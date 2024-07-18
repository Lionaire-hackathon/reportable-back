import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EditDocumentDto {
  @ApiProperty({
    example: 'The url of document in s3',
    description: 'The url of document in s3',
  })
  document_id: number;

  @ApiProperty({
    example: 'Add 5 to document',
    description: 'edit prompt; the thing you want to edit in document',
  })
  prompt: string;

  @ApiProperty({
    example: '1',
    description: 'Content to be edited',
  })
  content_before: string;
}
