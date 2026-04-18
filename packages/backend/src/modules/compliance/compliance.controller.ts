import {
  Controller,
  Delete,
  Get,
  Post,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
  Logger,
  Body,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { ComplianceService } from './compliance.service';

@Controller('api/compliance')
export class ComplianceController {
  private readonly logger = new Logger(ComplianceController.name);

  constructor(private readonly complianceService: ComplianceService) {}

  /**
   * GDPR: Export user data
   * GET /api/compliance/user/data-export
   * Allows users to download a copy of their personal data
   */
  @Get('user/data-export')
  @UseGuards(JwtAuthGuard)
  async exportUserData(@Request() req) {
    try {
      const userId = req.user.id;
      this.logger.log(`Data export requested by user: ${userId}`);

      // Call compliance service to gather all user data
      const userDataExport = await this.complianceService.exportUserData(userId);

      // Log for compliance audit
      await this.complianceService.logComplianceAction(
        userId,
        'user_data_export',
        'User exported their personal data (GDPR)',
      );

      return {
        success: true,
        message: 'Your data has been compiled and is ready for download',
        exportedAt: new Date().toISOString(),
        data: userDataExport,
      };
    } catch (error) {
      this.logger.error(`Data export failed: ${error.message}`);
      throw new HttpException(
        'Failed to export user data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GDPR: Get data export status
   * GET /api/compliance/user/data-export/status
   * Check if a data export is ready for download
   */
  @Get('user/data-export/status')
  @UseGuards(JwtAuthGuard)
  async getExportStatus(@Request() req) {
    try {
      const userId = req.user.id;
      const status = await this.complianceService.getExportStatus(userId);

      return {
        status: status.status, // 'pending', 'ready', 'failed'
        createdAt: status.createdAt,
        expiresAt: status.expiresAt,
        message:
          status.status === 'ready'
            ? 'Your data export is ready to download'
            : 'Your data export is being prepared',
      };
    } catch (error) {
      this.logger.error(`Export status check failed: ${error.message}`);
      throw new HttpException(
        'Failed to check export status',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * CCPA: Delete user data
   * DELETE /api/compliance/user/data
   * Permanently deletes all user personal data (right to be forgotten)
   */
  @Delete('user/data')
  @UseGuards(JwtAuthGuard)
  async deleteUserData(
    @Request() req,
    @Body() body: { confirmation: boolean; reason?: string },
  ) {
    try {
      const userId = req.user.id;
      const { confirmation, reason } = body;

      // Require explicit confirmation
      if (!confirmation) {
        throw new HttpException(
          'Data deletion requires explicit confirmation. Please set confirmation: true',
          HttpStatus.BAD_REQUEST,
        );
      }

      this.logger.log(`Data deletion requested by user: ${userId}`);
      this.logger.log(`Deletion reason: ${reason || 'Not provided'}`);

      // Call compliance service to delete all user data
      const deletionResult = await this.complianceService.deleteUserData(userId);

      // Log for compliance audit - CRITICAL for CCPA/GDPR compliance
      await this.complianceService.logComplianceAction(
        userId,
        'user_data_deleted',
        `User requested deletion of all personal data (CCPA). Reason: ${reason || 'Not specified'}`,
      );

      return {
        success: true,
        message:
          'Your account and all associated data have been permanently deleted',
        deletedAt: new Date().toISOString(),
        deletedRecords: deletionResult.deletedCount,
        note: 'Deletion cannot be undone. You will need to create a new account to use our service again.',
      };
    } catch (error) {
      this.logger.error(`Data deletion failed: ${error.message}`);
      throw new HttpException(
        'Failed to delete user data. Please try again or contact support.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * CCPA: Request deletion verification
   * POST /api/compliance/user/deletion-request
   * User can request deletion without being logged in (for verification flow)
   */
  @Post('user/deletion-request')
  async requestDeletion(@Body() body: { email: string }) {
    try {
      const { email } = body;

      if (!email) {
        throw new HttpException(
          'Email is required',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Initiate verification flow
      const result = await this.complianceService.initiateDeletionRequest(email);

      return {
        success: true,
        message: 'Verification email sent. Please check your email to confirm deletion request.',
        verificationRequired: true,
        expiresIn: '24 hours',
      };
    } catch (error) {
      this.logger.error(`Deletion request failed: ${error.message}`);
      throw new HttpException(
        'Failed to process deletion request',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * CCPA/GDPR: Verify deletion token
   * POST /api/compliance/user/verify-deletion
   * Confirms the user identity and processes deletion
   */
  @Post('user/verify-deletion')
  async verifyAndDelete(@Body() body: { token: string; confirmation: boolean }) {
    try {
      const { token, confirmation } = body;

      if (!token || !confirmation) {
        throw new HttpException(
          'Token and confirmation required',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Verify token and delete
      const result = await this.complianceService.verifyAndDeleteByToken(token);

      return {
        success: true,
        message: 'Your account has been permanently deleted',
        deletedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Deletion verification failed: ${error.message}`);
      throw new HttpException(
        'Failed to verify and process deletion',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Compliance: Get compliance status
   * GET /api/compliance/status
   * Returns compliance and privacy status for the authenticated user
   */
  @Get('status')
  @UseGuards(JwtAuthGuard)
  async getComplianceStatus(@Request() req) {
    try {
      const userId = req.user.id;
      const status = await this.complianceService.getComplianceStatus(userId);

      return {
        userId,
        dataRetentionPolicy: '1 year for inactive accounts, indefinite for active',
        gdprRightsAvailable: [
          'data_export',
          'data_deletion',
          'rectification',
          'portability',
        ],
        ccpaRightsAvailable: [
          'know_what_personal_info_is_collected',
          'delete_personal_info',
          'opt_out_of_sale',
          'request_not_to_sell_or_share',
        ],
        lastDataExport: status.lastExportDate,
        accountCreated: status.createdAt,
        lastLogin: status.lastLoginDate,
        dataCollected: [
          'email',
          'name',
          'account_preferences',
          'activity_logs',
        ],
      };
    } catch (error) {
      this.logger.error(`Compliance status check failed: ${error.message}`);
      throw new HttpException(
        'Failed to retrieve compliance status',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
