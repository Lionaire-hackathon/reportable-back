import { Identity } from 'src/auth/entity/identity.entity';
import { Document } from 'src/document/entity/document.entity';
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

  @Column()
  email: string;

  @Column()
  phone_number: string;

  @Column()
  role: Role;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToOne(() => Identity, { cascade: true, onDelete: 'CASCADE' })
  @JoinColumn()
  identity: Identity;

  @OneToMany(() => Document, (document) => document.user, {
    cascade: true,
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn()
  documents: Document[];
}
