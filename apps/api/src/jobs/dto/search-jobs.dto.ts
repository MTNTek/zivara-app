import { IsIn, IsNumberString, IsOptional, IsString, MaxLength } from 'class-validator';

export class SearchJobsDto {
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
  employmentType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  skill?: string;

  @IsOptional()
  @IsNumberString({}, { message: 'salaryMin must be a number.' })
  salaryMin?: string;

  @IsOptional()
  @IsNumberString({}, { message: 'salaryMax must be a number.' })
  salaryMax?: string;

  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;
}
