import { FileService } from './file.service';
import { CreateFileDto } from './dto/create-file.dto';
import { File } from './entity/file.entity';
export declare class FileController {
    private readonly fileService;
    constructor(fileService: FileService);
    uploadFile(file: Express.Multer.File, createFileDto: CreateFileDto): Promise<File>;
}
