import { Document } from 'src/document/entity/document.entity';
export type FileType = 'attachment' | 'analysis';
export declare class File {
    id: number;
    name: string;
    type: FileType;
    description: string;
    url: string;
    document: Document;
}
