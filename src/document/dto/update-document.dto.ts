import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from '../entity/document.entity';

// CreatePostDto는 게시글을 생성할 때 사용하는 데이터 전송 객체입니다.
export class UpdateDocumentDto {
  @ApiPropertyOptional({
    example: 'The title of the document',
    description: 'The title of the document',
  })
  title?: string;

  @ApiPropertyOptional({
    example: 'The amount of the document',
    description: 'The content of the document',
  })
  amount?: number;

  @ApiPropertyOptional({
    example: 'essay or research',
    description: 'The type of the post',
  })
  type?: Type;

  @ApiPropertyOptional({
    example: 'The prompt of the document',
    description: 'The prompt of the document',
  })
  prompt?: string;

  @ApiPropertyOptional({
    example: 'The format of essay',
    description: 'The format of essay',
  })
  form?: string;

  @ApiPropertyOptional({
    example: 'The elements of research paper',
    description: 'The elements of research paper',
  })
  elements?: string;

  @ApiPropertyOptional({
    example: 'The core contents of research paper',
    description: 'The core contents of research paper',
  })
  core?: string;
}
