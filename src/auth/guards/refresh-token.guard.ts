import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class RefreshTokenGuard extends AuthGuard('jwt-refresh') {
  private readonly logger = new Logger(RefreshTokenGuard.name);

  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      this.logger.debug('Refresh token validation failed', { err, info: info?.message });
      throw err || new UnauthorizedException('Invalid or missing refresh token');
    }
    return user;
  }
}
