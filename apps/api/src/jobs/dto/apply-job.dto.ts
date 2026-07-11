import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ApplyJobDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Cover note must be at most 1000 characters.' })
  coverNote?: string;
}
