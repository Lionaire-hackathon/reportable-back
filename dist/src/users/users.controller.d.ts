import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    update(id: number, updateUserDto: UpdateUserDto, req: any): Promise<import("./entity/user.entity").User>;
    findOne(id: number, req: any): Promise<import("./entity/user.entity").User>;
    remove(id: number, req: any): Promise<void>;
}
