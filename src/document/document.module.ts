import { Module } from '@nestjs/common';
import { DocumentService } from './document.service';
import { DocumentController } from './document.controller';
import { User } from 'src/users/entity/user.entity';
import { Document } from './entity/document.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([User, Document])],
  providers: [DocumentService],
  controllers: [DocumentController]
})
export class DocumentModule {}
