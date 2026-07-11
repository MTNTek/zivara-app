import { IsEmail, IsOptional, IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterProfessionalDto {
  @IsString()
  @MinLength(2, { message: 'Full name must be at least 2 characters.' })
  @MaxLength(100, { message: 'Full name must be at most 100 characters.' })
  fullName!: string;

  @IsEmail({}, { message: 'Please enter a valid email address.' })
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters.' })
  @MaxLength(128, { message: 'Password must be at most 128 characters.' })
  password!: string;

  @IsOptional()
  @IsString()
  @MinLength(7, { message: 'Please enter a valid phone number.' })
  @MaxLength(20, { message: 'Please enter a valid phone number.' })
  phone?: string;

  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Please select an industry.' })
  primaryIndustry?: string;
}
