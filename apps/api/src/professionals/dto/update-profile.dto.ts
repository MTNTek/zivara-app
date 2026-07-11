import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Full name must be at least 2 characters.' })
  @MaxLength(100, { message: 'Full name must be at most 100 characters.' })
  fullName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30, { message: 'Phone number is too long.' })
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Nationality must be at most 100 characters.' })
  nationality?: string;

  @IsOptional()
  @IsBoolean()
  showNationality?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Country of origin must be at most 100 characters.' })
  countryOfOrigin?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'City must be at most 100 characters.' })
  currentCity?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Country must be at most 100 characters.' })
  currentCountry?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Industry must be at most 100 characters.' })
  primaryIndustry?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Bio must be at most 1000 characters.' })
  bio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Profile photo URL is too long.' })
  profilePhotoUrl?: string;
}
