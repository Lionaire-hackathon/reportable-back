import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Document } from './entity/document.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/entity/user.entity';
import { CreateDocumentDto } from './dto/create-document.dto';
import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import { EditDocumentDto } from './dto/edit-document.dto';
import { File } from 'src/file/entity/file.entity';
import { classifyFiles, classifyImageType } from 'src/utils/file-utils';
import { ClaudeImageApiObject } from './dto/claude-api-objects.dto';
import axios from 'axios';
import { EditPromptDto } from './dto/edit-prompt.dto';
import {
  Document as WordDocument,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  HeadingLevel,
  AlignmentType,
} from 'docx';
import sizeOf from 'image-size';

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: process.env.AWS_REGION,
});

interface ClaudeApiResponse {
  content: { text: string }[];
  usage: { input_tokens: number; output_tokens: number };
  stop_reason: string;
}

@Injectable()
export class DocumentService {
  private s3 = new AWS.S3();

  constructor(
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(File)
    private fileRepository: Repository<File>,
  ) {}

  async findOne(documentId: number): Promise<Document> {
    return this.documentRepository.findOneBy({ id: documentId });
  }

  async create(
    createDocumentDto: CreateDocumentDto,
    user_id: number,
  ): Promise<Document> {
    const { title, amount, type, prompt, form, elements, core } =
      createDocumentDto;

    const user = await this.userRepository.findOneBy({ id: user_id });

    if (!user) {
      throw new Error('User not found');
    }

    const post = this.documentRepository.create({
      title,
      amount,
      type,
      prompt,
      form,
      elements,
      core,
      user,
    });

    return this.documentRepository.save(post);
  }

  async deleteDocument(documentId: number): Promise<Document> {
    const document = await this.documentRepository.findOneBy({
      id: documentId,
    });

    if (!document) {
      throw new Error('Document not found');
    }

    return this.documentRepository.remove(document);
  }

  async firstPrompt(documentId: number): Promise<any> {
    const document = await this.documentRepository.findOneBy({
      id: documentId,
    });
    if (!document) {
      throw new Error('Document not found');
    }

    const response = await this.claudeApiCall(
      document,
      `에세이 주제 "${document.title}"에 대해 답변하기 위해서 내용과 관련해서 너가 모르는 정보나 사용자의 견해 등 추가적으로 받아야 할 정보가 있어? 있으면 
      { needMorePrompt: 1, prompt: ["질문1 내용", "질문2 내용",...]} 형태로 대답하고, 없으면 
      { needMorePrompt: 0 } 으로 대답해 (중요!)대답은 반드시 JSON 형식이어야만 해`,
    );

    return response;
  }

  async createContent(documentId: number): Promise<Document> {
    const document = await this.documentRepository.findOneBy({
      id: documentId,
    });
    if (!document) {
      throw new Error('Document not found');
    }
    let promptHistory: object[] = [];
    let totalInputTokenCount: number = 0;
    let totalOutputTokenCount: number = 0;
    const prompt = await this.genPromptFromDoc(document);
    promptHistory.push({ role: 'user', content: prompt });
    const response: ClaudeApiResponse =
      document.type === 'essay'
        ? await this.claudeApiCall(document, prompt)
        : await this.claudeApiCallWithFiles(document, prompt);
    totalInputTokenCount += response.usage.input_tokens;
    totalOutputTokenCount += response.usage.output_tokens;
    promptHistory.push({
      role: 'assistant',
      content: response.content[0].text,
    });
    let textOutput = '';
    if (response.stop_reason === 'end_turn') {
      textOutput = response.content[0].text;
    } else {
      console.log('@@@Continuing the conversation...');
      const continuedResponse: ClaudeApiResponse =
        await this.claudeApiCallWithPromptHistory(document, promptHistory);
      totalInputTokenCount += continuedResponse.usage.input_tokens;
      totalOutputTokenCount += continuedResponse.usage.output_tokens;
      textOutput =
        promptHistory[1]['content'] + continuedResponse.content[0].text;
    }
    const s3Url = await this.uploadContentToS3(textOutput, document.title);
    document.used_input_tokens += totalInputTokenCount;
    document.used_output_tokens += totalOutputTokenCount;
    document.url = s3Url;
    return this.documentRepository.save(document);
  }

  async claudeApiCallWithPromptHistory(
    document: Document,
    promptHistory: object[],
  ): Promise<ClaudeApiResponse> {
    const headers = {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'max-tokens-3-5-sonnet-2024-07-15',
    };

    const data = {
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 8192,
      messages: [
        { role: 'user', content: promptHistory[0]['content'] },
        { role: 'assistant', content: promptHistory[1]['content'] },
        { role: 'user', content: 'Continue.' },
      ],
    };

    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      data,
      { headers },
    );
    return response.data;
  }

  async claudeApiCall(
    document: Document,
    prompt: string,
  ): Promise<ClaudeApiResponse> {
    const headers = {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'max-tokens-3-5-sonnet-2024-07-15',
    };

    const data = {
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 8192,
      messages: [{ role: 'user', content: prompt }],
    };
    console.log(prompt);
    try {
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        data,
        { headers },
      );
      console.log(response.data.content[0].text);
      return response.data;
    } catch (error) {
      console.log(error);
    }
  }

  async fetchImageData(imageFiles: File[]): Promise<ClaudeImageApiObject[]> {
    const claudeImageLists: ClaudeImageApiObject[] = [];

    for (const file of imageFiles) {
      const response = await axios.get(file.url, {
        responseType: 'arraybuffer',
      });
      const base64Image = Buffer.from(response.data, 'binary').toString(
        'base64',
      );
      claudeImageLists.push(
        new ClaudeImageApiObject(
          file.description,
          file.name,
          base64Image,
          classifyImageType(file.url),
        ),
      );
    }
    return claudeImageLists;
  }

  async fetchAndProcessTableData(urls: string[]): Promise<string[]> {
    // URL 리스트를 받아서 각 URL의 테이블 데이터를 처리하여 반환
    return null;
  }

  async claudeApiCallWithFiles(
    document: Document,
    prompt: string,
  ): Promise<ClaudeApiResponse> {
    const headers = {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'max-tokens-3-5-sonnet-2024-07-15',
    };

    const { imageFiles, spreadsheetFiles } = classifyFiles(document.files);

    let images = [];
    try {
      images = await this.fetchImageData(imageFiles);
    } catch (error) {
      console.error('Error fetching image data:', error);
    }

    let tables = [];
    try {
      tables = await this.fetchAndProcessTableData(
        spreadsheetFiles.map((file) => file.url),
      );
    } catch (error) {
      console.error('Error fetching table data:', error);
    }

    let combinedContent: Array<any> = []; // Start with the prompt

    try {
      images.forEach((image) => {
        combinedContent.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: image.media_type as
              | 'image/jpeg'
              | 'image/png'
              | 'image/gif'
              | 'image/webp',
            data: image.data,
          },
        });
        combinedContent.push({
          type: 'text',
          text: `이미지 이름: ${image.name}\n이미지 설명: ${image.description} 이미지ID: ${image.id}`,
        });
      });
    } catch (error) {
      console.error('Error processing image messages:', error);
    }

    const data = {
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 8192,
      messages: [
        {
          role: 'user',
          content: [
            ...combinedContent,
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    };

    try {
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        data,
        { headers },
      );
      return response.data;
    } catch (error) {
      console.error('Error during Claude API call:', error);
      throw new Error('Failed to complete Claude API call');
    }
  }

  async uploadContentToS3(content: string, title: string): Promise<string> {
    const fileName = `${title}-${uuidv4()}.txt`;
    const filePath = path.join('documents', fileName);

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: filePath,
      Body: content,
      ContentType: 'text/plain',
    };

    try {
      const data = await this.s3.upload(params).promise();
      return data.Location;
    } catch (error) {
      console.error('Error uploading file to S3:', error);
      throw new Error('Error uploading file to S3');
    }
  }

  async edit(editDocumentDto: EditDocumentDto) {
    const { document_id, prompt, content_before } = editDocumentDto;

    const final_prompt = `Edit chosen part, ${content_before}, as following instruction. ${prompt} \n Retrieve only result of edited part as response, not all the total document.`;

    const document = await this.documentRepository.findOne({
      where: { id: document_id },
    });
    const url_document = document.url;
    const documentContent = await this.downloadContentFromS3(url_document);

    const content_after = await this.claudeApiEditCall(
      final_prompt,
      documentContent,
    );
    const updatedContent = documentContent.replace(
      content_before,
      content_after,
    );

    const s3Url = await this.updateContentToS3(updatedContent, url_document);

    return s3Url;
  }

  async claudeApiEditCall(prompt: string, content: string): Promise<string> {
    const headers = {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'max-tokens-3-5-sonnet-2024-07-15',
    };

    const data = {
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: `Here is the total document content: ${content}.\nPlease edit it as follows:\n${prompt}`,
        },
      ],
    };

    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      data,
      { headers },
    );
    return response.data.content[0].text;
  }

  async getText(documentId: number): Promise<string> {
    const document = await this.documentRepository.findOneBy({
      id: documentId,
    });
    if (!document) {
      throw new Error('Document not found');
    }

    return this.downloadContentFromS3(document.url);
  }

  async genPromptFromDoc(document: Document): Promise<string> {
    const { type, title, prompt, amount, form, elements, core, files } =
      document;

    const formatFiles = (files: File[]): string => {
      return files
        .map(
          (file) => `
    파일명: ${file.name}
    파일ID: ${file.id}
    ---------`,
        )
        .join('\n');
    };

    if (type === 'essay') {
      return `
      당신은 에세이를 작성해야 하는 대학생입니다.
      <지시문>
      아래 제시한 조건과 요청사항에 따라 보고서를 작성해주세요.
      </지시문>
      
      <조건>
      1. 분량은 반드시 한글기준 공백 포함 ${amount}자 이상으로 작성해야 합니다. 내용은 응답 한번에 전부 작성하지 않아도 됩니다. 답변이 잘리더라도 다시 작성할 수 있습니다.
      2. 양식 : ${form}
      3. 필요하다면 인터넷 검색 결과를 바탕으로 보고서를 작성해야 합니다.
      4. 인터넷 검색 결과를 사용할 경우 마지막에 "참고문헌" 차례에 구체적인 참고문헌 url 링크를 첨부해야 합니다.
      5. 에세이는 명확한 어휘를 사용하고, 설명하듯이 작성해야 합니다.
      6. 아래 에세이 주제에 따라 작성하세요.
      7. 본문은 축약형이 아닌 줄글, 서술형의 형태로 작성되어야 합니다.
      8. 각각의 본론에 대해서 하위 항목이 2단계 이상 있으면 안됩니다.
      </조건>
      
      <참고사항>
      아래 프롬프트 내용을 반영해서 에세이를 작성해주세요.
      ${prompt}
      </참고사항>
      
      <보고서 주제>
      ${title}
      </보고서 주제>
      `;
    } else if (type === 'research') {
      return `
      당신은 실험보고서를 작성해야 하는 대학생입니다.
      <지시문>
      아래 제시한 조건과 요청사항에 따라 실험보고서를 작성해주세요.
      </지시문>

      <조건>
      0. 실험보고서 주제에 따라 작성해야 합니다
      1. 분량은 반드시 ${amount}자 이상으로 작성해야 합니다.
      2. 실험보고서에는 아래와 같은 내용이 포함되어야 합니다
	    <목차>
	      ${elements}
	    </목차>
      3. 필요하다면 인터넷 검색 결과를 바탕으로 보고서를 작성해야 합니다.
      4. 인터넷 검색 결과를 사용할 경우 마지막에 "참고문헌" 차례에 구체적인 참고문헌 url 링크를 첨부해야 합니다.
      5. 보고서는 명확한 어휘를 사용해서 작성해야 합니다.
      6. 아래 제시된 보고서의 핵심내용을 반드시 반영해야 합니다.
      7. 첨부된 이미지나 도표를 분석해서 실험 결과에 반영해야 합니다. 
      8. 첨부된 이미지는 사용되는 위치에 배치되어야 합니다.
      9. 보고서는 관련 개념까지 확장 설명하며, 내용이 풍부해야 합니다.
      10. 주제인 h1, 목차인 h2 를 파악해서 #, ## 를 앞에 붙여서 작성해야 합니다.
      11. "-"를 통해 나열하듯이 쓰지 말고 한 소주제에 대해 한번에 줄글로 작성해야 합니다.

      </조건>

      <첨부파일>
      첨부파일을 사용할 때에는 본문 속에 <<{파일ID 값}>>과 같이 작성해야 합니다. 아래는 사용가능한 파일 리스트와 파일의 내용들입니다.

      ${files ? formatFiles(files) : '첨부파일이 없습니다.'}

      </첨부파일>

      <요청사항>
      ${prompt}
      </요청사항>

      <핵심내용>
      ${core}
      </핵심내용>

      <보고서 주제>
      ${title}
      </보고서 주제>
      
      <예시>
      원소 분석 및 어는점 내림
      1. 초록 (Abstract)
      본 실험은 원자분석기로 미지시료의 실험식을 결정하고, 어는점 내림을 통해 미지시료의 분자량을 구해 종류를 판별하는 것이다. 미지시료 Red와 Green을 각각 원소분석기로 탄소, 수소의 질량 백분율의 정보를 얻었고, Red와 Green 용액의 어는점 내림을 측정해 어는점 내림 공식으로 두 미지시료의 분자량을 각각 구할 수 있었다. 분석 결과, Red와 Green의 탄소, 수소, 산소의 개수비는 각각 12:22.168:11.076, 6:12.194:6.093이며, 어는점 내림으로 계산한 결과, 분자량은 각각 338.18g/mol, 177.14g/mol로 얻었다. 따라서, 미지시료 Red는 Saccharose(C₁₂H₂₂O₁₁), 미지시료 Green은 Dextrose(C₆H₁₂O₆)임을 판별하고 확인할 수 있었다. 오차원인으로는 크게 불순물에 의한 부정확한 원소 개수비와 용액의 총괄성을 비이상용액에 적용했다는 점을 생각해볼 수 있었으며, 이 실험은 다른 유기분자의 실험식과 종류를 판별하는데에도 활용될 수 있다고 기대해볼 수 있다.

      2. 실험 목적 (Objective)
      이 실험의 목적은 원소분석기와 어는점 내림 실험을 통해 미지시료의 화학적 성분과 분자량을 정확히 분석하여 그 종류를 판별하는 것이다. 이를 통해 분석 기술의 정확성과 유효성을 검증하고, 화학적 분석의 기본 원리를 이해하며, 실험 데이터를 통해 실험 결과를 도출하는 방법을 습득한다.

      3. 실험 재료 및 방법 (Materials and Methods)
      실험에는 미지시료 Red와 Green, 원소분석기, 증류수, NaCl, 온도 센서, 얼음과 꽃소금, 바이알, 비커, 저울 등이 사용되었다. 먼저 원소 분석을 위해 Red 미지시료 2.031mg과 Green 미지시료 2.059mg을 원소분석기에 넣어 탄소와 수소의 질량 백분율을 측정하였다. 그 후 측정된 탄소와 수소의 질량 백분율을 바탕으로 산소의 질량 백분율을 계산하고, 이를 통해 각 원소의 질량 백분율을 사용하여 원자량을 계산하였다. 이러한 과정을 통해 각 미지시료의 실험식을 도출하였다.

      어는점 내림 실험을 위해 증류수 5mL에 미지시료 Red와 Green 각각 1g을 녹여 용액을 준비하였다. 또한 NaCl 0.1g을 증류수 5mL에 녹여 NaCl 용액을 준비하였다. 각 용액을 얼음과 꽃소금이 담긴 비커에 넣고 온도 센서를 사용해 10초마다 10분 동안 온도를 측정하였다. 이렇게 측정된 온도를 바탕으로 각 용액의 어는점을 구하고, 어는점 내림 공식을 이용해 미지시료의 분자량을 계산하였다.

      4. 실험 결과 (Results)
        4.1 원소 분석 결과
        시료	탄소 (%)	수소 (%)	산소 (%)	실험식
        Red	41.9392	6.5029	51.5579	C₁₂H₂₂O₁₁
        Green	39.6446	6.7624	53.5930	C₆H₁₂O₆
        4.2 어는점 내림 결과
        용액	어는점 (℃)	분자량 (g/mol)
        증류수	0	-
        NaCl 용액	-1.3	-
        Red 용액	-1.1	338.18
        Green 용액	-2.1	177.14
      5. 데이터 분석 및 논의 (Data Analysis and Discussion)
      원소 분석 결과를 이론값과 비교한 결과, 미지시료의 실험식을 확인할 수 있었다. 그러나 분석 과정에서 불순물이나 공기 중의 CO₂와 H₂O의 영향을 받을 가능성이 있어 이러한 오차의 원인을 논의하였다. 어는점 내림 실험에서는 계산된 분자량이 이론값과 유사함을 확인하였으며, NaCl 용액의 경우 이론값과의 차이를 논의하고 비이상용액의 특성에 대해 설명하였다. 또한 실험 조건과 측정 기기의 한계로 인해 발생할 수 있는 오차 요인들을 분석하였다.

      6. 결론 (Conclusion)
      실험 결과, 원소분석기와 어는점 내림 실험을 통해 미지시료 Red는 Saccharose, Green은 Dextrose임을 확인하였다. 이러한 실험 결과를 바탕으로 분석 방법의 정확성과 유효성을 검증할 수 있었으며, 이 실험 방법이 다른 유기분자의 분석에도 활용될 수 있음을 논의하였다.

      7. 참고문헌 (References)
      김희준, 일반화학실험, 2010, 자유아카데미, 33-45.
      David W. Oxtoby, H. P. Gills, Alan Campion, Principles of Modern Chemistry, 7th edition, 2011, Cengage Learning, 495-497.
      </예시>

      예시에 있는 정도보다 더 풍부하게 내용을 더 추가해주세요.
      `;
    }
  }

  async editPrompt(editPromptDto: EditPromptDto): Promise<Document> {
    const { documentId, addPrompt } = editPromptDto;

    const document = await this.documentRepository.findOneBy({
      id: documentId,
    });

    const total_prompt = `${document.prompt} 다음 사용자와 질의응답을 고려해서 작성해주세요. \n${addPrompt}`;

    document.prompt = total_prompt;
    return this.documentRepository.save(document);
  }

  async getDocFile(documentId: number): Promise<string> {
    const document = await this.documentRepository.findOneBy({
      id: documentId,
    });
    if (!document) {
      throw new Error('Document not found');
    }
    const content: string = await this.downloadContentFromS3(document.url);

    const paragraphs = await Promise.all(
      content.split('\n').map(async (line) => {
        const matches = line.match(/<<(\d+)>>/);
        if (matches) {
          const fileId = parseInt(matches[1], 10);
          const file = await this.fileRepository.findOneBy({
            id: fileId,
          });
          if (file && file.url) {
            const imageBuffer = await this.downloadImageFromS3(file.url);
            const dimensions = sizeOf(imageBuffer);

            let width = dimensions.width;
            let height = dimensions.height;

            if (width > 300) {
              const aspectRatio = width / height;
              width = 300;
              height = width / aspectRatio;
            }

            return new Paragraph({
              children: [
                new ImageRun({
                  data: imageBuffer,
                  transformation: {
                    width: width,
                    height: height,
                  },
                }),
              ],
            });
          }
        }

        // 스타일 적용 예시
        if (line.startsWith('# ')) {
          return new Paragraph({
            children: [
              new TextRun({
                text: line.replace('# ', ''),
                bold: true,
                size: 32,
                color: '000000',
              }),
            ],
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          });
        } else if (line.startsWith('## ')) {
          return new Paragraph({
            children: [
              new TextRun({
                text: line.replace('## ', ''),
                bold: true,
                size: 24,
                color: '000000',
              }),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 100 },
          });
        } else if(line.startsWith('### ')) {
          return new Paragraph({
            children: [
              new TextRun({
                text: line.replace('### ', ''),
                bold: true,
                size: 20,
                color: '000000',
              }),
            ],
            heading: HeadingLevel.HEADING_3,
            spacing: { after: 50 },
          });
        }
        else {
          return new Paragraph({
            children: [
              new TextRun({
                text: line,
                color: '000000',
              }),
            ],
          });
        }
      }),
    );

    const doc = new WordDocument({
      sections: [
        {
          properties: {},
          children: paragraphs,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    // Upload to S3
    const fileName = `${document.title}-${uuidv4()}.docx`;
    const filePath = path.join('documents', fileName);

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: filePath,
      Body: buffer,
      ContentType:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };

    try {
      const data = await this.s3.upload(params).promise();
      document.wordUrl = data.Location;
      await this.documentRepository.save(document);
      return document.wordUrl;
    } catch (error) {
      console.error('Error uploading file to S3:', error);
      throw new Error('Error uploading file to S3');
    }
  }

  async downloadContentFromS3(url: string): Promise<string> {
    const parsedUrl = new URL(url);
    const key = decodeURIComponent(parsedUrl.pathname.substring(1));

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    };

    try {
      const data = await this.s3.getObject(params).promise();
      return data.Body.toString('utf-8');
    } catch (error) {
      console.error('Error downloading file from S3:', error);
      throw new Error('Error downloading file from S3');
    }
  }
  async downloadImageFromS3(url: string): Promise<Buffer> {
    const parsedUrl = new URL(url);
    const key = decodeURIComponent(parsedUrl.pathname.substring(1));

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    };

    try {
      const data = await this.s3.getObject(params).promise();
      return data.Body as Buffer;
    } catch (error) {
      console.error('Error downloading image from S3:', error);
      throw new Error('Error downloading image from S3');
    }
  }

  async updateContentToS3(content: string, url: string): Promise<string> {
    const parsedUrl = new URL(url);
    const key = decodeURIComponent(parsedUrl.pathname.substring(1));

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: content,
      ContentType: 'text/plain',
    };

    try {
      const data = await this.s3.upload(params).promise();
      return data.Location;
    } catch (error) {
      console.error('Error uploading file to S3:', error);
      throw new Error('Error uploading file to S3');
    }
  }
}
