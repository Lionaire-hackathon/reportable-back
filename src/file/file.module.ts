import { Module } from '@nestjs/common';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { File } from './entity/file.entity';
import { Document } from 'src/document/entity/document.entity';

@Module({
  imports: [TypeOrmModule.forFeature([File, Document])],
  controllers: [FileController],
  providers: [FileService]
})
export class FileModule {}
