"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KakaoStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_kakao_1 = require("passport-kakao");
const auth_service_1 = require("../auth.service");
let KakaoStrategy = class KakaoStrategy extends (0, passport_1.PassportStrategy)(passport_kakao_1.Strategy, 'kakao') {
    constructor(authService) {
        super({
            clientID: process.env.KAKAO_REST_API_KEY,
            clientSecret: '',
            callbackURL: process.env.ENV === 'production'
                ? process.env.KAKAO_CALLBACK_PROD_URL
                : process.env.KAKAO_CALLBACK_DEV_URL,
            scope: ['profile', 'account_email'],
        });
        this.authService = authService;
    }
    async validate(accessToken, refreshToken, profile, done) {
        console.log('KakaoStrategy validate', profile);
        const { id, username, _json: { kakao_account }, } = profile;
        const userPayload = {
            email: kakao_account.email,
            name: username,
            kakaoId: id,
            accessToken,
            refreshToken,
        };
        const user = await this.authService.validateOAuthLogin(userPayload, 'kakao');
        done(null, user);
    }
};
exports.KakaoStrategy = KakaoStrategy;
exports.KakaoStrategy = KakaoStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], KakaoStrategy);
//# sourceMappingURL=kakao.strategy.js.map