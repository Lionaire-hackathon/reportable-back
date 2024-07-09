import {
    ExecutionContext,
    ForbiddenException,
    HttpStatus,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// JWT를 검증하는 Guard입니다.
// JWT가 만료되었을 때와 유저가 없을 때에 대한 예외처리를 합니다.
@Injectable()
export class JwtGuard extends AuthGuard('jwt') {
    // canActivate 메서드는 요청을 처리할 수 있는지 여부를 반환합니다.
    canActivate(context: ExecutionContext) {
        return super.canActivate(context);
    }

    // handleRequest 메서드는 요청을 처리합니다.
    handleRequest(err, user, info) {
        if (info && info.name === 'TokenExpiredError') {
            throw new ForbiddenException({
                status: HttpStatus.FORBIDDEN,
                error: 'Forbidden',
                message: 'Access token has expired',
            });
        }
        if (err || !user) {
            throw new UnauthorizedException({
                status: HttpStatus.UNAUTHORIZED,
                error: 'Unauthorized',
                message: err ? err.message : 'No user',
            });
        }

        return user;
    }
}
