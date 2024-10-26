import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
  } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class Payment {
@ApiProperty({ description: '결제 ID' })
@PrimaryGeneratedColumn()
id: number;

@ApiProperty({ description: '결제 방법' })
@Column()
paymentMethod: string;

@ApiProperty({ description: '상품 코드' })
@Column()
productCode: string;

@ApiProperty({ description: '상품 이름' })
@Column()
productName: string;

@ApiProperty({ description: '결제 금액', example: 10000 })
@Column('decimal', { precision: 10, scale: 2 })
paymentAmount: number;

@ApiProperty({ description: '생성 일자' })
@CreateDateColumn()
createdAt: Date;

@ApiProperty({ description: '수정 일자' })
@UpdateDateColumn()
updatedAt: Date;
}
