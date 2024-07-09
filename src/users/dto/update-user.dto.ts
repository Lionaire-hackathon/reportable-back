// src/users/dtos/create-user.dto.ts
import { ApiProperty } from '@nestjs/swagger';

// CreateUserDto는 사용자를 생성할 때 사용하는 데이터 전송 객체입니다.
export class UpdateUserDto {
  @ApiProperty({
    example: 'Nakyung Lee',
    description: 'The name of the user',
  })
  name?: string;

  @ApiProperty({
    example: 'abcd@gmail.com',
    description: 'The email of the user',
  })
  email?: string;

  @ApiProperty({
    example: 'password',
    description: 'The password of the user',
  })
  password?: string;
}
