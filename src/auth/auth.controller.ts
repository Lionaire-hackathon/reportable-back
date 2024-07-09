import { Body, Controller, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { SignUpDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  // AuthService를 주입합니다.
  constructor(private readonly authService: AuthService) {}

  // 회원가입 요청을 처리합니다.
  @Post('signup')
  async signup(@Body() signUpDto: SignUpDto, @Res() res) {
    return this.authService.signup(res, signUpDto);
  }

  // 로그인 요청을 처리합니다.
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res() res) {
    return this.authService.login(res, loginDto);
  }
}
