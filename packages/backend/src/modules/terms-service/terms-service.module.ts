import { Module } from '@nestjs/common';
import { AuthServiceModule } from '../auth-service/auth-service.module';
import { TermsServiceController } from './terms-service.controller';
import { TermsServiceService } from './terms-service.service';

/**
 * Terms & Conditions Module
 * Manages T&C versions and user acceptance tracking
 *
 * Imports AuthServiceModule to provide JwtService for JWT-protected endpoints.
 */
@Module({
  imports: [AuthServiceModule],
  controllers: [TermsServiceController],
  providers: [TermsServiceService],
  exports: [TermsServiceService],
})
export class TermsServiceModule {}
