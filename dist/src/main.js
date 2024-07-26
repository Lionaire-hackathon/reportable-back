"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const dotenv = require("dotenv");
const all_exceptions_filter_1 = require("../all-exceptions.filter");
const app_module_1 = require("./app.module");
const cookieParser = require("cookie-parser");
dotenv.config();
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.use(cookieParser());
    app.useGlobalFilters(new all_exceptions_filter_1.AllExceptionsFilter());
    app.enableCors({
        origin: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
    });
    const config = new swagger_1.DocumentBuilder()
        .setTitle('REPORTABLE API')
        .setDescription('The reportable API description')
        .setVersion('1.0')
        .addBearerAuth({
        type: 'http',
        description: '',
        scheme: 'Bearer',
        bearerFormat: 'JWT',
    }, 'JWT')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api-docs', app, document);
    await app.listen(8080);
}
bootstrap();
//# sourceMappingURL=main.js.map