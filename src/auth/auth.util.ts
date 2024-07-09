import { Response } from 'express';

// setLoginCookie 함수는 로그인 요청에 대한 응답으로 쿠키를 설정합니다.
export const setLoginCookie = (
  res: Response,
  accessToken: string,
  refreshToken: string,
) => {
  // 쿠키를 설정합니다.
  res.cookie('refreshToken', refreshToken, {
    domain: process.env.FRONTEND_DOMAIN,
    path: '/',
    sameSite: 'none',
    secure: false,
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
  res.cookie('accessToken', accessToken, {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    domain: process.env.FRONTEND_DOMAIN,
    path: '/',
    sameSite: 'none',
    secure: false,
    httpOnly: false,
  });
};

export const setLogoutCookie = (res: Response) => {
    res.clearCookie('refreshToken', {
        domain: process.env.FRONTEND_DOMAIN,
        path: '/',
        sameSite: 'none',
        secure: true,
        httpOnly: true,
    });
    res.clearCookie('accessToken', {
        domain: process.env.FRONTEND_DOMAIN,
        path: '/',
        sameSite: 'none',
        secure: true,
        httpOnly: false,
    });
    res.sendStatus(200);
}
