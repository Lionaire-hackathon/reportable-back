import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentDto {
  @ApiProperty({ description: '결제 방법 (예: 카드, 계좌이체)', example: '카드' })
  @IsNotEmpty({ message: '결제 방법은 필수 항목입니다.' })
  @IsString()
  paymentMethod: string;

  @ApiProperty({ description: '상품 코드', example: 'PROD_001' })
  @IsNotEmpty({ message: '상품 코드는 필수 항목입니다.' })
  @IsString()
  productCode: string;

  @ApiProperty({ description: '상품 이름', example: '프리미엄 이용권' })
  @IsNotEmpty({ message: '상품 이름은 필수 항목입니다.' })
  @IsString()
  productName: string;

  @ApiProperty({ description: '결제 금액', example: 10000 })
  @IsNotEmpty({ message: '결제 금액은 필수 항목입니다.' })
  @IsNumber({}, { message: '결제 금액은 숫자여야 합니다.' })
  paymentAmount: number;
}
