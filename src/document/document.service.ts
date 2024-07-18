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
import { File } from 'src/file/entity/file.entity';

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

  async createContent(documentId: number): Promise<Document> {
    const document = await this.documentRepository.findOneBy({
      id: documentId,
    });
    if (!document) {
      throw new Error('Document not found');
    }
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await this.claudeApiCall(anthropic, document);
    const s3Url = await this.uploadContentToS3(
      response.content[0]['text'],
      document.title,
    );

    document.url = s3Url;

    return this.documentRepository.save(document);
  }

  async claudeApiCall(anthropic: Anthropic, document: Document) {
    const prompt = await this.prompt(document);
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 512,
      //prompt 준비되면 사용하기
      messages: [{ role: 'user', content: 'say 1'}],
    });
    console.log(response.content[0]['text']);
    return response;
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

  async prompt(document: Document): Promise<string> {
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
