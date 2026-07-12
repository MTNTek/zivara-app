import { IsString, MaxLength, MinLength } from 'class-validator';

export class SuspendAccountDto {
  @IsString()
  @MinLength(10, { message: 'Suspension reason must be at least 10 characters.' })
  @MaxLength(1000)
  reason!: string;
}
