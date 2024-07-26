import { Type } from '../entity/document.entity';
export declare class CreateDocumentDto {
    title: string;
    amount: number;
    type: Type;
    prompt: string;
    form?: string;
    elements?: string;
    core?: string;
    retrieval?: string;
}
