import { Document } from './entity/document.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/entity/user.entity';
import { CreateDocumentDto } from './dto/create-document.dto';
import { Edit } from './entity/edit.entity';
import { EditDocumentDto } from './dto/edit-document.dto';
import { File } from 'src/file/entity/file.entity';
import { ClaudeImageApiObject } from './dto/claude-api-objects.dto';
import { EditPromptDto } from './dto/edit-prompt.dto';
import { Pinecone } from '@pinecone-database/pinecone';
interface PromptHistory {
    role: string;
    content: string;
}
interface ClaudeApiResponse {
    content: {
        text: string;
    }[];
    usage: {
        input_tokens: number;
        output_tokens: number;
    };
    stop_reason: string;
}
export declare class DocumentService {
    private documentRepository;
    private userRepository;
    private fileRepository;
    private editRepository;
    private s3;
    constructor(documentRepository: Repository<Document>, userRepository: Repository<User>, fileRepository: Repository<File>, editRepository: Repository<Edit>);
    queryrag(pinc: Pinecone, query: string): Promise<string>;
    findOne(documentId: number, userId: number): Promise<Document>;
    create(createDocumentDto: CreateDocumentDto, user_id: number): Promise<Document>;
    deleteDocument(documentId: number): Promise<Document>;
    firstPrompt(documentId: number): Promise<any>;
    createContent(documentId: number): Promise<Document>;
    claudeApiCallWithPromptHistory(document: Document, promptHistory: PromptHistory[]): Promise<ClaudeApiResponse>;
    claudeApiCall(document: Document, prompt: string): Promise<ClaudeApiResponse>;
    fetchImageData(imageFiles: File[]): Promise<ClaudeImageApiObject[]>;
    fetchAndProcessTableData(urls: string[]): Promise<string[]>;
    claudeApiCallWithFiles(document: Document, prompt: string): Promise<ClaudeApiResponse>;
    uploadContentToS3(content: string, title: string): Promise<string>;
    edit(editDocumentDto: EditDocumentDto, userId: number): Promise<{
        cloudFrontUrl: string;
        wordUrl: string;
        editId: number;
    }>;
    gptApiCall(documentContent: string, content_before: string, prompt: string): Promise<{
        exact_content_before: string;
        content_after: string;
        used_input_tokens: number;
        used_output_tokens: number;
    }>;
    getText(documentId: number): Promise<string>;
    genPromptFromDoc(document: Document): Promise<string>;
    editPrompt(editPromptDto: EditPromptDto): Promise<Document>;
    getDocFile(documentId: number): Promise<string>;
    downloadContentFromS3(url: string): Promise<string>;
    downloadImageFromS3(url: string): Promise<Buffer>;
    updateContentToS3(content: string, url: string): Promise<string>;
}
export {};
