import { Module } from '@nestjs/common';
import { ComplianceController } from './compliance.controller';
import { ComplianceService } from './compliance.service';

/**
 * Compliance Module
 *
 * Handles GDPR and CCPA compliance requirements:
 * - Data export (right of access)
 * - Data deletion (right to be forgotten)
 * - Compliance logging and audit trails
 * - Data retention policies
 *
 * Endpoints:
 * GET  /api/compliance/user/data-export - Export user data (GDPR)
 * DELETE /api/compliance/user/data - Delete user data (CCPA/GDPR)
 * POST /api/compliance/user/deletion-request - Request deletion via email
 * GET  /api/compliance/status - Check compliance status
 */
@Module({
  controllers: [ComplianceController],
  providers: [ComplianceService],
  exports: [ComplianceService],
})
export class ComplianceModule {}
