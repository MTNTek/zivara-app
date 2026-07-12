import { IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

export class SubmitRatingDto {
  @IsUUID()
  shiftId!: string;

  @IsInt({ message: 'Stars must be a whole number.' })
  @Min(1, { message: 'Minimum rating is 1 star.' })
  @Max(5, { message: 'Maximum rating is 5 stars.' })
  stars!: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Review text must be at most 1000 characters.' })
  reviewText?: string;
}
