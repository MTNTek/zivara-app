import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateApplicationStatusDto {
  @IsIn(['received', 'under_review', 'shortlisted', 'rejected', 'hired'], {
    message: 'Status must be one of: received, under_review, shortlisted, rejected, hired.',
  })
  status!: 'received' | 'under_review' | 'shortlisted' | 'rejected' | 'hired';

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  rejectionReason?: string;
}
