import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterEmployerDto {
  @IsString()
  @MinLength(2, { message: 'Full name must be at least 2 characters.' })
  @MaxLength(100)
  fullName!: string;

  @IsString()
  @MinLength(2, { message: 'Company name must be at least 2 characters.' })
  @MaxLength(200)
  companyName!: string;

  @IsString()
  @MinLength(3, { message: 'Trade license number is required.' })
  @MaxLength(100)
  tradeLicenseNumber!: string;

  @IsString()
  @MinLength(1, { message: 'Please select an industry.' })
  industry!: string;

  @IsString()
  @MinLength(2, { message: 'Please select an operating country.' })
  operatingCountry!: string;

  @IsEmail({}, { message: 'Please enter a valid email address.' })
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters.' })
  @MaxLength(128)
  password!: string;
}
