import { User } from 'src/users/entity/user.entity';
import {
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  Entity,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

// Type은 문서의 종류를 정의합니다.
export enum Type {
  essay = 'essay',
  research = 'research',
}

@Entity()
export class Document {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  amount: number;

  @Column()
  type: Type;

  @Column()
  prompt: string;

  @Column()
  form: string;

  @Column()
  elements: string;

  @Column()
  core: string;

  @Column()
  url: string;

  @Column()
  used_tokens: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => User, (user) => user.documents)
  @JoinColumn()
  user: User;
}
