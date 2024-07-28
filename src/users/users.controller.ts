import { Body, Controller, Delete, Get, Param, Put, Req, UseGuards } from '@nestjs/common';
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
    async update(@Param('id') id: number, @Body() updateUserDto: UpdateUserDto, @Req() req) {
        if(req.user.userId !== id) {
            throw new Error('사용자 정보를 수정할 수 없습니다.');
        }
        return this.usersService.updateUser(id, updateUserDto);
    }

    @UseGuards(JwtGuard)
    @Get(':id')
    async findOne(@Param('id') id: number, @Req() req) {
        if(req.user.userId !== id) {
            throw new Error('사용자 정보를 조회할 수 없습니다.');
        }
        return this.usersService.findOneById(id);
    }

    @UseGuards(JwtGuard)
    @Delete(':id')
    async remove(@Param('id') id: number, @Req() req) {
        if(req.user.userId !== id) {
            throw new Error('사용자 정보를 삭제할 수 없습니다.');
        }
        return this.usersService.removeUser(id);
    }
}
