import { IsString, MaxLength, MinLength } from 'class-validator';

export class CancelShiftDto {
  @IsString()
  @MinLength(5, { message: 'Please provide a reason for cancellation.' })
  @MaxLength(500)
  reason!: string;
}
