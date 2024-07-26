import { User } from 'src/users/entity/user.entity';
export declare class Identity {
    id: number;
    email: string;
    password: string;
    refreshToken?: string;
    provider: string;
    is_email_verified: Boolean;
    is_phone_verified: Boolean;
    user: User;
}
