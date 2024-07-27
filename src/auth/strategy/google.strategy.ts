import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { AuthService } from '../auth.service';

// 구글 로그인 전략을 정의합니다.
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  // AuthService를 주입합니다.  
  constructor(private authService: AuthService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.ENV === "production" ? process.env.GOOGLE_CALLBACK_PROD_URL : process.env.GOOGLE_CALLBACK_DEV_URL,
      scope: ['email', 'profile'],
    });
  }

  // 구글 로그인 성공 시 호출됩니다.
  async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback) {
    const { displayName, emails } = profile;
    const userPayload = {
      email: emails[0].value,
      name: displayName,
      accessToken,
      refreshToken,
    };

    const user = await this.authService.validateOAuthLogin(userPayload, 'google');
    done(null, user);
  }
}
