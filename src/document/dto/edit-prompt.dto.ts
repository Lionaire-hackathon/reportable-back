import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EditPromptDto {
  @ApiProperty({
    example: 'The url of document in s3',
    description: 'The url of document in s3',
  })
  documentId: number;

  @ApiProperty({
    example: 'Additional q&a prompt from user',
    description: 'Additional q$a prompt from user',
  })
  addPrompt: string;
}