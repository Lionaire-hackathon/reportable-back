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
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 512,
      messages: [{ role: 'user', content: 'Say 1' }],
    });
    console.log(response.content[0]['text']);
    return response;
  }

  async uploadContentToS3(content: string, title: string): Promise<string> {
    const fileName = `${uuidv4()}.txt`; // 고유한 파일 이름 생성
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
    console.log('total document ', documentContent);
    console.log('before_content ', content_before);

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

    console.log('updated content', updatedContent);

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
    // URL을 분석합니다.
    const parsedUrl = new URL(url);

    // pathname에서 첫 번째 슬래시를 제거하고 디코딩하여 키를 얻습니다.
    const key = decodeURIComponent(parsedUrl.pathname.substring(1));
    console.log('converted key: ', key);

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

    console.log('update_key:', key);

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
}
