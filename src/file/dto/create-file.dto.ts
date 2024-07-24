import { ApiProperty } from '@nestjs/swagger';
import { FileType } from '../entity/file.entity';

export class CreateFileDto {
  @ApiProperty({
    example: 'The title of the document',
    description: 'The title of the document',
  })
  document_id: number;

  @ApiProperty({
    example: 'The name of the file',
    description: 'The name of the file',
  })
  name: string;

  @ApiProperty({
    example: 'The description of the file',
    description: 'The description of the file',
  })
  description: string;

  @ApiProperty({
    example: 'The url of the file',
    description: 'The title of the file',
  })
  url: string;

  @ApiProperty({
    example: 'attachment',
    description: 'The type of the file',
  })
  type: FileType;
}
