import { IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class AddSkillDto {
  @IsString()
  @MinLength(1, { message: 'Skill name is required.' })
  @MaxLength(100, { message: 'Skill name must be at most 100 characters.' })
  skillName!: string;

  @IsOptional()
  @IsInt({ message: 'Years of experience must be a whole number.' })
  @Min(0)
  @Max(50)
  yearsExperience?: number;
}
