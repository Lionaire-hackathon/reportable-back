import { File } from './entity/file.entity';
import { Repository } from 'typeorm';
import { CreateFileDto } from './dto/create-file.dto';
import { Document } from 'src/document/entity/document.entity';
export declare class FileService {
    private fileRepository;
    private documentRepository;
    constructor(fileRepository: Repository<File>, documentRepository: Repository<Document>);
    create(createFileDto: CreateFileDto): Promise<File>;
}
