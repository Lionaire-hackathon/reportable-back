import { File } from 'src/file/entity/file.entity';
export declare function zip<T>(...arrays: T[][]): T[][];
export declare function classifyFiles(files: File[]): {
    imageFiles: File[];
    spreadsheetFiles: File[];
};
export declare function getFileExtension(url: string): string;
export declare function isImageFile(filename: string): boolean;
export declare function classifyImageType(file_url: string): string;
export declare function isSpreadsheetFile(filename: string): boolean;
