import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-kakao';
import { AuthService } from '../auth.service';

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  constructor(private authService: AuthService) {
    super({
      clientID: process.env.KAKAO_REST_API_KEY,
      clientSecret: '', // 카카오는 clientSecret을 사용하지 않음
      callbackURL:
        process.env.ENV === 'production'
          ? process.env.KAKAO_CALLBACK_PROD_URL
          : process.env.KAKAO_CALLBACK_DEV_URL,
      scope: ['profile', 'account_email'], // 이메일 정보 요청
    });
  }

  // 카카오 로그인 성공 시 호출
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: Function,
  ) {
    console.log('KakaoStrategy validate', profile);
    const {
      id,
      username,
      _json: { kakao_account },
    } = profile;

    const userPayload = {
      email: kakao_account.email, // 이메일 정보 접근
      name: username,
      kakaoId: id,
      accessToken,
      refreshToken,
    };

    const user = await this.authService.validateOAuthLogin(
      userPayload,
      'kakao',
    );
    done(null, user);
  }
}
