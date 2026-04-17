import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { AuthServiceService } from './auth-service.service';
import { LoginDto } from '../../dto/auth/login.dto';
import { RegisterDto } from '../../dto/auth/register.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';

@Controller('auth')
export class AuthServiceController {
  private readonly logger = new Logger(AuthServiceController.name);

  constructor(private readonly authService: AuthServiceService) {}

  /**
   * POST /auth/login
   * Login with email and password
   * Returns: access_token, refresh_token, user info
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginDto) {
    this.logger.debug(`Login attempt for email: ${body.email}`);
    const result = await this.authService.login(body.email, body.password);
    this.logger.log(`Login successful for email: ${body.email}`);
    return result;
  }

  /**
   * POST /auth/register
   * Register new user with email and password
   * Returns: access_token, user info
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() body: RegisterDto) {
    this.logger.debug(`Registration attempt for email: ${body.email}`);
    const result = await this.authService.register(
      body.email,
      body.password,
      body.firstName,
      body.lastName,
      body.acceptTerms,
    );
    this.logger.log(`Registration successful for email: ${body.email}`);
    return result;
  }

  /**
   * POST /auth/refresh
   * Refresh access token using refresh token
   * Body: { refresh_token: string }
   * Returns: new access_token
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() body: { refresh_token: string }) {
    this.logger.debug('Token refresh attempt');
    const result = await this.authService.refreshToken(body.refresh_token);
    this.logger.log('Token refreshed successfully');
    return result;
  }

  /**
   * GET /auth/profile
   * Get current user profile (protected endpoint)
   * Requires: Valid JWT token
   * Returns: User profile info
   */
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req) {
    const userId = req.user.sub;
    this.logger.debug(`Profile request for user: ${userId}`);

    return {
      id: req.user.sub,
      email: req.user.email,
      // Add more user details from database as needed
    };
  }

  /**
   * POST /auth/logout
   * Logout user (invalidate token)
   * Requires: Valid JWT token
   * Note: In JWT-based auth, tokens are self-contained.
   * For true logout, implement token blacklist or use short expiration times.
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req) {
    const userId = req.user.sub;
    this.logger.log(`User logged out: ${userId}`);

    // In production, add token to blacklist if needed
    // For now, just inform client to remove token from localStorage
    return {
      message: 'Logged out successfully. Please remove token from client.',
    };
  }
}