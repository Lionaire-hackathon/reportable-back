import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role, User } from './entity/user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Identity } from 'src/auth/entity/identity.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Identity)
    private identityRepository: Repository<Identity>,
  ) {}

  // 사용자를 생성합니다.
  async createUser(createUserDto: CreateUserDto): Promise<User> {
    // 사용자를 생성하고 반환합니다.
    const newUser = this.userRepository.create({
      role: Role.user,
      ...createUserDto,
    });

    // 사용자를 저장하고 반환합니다.
    await this.userRepository.save(newUser);

    // 사용자를 반환합니다.
    return newUser;
  }

  async findOne(email: string): Promise<User | undefined> {
    return this.userRepository.findOneBy({
      email: email,
    });
  }

  // ID를 기반으로 사용자를 조회합니다.
  async findOneById(id: number): Promise<User | undefined> {
    return this.userRepository.findOneBy({ id });
  }

  // Kakao ID를 기반으로 사용자를 조회합니다.
  async findOneByKakaoId(kakaoId: string): Promise<User> {
    return this.userRepository.findOneBy({ kakaoId });
  }

  async updateUser(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    // ID를 기반으로 사용자를 조회합니다.
    const { name, email, password } = updateUserDto;
    const user = await this.userRepository.findOneBy({ id });

    // 사용자가 존재하지 않는다면 예외를 발생시킵니다.
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    await this.userRepository.update(id, {
      name: name || user.name,
      email: email || user.email,
    });

    const identity = await this.identityRepository.findOne({
      where: { user: user },
    });

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await this.identityRepository.update(identity.id, {
        password: hashedPassword,
      });
    }

    return this.findOneById(id);
  }

  async removeUser(id: number): Promise<void> {
    await this.userRepository.delete(id);
  }
}
