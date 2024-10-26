"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const typeorm_1 = require("@nestjs/typeorm");
const document_module_1 = require("./document/document.module");
const file_module_1 = require("./file/file.module");
const dotenv = require("dotenv");
const config_1 = require("@nestjs/config");
const email_module_1 = require("./email/email.module");
const payments_module_1 = require("./payments/payments.module");
dotenv.config();
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            typeorm_1.TypeOrmModule.forRoot({
                type: 'mysql',
                host: process.env.DB_HOST,
                port: parseInt(process.env.DB_PORT, 10),
                username: process.env.DB_ADMIN,
                password: process.env.DB_PASS,
                database: process.env.DB_NAME,
                entities: [__dirname + '/**/*.entity{.ts,.js}'],
                synchronize: true,
            }),
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            document_module_1.DocumentModule,
            file_module_1.FileModule,
            email_module_1.EmailModule,
            payments_module_1.PaymentsModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map