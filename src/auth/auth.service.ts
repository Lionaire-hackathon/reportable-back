import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Identity } from './entity/identity.entity';
import { Repository } from 'typeorm';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';
import { SignUpDto } from './dto/signup.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Identity) // Identity 엔터티를 주입합니다.
    private identityRepository: Repository<Identity>, // Identity 레포지토리를 주입합니다.
    private usersService: UsersService, // UsersService를 주입합니다.
    private jwtService: JwtService, // JwtService를 주입합니다.
  ) {}

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
    res.sendStatus(200);
  }
}
