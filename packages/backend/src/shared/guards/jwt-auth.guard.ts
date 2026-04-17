import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

interface JwtPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Extract token from Authorization header
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      this.logger.warn('[AUTH] Attempt to access protected endpoint without token');
      throw new UnauthorizedException('No authorization token provided');
    }

    try {
      // Verify and decode JWT
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      // Attach user info to request for downstream handlers
      request['user'] = {
        id: payload.sub,
        sub: payload.sub,
        email: payload.email,
      };

      this.logger.debug(`[AUTH] User authenticated: ${payload.sub}`);
      return true;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        this.logger.warn('[AUTH] Token expired');
        throw new UnauthorizedException('Token expired');
      }

      if (error.name === 'JsonWebTokenError') {
        this.logger.warn('[AUTH] Invalid token signature');
        throw new UnauthorizedException('Invalid token');
      }

      this.logger.error('[AUTH] Token verification failed', error);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * Extract JWT from Authorization header
   * Expected format: "Bearer <token>"
   */
  private extractTokenFromHeader(request: any): string | undefined {
    const authHeader = request.headers?.authorization;

    if (!authHeader) {
      return undefined;
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      this.logger.warn(
        '[AUTH] Invalid Authorization header format. Expected: Bearer <token>',
      );
      return undefined;
    }

    return parts[1];
  }
}
