import { User } from './entity/user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Identity } from 'src/auth/entity/identity.entity';
export declare class UsersService {
    private userRepository;
    private identityRepository;
    constructor(userRepository: Repository<User>, identityRepository: Repository<Identity>);
    createUser(createUserDto: CreateUserDto): Promise<User>;
    findOne(email: string): Promise<User | undefined>;
    findOneById(id: number): Promise<User | undefined>;
    updateUser(id: number, updateUserDto: UpdateUserDto): Promise<User>;
    removeUser(id: number): Promise<void>;
}
