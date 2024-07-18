import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Document } from './entity/document.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/entity/user.entity';
import { CreateDocumentDto } from './dto/create-document.dto';
import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

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
  async create(createDocumentDto: CreateDocumentDto, user_id: number): Promise<Document> {
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
    const document = await this.documentRepository.findOneBy({ id: documentId });
    if (!document) {
      throw new Error('Document not found');
    }

    const content = await this.claudeApiCall(document);

    const s3Url = await this.uploadContentToS3(content, document.title);
    
    document.url = s3Url;


    return this.documentRepository.save(document);
  }

  async claudeApiCall(document: Document): Promise<string> {
    // Claude API 호출
    return 'claude api content';
  }

  async uploadContentToS3(content: string, title: string): Promise<string> {
    const fileName = `${uuidv4()}.txt`; // 고유한 파일 이름 생성
    const filePath = path.join('documents', fileName); // 파일 경로 설정

    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME, // S3 버킷 이름
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
}
