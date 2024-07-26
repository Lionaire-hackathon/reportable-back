import { AuthService } from './auth.service';
import { SignUpDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { VerificationDto } from './dto/verification.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    signup(signUpDto: SignUpDto, res: any): Promise<void>;
    login(loginDto: LoginDto, res: any): Promise<void>;
    sendcode(verificationDto: VerificationDto): Promise<void>;
    verifycode(verificationDto: VerificationDto): Promise<false | Boolean>;
    verify(req: any): Promise<import("../users/entity/user.entity").User>;
    refresh(refreshToken: any, res: any): Promise<void>;
    refreshToken(req: any, res: any): void;
    logout(res: any): Promise<void>;
    googleAuthRedirect(req: any, res: any): Promise<void>;
}
