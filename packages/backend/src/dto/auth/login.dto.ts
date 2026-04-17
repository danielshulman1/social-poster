import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

/**
 * Login Data Transfer Object
 * Validates user login credentials with decorators for automatic validation
 */
export class LoginDto {
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email: string;

  @IsString({ message: 'Password must be a string' })
  @MinLength(8, {
    message: 'Password must be at least 8 characters long',
  })
  @MaxLength(100, {
    message: 'Password must not exceed 100 characters',
  })
  password: string;
}