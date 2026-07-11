import { IsEmail, IsIn, IsString } from 'class-validator';

export class InviteMemberDto {
  @IsEmail({}, { message: 'Please enter a valid email address.' })
  email!: string;

  @IsString()
  @IsIn(['manager', 'recruiter'], {
    message: 'Role must be one of: manager, recruiter.',
  })
  role!: 'manager' | 'recruiter';
}
