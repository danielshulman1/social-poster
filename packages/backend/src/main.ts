import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, BadRequestException } from '@nestjs/common';
import * as helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // ============================================================================
  // SECURITY MIDDLEWARE
  // ============================================================================

  // Helmet: Set security HTTP headers
  app.use(
    helmet.default({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", 'https://api.openai.com', 'https://api.vercel.com'],
          fontSrc: ["'self'", 'data:', 'https:'],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
          upgradeInsecureRequests: ['strict'],
        },
      },
      frameguard: {
        action: 'deny', // Prevent clickjacking
      },
      noSniff: true, // Prevent MIME sniffing
      xssFilter: true, // Legacy XSS protection
      referrerPolicy: {
        policy: 'strict-origin-when-cross-origin', // Control referrer leakage
      },
      hsts: {
        maxAge: 63072000, // 2 years (increased for better security)
        includeSubDomains: true,
        preload: true,
      },
      permittedCrossDomainPolicies: {
        permittedPolicies: 'none', // Disable Flash/PDF cross-domain requests
      },
    }),
  );

  // CORS Configuration
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    maxAge: 3600, // 1 hour
  });

  // ============================================================================
  // INPUT VALIDATION
  // ============================================================================

  // Global validation pipe - validate all DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties not in DTO
      forbidNonWhitelisted: true, // Throw error if extra properties
      transform: true, // Automatically transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        const messages = errors.map((error) => {
          const constraints = error.constraints || {};
          return `${error.property}: ${Object.values(constraints).join(', ')}`;
        });
        return new BadRequestException({
          message: 'Validation failed',
          errors: messages,
        });
      },
    }),
  );

  // ============================================================================
  // REQUEST LOGGING MIDDLEWARE
  // ============================================================================

  app.use((req, res, next) => {
    const { method, path, ip } = req;
    const userAgent = req.headers['user-agent'];
    const timestamp = new Date().toISOString();

    logger.log(
      `[${timestamp}] ${method} ${path} - IP: ${ip} - User-Agent: ${userAgent}`,
    );

    // Add request ID for tracking
    req['id'] = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Log response time
    res.on('finish', () => {
      const responseTime = Date.now() - req['startTime'];
      logger.log(
        `[${timestamp}] ${method} ${path} - Status: ${res.statusCode} - Duration: ${responseTime}ms`,
      );
    });

    req['startTime'] = Date.now();
    next();
  });

  // ============================================================================
  // FORCE HTTPS IN PRODUCTION
  // ============================================================================

  if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
      if (req.header('x-forwarded-proto') !== 'https') {
        res.redirect(301, `https://${req.header('host')}${req.url}`);
      } else {
        next();
      }
    });
  }

  // ============================================================================
  // ENVIRONMENT VALIDATION
  // ============================================================================

  const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'NODE_ENV',
  ];

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName],
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`,
    );
  }

  // Validate JWT_SECRET length
  if (process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }

  // ============================================================================
  // START SERVER
  // ============================================================================

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`✅ Application started on http://localhost:${port}`);
  logger.log(`🔒 Environment: ${process.env.NODE_ENV}`);
  logger.log(`🌐 CORS enabled for: ${allowedOrigins.join(', ')}`);
  logger.log(`🛡️  Security headers enabled (Helmet)`);
  logger.log(`✔️ Input validation enabled`);
}

bootstrap().catch((error) => {
  const logger = new Logger('Bootstrap');
  logger.error('Failed to start application', error);
  process.exit(1);
});
