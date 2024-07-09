import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entity/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Identity } from 'src/auth/entity/identity.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Identity])],
  providers: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
