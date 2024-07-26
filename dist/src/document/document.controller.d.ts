import { DocumentService } from './document.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { EditDocumentDto } from './dto/edit-document.dto';
import { EditPromptDto } from './dto/edit-prompt.dto';
export declare class DocumentController {
    private readonly documentService;
    constructor(documentService: DocumentService);
    findOne(documentId: number): Promise<import("./entity/document.entity").Document>;
    create(createDocumentDto: CreateDocumentDto, req: any): Promise<import("./entity/document.entity").Document>;
    deleteDocument(documentId: number): Promise<import("./entity/document.entity").Document>;
    createContent(documentId: number): Promise<import("./entity/document.entity").Document>;
    firstPrompt(documentId: number): Promise<any>;
    edit(editDocumentDto: EditDocumentDto, req: any): Promise<{
        s3Url: string;
        wordUrl: string;
        editId: number;
    }>;
    getText(documentId: number): Promise<string>;
    editPrompt(editPromptDto: EditPromptDto): Promise<import("./entity/document.entity").Document>;
    getDocFile(documentId: number): Promise<string>;
}
