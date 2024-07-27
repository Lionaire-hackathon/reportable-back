import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Identity } from './entity/identity.entity';
import { Repository } from 'typeorm';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';
import { SignUpDto } from './dto/signup.dto';
import { setLoginCookie, setLogoutCookie } from './auth.util';
import { Role, User } from 'src/users/entity/user.entity';
import { LoginDto } from './dto/login.dto';
import { Verification } from './entity/verification.entity';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Identity) // Identity 엔터티를 주입합니다.
    private identityRepository: Repository<Identity>, // Identity 레포지토리를 주입합니다.
    @InjectRepository(Verification)
    private verificationRepository: Repository<Verification>,
    private usersService: UsersService, // UsersService를 주입합니다.
    private jwtService: JwtService, // JwtService를 주입합니다.
    private emailService: EmailService,
  ) {}

  // 이메일 인증 요청
  async sendVerificationCode(email: string) {
    const verification_code = Math.floor(
      100000 + Math.random() * 900000,
    ).toString(); // Generate a 6-digit code
    const current_time = new Date();
    const expired_at = new Date(current_time.getTime() + 5 * 60000);
    const is_verified = false;

    // Verification 엔티티에 정보 저장
    const verification = new Verification();
    verification.email = email;
    verification.verification_code = verification_code;
    verification.expired_at = expired_at;
    verification.is_verified = is_verified;

    // 데이터베이스에 저장
    await this.verificationRepository.save(verification);

    await this.emailService.sendVerificationMail(email, verification_code);
  }

  // 이메일 인증 확인
  async verifyEmail(email: string, code: string) {
    // ## TODO: 가장 최신의 email entity 객체만 가져오도록 findone 할 수 있게 코드를 수정해줘 (중복 방지)
    const verification: Verification =
      await this.verificationRepository.findOne({
        where: { email },
        order: { expired_at: 'DESC' }, // expired_at를 기준으로 최신 항목 선택
      });

    if (!verification) {
      throw new NotFoundException('Verification email not found');
    }

    if (verification.expired_at < new Date()) {
      throw new UnauthorizedException('Verification code expired.');
    }

    if (verification.verification_code !== code) {
      return false;
    }

    verification.is_verified = true;
    await this.verificationRepository.save(verification);

    return verification.is_verified;
  }

  // 회원가입 요청을 처리합니다.
  async signup(res: Response, signUpDto: SignUpDto) {
    // 이메일이 이미 존재하는지 확인합니다.
    const existingIdentity = await this.identityRepository.findOne({
      where: { email: signUpDto.email },
    });

    // 이미 존재하는 이메일이라면 예외를 발생시킵니다.
    if (existingIdentity) {
      throw new ConflictException('이미 존재하는 이메일입니다.');
    }

    // 비밀번호를 해싱합니다.
    const hashedPassword = await bcrypt.hash(signUpDto.password, 10);

    // 사용자를 생성합니다.
    const user = await this.usersService.createUser({
      email: signUpDto.email,
      name: signUpDto.name,
      phone_number: signUpDto.phone_number,
    });

    // 사용자의 인증 정보를 생성합니다.
    const identity = this.identityRepository.create({
      email: signUpDto.email,
      password: hashedPassword,
      user: user,
      provider: 'email',
    });

    // 사용자의 인증 정보를 저장합니다.
    await this.identityRepository.save(identity);

    //verification entity에서 해당 이메일의 인증 정보를 가져와서 is_verified가 true인지 확인
    const verification: Verification =
      await this.verificationRepository.findOne({
        where: { email: signUpDto.email },
        order: { expired_at: 'DESC' }, // expired_at를 기준으로 최신 항목 선택
      });

    if (!verification.is_verified) {
      throw new UnauthorizedException('Email is not verified');
    } else {
      res.sendStatus(200);
    }
  }

  // 로그인 요청을 처리합니다.
  async login(res: Response, loginDto: LoginDto) {
    // 이메일로 사용자의 인증 정보를 찾습니다.
    const identity = await this.identityRepository.findOne({
      where: { email: loginDto.email },
      relations: ['user'],
    });

    // 이메일이 존재하지 않는다면 예외를 발생시킵니다.
    if (!identity) {
      console.log('가입된 이메일이 아닙니다.');
      throw new ConflictException('가입된 이메일이 아닙니다.');
    }

    // 이메일 제공자를 통한 로그인만 가능합니다.
    if (identity.provider !== 'email') {
      console.log('이메일 제공자를 통한 로그인만 가능합니다.');
      throw new ConflictException('이메일 제공자를 통한 로그인만 가능합니다.');
    }

    // 비밀번호가 일치하는지 확인합니다.
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      identity.password,
    );

    // 비밀번호가 일치하지 않는다면 예외를 발생시킵니다.
    if (!isPasswordValid) {
      console.log('비밀번호가 일치하지 않습니다.');
      throw new ConflictException('비밀번호가 일치하지 않습니다.');
    }

    // 사용자의 정보를 토큰에 담습니다.
    const payload = {
      email: identity.email,
      sub: identity.user.id,
      role: identity.user.role,
    };
    console.log(payload);

    // 토큰을 생성합니다.
    const accessToken = this.jwtService.sign(payload, { expiresIn: '30m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '30d' });

    // 사용자의 인증 정보를 업데이트합니다.
    await this.identityRepository.update(identity.id, { refreshToken });

    // 로그인 쿠키를 설정합니다.
    setLoginCookie(res, accessToken, refreshToken);

    res.sendStatus(200);
  }

  // 토큰 검증 요청을 처리합니다.
  async verifyUser(userId: number): Promise<User> {
    // 사용자의 정보를 찾아 반환합니다.
    return this.usersService.findOneById(userId);
  }

  // 토큰 갱신 요청을 처리합니다.
  async refreshToken(res: Response, token: string) {
    try {
      // 토큰을 검증합니다.
      const decoded = this.jwtService.verify(token);

      // 사용자의 인증 정보를 찾습니다.
      const identity = await this.identityRepository.findOne({
        where: {
          user: {
            id: decoded.sub,
          },
        },
        relations: ['user'],
      });

      // 사용자의 인증 정보가 존재하지 않거나, 리프레시 토큰이 일치하지 않는다면 예외를 발생시킵니다.
      if (!identity || identity.refreshToken !== token) {
        throw new UnauthorizedException('Invalid token');
      }

      // 사용자의 정보를 토큰에 담습니다.
      const payload = {
        email: identity.email,
        sub: identity.user.id,
        role: identity.user.role,
      };
      const accessToken = this.jwtService.sign(payload, { expiresIn: '30m' });

      // 로그인 쿠키를 설정합니다.
      setLoginCookie(res, accessToken, token);
      res.sendStatus(200);
    } catch (error) {
      console.log(error);
      throw new UnauthorizedException('Invalid token');
    }
  }

  // 로그아웃 요청을 처리합니다.
  async logout(res: Response) {
    setLogoutCookie(res);
  }

  // 구글 로그인 요청을 처리합니다.
  async validateOAuthLogin(userPayload: any, provider: string) {
    // 사용자의 정보를 찾습니다.
    let user: User = await this.usersService.findOne(userPayload.email);

    // 사용자가 존재하지 않는다면 사용자를 생성합니다.
    if (!user) {
      user = await this.usersService.createUser({
        email: userPayload.email,
        name: userPayload.name,
        phone_number: '',
      });
    }

    // 사용자의 정보를 토큰에 담습니다.
    const payload = { email: user.email, sub: user.id, role: user.role };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '30d' });

    // 사용자의 인증 정보를 찾습니다.
    let identity = await this.identityRepository.findOneBy({
      email: userPayload.email,
    });

    // 사용자의 인증 정보가 존재하지 않는다면 생성합니다.
    if (!identity) {
      // 사용자의 인증 정보를 생성합니다.
      identity = this.identityRepository.create({
        email: userPayload.email,
        provider,
        user,
        refreshToken,
      });

      // 사용자의 인증 정보를 저장합니다.
      await this.identityRepository.save(identity);
    } else {
      if (identity.provider !== provider) {
        throw new UnauthorizedException('이미 존재하는 이메일입니다.');
      } else {
        await this.identityRepository.update(identity.id, { refreshToken });
      }
    }

    // 토근을 반환합니다.
    return { accessToken, refreshToken };
  }
}
