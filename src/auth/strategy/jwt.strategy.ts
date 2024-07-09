// jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';

// PassportStrategy 클래스를 상속받아 JwtStrategy 클래스를 정의합니다.
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  // JwtStrategy 클래스의 생성자입니다.
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  // validate 메서드는 JwtStrategy 클래스가 유효한 토큰인지 검사합니다.
  async validate(payload: any) {
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
