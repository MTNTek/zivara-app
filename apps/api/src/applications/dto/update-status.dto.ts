import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateStatusDto {
  @IsIn(['received', 'under_review', 'shortlisted', 'rejected', 'hired'], {
    message: 'Status must be one of: received, under_review, shortlisted, rejected, hired.',
  })
  status!: 'received' | 'under_review' | 'shortlisted' | 'rejected' | 'hired';

  /** Optional reason — only surfaced to the professional if status is rejected */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  rejectionReason?: string;
}
