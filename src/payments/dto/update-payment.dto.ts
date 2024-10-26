import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePaymentDto {
  @ApiPropertyOptional({ description: '결제 방법 (예: 카드, 계좌이체)', example: '계좌이체' })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional({ description: '상품 코드', example: 'PROD_002' })
  @IsOptional()
  @IsString()
  productCode?: string;

  @ApiPropertyOptional({ description: '상품 이름', example: '스타터 이용권' })
  @IsOptional()
  @IsString()
  productName?: string;

  @ApiPropertyOptional({ description: '결제 금액', example: 5000 })
  @IsOptional()
  @IsNumber({}, { message: '결제 금액은 숫자여야 합니다.' })
  paymentAmount?: number;
}
