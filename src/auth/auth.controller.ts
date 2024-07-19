import { Body, Controller, Get, HttpException, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { setLoginCookie } from './auth.util';
import { JwtGuard } from './guard/jwt.guard';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  // AuthService를 주입합니다.
  constructor(private readonly authService: AuthService) {}

  // 회원가입 요청을 처리합니다.
  @Post('signup')
  async signup(@Body() signUpDto: SignUpDto, @Res() res) {
    return this.authService.signup(res, signUpDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res() res) {
    return this.authService.login(res, loginDto);
  }

  @ApiBearerAuth('JWT') // ApiBearerAuth 데코레이터를 사용하여 Swagger에서 JWT를 사용한다고 명시합니다.
  @UseGuards(JwtGuard)
  @Get('verify')
  async verify(@Req() req) {
      return this.authService.verifyUser(req.user.userId);
  }

  // 토큰 갱신 요청을 처리합니다.
  @Post('refresh')
  async refresh(@Body('refreshToken') refreshToken, @Res() res) {
    return this.authService.refreshToken(res, refreshToken);
  }

  @Get('refreshToken')
  refreshToken(@Req() req: any, @Res() res: any) {
    try {
      console.log('Cookies:', req.cookies);
      const refreshToken = req.cookies['refreshToken'];
      if (!refreshToken) {
        throw new HttpException('Refresh token not found in cookies', HttpStatus.BAD_REQUEST);
      }
      res.status(HttpStatus.OK).json({ refreshToken });
    } catch (error) {
      throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 로그아웃 요청을 처리합니다.
  @Post('logout')
  async logout(@Res() res) {
    return this.authService.logout(res);
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res) {
      const { accessToken, refreshToken } = req.user;
      setLoginCookie(res, accessToken, refreshToken);
      res.redirect(process.env.FRONTEND_URL);
  }

}
