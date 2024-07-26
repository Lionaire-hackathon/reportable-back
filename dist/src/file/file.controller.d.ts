import { FileService } from './file.service';
import { CreateFileDto } from './dto/create-file.dto';
export declare class FileController {
    private readonly fileService;
    constructor(fileService: FileService);
    create(createFileDto: CreateFileDto, req: any): Promise<import("./entity/file.entity").File>;
}
