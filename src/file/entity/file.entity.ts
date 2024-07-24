import { Document } from 'src/document/entity/document.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

// 파일 타입 정의 : 첨부용 / 분석용
export type FileType = 'attachment' | 'analysis';

@Entity()
export class File {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  type: FileType;

  @Column()
  description: string;

  @Column({length: 5000})
  url: string;

  @ManyToOne(() => Document, (document) => document.files, { onDelete: 'CASCADE' })
  @JoinColumn()
  document: Document;
}
