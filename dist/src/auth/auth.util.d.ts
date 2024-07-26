import { Response } from 'express';
export declare const setLoginCookie: (res: Response, accessToken: string, refreshToken: string) => void;
export declare const setLogoutCookie: (res: Response) => void;
