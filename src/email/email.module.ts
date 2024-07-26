import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Identity } from 'src/auth/entity/identity.entity';
import { JwtModule } from '@nestjs/jwt';
import { Verification } from 'src/auth/entity/verification.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Identity, Verification]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
  ],
  providers: [EmailService],
})
export class EmailModule {}
