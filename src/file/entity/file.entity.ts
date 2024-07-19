import { Document } from 'src/document/entity/document.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class File {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column({length: 5000})
  url: string;

  @ManyToOne(() => Document, (document) => document.files)
  @JoinColumn()
  document: Document;
}
