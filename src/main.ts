import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as dotenv from 'dotenv';

// dotenv를 사용하여 .env 파일을 읽어옵니다.
dotenv.config();

// 애플리케이션을 생성하고 실행합니다.
async function bootstrap() {
  // AppModule을 사용하여 애플리케이션을 생성합니다.
  const app = await NestFactory.create(AppModule);

  // CORS를 활성화합니다.
  app.enableCors({
    origin: true,
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
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  // 애플리케이션을 8080 포트에서 실행합니다.
  await app.listen(8080);
}

// 애플리케이션을 실행합니다.
bootstrap();
