import { Body, Controller, Post, Put, Req, UseGuards } from '@nestjs/common';
import { DocumentService } from './document.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { JwtGuard } from 'src/auth/guard/jwt.guard';
import { CreateDocumentContentsDto } from './dto/create-document-contents.dto';
import { ApiBody } from '@nestjs/swagger';

@Controller('document')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  // 새로운 문서를 생성합니다.
  //@UseGuards(JwtGuard) // JwtGuard를 사용하여 JWT를 검증합니다.
  @Post()
  create(@Body() createDocumentDto: CreateDocumentDto, @Req() req) {
    return this.documentService.create(createDocumentDto, 1);
  }

  // 문서의 내용을 생성합니다.
  //@UseGuards(JwtGuard) // JwtGuard를 사용하여 JWT를 검증합니다.
  @Put('content')
  @ApiBody({type: CreateDocumentContentsDto})
  createContent(@Body() createDocumentContentsDto: CreateDocumentContentsDto) {
    return this.documentService.createContent(createDocumentContentsDto.documentId);
  }
}
