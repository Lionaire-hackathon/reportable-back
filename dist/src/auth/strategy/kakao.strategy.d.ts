import { Profile } from 'passport-kakao';
import { AuthService } from '../auth.service';
declare const KakaoStrategy_base: new (...args: any[]) => InstanceType<any>;
export declare class KakaoStrategy extends KakaoStrategy_base {
    private authService;
    constructor(authService: AuthService);
    validate(accessToken: string, refreshToken: string, profile: Profile, done: Function): Promise<void>;
}
export {};
