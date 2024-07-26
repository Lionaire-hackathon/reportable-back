import { File } from 'src/file/entity/file.entity';
import { User } from 'src/users/entity/user.entity';
import { Edit } from './edit.entity';
export declare enum Type {
    essay = "essay",
    research = "research"
}
export declare class Document {
    id: number;
    title: string;
    amount: number;
    type: Type;
    prompt: string;
    form: string;
    elements: string;
    core: string;
    url: string;
    wordUrl: string;
    retrieval: string;
    used_input_tokens: number;
    used_output_tokens: number;
    created_at: Date;
    updated_at: Date;
    user: User;
    files: File[];
    edits: Edit[];
}
