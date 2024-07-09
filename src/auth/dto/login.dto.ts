import { ApiProperty } from '@nestjs/swagger';

// DTO는 데이터 전송 객체로, 클라이언트와 서버 간의 데이터를 전송하는 데 사용됩니다.
// LoginDto는 사용자가 로그인할 때 사용하는 데이터 전송 객체입니다.
// @ApiProperty() 데코레이터는 Swagger에 표시되는 API 문서를 생성합니다.

export class LoginDto {
  @ApiProperty({
    example: 'abc@gmail.com', // 예시
    description: 'The email of the user', // 설명
  })
  email: string;

  @ApiProperty({
    example: 'abcdefg',
    description: 'The password of the user',
  })
  password: string;
}
