import { Document } from './document.entity';
import { User } from 'src/users/entity/user.entity';
import {
  Column,
  PrimaryGeneratedColumn,
  Entity,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity()
export class Edit {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Document, (document) => document.edits)
  @JoinColumn()
  document: Document;

  @ManyToOne(() => User, (user) => user.edits, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column({ length: 1000 })
  content_before: string;

  @Column({ length: 1000 })
  content_after: string;

  @Column({ length: 1000 })
  prompt: string;

  @Column({ default: 0 })
  used_input_tokens: number;

  @Column({ default: 0 })
  used_output_tokens: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}