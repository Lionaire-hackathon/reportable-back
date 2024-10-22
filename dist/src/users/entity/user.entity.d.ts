import { Identity } from 'src/auth/entity/identity.entity';
import { Document } from 'src/document/entity/document.entity';
import { Edit } from 'src/document/entity/edit.entity';
export declare enum Role {
    admin = "admin",
    user = "user"
}
export declare class User {
    id: number;
    name: string;
    email: string;
    phone_number: string;
    kakaoId: string;
    role: Role;
    essayLimit: number;
    researchLimit: number;
    created_at: Date;
    updated_at: Date;
    identity: Identity;
    documents: Document[];
    edits: Edit[];
}
