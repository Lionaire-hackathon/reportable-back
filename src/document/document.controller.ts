import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { DocumentService } from './document.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { JwtGuard } from 'src/auth/guard/jwt.guard';
import { DocumentDto } from './dto/document.dto';
import { ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { EditDocumentDto } from './dto/edit-document.dto';
import { EditPromptDto } from './dto/edit-prompt.dto';

@Controller('document')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  // 새로운 문서를 생성합니다.
  @ApiBearerAuth('JWT')
  @UseGuards(JwtGuard) // JwtGuard를 사용하여 JWT를 검증합니다.
  @Post()
  create(@Body() createDocumentDto: CreateDocumentDto, @Req() req) {
    return this.documentService.create(createDocumentDto, req.user.userId);
  }
  // 문서의 내용을 생성합니다.
  @ApiBearerAuth('JWT')
  @UseGuards(JwtGuard) // JwtGuard를 사용하여 JWT를 검증합니다.
  @Put('content/:id')
  createContent(@Param('id') documentId: number) {
    return this.documentService.createContent(documentId);
  }
  
  @Post('first-prompt/:id')
  firstPrompt(@Param('id') documentId: number) {
    return this.documentService.firstPrompt(documentId);
  }
  // 문서의 내용 수정하기
  @ApiBearerAuth('JWT')
  @UseGuards(JwtGuard) // JwtGuard를 사용하여 JWT를 검증합니다.
  @Patch('edit')
  edit(@Body() editDocumentDto: EditDocumentDto) {
    return this.documentService.edit(editDocumentDto);
  }
  
  @ApiBearerAuth('JWT')
  @UseGuards(JwtGuard) // JwtGuard를 사용하여 JWT를 검증합니다.
  @Get('text/:id')
  getText(@Param('id') documentId: number) {
    return this.documentService.getText(documentId);
  }

  @ApiBearerAuth('JWT')
  @UseGuards(JwtGuard)
  @Put('edit-prompt')
  editPrompt(@Body() editPromptDto: EditPromptDto) {
    return this.documentService.editPrompt(editPromptDto);
  }
}