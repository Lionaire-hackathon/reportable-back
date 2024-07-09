import { Body, Controller, Delete, Get, Param, Put } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
    ) {}
    
    @Put(':id')
    async update(@Param('id') id: number, @Body() updateUserDto: UpdateUserDto) {
        return this.usersService.updateUser(id, updateUserDto);
    }

    @Get(':id')
    async findOne(@Param('id') id: number) {
        return this.usersService.findOneById(id);
    }

    @Delete(':id')
    async remove(@Param('id') id: number) {
        return this.usersService.removeUser(id);
    }
}
