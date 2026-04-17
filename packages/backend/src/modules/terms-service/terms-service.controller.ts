import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { TermsServiceService } from './terms-service.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';

@Controller('terms')
export class TermsServiceController {
  constructor(private readonly termsService: TermsServiceService) {}

  /**
   * GET /terms
   * Get the current active terms and conditions
   * Public endpoint - no auth required
   */
  @Get()
  async getActiveTerms() {
    const terms = await this.termsService.getActiveTerms();
    return {
      terms,
    };
  }

  /**
   * GET /terms/:version
   * Get a specific version of T&C
   */
  @Get(':version')
  async getTermsByVersion(@Body('version') version: string) {
    const terms = await this.termsService.getTermsByVersion(version);
    if (!terms) {
      throw new ForbiddenException('Terms and conditions version not found');
    }
    return {
      terms,
    };
  }

  /**
   * GET /terms/acceptance/status
   * Check if current user has accepted T&C
   * Protected endpoint - requires JWT
   */
  @Get('acceptance/status')
  @UseGuards(JwtAuthGuard)
  async getAcceptanceStatus(@Request() req) {
    const userId = req.user.sub; // from JWT payload
    const mustAccept = await this.termsService.getMustAcceptTerms(userId);
    return {
      must_accept: mustAccept?.must_accept ?? false,
      tc_version: mustAccept?.tc_version,
      tc_id: mustAccept?.tc_id,
      message: mustAccept?.must_accept
        ? 'User must accept current terms and conditions'
        : 'User has accepted all required terms',
    };
  }

  /**
   * POST /terms/acceptance/accept
   * Accept the current terms and conditions
   * Protected endpoint - requires JWT
   * Body: { tcId: string }
   */
  @Post('acceptance/accept')
  @UseGuards(JwtAuthGuard)
  async acceptTerms(
    @Request() req,
    @Body() body: { tcId: string },
  ) {
    const userId = req.user.sub;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await this.termsService.acceptTerms(
      userId,
      body.tcId,
      ipAddress,
      userAgent,
    );

    if (!result.success) {
      throw new ForbiddenException(result.message);
    }

    return {
      success: true,
      message: result.message,
    };
  }

  /**
   * GET /terms/acceptance/history
   * Get user's T&C acceptance history
   * Protected endpoint - only for the user themselves or admins
   */
  @Get('acceptance/history')
  @UseGuards(JwtAuthGuard)
  async getAcceptanceHistory(@Request() req) {
    const userId = req.user.sub;
    const history = await this.termsService.getUserAcceptanceHistory(userId);

    return {
      user_id: userId,
      acceptance_history: history,
    };
  }
}
