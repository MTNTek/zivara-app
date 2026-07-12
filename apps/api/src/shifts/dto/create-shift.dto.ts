import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export class CreateShiftDto {
  @IsUUID()
  professionalId!: string;

  @IsOptional()
  @IsUUID()
  applicationId?: string;

  @IsDateString({}, { message: 'Shift date must be a valid date (YYYY-MM-DD).' })
  shiftDate!: string;

  @Matches(TIME_REGEX, { message: 'Start time must be in HH:MM format.' })
  startTime!: string;

  @Matches(TIME_REGEX, { message: 'End time must be in HH:MM format.' })
  endTime!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(500)
  location!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  roleDescription!: string;
}
