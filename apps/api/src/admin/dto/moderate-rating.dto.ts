import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ModerateRatingDto {
  @IsIn(['approved', 'removed'], {
    message: 'Decision must be either "approved" or "removed".',
  })
  decision!: 'approved' | 'removed';

  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  reason?: string;
}
