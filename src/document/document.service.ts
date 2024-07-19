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
import { MessageParam } from '@anthropic-ai/sdk/resources';
import axios from 'axios';
import { EditPromptDto } from './dto/edit-prompt.dto';

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
  ) {}

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
      `에세이 주제 "${document.title}"에 대해 답변하기 위해서 내용과 관련해서 너가 모르는 정보나 사용자의 견해 등 추가적으로 받아야 할 정보가 있어? 있으면 {
      needMorePrompt: 1,
      prompt: ["질문1 내용", "질문2 내용",...]
    }형태로 대답하고, 없으면 {
      needMorePrompt: 0
    }으로 대답해`,
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

    const images = await this.fetchImageData(imageFiles);
    const tables = await this.fetchAndProcessTableData(
      spreadsheetFiles.map((file) => file.url),
    );

    let imageMessages: MessageParam[] = images.map((image) => ({
      role: 'user',
      content: [
        {
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
        },
      ],
    }));

    const data = {
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 8192,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
        ...imageMessages,
      ],
    };

    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      data,
      { headers },
    );
    return response.data;
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

  async genPromptFromDoc(document: Document): Promise<string> {
    const { type, title, prompt, amount, form, elements, core, files } =
      document;

    const formatFiles = (files: File[]): string => {
      return files
        .map(
          (file) => `
    파일명: ${file.name}
    내용: ${file.description}
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
      1. 분량은 반드시 ${amount}자 이상으로 작성해야 합니다.
      2. 실험보고서에는 아래와 같은 내용이 포함되어야 합니다
	    <목차>
	      ${elements}
	    </목차>
      3. 보고서는 html로 작성되어야 합니다.
      4. 필요하다면 인터넷 검색 결과를 바탕으로 보고서를 작성해야 합니다.
      5. 인터넷 검색 결과를 사용할 경우 마지막에 "참고문헌" 차례에 구체적인 참고문헌 url 링크를 첨부해야 합니다.
      6. 보고서는 명확한 어휘를 사용해서 작성해야 합니다.
      7. 아래 제시된 보고서의 핵심내용을 반드시 반영해야 합니다.
      8. 첨부된 이미지나 도표를 적절한 위치에 인용해야 합니다.
      9. 실험보고서 주제에 따라 작성해야 합니다
      </조건>

      <첨부파일>
      첨부파일을 사용할 때에는 본문 속에 <<파일명>>과 같이 작성해야 합니다. 아래는 사용가능한 파일 리스트와 파일의 내용들입니다.

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
      </보고서 주제>`;
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
}
