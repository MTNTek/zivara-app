import {
  IsDateString,
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class LocalizedStringDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  en?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  ar?: string;
}

export class UpdateJobDto {
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  title?: LocalizedStringDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  description?: LocalizedStringDto;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  industry?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @IsOptional()
  @IsIn(['full_time', 'part_time', 'shift_based', 'contract'])
  employmentType?: 'full_time' | 'part_time' | 'shift_based' | 'contract';

  @IsOptional()
  @IsNumber()
  @Min(0)
  salaryMin?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  salaryMax?: number;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  salaryCurrency?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsString({ each: true })
  requiredSkills?: string[];
}
