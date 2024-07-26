import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Document } from './entity/document.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/entity/user.entity';
import { CreateDocumentDto } from './dto/create-document.dto';
import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import { Edit } from './entity/edit.entity';
import { EditDocumentDto } from './dto/edit-document.dto';
import { File } from 'src/file/entity/file.entity';
import { classifyFiles, classifyImageType } from 'src/utils/file-utils';
import { ClaudeImageApiObject } from './dto/claude-api-objects.dto';
import axios from 'axios';
import { EditPromptDto } from './dto/edit-prompt.dto';
import { Document as WordDocument, Packer, Paragraph, TextRun } from 'docx';
import { Pinecone } from '@pinecone-database/pinecone';
import { ImageRun, HeadingLevel, AlignmentType } from 'docx';
import sizeOf from 'image-size';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ChatCompletionMessageParam {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface PromptHistory {
  role: string;
  content: string;
}

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
    @InjectRepository(Edit)
    private editRepository: Repository<Edit>,
  ) {}

  async queryrag(pinc: Pinecone, query: string) {
    const pc = pinc;
    const index = pc.index('reportable-vectordb');
    // const jsonFilePath = path.join(__dirname, '..', 'document/id2text.json');
    //const projectRoot = path.resolve(__dirname, '..', '..');
    //const jsonFilePath = path.join(projectRoot, 'id2text.json');
    const jsonFilePath = path.join(process.cwd(), 'id2text.json');
    console.log('jsonFilePath: ', jsonFilePath);
    const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'));
    const openai = new OpenAI({
      apiKey: process.env.UPSTAGE_API_KEY,
      baseURL: 'https://api.upstage.ai/v1/solar',
    });
    const embeddings = await openai.embeddings.create({
      model: 'solar-embedding-1-large-query',
      input: query,
    });
    const embedding = embeddings['data'][0]['embedding'];
    const queryResponse = await index.namespace('default').query({
      topK: 3,
      vector: embedding,
      includeValues: true,
    });
    const matches = queryResponse.matches;
    let resultList: string[] = [];
    for (let i = 0; i < 3; i++) {
      resultList.push(jsonData[matches[i]['id']]);
    }
    console.log(resultList[0]);
    let finalString = resultList.join(' ');
    return finalString;
  }

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
    const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

    let retrieval = '';
    try {
      retrieval = await this.queryrag(pc, core);
    } catch (error) {
      console.log(error);
    }

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
      retrieval,
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
      { "needMorePrompt" : 1, "prompt": ["질문1 내용", "질문2 내용",...]} 형태로 대답하고, 없으면 
      { "needMorePrompt" : 0 } 으로 대답해 (중요!)대답은 반드시 JSON 형식이어야만 해`,
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
    let promptHistory: PromptHistory[] = [];
    let totalInputTokenCount: number = 0;
    let totalOutputTokenCount: number = 0;
    const prompt = await this.genPromptFromDoc(document);
    console.log(prompt);

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
      console.log('response', response);
      console.log('response stop reason', response.stop_reason);
      console.log('prompt history', promptHistory);
      console.log('@@@Continuing the conversation...');
      const continuedResponse: ClaudeApiResponse =
        await this.claudeApiCallWithPromptHistory(document, promptHistory);
      totalInputTokenCount += continuedResponse.usage.input_tokens;
      totalOutputTokenCount += continuedResponse.usage.output_tokens;
      textOutput =
        promptHistory[1]['content'] + continuedResponse.content[0].text;
    }
    const cloudFrontUrl = await this.uploadContentToS3(
      textOutput,
      document.title,
    );
    document.used_input_tokens += totalInputTokenCount;
    document.used_output_tokens += totalOutputTokenCount;
    document.url = cloudFrontUrl;
    return this.documentRepository.save(document);
  }

  async claudeApiCallWithPromptHistory(
    document: Document,
    promptHistory: PromptHistory[],
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
        ...promptHistory,
        {
          role: 'user',
          content: 'Continue',
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
      console.log('claude api call with prompt history', error);
    }
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
          text: `이미지 이름: ${image.name ? image.name : '없음'}\n이미지 설명: ${image.description ? image.description : '없음'} 이미지ID: ${image.id} 이미지 type: ${image.type}`,
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
    // 기존 파일 이름 생성 부분
    const shortFileName = title
      .substring(0, 10)
      .replace(/\s/g, '-')
      .replace(/[<>:"/\\|?*]/g, ''); // 20글자로 제한
    const fileName = `${shortFileName}-${uuidv4()}.txt`;
    const filePath = path.join('documents', fileName);

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: filePath,
      Body: content,
      ContentType: 'text/plain',
    };

    try {
      const data = await this.s3.upload(params).promise();
      const cloudFrontUrl = data.Location.replace(
        process.env.S3_DOMAIN,
        process.env.CLOUDFRONT_DOMAIN,
      );
      return cloudFrontUrl;
    } catch (error) {
      console.error('Error uploading file to S3:', error);
      throw new Error('Error uploading file to S3');
    }
  }

  async edit(editDocumentDto: EditDocumentDto, userId: number) {
    const { document_id, prompt, content_before } = editDocumentDto;

    const document = await this.documentRepository.findOne({
      where: { id: document_id },
    });
    if (!document) {
      throw new Error('Document not found');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new Error('User not found');
    }

    const documentContent = await this.downloadContentFromS3(document.url);

    const {
      exact_content_before,
      content_after,
      used_input_tokens,
      used_output_tokens,
    } = await this.gptApiCall(documentContent, content_before, prompt);

    const updatedContent = documentContent.replace(
      exact_content_before,
      content_after,
    );
    console.log('exact_content_before: ', exact_content_before);
    console.log('content_after: ', content_after);

    console.log('updatedContent: ', updatedContent);

    const cloudFrontUrl = await this.updateContentToS3(
      updatedContent,
      document.url,
    );

    // Create and save the Edit entity
    const edit = new Edit();
    edit.document = document;
    edit.user = user;
    edit.content_before = exact_content_before;
    edit.content_after = content_after;
    edit.prompt = prompt;
    edit.used_input_tokens = used_input_tokens;
    edit.used_output_tokens = used_output_tokens;

    await this.editRepository.save(edit);

    // Update the document URL
    document.url = cloudFrontUrl;
    await this.documentRepository.save(document);
    const updatedWordUrl = await this.getDocFile(document_id);

    return { cloudFrontUrl, wordUrl: updatedWordUrl, editId: edit.id };
  }

  async gptApiCall(
    documentContent: string,
    content_before: string,
    prompt: string,
  ): Promise<{
    exact_content_before: string;
    content_after: string;
    used_input_tokens: number;
    used_output_tokens: number;
  }> {
    const messages: ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: `당신은 문서 편집 전문가입니다. 주어진 문서 내용에서 사용자가 제공한 텍스트와 가장 유사한 부분을 찾고, 
        수정 요청 사항을 반영하여 해당 부분을 수정해야 합니다. 공백, 줄바꿈, 마크다운 기호(#) 등의 차이는 무시하고 
        가장 유사한 내용을 찾아주세요.`,
      },
      {
        role: 'user',
        content: `다음은 문서의 전체 내용입니다:
        "${documentContent}"

        다음은 수정하고자 하는 내용입니다:
        "${content_before}"

        수정 요청 사항은 다음과 같습니다:
        "${prompt}"

        1. 먼저 문서 내용에서 수정하고자 하는 내용과 가장 유사한 부분을 찾아주세요. 문장 단위로 찾아서, 끊기면 안됩니다. 
        2. 수정하고자 하는 내용을 통해 실제로 찾은 마크다운 기호(#)나 공백, 줄바꿈을 포함한 정확한 원본 내용을 제공해주세요.
        3. 그 다음, 수정 요청 사항을 반영하여 해당 부분을 수정해주세요.
        4. 결과를 다음과 같은 JSON 형식으로 제공해주세요:
        {
          "exact_content_before": "문서에서 실제로 찾은 원본 내용",
          "content_after": "수정된 내용"
        }`,
      },
    ];

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini-2024-07-18',
        messages: messages,
      });

      const response = completion.choices[0].message.content.trim();
      console.log('response: ', response);
      if (!response) {
        throw new Error('GPT API response is empty');
      }
      const { exact_content_before, content_after } = JSON.parse(response);
      const used_input_tokens = completion.usage.prompt_tokens;
      const used_output_tokens = completion.usage.completion_tokens;
      return {
        exact_content_before,
        content_after,
        used_input_tokens,
        used_output_tokens,
      };
    } catch (error) {
      console.error('Error during GPT API call:', error);
      throw new Error('Failed to generate the content using GPT API');
    }
  }

  async getText(documentId: number): Promise<string> {
    const document = await this.documentRepository.findOneBy({
      id: documentId,
    });
    if (!document) {
      throw new Error('Document not found');
    }
    const content: string = await this.downloadContentFromS3(document.url);

    const paragraphs = await Promise.all(
      content.split('\n').map(async (line) => {
        // 이미지 처리
        const imageMatches = line.match(/<<(\d+)-(.+?)>>/);
        if (imageMatches) {
          const fileId = parseInt(imageMatches[1], 10);
          const fileName = imageMatches[2];
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

            return `
              <div style="text-align: center;">
                <img src="${file.url}" width="${width}" height="${height}" />
                <p style="font-weight: bold; font-size: 24pt; color: #000000;">${fileName}</p>
              </div>
            `;
          }
        }
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

            // 이미지 태그로 변환
            return `<img src="${file.url}" width="${width}" height="${height}" />`;
          }
        }

        // 스타일 적용 예시
        if (line.startsWith('# ')) {
          return `<h1 style="text-align: center; margin-bottom: 20px; font-size: 18pt; font-weight: bold; color: #000000;">${line.replace('# ', '')}</h1>`;
        } else if (line.startsWith('## ')) {
          return `<h2 style="margin-bottom: 10px; font-size: 14pt; font-weight: bold; color: #000000;">${line.replace('## ', '')}</h2>`;
        } else if (line.startsWith('### ')) {
          return `<h3 style="margin-bottom: 5px; font-size: 11pt; font-weight: bold; color: #000000;">${line.replace('### ', '')}</h3>`;
        } else {
          return `<p style="color: #000000; font-size: 11pt;">${line}</p>`;
        }
      }),
    );

    // 전체 내용을 하나의 문자열로 병합
    const formattedContent = paragraphs.join('\n');
    return formattedContent;
  }

  async genPromptFromDoc(document: Document): Promise<string> {
    const {
      type,
      title,
      prompt,
      amount,
      form,
      elements,
      core,
      files,
      retrieval,
    } = document;

    const formatFiles = (files: File[]): string => {
      return files
        .filter((file) => file.type === 'attachment')
        .map(
          (file) => `
      파일명: ${file.name}
      파일ID: ${file.id}
      파일 설명: ${file.description}
      파일 타입: ${file.type}
      ---------
            `,
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
      3. 주어진 양식이 따로 없다면 적절한 양식으로 보고서를 작성해야합니다.
      4. 필요하다면 인터넷 검색 결과를 바탕으로 보고서를 작성해야 합니다.
      5. 인터넷 검색 결과를 사용할 경우 마지막에 "참고문헌" 차례에 구체적인 참고문헌 url 링크를 첨부해야 합니다.
      6. 보고서의 제목을 선정해서 보고서 상단에 기입해야 합니다.
      7. 아래 보고서 주제에 따라 작성하세요.
      8. (!중요) 본문은 줄글 형태의 긴 문장들로 작성되어야 합니다. 하위 항목들을 나열하지 마세요!
      9. 제목인 h1, 목차인 h2, 하위 목차인 h3 를 파악해서 #, ##, ### 를 앞에 붙여서 작성해야 합니다. ('#'을 4개 이상 붙이지 마세요!)
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
      7. 첨부된 이미지나 도표를 분석해서 분석 내용을 반영해서 실험 결과를 작성해야 합니다.
      8. 첨부용 이미지(type="attachment"인 경우)는 사용되는 위치에 딱 한번만 배치되어야 합니다.
      9. 보고서는 관련 개념까지 확장 설명하며, 내용이 풍부해야 합니다.
      10. 제목인 h1, 목차인 h2, 하위 목차인 h3 를 파악해서 #, ##, ### 를 앞에 붙여서 작성해야 합니다. ('#'을 4개 이상 붙이지 마세요!)
      11. "-"를 통해 나열하듯이 쓰지 말고 한 소주제에 대해 한번에 긴 줄글로 작성해야 합니다.
      12. 실험 결과(본문)와 분석은 분량이 엄청 많아야 합니다.
      13. 보고서와 관련된 전공지식을 기반으로 정확한 내용을 작성해야 합니다.
      </조건>

      <첨부파일>
      첨부용 이미지를 사용할 때에는 본문 속에 <<{파일ID 값}-{파일명}}>>과 같이 작성해야 합니다.
      아래는 사용가능한 첨부용(attachment) 파일 리스트와 파일의 내용들입니다. 분석용(analysis) 파일은 본문에 사용하지 않아도 됩니다.

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

      <관련된 전공지식>
      ${retrieval}
      </관련된 전공지식>

      `;
    }
  }

  async editPrompt(editPromptDto: EditPromptDto): Promise<Document> {
    const { documentId, addPrompt } = editPromptDto;

    const document = await this.documentRepository.findOneBy({
      id: documentId,
    });

    const total_prompt = `${document.prompt} \n${addPrompt}`;

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

    const docChildren = await Promise.all(
      content.split('\n').map(async (line) => {
        // 이미지 처리
        const imageMatches = line.match(/<<(\d+)-(.+?)>>/);
        if (imageMatches) {
          const fileId = parseInt(imageMatches[1], 10);
          const fileName = imageMatches[2];
          const file = await this.fileRepository.findOneBy({
            id: fileId,
          });

          console.log(`파일 url: ${file.url}`);
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

            return [
              new Paragraph({
                children: [
                  new ImageRun({
                    data: imageBuffer,
                    transformation: {
                      width: width,
                      height: height,
                    },
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: fileName,
                    bold: true,
                    size: 24,
                    color: '000000',
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 100 },
              }),
            ];
          }
        }

        // 스타일 적용
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
        } else if (line.startsWith('### ')) {
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
        } else {
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

    // Flatten the nested arrays created by the image processing
    const flattenedChildren = docChildren.flat();

    const doc = new WordDocument({
      sections: [
        {
          properties: {},
          children: flattenedChildren,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    // Upload to S3
    const shortFileName = document.title
      .substring(0, 10)
      .replace(/\s/g, '-')
      .replace(/[<>:"/\\|?*]/g, '');
    const fileName = `${shortFileName}-${uuidv4()}.docx`;
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
      document.wordUrl = data.Location.replace(
        process.env.S3_DOMAIN,
        process.env.CLOUDFRONT_DOMAIN,
      );
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
      const cloudFrontUrl = data.Location.replace(
        process.env.S3_DOMAIN,
        process.env.CLOUDFRONT_DOMAIN,
      );
      return cloudFrontUrl;
    } catch (error) {
      console.error('Error uploading file to S3:', error);
      throw new Error('Error uploading file to S3');
    }
  }
}
