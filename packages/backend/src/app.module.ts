import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { AuthServiceModule } from './modules/auth-service/auth-service.module';
import { OrgServiceModule } from './modules/org-service/org-service.module';
import { EmailIntelServiceModule } from './modules/email-intel-service/email-intel-service.module';
import { WorkflowServiceModule } from './modules/workflow-service/workflow-service.module';
import { AgentServiceModule } from './modules/agent-service/agent-service.module';
import { NotificationServiceModule } from './modules/notification-service/notification-service.module';
import { IntegrationServiceModule } from './modules/integration-service/integration-service.module';
import { TermsServiceModule } from './modules/terms-service/terms-service.module';
import { ComplianceModule } from './modules/compliance/compliance.module';
import { SharedModule } from './shared/shared.module';
import { DatabaseModule } from './database/database.module';
import { ConfigService } from './config/config.service';
import { HttpExceptionFilter } from './shared/filters/http-exception.filter';

/**
 * Root Application Module
 * PHASE 2: Security Configuration Applied
 * - Configuration management with validation
 * - Rate limiting (Throttler)
 * - Global error handling filter
 * - Authentication & Authorization
 * - CORS & Security Headers (configured in main.ts)
 */
@Module({
  imports: [
    // Configuration module - must be first and global
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      cache: true,
      expandVariables: true,
    }),

    // Rate Limiting - configured at individual endpoint level
    // Global rate limiting can be enabled per-route using @Throttle() decorator

    // Shared & Database
    SharedModule,
    DatabaseModule,

    // Feature Modules
    AuthServiceModule,
    TermsServiceModule,
    ComplianceModule,
    OrgServiceModule,
    EmailIntelServiceModule,
    WorkflowServiceModule,
    AgentServiceModule,
    NotificationServiceModule,
    IntegrationServiceModule,
  ],
  providers: [
    // Configuration service with validation
    ConfigService,
    // Global rate limiting guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Global exception filter for consistent error handling
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
