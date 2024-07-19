import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// CreatePostDto는 게시글을 생성할 때 사용하는 데이터 전송 객체입니다.
export class DocumentDto {
  @ApiProperty({
    example: 1,
    description: 'The id of the document',
  })
  documentId: number;
}
