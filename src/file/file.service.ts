import { Injectable, NotFoundException } from '@nestjs/common';
import { File } from './entity/file.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateFileDto } from './dto/create-file.dto';
import { Document } from 'src/document/entity/document.entity';
import * as AWS from 'aws-sdk';
import { create } from 'domain';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: process.env.AWS_REGION,
});

@Injectable()
export class FileService {
  constructor(
    @InjectRepository(File)
    private fileRepository: Repository<File>,
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
  ) {}

  async uploadFile(file: Express.Multer.File, createFileDto: CreateFileDto): Promise<File> {
    const document = await this.documentRepository.findOneBy({id: createFileDto.document_id});
    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const uploadResult = await s3
      .upload({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: "input/" + createFileDto.name,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
      .promise();

    const newFile = this.fileRepository.create({
      name: createFileDto.name,
      description: createFileDto.description,
      type: createFileDto.type,
      url: uploadResult.Location,
      document,
    });

    return this.fileRepository.save(newFile);
  }
}
