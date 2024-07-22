import { Module } from '@nestjs/common';
import { DocumentService } from './document.service';
import { DocumentController } from './document.controller';
import { User } from 'src/users/entity/user.entity';
import { Document } from './entity/document.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { File } from 'src/file/entity/file.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Document, File])],
  providers: [DocumentService],
  controllers: [DocumentController]
})
export class DocumentModule {}
