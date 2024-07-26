import { FileType } from '../entity/file.entity';
export declare class CreateFileDto {
    document_id: number;
    name: string;
    description: string;
    type: FileType;
}
