import { ApiProperty } from '@nestjs/swagger';

// CreateUserDto는 사용자를 생성할 때 사용하는 데이터 전송 객체입니다.
export class CreateUserDto {
  @ApiProperty({
    example: 'Nakyung Lee',
    description: 'The name of the user',
  })
  name: string;

  @ApiProperty({
    example: 'abcd@gmail.com',
    description: 'The email of the user',
  })
  email: string;

  @ApiProperty({
    example: '010-1234-5678',
    description: 'The phone number of the user',
  })
  phone_number: string;

  @ApiProperty({
    example: '1234567890',
    description: 'The Kakao ID of the user',
    required: false, // 카카오 사용자가 아닐 경우 null이 될 수 있음
  })
  kakaoId?: string; // 카카오 사용자의 고유 ID를 저장
}
