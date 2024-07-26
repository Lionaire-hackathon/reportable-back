"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setLogoutCookie = exports.setLoginCookie = void 0;
const setLoginCookie = (res, accessToken, refreshToken) => {
    console.log('setLoginCookie environment: ', process.env.ENV);
    const sameSite = process.env.ENV === 'production' ? 'none' : 'strict';
    const secure = process.env.ENV === 'production' ? true : false;
    const FRONTEND_DOMAIN = process.env.ENV === 'production' ? process.env.FRONTEND_PROD_DOMAIN : process.env.FRONTEND_DEV_DOMAIN;
    res.cookie('refreshToken', refreshToken, {
        domain: FRONTEND_DOMAIN,
        path: '/',
        sameSite,
        secure,
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    res.cookie('accessToken', accessToken, {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        domain: FRONTEND_DOMAIN,
        path: '/',
        sameSite,
        secure,
        httpOnly: false,
    });
};
exports.setLoginCookie = setLoginCookie;
const setLogoutCookie = (res) => {
    console.log('setLogoutCookie environment: ', process.env.ENV);
    const sameSite = process.env.ENV === 'production' ? 'none' : 'strict';
    const secure = process.env.ENV === 'production' ? true : false;
    const FRONTEND_DOMAIN = process.env.ENV === 'production' ? process.env.FRONTEND_PROD_DOMAIN : process.env.FRONTEND_DEV_DOMAIN;
    res.clearCookie('refreshToken', {
        domain: FRONTEND_DOMAIN,
        path: '/',
        sameSite,
        secure,
        httpOnly: true,
    });
    res.clearCookie('accessToken', {
        domain: FRONTEND_DOMAIN,
        path: '/',
        sameSite,
        secure,
        httpOnly: false,
    });
    res.sendStatus(200);
};
exports.setLogoutCookie = setLogoutCookie;
//# sourceMappingURL=auth.util.js.map