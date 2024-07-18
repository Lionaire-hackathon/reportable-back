import { Injectable, NotFoundException } from '@nestjs/common';
import { File } from './entity/file.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateFileDto } from './dto/create-file.dto';
import { Document } from 'src/document/entity/document.entity';

@Injectable()
export class FileService {
  constructor(
    @InjectRepository(File)
    private fileRepository: Repository<File>,
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
  ) {}

  async create(createFileDto: CreateFileDto) {
    const { document_id, name, url } = createFileDto;

    // Find the Document entity using the document_id
    const document = await this.documentRepository.findOne({
      where: { id: document_id },
    });
    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Create a new File entity and set its properties
    const file = this.fileRepository.create({ name, url, document });

    // Save the File entity using the repository
    await this.fileRepository.save(file);

    // Return the created File entity
    return file;
  }
}
