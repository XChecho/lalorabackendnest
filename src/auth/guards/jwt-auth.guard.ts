import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  override async canActivate(context: ExecutionContext): Promise<boolean> {
    const result = (await super.canActivate(context)) as boolean;

    if (result) {
      const request = context.switchToHttp().getRequest();
      const user = request.user;

      if (user) {
        const dbUser = await this.prisma.user.findUnique({
          where: { id: user.userId || user.id },
        });

        if (!dbUser || !dbUser.active) {
          this.logger.warn('User account is inactive', {
            userId: user.userId || user.id,
          });
          throw new UnauthorizedException('User account is inactive');
        }
      }
    }

    return result;
  }

  override handleRequest(err: any, user: any, info: any): any {
    if (err || !user) {
      this.logger.debug('JWT validation failed', { err, info: info?.message });
      throw err || new UnauthorizedException('Invalid or missing token');
    }
    return user;
  }
}
