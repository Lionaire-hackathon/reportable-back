import { ApiProperty } from '@nestjs/swagger';

// EditSCriptDto는 문서를 수정할 때 사용하는 데이터 전송 객체입니다.
export class EditSCriptDto {
  @ApiProperty({
    example: 'The edit before content part of the document script',
    description: 'The edit before content part of the document script',
  })
  content_before: string;

  @ApiProperty({
    example: 'The edit prompt for the content before part',
    description: 'The edit prompt for the content before part',
  })
  prompt: string;
}
