import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

// Mock entities - replace with actual TypeORM entities
interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  tc_accepted?: boolean;
  tc_accepted_at?: Date;
  created_at?: Date;
  updated_at?: Date;
}

interface AuthAccount {
  id: string;
  user_id: string;
  provider: string;
  password_hash: string;
  created_at?: Date;
  updated_at?: Date;
}

interface JwtPayload {
  sub: string; // user id
  email: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class AuthServiceService {
  private readonly bcryptSaltRounds = 12;

  constructor(
    // @InjectRepository(User)
    // private usersRepo: Repository<User>,
    // @InjectRepository(AuthAccount)
    // private authAccountsRepo: Repository<AuthAccount>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    // Verify JWT_SECRET is configured
    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    if (!jwtSecret || jwtSecret.length < 32) {
      throw new InternalServerErrorException(
        'JWT_SECRET not configured or too short. Must be at least 32 characters.',
      );
    }
  }

  /**
   * Login with email and password
   * @param email User email address
   * @param password Plain text password (will be hashed and compared)
   * @returns JWT token and user info
   */
  async login(
    email: string,
    password: string,
  ): Promise<{ access_token: string; refresh_token: string; user: Partial<User> }> {
    // Validate inputs
    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }

    if (email.length > 255) {
      throw new BadRequestException('Email is too long');
    }

    // Find user by email
    // const user = await this.usersRepo.findOne({
    //   where: { email: email.toLowerCase() },
    //   relations: ['auth_accounts'],
    // });

    // Mock user lookup - replace with actual database query
    const user: User | null = null; // Placeholder

    if (!user) {
      // Don't reveal if user exists (security best practice)
      throw new UnauthorizedException('Invalid email or password');
    }

    // Get auth account with password hash
    // const authAccount = user.auth_accounts?.find(
    //   (a) => a.provider === 'email',
    // );

    // Mock auth account - replace with actual lookup
    const authAccount: AuthAccount | null = null; // Placeholder

    if (!authAccount) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Verify password (bcrypt comparison)
    const isPasswordValid = await bcrypt.compare(
      password,
      authAccount.password_hash,
    );

    if (!isPasswordValid) {
      // Log failed attempt for security monitoring
      console.warn(`[AUTH] Failed login attempt for email: ${email}`);
      throw new UnauthorizedException('Invalid email or password');
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // Log successful login
    console.log(`[AUTH] Successful login for user: ${user.id}`);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
      },
    };
  }

  /**
   * Register new user with email and password
   * @param email User email
   * @param password Plain text password (will be hashed)
   * @param firstName User first name
   * @param lastName User last name
   * @param acceptTerms Must be true to proceed
   * @returns JWT token and user info
   */
  async register(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    acceptTerms: boolean,
  ): Promise<{ access_token: string; user: Partial<User> }> {
    // Validate inputs
    if (!email || !password || !firstName || !lastName) {
      throw new BadRequestException('All fields are required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new BadRequestException('Invalid email format');
    }

    // Validate password strength
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      throw new BadRequestException(
        'Password must contain at least 8 characters, including uppercase, lowercase, number, and special character',
      );
    }

    // Validate T&C acceptance
    if (!acceptTerms) {
      throw new BadRequestException(
        'You must accept the Terms and Conditions to create an account',
      );
    }

    // Validate name lengths
    if (firstName.length > 50 || lastName.length > 50) {
      throw new BadRequestException('Names are too long (max 50 characters)');
    }

    if (firstName.length < 1 || lastName.length < 1) {
      throw new BadRequestException('Names must be at least 1 character');
    }

    // Check if user already exists
    // const existingUser = await this.usersRepo.findOne({
    //   where: { email: email.toLowerCase() },
    // });

    // Mock existing user check - replace with actual database query
    const existingUser: User | null = null; // Placeholder

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    // Hash password with bcrypt
    let passwordHash: string;
    try {
      passwordHash = await bcrypt.hash(password, this.bcryptSaltRounds);
    } catch (error) {
      throw new InternalServerErrorException('Failed to hash password');
    }

    // Create new user
    const newUser: User = {
      id: this.generateId(),
      email: email.toLowerCase(),
      first_name: firstName,
      last_name: lastName,
      tc_accepted: true,
      tc_accepted_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    };

    // Save user to database
    // try {
    //   const savedUser = await this.usersRepo.save(newUser);
    //   // Create auth account
    //   const authAccount = this.authAccountsRepo.create({
    //     user_id: savedUser.id,
    //     provider: 'email',
    //     password_hash: passwordHash,
    //   });
    //   await this.authAccountsRepo.save(authAccount);
    // } catch (error) {
    //   throw new InternalServerErrorException('Failed to create user');
    // }

    // Generate JWT token
    const accessToken = this.generateAccessToken(newUser);

    // Log successful registration
    console.log(`[AUTH] New user registered: ${newUser.id}`);

    return {
      access_token: accessToken,
      user: {
        id: newUser.id,
        email: newUser.email,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
      },
    };
  }

  /**
   * Refresh access token using refresh token
   * @param refreshToken Refresh token (valid for 30 days)
   * @returns New access token
   */
  async refreshToken(refreshToken: string): Promise<{ access_token: string }> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      // Verify it's actually a refresh token (if using different claims)
      if (!payload.sub || !payload.email) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Fetch user to ensure they still exist
      // const user = await this.usersRepo.findOne({
      //   where: { id: payload.sub },
      // });

      // Mock user lookup - replace with actual database query
      const user: User | null = null; // Placeholder

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Generate new access token
      const newAccessToken = this.generateAccessToken(user);

      return {
        access_token: newAccessToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Validate JWT token (used by JWT guard)
   * @param token JWT token
   * @returns JWT payload if valid
   */
  async validateToken(token: string): Promise<JwtPayload> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * Generate access token (7 days expiration)
   * @param user User entity
   * @returns JWT token
   */
  private generateAccessToken(user: User): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: '7d',
    });
  }

  /**
   * Generate refresh token (30 days expiration)
   * @param user User entity
   * @returns JWT token
   */
  private generateRefreshToken(user: User): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: '30d',
    });
  }

  /**
   * Generate unique user ID
   * @returns UUID v4
   */
  private generateId(): string {
    // In production, use actual UUID generation or let database handle it
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
