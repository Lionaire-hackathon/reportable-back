import {
  Body,
  Controller,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { DocumentService } from './document.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { JwtGuard } from 'src/auth/guard/jwt.guard';
import { CreateDocumentContentsDto } from './dto/create-document-contents.dto';
import { ApiBody } from '@nestjs/swagger';
import { EditDocumentDto } from './dto/edit-document.dto';
import { EditPromptDto } from './dto/edit-prompt.dto';

@Controller('document')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  // 새로운 문서를 생성합니다.
  @UseGuards(JwtGuard) // JwtGuard를 사용하여 JWT를 검증합니다.
  @Post()
  create(@Body() createDocumentDto: CreateDocumentDto, @Req() req) {
    return this.documentService.create(createDocumentDto, 1);
  }

  // 문서의 내용을 생성합니다.
  @UseGuards(JwtGuard) // JwtGuard를 사용하여 JWT를 검증합니다.
  @Put('content')
  @ApiBody({ type: CreateDocumentContentsDto })
  createContent(@Body() createDocumentContentsDto: CreateDocumentContentsDto) {
    return this.documentService.createContent(
      createDocumentContentsDto.documentId,
    );
  }

  @Post('first-prompt')
  @ApiBody({ type: CreateDocumentContentsDto })
  firstPrompt(@Body() createDocumentContentsDto: CreateDocumentContentsDto) {
    return this.documentService.firstPrompt(
      createDocumentContentsDto.documentId,
    );
  }
  // 문서의 내용 수정하기
  @UseGuards(JwtGuard) // JwtGuard를 사용하여 JWT를 검증합니다.
  @Patch('edit')
  edit(@Body() editDocumentDto: EditDocumentDto) {
    return this.documentService.edit(editDocumentDto);
  }

  // prompt 추가질문 받아 수정하기
  @UseGuards(JwtGuard)
  @Put('edit-prompt')
  editPrompt(@Body() editPromptDto: EditPromptDto) {
    return this.documentService.editPrompt(editPromptDto);
  }
}
