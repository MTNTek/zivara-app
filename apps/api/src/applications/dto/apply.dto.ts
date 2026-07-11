import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class ApplyDto {
  @IsUUID()
  jobId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Cover note must be at most 1000 characters.' })
  coverNote?: string;
}
