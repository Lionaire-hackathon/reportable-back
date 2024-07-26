import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Verification {
  @PrimaryGeneratedColumn() // 기본키를 생성합니다.
  id: number;

  @Column()
  email: string;

  @Column()
  phone_number: string;

  @Column()
  verification_code: string;

  @Column()
  expired_at: Date;

  @Column()
  is_verified: Boolean;
}
