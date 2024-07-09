import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Document } from './entity/document.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/entity/user.entity';
import { CreateDocumentDto } from './dto/create-document.dto';

@Injectable()
export class DocumentService {
  constructor(
    @InjectRepository(Document) // Document 엔터티를 주입합니다.
    private documentRepository: Repository<Document>, // Document 레포지토리를 주입합니다.
    @InjectRepository(User) // User 엔터티를 주입합니다.
    private userRepository: Repository<User>, // User 레포지토리를 주입합니다.
  ) {}

  // 게시글을 생성합니다.
  async create(createDocumentDto: CreateDocumentDto, user_id: number) {
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

    // 게시글을 저장하고 반환합니다.
    return this.documentRepository.save(post);
  }
}
