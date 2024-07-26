import {
  Body,
  Controller,
  Delete,
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
import { ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { EditDocumentDto } from './dto/edit-document.dto';
import { EditPromptDto } from './dto/edit-prompt.dto';

@Controller('document')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}


  @ApiBearerAuth('JWT')
  @UseGuards(JwtGuard)
  @Get('/:id')
  findOne(@Param('id') documentId: number) {
    return this.documentService.findOne(documentId);
  }
  // 새로운 문서를 생성합니다.
  @ApiBearerAuth('JWT')
  @UseGuards(JwtGuard) // JwtGuard를 사용하여 JWT를 검증합니다.
  @Post()
  create(@Body() createDocumentDto: CreateDocumentDto, @Req() req) {
    return this.documentService.create(createDocumentDto, req.user.userId);
  }

  @ApiBearerAuth('JWT')
  @UseGuards(JwtGuard)
  @Delete(':id')
  deleteDocument(@Param('id') documentId: number) {
    return this.documentService.deleteDocument(documentId);
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
  @UseGuards(JwtGuard)
  @Put('edit') // 문서의 내용을 프롬프트를 기반으로 수정합니다.
  edit(@Body() editDocumentDto: EditDocumentDto, @Req() req) {
    return this.documentService.edit(editDocumentDto, req.user.userId);
  }
  
  @ApiBearerAuth('JWT')
  @UseGuards(JwtGuard) // JwtGuard를 사용하여 JWT를 검증합니다.
  @Get('text/:id')
  getText(@Param('id') documentId: number) {
    return this.documentService.getText(documentId);
  }

  @ApiBearerAuth('JWT')
  @UseGuards(JwtGuard)
  @Put('edit-prompt') // firstPrompt 질문을 통해 얻은 답변을 프롬프트에 추가합니다.
  editPrompt(@Body() editPromptDto: EditPromptDto) {
    return this.documentService.editPrompt(editPromptDto);
  }

  @Get('doc/:id')
  getDocFile(@Param('id') documentId: number) {
    return this.documentService.getDocFile(documentId);
  }
}