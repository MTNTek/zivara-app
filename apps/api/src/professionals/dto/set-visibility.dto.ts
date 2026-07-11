import { IsBoolean } from 'class-validator';

export class SetVisibilityDto {
  @IsBoolean({ message: 'isPublic must be a boolean.' })
  isPublic!: boolean;
}
