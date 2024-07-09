import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Identity } from './entity/identity.entity';
import { User } from 'src/users/entity/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';

@Module({
  // TypeOrmModule을 사용하여 Identity와 User 엔터티를 주입합니다.
  imports: [
    TypeOrmModule.forFeature([Identity, User]),
    JwtModule.register({
      secret: process.env.JWT_SECRET, // JWT 비밀 키 설정
      signOptions: { expiresIn: '60m' }, // 토큰 만료 시간 설정
    }),
  ],
  providers: [AuthService, UsersService],
  controllers: [AuthController],
})
export class AuthModule {}
