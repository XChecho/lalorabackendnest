import {
  Injectable,
  UnauthorizedException,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  private readonly logger = new Logger(RefreshTokenGuard.name);

  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];
    const refreshToken = authHeader?.replace('Bearer ', '');

    if (!refreshToken) {
      this.logger.debug('No refresh token provided in Authorization header');
      throw new UnauthorizedException('Invalid or missing refresh token');
    }

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      if (storedToken) {
        await this.prisma.refreshToken.delete({
          where: { token: refreshToken },
        });
      }
      this.logger.debug('Refresh token expired or not found');
      throw new UnauthorizedException('Refresh token expired or invalid');
    }

    request.user = {
      userId: storedToken.userId,
      email: storedToken.user.email,
      role: storedToken.user.role,
      refreshToken: storedToken.token,
    };

    return true;
  }
}
