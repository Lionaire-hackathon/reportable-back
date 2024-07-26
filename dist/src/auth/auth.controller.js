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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const signup_dto_1 = require("./dto/signup.dto");
const login_dto_1 = require("./dto/login.dto");
const swagger_1 = require("@nestjs/swagger");
const auth_util_1 = require("./auth.util");
const jwt_guard_1 = require("./guard/jwt.guard");
const passport_1 = require("@nestjs/passport");
const verification_dto_1 = require("./dto/verification.dto");
let AuthController = class AuthController {
    constructor(authService) {
        this.authService = authService;
    }
    async signup(signUpDto, res) {
        return this.authService.signup(res, signUpDto);
    }
    async login(loginDto, res) {
        return this.authService.login(res, loginDto);
    }
    async sendcode(verificationDto) {
        return this.authService.sendVerificationCode(verificationDto.email);
    }
    async verifycode(verificationDto) {
        return this.authService.verifyEmail(verificationDto.email, verificationDto.code);
    }
    async verify(req) {
        return this.authService.verifyUser(req.user.userId);
    }
    async refresh(refreshToken, res) {
        return this.authService.refreshToken(res, refreshToken);
    }
    refreshToken(req, res) {
        try {
            console.log('Cookies:', req.cookies);
            const refreshToken = req.cookies['refreshToken'];
            if (!refreshToken) {
                throw new common_1.HttpException('Refresh token not found in cookies', common_1.HttpStatus.BAD_REQUEST);
            }
            res.status(common_1.HttpStatus.OK).json({ refreshToken });
        }
        catch (error) {
            throw new common_1.HttpException('Internal server error', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async logout(res) {
        return this.authService.logout(res);
    }
    async googleAuthRedirect(req, res) {
        const { accessToken, refreshToken } = req.user;
        (0, auth_util_1.setLoginCookie)(res, accessToken, refreshToken);
        const FRONTEND_URL = process.env.ENV === 'production' ? process.env.FRONTEND_PROD_URL : process.env.FRONTEND_DEV_URL;
        console.log('FRONTEND_URL: ', FRONTEND_URL);
        res.redirect(FRONTEND_URL);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('signup'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [signup_dto_1.SignUpDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "signup", null);
__decorate([
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('send-code'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [verification_dto_1.VerificationDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "sendcode", null);
__decorate([
    (0, common_1.Put)('verify-code'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [verification_dto_1.VerificationDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifycode", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtGuard),
    (0, common_1.Get)('verify'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verify", null);
__decorate([
    (0, common_1.Post)('refresh'),
    __param(0, (0, common_1.Body)('refreshToken')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, common_1.Get)('refreshToken'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "refreshToken", null);
__decorate([
    (0, common_1.Post)('logout'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Get)('google/callback'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('google')),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "googleAuthRedirect", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map