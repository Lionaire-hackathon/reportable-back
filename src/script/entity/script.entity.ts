import { Document } from 'src/document/entity/document.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Script {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  page: number;

  @Column()
  content: string;

  @ManyToOne(() => Document, (document) => document.scripts)
  @JoinColumn()
  document_id: Document;
}
