import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { DocumentService } from './document.service';
import { CreateDocumentDto } from './dto/create-document.dto';

@Controller('document')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  // 새로운 문서를 생성합니다.
  @UseGuards(JwtGuard) // JwtGuard를 사용하여 JWT를 검증합니다.
  @Post()
  create(@Body() createDocumentDto: CreateDocumentDto, @Req() req) {
    return this.documentService.create(createDocumentDto, req.user.userId);
  }
}
