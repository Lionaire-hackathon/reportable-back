import { Identity } from 'src/auth/entity/identity.entity';
import { Document } from 'src/document/entity/document.entity';
import { Edit } from 'src/document/entity/edit.entity';
import {
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  Entity,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';

// Role은 사용자의 역할을 정의합니다.
export enum Role {
  admin = 'admin',
  user = 'user',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true, nullable: true }) // 이메일은 카카오 로그인의 경우 null일 수 있음
  email: string;

  @Column({ nullable: true }) // 전화번호도 카카오에서 제공되지 않을 수 있음
  phone_number: string;

  @Column({ unique: true, nullable: true }) // 카카오 사용자 고유 ID, 유일해야 함
  kakaoId: string;

  @Column()
  role: Role;

  @Column({ default: 3 })
  essayLimit: number;

  @Column({ default: 3 })
  researchLimit: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToOne(() => Identity, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn()
  identity: Identity;

  @OneToMany(() => Document, (document) => document.user, {
    cascade: true,
    onDelete: 'CASCADE',
    eager: true,
    onUpdate: 'CASCADE',
  })
  @JoinColumn()
  documents: Document[];

  @OneToMany(() => Edit, (edit) => edit.user, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn()
  edits: Edit[];
}
