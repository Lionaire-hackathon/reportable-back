"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const auth_controller_1 = require("./auth.controller");
const typeorm_1 = require("@nestjs/typeorm");
const identity_entity_1 = require("./entity/identity.entity");
const user_entity_1 = require("../users/entity/user.entity");
const jwt_1 = require("@nestjs/jwt");
const users_service_1 = require("../users/users.service");
const jwt_strategy_1 = require("./strategy/jwt.strategy");
const google_strategy_1 = require("./strategy/google.strategy");
const kakao_strategy_1 = require("./strategy/kakao.strategy");
const dotenv = require("dotenv");
const email_service_1 = require("../email/email.service");
const verification_entity_1 = require("./entity/verification.entity");
dotenv.config();
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([identity_entity_1.Identity, user_entity_1.User, verification_entity_1.Verification]),
            jwt_1.JwtModule.register({
                secret: process.env.JWT_SECRET,
            }),
        ],
        providers: [
            auth_service_1.AuthService,
            users_service_1.UsersService,
            jwt_strategy_1.JwtStrategy,
            google_strategy_1.GoogleStrategy,
            kakao_strategy_1.KakaoStrategy,
            email_service_1.EmailService,
        ],
        controllers: [auth_controller_1.AuthController],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map