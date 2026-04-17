import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

/**
 * Custom Configuration Service
 * Validates environment variables on startup
 */
@Injectable()
export class ConfigService implements OnModuleInit {
  private readonly logger = new Logger(ConfigService.name);

  private readonly requiredEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'NODE_ENV',
  ];

  constructor(private nestConfigService: NestConfigService) {}

  /**
   * Validate environment on module initialization
   */
  onModuleInit() {
    this.validateEnv();
  }

  /**
   * Validate all required environment variables
   */
  private validateEnv() {
    const missingVars: string[] = [];
    const invalidVars: string[] = [];

    // Check required variables
    for (const varName of this.requiredEnvVars) {
      const value = this.nestConfigService.get<string>(varName);

      if (!value) {
        missingVars.push(varName);
      }
    }

    // Validate JWT_SECRET length
    const jwtSecret = this.nestConfigService.get<string>('JWT_SECRET');
    if (jwtSecret && jwtSecret.length < 32) {
      invalidVars.push('JWT_SECRET must be at least 32 characters');
    }

    // Validate NODE_ENV
    const nodeEnv = this.nestConfigService.get<string>('NODE_ENV');
    if (nodeEnv && !['development', 'production', 'test'].includes(nodeEnv)) {
      invalidVars.push(
        `NODE_ENV must be one of: development, production, test (got: ${nodeEnv})`,
      );
    }

    // Throw if validation fails
    if (missingVars.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missingVars.join(', ')}. See .env.example for required variables.`,
      );
    }

    if (invalidVars.length > 0) {
      throw new Error(`Invalid environment variables: ${invalidVars.join('; ')}`);
    }

    this.logger.log('✅ All environment variables validated successfully');
  }

  /**
   * Get JWT secret
   */
  getJwtSecret(): string {
    return this.nestConfigService.get<string>('JWT_SECRET');
  }

  /**
   * Get database URL
   */
  getDatabaseUrl(): string {
    return this.nestConfigService.get<string>('DATABASE_URL');
  }

  /**
   * Get node environment
   */
  getNodeEnv(): string {
    return this.nestConfigService.get<string>('NODE_ENV') || 'development';
  }

  /**
   * Get allowed origins for CORS
   */
  getAllowedOrigins(): string[] {
    const origins = this.nestConfigService.get<string>('ALLOWED_ORIGINS');
    return origins ? origins.split(',').map((o) => o.trim()) : ['http://localhost:3000'];
  }

  /**
   * Check if production environment
   */
  isProduction(): boolean {
    return this.getNodeEnv() === 'production';
  }

  /**
   * Get port number
   */
  getPort(): number {
    return this.nestConfigService.get<number>('PORT') || 3000;
  }

  /**
   * Get rate limiting configuration
   */
  getRateLimitConfig() {
    return {
      windowMs: this.nestConfigService.get<number>('RATE_LIMIT_WINDOW_MS') || 60000,
      maxRequests: this.nestConfigService.get<number>('RATE_LIMIT_MAX_REQUESTS') || 100,
      authWindowMs: this.nestConfigService.get<number>('RATE_LIMIT_AUTH_WINDOW_MS') || 60000,
      authMaxRequests: this.nestConfigService.get<number>('RATE_LIMIT_AUTH_MAX_REQUESTS') || 5,
    };
  }
}
