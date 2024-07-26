import { Document } from './document.entity';
import { User } from 'src/users/entity/user.entity';
export declare class Edit {
    id: number;
    document: Document;
    user: User;
    content_before: string;
    content_after: string;
    prompt: string;
    used_input_tokens: number;
    used_output_tokens: number;
    created_at: Date;
    updated_at: Date;
}
