import {
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class AddExperienceDto {
  @IsString()
  @MinLength(2, { message: 'Job title is required.' })
  @MaxLength(150, { message: 'Job title must be at most 150 characters.' })
  jobTitle!: string;

  @IsString()
  @MinLength(2, { message: 'Company name is required.' })
  @MaxLength(150, { message: 'Company name must be at most 150 characters.' })
  companyName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  industry?: string;

  @IsDateString({}, { message: 'Start date must be a valid date (YYYY-MM-DD).' })
  startDate!: string;

  @IsOptional()
  @IsDateString({}, { message: 'End date must be a valid date (YYYY-MM-DD).' })
  endDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'Description must be at most 2000 characters.' })
  description?: string;
}
