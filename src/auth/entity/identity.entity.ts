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

  @Column({ nullable: true })
  email: string; // 카카오 로그인 시 이메일이 없을 수 있으므로 nullable로 설정

  @Column({ nullable: true })
  password: string; // 카카오 로그인 시 비밀번호가 없을 수 있으므로 nullable로 설정

  @Column({ nullable: true, length: 1000 })
  refreshToken?: string;

  @Column({ nullable: true })
  provider: string; // 'google', 'kakao' 등 제공자 이름을 저장

  @Column({ nullable: true, unique: true }) // 카카오 사용자 고유 ID를 저장
  kakaoId: string; // 카카오 로그인 시 사용

  @Column()
  is_email_verified: Boolean;

  @Column()
  is_phone_verified: Boolean;

  @OneToOne(() => User, { cascade: true, onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;
}
