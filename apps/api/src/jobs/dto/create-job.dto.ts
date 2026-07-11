import {
  IsDateString,
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class LocalizedStringDto {
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  en!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  ar?: string;
}

export class CreateJobDto {
  @IsObject()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  title!: LocalizedStringDto;

  @IsObject()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  description!: LocalizedStringDto;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  industry!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  city!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  country!: string;

  @IsIn(['full_time', 'part_time', 'shift_based', 'contract'])
  employmentType!: 'full_time' | 'part_time' | 'shift_based' | 'contract';

  @IsOptional()
  @IsNumber({}, { message: 'Salary minimum must be a number.' })
  @Min(0)
  salaryMin?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Salary maximum must be a number.' })
  @Min(0)
  salaryMax?: number;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  salaryCurrency?: string;

  /** ISO date string, e.g. 2025-12-31. Defaults to 60 days from now if omitted. */
  @IsOptional()
  @IsDateString({}, { message: 'Expiry date must be a valid date (YYYY-MM-DD).' })
  expiresAt?: string;

  @IsOptional()
  @IsString({ each: true })
  requiredSkills?: string[];
}
