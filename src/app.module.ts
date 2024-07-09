import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentModule } from './document/document.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'no1-database.cnuayuowelgu.ap-northeast-2.rds.amazonaws.com',
      port: 3306,
      username: 'admin',
      password: '#gulmat456',
      database: 'no1DB',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // 주의: 프로덕션에서는 false로 설정
    }),
    AuthModule,
    UsersModule,
    DocumentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
