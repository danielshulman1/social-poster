import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

interface JwtPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * JWT Strategy for Passport
 * Validates JWT tokens and extracts user information
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  /**
   * Validate JWT payload
   * Called after JWT is successfully verified
   */
  async validate(payload: JwtPayload) {
    if (!payload.sub || !payload.email) {
      this.logger.warn('[JWT] Invalid payload structure');
      throw new UnauthorizedException('Invalid token payload');
    }

    this.logger.debug(`[JWT] User validated: ${payload.sub}`);

    return {
      id: payload.sub,
      sub: payload.sub,
      email: payload.email,
    };
  }
}
