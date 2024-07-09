import { User } from 'src/users/entity/user.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';

// 사용자의 인증 정보를 저장하는 엔터티(테이블)입니다.
@Entity()
export class Identity {
  @PrimaryGeneratedColumn() // 기본키를 생성합니다.
  id: number;

  @Column()
  email: string;

  @Column({ nullable: true })
  password: string;

  @Column({ nullable: true })
  refreshToken?: string;

  @Column({ nullable: true })
  provider: string;

  @Column()
  is_email_verified: Boolean;

  @Column()
  is_phone_verified: Boolean;

  @OneToOne(() => User) // User 엔터티와 일대일 관계를 설정합니다.
  @JoinColumn()
  user: User;
}
