import { Identity } from './entity/identity.entity';
import { Repository } from 'typeorm';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { SignUpDto } from './dto/signup.dto';
import { User } from 'src/users/entity/user.entity';
import { LoginDto } from './dto/login.dto';
import { Verification } from './entity/verification.entity';
import { EmailService } from 'src/email/email.service';
export declare class AuthService {
    private identityRepository;
    private verificationRepository;
    private usersService;
    private jwtService;
    private emailService;
    constructor(identityRepository: Repository<Identity>, verificationRepository: Repository<Verification>, usersService: UsersService, jwtService: JwtService, emailService: EmailService);
    sendVerificationCode(email: string): Promise<void>;
    verifyEmail(email: string, code: string): Promise<false | Boolean>;
    signup(res: Response, signUpDto: SignUpDto): Promise<void>;
    login(res: Response, loginDto: LoginDto): Promise<void>;
    verifyUser(userId: number): Promise<User>;
    refreshToken(res: Response, token: string): Promise<void>;
    logout(res: Response): Promise<void>;
    validateOAuthLogin(userPayload: any, provider: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
}
