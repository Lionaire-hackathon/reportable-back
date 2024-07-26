"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setLogoutCookie = exports.setLoginCookie = void 0;
const setLoginCookie = (res, accessToken, refreshToken) => {
    console.log('setLoginCookie environment: ', process.env.ENV);
    const sameSite = process.env.ENV === 'production' ? 'none' : 'strict';
    const secure = process.env.ENV === 'production' ? true : false;
    res.cookie('refreshToken', refreshToken, {
        domain: process.env.FRONTEND_DOMAIN,
        path: '/',
        sameSite,
        secure,
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    res.cookie('accessToken', accessToken, {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        domain: process.env.FRONTEND_DOMAIN,
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
    res.clearCookie('refreshToken', {
        domain: process.env.FRONTEND_DOMAIN,
        path: '/',
        sameSite,
        secure,
        httpOnly: true,
    });
    res.clearCookie('accessToken', {
        domain: process.env.FRONTEND_DOMAIN,
        path: '/',
        sameSite,
        secure,
        httpOnly: false,
    });
    res.sendStatus(200);
};
exports.setLogoutCookie = setLogoutCookie;
//# sourceMappingURL=auth.util.js.map