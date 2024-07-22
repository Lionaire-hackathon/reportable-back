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
      # HPLC에 의한 아데닌과 카페인의 분리
      ## 1. 초록 (Abstract)
      본 실험은 HPLC를 활용하여 아데닌과 카페인의 머무름 시간을 통해 분자의 극성 차이에 대해 고찰하고, 여러 농도의 카페인 용액의 peak 적분값으로 검정곡선을 얻어 커피의 농도를 구하는 것이 목표이다. 준비된 600μM 아데닌과 800μM 카페인을 260nm 파장영역에서 크로마토그램을 얻어 RT값을 비교하고, 270nm에서 여러 농도의 카페인 용액의 peak 적분값을 토대로 얻은 검정곡선을 이용해 커피의 농도를 구하였다. 아데닌 분자가 카페인 분자보다 극성이 크고, 각각 260nm, 273nm에서 최대흡광파장을 가진다는 것을 알 수 있었다. 또한, 검정곡선을 통해 구한 커피의 농도는 196.06μM이며, 커피 100mL당 함유된 카페인양은 64.61mg임을 구할 수 있었다. 위 실험방법은 커피 내 카페인양뿐만 아니라 여러 음료 내의 성분을 정성, 정량 분석하는데에 활용될 수 있고, 이렇게 분석한 여러 물질의 최대흡광파장이 다른 연구에도 쓰일 것을 기대할 수 있다.

      ## 2. 서론 (Introduction)
      HPLC(High Performance Liquid Chromatography)는 분석물질을 정성, 정량적 측정을 동시에 할 수 있는 재현성이 뛰어난 분석기법이다. 이때 분석물질의 머무름 시간(Retention Time)의 차이를 이용해 물질의 구분이 가능하고, 분광분석장치(UV)를 활용하여 정해진 파장영역에서의 peak 적분값을 얻을 수 있어 분자마다 최대 흡광도를 가지는 최적의 조건을 찾을 수 있다(이때, RT값은 분석물질과 이동상, 정지상의 상호작용 차이에 의해 결정되는 값이다). Beer-Lambert Law는 시료의 흡광도를 나타내는 법칙이다. A를 흡광도, ε을 몰 흡광계수, b를 큐벳의 두께(빛의 투과거리), C를 용액의 몰농도라고 했을 때, A = εbC를 만족한다.

      ## 3. 실험 방법 (Method)
      실험 1: 아데닌과 카페인의 분리
      HPLC의 프로그램 수집 시간을 5분, 측정파장을 260nm로 설정한 뒤 각 시료의 크로마토그램을 얻어 분석하고 비교하였다.

      실험 2: 아데닌과 카페인의 흡수 스펙트럼
      HPLC의 프로그램 수집 시간을 5분, 측정파장을 260nm로 설정한 뒤 600μM 아데닌과 800μM 카페인 부피비 1:1 용액의 크로마토그램을 얻어 분석하였다. 그 후, 600μM 아데닌과 800μM 카페인을 250, 260, 270, 280nm의 파장에서 각각 peak 적분값을 얻어 파장에 따른 흡광도를 분석하였다.

      실험 3: 커피에 들어 있는 카페인의 정량 분석
      HPLC의 프로그램 수집 시간을 5분, 측정파장을 270nm로 설정한 뒤 여러 농도의 카페인 용액과 미지 농도의 1/10로 묽힌 커피의 크로마토그램을 얻어 분석하고 비교하였다.

      ## 4. 결과 (Results)
      실험 1: 아데닌과 카페인의 분리
      아데닌의 RT값은 2.2483, 카페인의 RT값은 4.5717로 아데닌의 RT값이 더 작게 나왔음을 확인할 수 있다. (더 길게 작성하기)

      실험 2: 아데닌과 카페인의 흡수 스펙트럼
      혼합용액에서도 RT값에 따라 분리되며, 카페인은 270nm에서 275nm사이의 파장에서 최대 흡광도를 가진다. (더 길게 작성하기)

      실험 3: 커피에 들어 있는 카페인의 정량 분석
      검정곡선의 식은 y = 28.99x + 27.047 (R² = 0.9998)로 얻을 수 있었으며, 미지 농도의 1/10로 묽힌 커피의 농도는 196.06μM으로 계산되었다. 커피 100mL당 함유된 카페인양은 64.61mg으로 계산되었다. (더 길게 작성하기)

      ## 5. 고찰 (Discussion)
      아데닌이 카페인보다 극성이 크고, RT값이 작다는 사실을 실험을 통해 확인하였다. 카페인의 최대 흡광도는 270nm에서 275nm 사이이며, 검정곡선을 통해 커피의 카페인 농도를 정량 분석하였다. 본 실험은 다양한 종류의 커피의 카페인양을 측정할 때 동일한 방법이 적용될 수 있으며, 여러 음료의 성분을 확인하고 정량 측정하는데에도 활용될 수 있다. (더 길게 작성하기)

      ## 6. 결론 (Conclusion)
      HPLC를 통해 아데닌과 카페인의 극성 차이를 확인하고, 카페인의 정량 분석을 성공적으로 수행하였다. 이 방법은 커피뿐만 아니라 다양한 음료의 성분 분석에 유용하게 사용될 수 있다. (더 길게 작성하기)

      ## 7. 참고문헌 (Reference)
      김희준, 일반화학실험, 2010, 자유아카데미, 55-58
      이동선(1993). 고성능 액체 크로마토그래피(HPLC)의 원리 및 응용, Vol. 6(No. 4), 109A
      David W. Oxtoby, H. P. Gills, Alan Campion, Principles of Modern Chemistry, 7th edition, 2011, Cengage Learning, 651-654, 975
      John Mcmurry, Organic Chemistry, 7th, 2008, Thomson, 905, 915
      나카무라 히로시, 오승호, 조금 상세한 액체크로마토그래피, 분리편 IV, 2011, 신일북스
      </예시> (더 길게 작성하기라고 되어있는 부분은 더 길게 작성해야 합니다)
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
            text: line.replace('# ', ''),
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          });
        } else if (line.startsWith('## ')) {
          return new Paragraph({
            text: line.replace('## ', ''),
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 100 },
          });
        } else {
          return new Paragraph(line);
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
