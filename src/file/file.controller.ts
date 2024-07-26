import { Body, Controller, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileService } from './file.service';
import { CreateFileDto } from './dto/create-file.dto';
import { JwtGuard } from 'src/auth/guard/jwt.guard';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { File } from './entity/file.entity';
import { FileDto } from './dto/file.dto';

@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  //@UseGuards(JwtGuard)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'File to upload',
    schema: {
      type: 'object',
      properties: {
        document_id: { type: 'number' },
        name: { type: 'string' },
        description: { type: 'string' },
        type: { type: 'string' }, // assuming FileType is a string for Swagger documentation
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() createFileDto: CreateFileDto,
  ): Promise<File> {
    return this.fileService.uploadFile(file, createFileDto);
  }
}
