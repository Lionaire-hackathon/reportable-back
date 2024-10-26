"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const dotenv = require("dotenv");
const app_module_1 = require("./app.module");
const cookieParser = require("cookie-parser");
const common_1 = require("@nestjs/common");
dotenv.config();
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.use(cookieParser());
    const FRONTEND_URL = process.env.ENV === "production" ? process.env.FRONTEND_PROD_URL : process.env.FRONTEND_DEV_URL;
    app.enableCors({
        origin: FRONTEND_URL,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe());
    const config = new swagger_1.DocumentBuilder()
        .setTitle('REPORTABLE API')
        .setDescription('The reportable API description')
        .setVersion('1.0')
        .addBearerAuth({
        type: 'http',
        description: 'Enter JWT token',
        scheme: 'Bearer',
        bearerFormat: 'JWT',
        in: 'Header',
        name: 'Authorization',
    }, 'JWT')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api-docs', app, document);
    await app.listen(8080);
}
bootstrap();
//# sourceMappingURL=main.js.map