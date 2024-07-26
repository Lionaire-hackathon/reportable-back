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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const identity_entity_1 = require("./entity/identity.entity");
const typeorm_2 = require("typeorm");
const users_service_1 = require("../users/users.service");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcrypt");
const auth_util_1 = require("./auth.util");
let AuthService = class AuthService {
    constructor(identityRepository, usersService, jwtService) {
        this.identityRepository = identityRepository;
        this.usersService = usersService;
        this.jwtService = jwtService;
    }
    async signup(res, signUpDto) {
        const existingIdentity = await this.identityRepository.findOne({
            where: { email: signUpDto.email },
        });
        if (existingIdentity) {
            throw new common_1.ConflictException('이미 존재하는 이메일입니다.');
        }
        const hashedPassword = await bcrypt.hash(signUpDto.password, 10);
        const user = await this.usersService.createUser({
            email: signUpDto.email,
            name: signUpDto.name,
            phone_number: signUpDto.phone_number,
        });
        const identity = this.identityRepository.create({
            email: signUpDto.email,
            password: hashedPassword,
            user: user,
            provider: 'email',
        });
        await this.identityRepository.save(identity);
        res.sendStatus(200);
    }
    async login(res, loginDto) {
        const identity = await this.identityRepository.findOne({
            where: { email: loginDto.email },
            relations: ['user'],
        });
        if (!identity) {
            console.log('가입된 이메일이 아닙니다.');
            throw new common_1.ConflictException('가입된 이메일이 아닙니다.');
        }
        if (identity.provider !== 'email') {
            console.log('이메일 제공자를 통한 로그인만 가능합니다.');
            throw new common_1.ConflictException('이메일 제공자를 통한 로그인만 가능합니다.');
        }
        const isPasswordValid = await bcrypt.compare(loginDto.password, identity.password);
        if (!isPasswordValid) {
            console.log('비밀번호가 일치하지 않습니다.');
            throw new common_1.ConflictException('비밀번호가 일치하지 않습니다.');
        }
        const payload = {
            email: identity.email,
            sub: identity.user.id,
            role: identity.user.role,
        };
        console.log(payload);
        const accessToken = this.jwtService.sign(payload, { expiresIn: "30m" });
        const refreshToken = this.jwtService.sign(payload, { expiresIn: '30d' });
        await this.identityRepository.update(identity.id, { refreshToken });
        (0, auth_util_1.setLoginCookie)(res, accessToken, refreshToken);
        res.sendStatus(200);
    }
    async verifyUser(userId) {
        return this.usersService.findOneById(userId);
    }
    async refreshToken(res, token) {
        try {
            const decoded = this.jwtService.verify(token);
            const identity = await this.identityRepository.findOne({
                where: {
                    user: {
                        id: decoded.sub,
                    },
                },
                relations: ['user'],
            });
            if (!identity || identity.refreshToken !== token) {
                throw new common_1.UnauthorizedException('Invalid token');
            }
            const payload = {
                email: identity.email,
                sub: identity.user.id,
                role: identity.user.role,
            };
            const accessToken = this.jwtService.sign(payload, { expiresIn: '30m' });
            (0, auth_util_1.setLoginCookie)(res, accessToken, token);
            res.sendStatus(200);
        }
        catch (error) {
            console.log(error);
            throw new common_1.UnauthorizedException('Invalid token');
        }
    }
    async logout(res) {
        (0, auth_util_1.setLogoutCookie)(res);
    }
    async validateOAuthLogin(userPayload, provider) {
        let user = await this.usersService.findOne(userPayload.email);
        if (!user) {
            user = await this.usersService.createUser({
                email: userPayload.email,
                name: userPayload.name,
                phone_number: '',
            });
        }
        const payload = { email: user.email, sub: user.id, role: user.role };
        const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
        const refreshToken = this.jwtService.sign(payload, { expiresIn: '30d' });
        let identity = await this.identityRepository.findOneBy({
            email: userPayload.email,
        });
        if (!identity) {
            identity = this.identityRepository.create({
                email: userPayload.email,
                provider,
                user,
                refreshToken,
            });
            await this.identityRepository.save(identity);
        }
        else {
            if (identity.provider !== provider) {
                throw new common_1.UnauthorizedException('이미 존재하는 이메일입니다.');
            }
            else {
                await this.identityRepository.update(identity.id, { refreshToken });
            }
        }
        return { accessToken, refreshToken };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(identity_entity_1.Identity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        users_service_1.UsersService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map