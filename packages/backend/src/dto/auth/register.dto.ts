import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsBoolean,
} from 'class-validator';

/**
 * Register Data Transfer Object
 * Validates user registration data with strict requirements
 */
export class RegisterDto {
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email: string;

  @IsString({ message: 'Password must be a string' })
  @MinLength(8, {
    message: 'Password must be at least 8 characters long',
  })
  @MaxLength(100, {
    message: 'Password must not exceed 100 characters',
  })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
    {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)',
    },
  )
  password: string;

  @IsString({ message: 'First name must be a string' })
  @MinLength(1, {
    message: 'First name must be at least 1 character long',
  })
  @MaxLength(50, {
    message: 'First name must not exceed 50 characters',
  })
  firstName: string;

  @IsString({ message: 'Last name must be a string' })
  @MinLength(1, {
    message: 'Last name must be at least 1 character long',
  })
  @MaxLength(50, {
    message: 'Last name must not exceed 50 characters',
  })
  lastName: string;

  @IsBoolean({ message: 'acceptTerms must be a boolean' })
  acceptTerms: boolean;
}
