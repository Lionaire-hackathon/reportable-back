import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as dotenv from 'dotenv';
import { AllExceptionsFilter } from 'all-exceptions.filter';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';

// dotenv를 사용하여 .env 파일을 읽어옵니다.
dotenv.config();

// 애플리케이션을 생성하고 실행합니다.
async function bootstrap() {
  // AppModule을 사용하여 애플리케이션을 생성합니다.
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  app.useGlobalFilters(new AllExceptionsFilter());

  const FRONTEND_URL = process.env.ENV === "production" ? process.env.FRONTEND_PROD_URL : process.env.FRONTEND_DEV_URL;

  // CORS를 활성화합니다.
  app.enableCors({
    origin: FRONTEND_URL,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Swagger를 설정합니다.
  const config = new DocumentBuilder()
    .setTitle('REPORTABLE API')
    .setDescription('The reportable API description')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        description: '',
        scheme: 'Bearer',
        bearerFormat: 'JWT',
      },
      'JWT',
    )
    .build();

  // 애플리케이션을 8080 포트에서 실행합니다.
  await app.listen(8080);
}

// 애플리케이션을 실행합니다.
bootstrap();
