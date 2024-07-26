import { Identity } from './entity/identity.entity';
import { Repository } from 'typeorm';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { SignUpDto } from './dto/signup.dto';
import { User } from 'src/users/entity/user.entity';
import { LoginDto } from './dto/login.dto';
export declare class AuthService {
    private identityRepository;
    private usersService;
    private jwtService;
    constructor(identityRepository: Repository<Identity>, usersService: UsersService, jwtService: JwtService);
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
