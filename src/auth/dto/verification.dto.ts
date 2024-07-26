import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VerificationDto {
  @ApiPropertyOptional({
    example: 'abc@gmail.com', // 예시
    description: 'The email of the user', // 설명
  })
  email?: string;

  @ApiPropertyOptional({
    example: '01012345678', // 예시
    description: 'The phone number of the user', // 설명
  })
  phone_number?: string;

  @ApiPropertyOptional({
    example: '01012345678', // 예시
    description: 'The phone number of the user', // 설명
  })
  code?: string;
}
