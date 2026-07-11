import {
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateExperienceDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  jobTitle?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  companyName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  industry?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Start date must be a valid date (YYYY-MM-DD).' })
  startDate?: string;

  @IsOptional()
  @IsDateString({}, { message: 'End date must be a valid date (YYYY-MM-DD).' })
  endDate?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}
