import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Document } from './entity/document.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/entity/user.entity';
import { CreateDocumentDto } from './dto/create-document.dto';
import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import Anthropic from '@anthropic-ai/sdk';
import { EditDocumentDto } from './dto/edit-document.dto';
import * as url from 'url';
import { File } from 'src/file/entity/file.entity';
import { classifyFiles, classifyImageType } from 'src/utils/file-utils';
import { ClaudeImageApiObject } from './dto/claude-api-objects.dto';

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: process.env.AWS_REGION,
});

@Injectable()
export class DocumentService {
  private s3 = new AWS.S3();

  constructor(
    @InjectRepository(Document) // Document 엔터티를 주입합니다.
    private documentRepository: Repository<Document>, // Document 레포지토리를 주입합니다.
    @InjectRepository(User) // User 엔터티를 주입합니다.
    private userRepository: Repository<User>, // User 레포지토리를 주입합니다.
  ) {}

  // 게시글을 생성합니다.
  async create(
    createDocumentDto: CreateDocumentDto,
    user_id: number,
  ): Promise<Document> {
    const { title, amount, type, prompt, form, elements, core } =
      createDocumentDto;

    // 사용자를 조회합니다.
    const user = await this.userRepository.findOneBy({ id: user_id });

    // 사용자가 존재하지 않으면 예외를 던집니다.
    if (!user) {
      throw new Error('User not found');
    }

    // 게시글을 생성합니다.
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
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await this.claudeApiCall(anthropic, document, `에세이 주제 "${document.title}"에 대해 답변하기 위해서 내용과 관련해서 너가 모르는 정보나 사용자의 견해 등 추가적으로 받아야 할 정보가 있어? 있으면 {
      needMorePrompt: 1,
      prompt: ["질문1 내용", "질문2 내용",...]
    }형태로 대답하고, 없으면 {
      needMorePrompt: 0
    }으로 대답해`);
  
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
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const prompt = await this.genPromptFromDoc(document);
    promptHistory.push({"role": "user", "content": prompt});
    //prompt 적용하기
    //const response = await this.claudeApiCall(anthropic, document, prompt);
    const response = await this.claudeApiCall(anthropic, document, prompt);
    totalInputTokenCount += response.usage['input_tokens'];
    totalOutputTokenCount += response.usage['output_tokens'];
    promptHistory.push({"role": "assistant", "content": response.content[0]['text']});
    if (response.stop_reason === "end_turn") {
      const textOutput = response.content[0]['text'];
    } else {
      const response = await this.claudeApiCallWithPromptHistory(anthropic, document, promptHistory);
      totalInputTokenCount += response.usage['input_tokens'];
      totalOutputTokenCount += response.usage['output_tokens'];
      const textOutput = promptHistory[1]['content']+response.content[0]['text'];
    }
    const s3Url = await this.uploadContentToS3(
      textOutput,
      document.title,
    );
    document.used_input_tokens = totalInputTokenCount;
    document.used_output_tokens = totalOutputTokenCount;
    document.url = s3Url;
    return this.documentRepository.save(document);
  }

  async claudeApiCallWithPromptHistory(anthropic: Anthropic, document: Document, promptHistory: object[]): Promise<any> {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 8192,
      messages: [{"role": "user", "content": promptHistory[0]['content']},
                 {"role": "assistant", "content": promptHistory[1]['content']},
                 {"role": "user", "content": "Continue."},],
    });
    return response;
  }

  async claudeApiCall(anthropic: Anthropic, document: Document, prompt: string): Promise<any> {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 8192,
      messages: [{"role": "user", "content": prompt}],
    });
    console.log(response.content[0]['text']);
    return response;
  }

  async fetchImageData(imageFiles: File[]): Promise<ClaudeImageApiObject[]> {
    const claudeImageLists: ClaudeImageApiObject[] = [];

    for (const file of imageFiles) {
      const response = await fetch(file.url);
      const arrayBuffer = await response.arrayBuffer();
      const base64Image = Buffer.from(arrayBuffer).toString('base64');
      claudeImageLists.push(new ClaudeImageApiObject(file.description, file.name, base64Image, classifyImageType(file.url)));
    }
    return claudeImageLists;
  }

  async fetchAndProcessTableData(urls: string[]): Promise<string[]> {
    // URL 리스트를 받아서 각 URL의 테이블 데이터를 처리하여 반환
    return null;
  }

  async claudeApiCallWithFiles(anthropic: Anthropic, document: Document, prompt: string): Promise<any> {
    const { imageFiles, tableFiles } = classifyFiles(document.files);
    //const imagePrompts = genImagePrompts(imageFiles);
    //const tablePrompts = genTablePrompts(tableFiles);
    
    const images = await this.fetchImageData(imageFiles);
    const table = await this.fetchAndProcessTableData(tableFiles);
    let a: Anthropic.Messages.MessageParam[] = [{role: 'user', content: images.map(image => image.gen_content()).reduce((accumulator, val) => {return accumulator.concat(val)}, [])}];
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
        {
          role: 'user',
          content: `Here is the total document content: ${content}.\nPlease edit it as follows:\n${prompt}`,
        },
      ],
    });
  }
  
  async uploadContentToS3(content: string, title: string): Promise<string> {
    const fileName = `${title}-${uuidv4()}.txt`; // 파일 이름 설정
    const filePath = path.join('documents', fileName); // 파일 경로 설정

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME, // S3 버킷 이름
      Key: filePath, // 파일 경로
      Body: content, // 파일 내용
      ContentType: 'text/plain', // 파일 타입
    };

    try {
      const data = await this.s3.upload(params).promise();
      return data.Location; // 업로드된 파일의 URL 반환
    } catch (error) {
      console.error('Error uploading file to S3:', error);
      throw new Error('Error uploading file to S3');
    }
  }

  async edit(editDocumentDto: EditDocumentDto) {
    const { document_id, prompt, content_before } = editDocumentDto;

    const final_prompt = `Edit chosen part, ${content_before}, as following instruction. ${prompt} \n Retrieve only result of edited part as response, not all the total document.`;

    // s3에서 문서 다운로드
    const document = await this.documentRepository.findOne({
      where: { id: document_id },
    });
    const url_document = document.url;
    const documentContent = await this.downloadContentFromS3(url_document);

    //claude API edit call
    // 사용자 프롬프트를 통해 Claude API에 수정 요청을 보내고 이를 반영하여 document 수정
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const content_after = await this.claudeApiEditCall(
      anthropic,
      final_prompt,
      documentContent,
    );
    const updatedContent = documentContent.replace(
      content_before,
      content_after,
    );

    // edit content 저장
    const s3Url = await this.updateContentToS3(updatedContent, url_document);

    return s3Url;
  }

  async claudeApiEditCall(
    anthropic: Anthropic,
    prompt: string,
    content: string,
  ): Promise<string> {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: `Here is the total document content: ${content}.\nPlease edit it as follows:\n${prompt}`,
        },
      ],
    });
    return response.content[0]['text'];
  }

  async downloadContentFromS3(url: string): Promise<string> {
    // URL을 분석
    const parsedUrl = new URL(url);

    // pathname에서 첫 번째 슬래시를 제거하고 디코딩하여 키를 얻기
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
      Bucket: process.env.AWS_BUCKET_NAME, // S3 버킷 이름
      Key: key, // 파일 경로
      Body: content, // 파일 내용
      ContentType: 'text/plain', // 파일 타입
    };

    try {
      const data = await this.s3.upload(params).promise();
      return data.Location; // 업로드된 파일의 URL 반환
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
      당신은 보고서를 작성해야 하는 대학생입니다.
      <지시문>
      아래 제시한 조건과 요청사항에 따라 보고서를 작성해주세요.
      </지시문>
      
      <조건>
      1. 분량은 반드시 ${amount}자 이내로 작성해야 합니다.
      2. 양식 : ${form}
      3. 보고서는 html로 작성되어야 합니다.
      4. 필요하다면 인터넷 검색 결과를 바탕으로 보고서를 작성해야 합니다.
      5. 인터넷 검색 결과를 사용할 경우 마지막에 "참고문헌" 차례에 구체적인 참고문헌 url 링크를 첨부해야 합니다.
      6. 보고서는 명확한 어휘와 전문용어를 사용해서 작성해야 합니다.
      7. 아래 보고서 주제에 따라 작성하세요.
      8. 보고서의 서식은 대제목-중제목-소제목-본문으로 구성되어야 합니다. 대제목과 중제목은 볼드체를 사용하고 대제목은 항상 중앙 정렬되어야 합니다. 본문은 축약형이 아닌 서술형의 형태로 작성되어야 합니다.
      
      </조건>
      
      <요청사항>
      ${prompt}
      </요청사항>
      
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
      1. 분량은 반드시 ${amount}자 이내로 작성해야 합니다.
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

      ${files? formatFiles(files) : '첨부파일이 없습니다.'}

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
}
