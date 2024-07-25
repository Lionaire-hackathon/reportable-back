import { File } from 'src/file/entity/file.entity';
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
import { Edit } from './edit.entity';

// Type은 문서의 종류를 정의합니다.
export enum Type {
  essay = 'essay',
  research = 'research',
}

@Entity()
export class Document {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 1000 })
  title: string;

  @Column()
  amount: number;

  @Column()
  type: Type;

  @Column({ length: 1000 })
  prompt: string;

  @Column({ length: 1000 })
  form: string;

  @Column({ length: 1000 })
  elements: string;

  @Column({ length: 1000 })
  core: string;

  @Column({ length: 2000 })
  url: string;

  @Column({length: 2000})
  wordUrl: string;

  @Column({length: 3800})
  retrieval: string;

  @Column({ default: 0 }) // default value 0 token으로 설정
  used_input_tokens: number;

  @Column({ default: 0 }) // default value 0 token으로 설정
  used_output_tokens: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => User, (user) => user.documents)
  @JoinColumn()
  user: User;

  @OneToMany(() => File, (file) => file.document, { cascade: true , eager: true, onDelete: 'CASCADE' })
  @JoinColumn()
  files: File[];

  @OneToMany(() => Edit, (edit) => edit.document, { cascade: true, eager: true, onDelete: 'CASCADE' })
  @JoinColumn()
  edits: Edit[];
}
