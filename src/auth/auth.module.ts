import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Identity } from './entity/identity.entity';
import { User } from 'src/users/entity/user.entity';
import { JwtModule } from '@nestjs/jwt';

@Module({
  // TypeOrmModule을 사용하여 Identity와 User 엔터티를 주입합니다.
  imports: [
    TypeOrmModule.forFeature([Identity, User]),
    JwtModule.register({
      secret: 'secretKey', // 실제 환경에서는 .env 파일 등에서 관리하는 것이 좋습니다.
      signOptions: { expiresIn: '60m' }, // 토큰 만료 시간 설정
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
