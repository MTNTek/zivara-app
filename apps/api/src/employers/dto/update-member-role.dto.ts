import { IsIn, IsString } from 'class-validator';

export class UpdateMemberRoleDto {
  @IsString()
  @IsIn(['manager', 'recruiter'], {
    message: 'Role must be one of: manager, recruiter.',
  })
  role!: 'manager' | 'recruiter';
}
