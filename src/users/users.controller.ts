import { Body, Controller, Delete, Get, Param, Put, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtGuard } from 'src/auth/guard/jwt.guard';

@Controller('users')
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
    ) {}
    
    @UseGuards(JwtGuard)
    @Put(':id')
    async update(@Param('id') id: number, @Body() updateUserDto: UpdateUserDto) {
        return this.usersService.updateUser(id, updateUserDto);
    }

    @UseGuards(JwtGuard)
    @Get(':id')
    async findOne(@Param('id') id: number) {
        return this.usersService.findOneById(id);
    }

    @UseGuards(JwtGuard)
    @Delete(':id')
    async remove(@Param('id') id: number) {
        return this.usersService.removeUser(id);
    }
}
