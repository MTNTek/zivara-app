import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ReviewVerificationDto {
  @IsIn(['approved', 'rejected'], {
    message: 'Decision must be either "approved" or "rejected".',
  })
  decision!: 'approved' | 'rejected';

  @IsString()
  @MinLength(5, { message: 'A reason is required for every verification decision.' })
  @MaxLength(500)
  reason!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  requestAdditionalDocuments?: string;
}
