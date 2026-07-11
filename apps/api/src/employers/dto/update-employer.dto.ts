import { IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';

export class UpdateEmployerDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  companyName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  industry?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Logo URL must be a valid URL.' })
  @MaxLength(500)
  logoUrl?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Website URL must be a valid URL.' })
  @MaxLength(500)
  websiteUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  employeeCountRange?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  operatingCountry?: string;
}
