import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entity/user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // 사용자를 생성합니다.
  async createUser(createUserDto: CreateUserDto): Promise<User> {
    // 사용자를 생성하고 반환합니다.
    const newUser = this.userRepository.create(createUserDto);

    // 사용자를 저장하고 반환합니다.
    await this.userRepository.save(newUser);

    // 사용자를 반환합니다.
    return newUser;
  }
}
