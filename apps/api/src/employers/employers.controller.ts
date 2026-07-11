import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@zivara/shared';
import { EmployersService } from './employers.service';
import { UpdateEmployerDto } from './dto/update-employer.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import type { RequestUser } from '../auth/interfaces/jwt-payload.interface';

@Controller('employers')
export class EmployersController {
  constructor(private readonly service: EmployersService) {}

  // ─── My Company Profile ───────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Employer)
  @Get('me')
  getMyProfile(@CurrentUser() user: RequestUser) {
    return this.service.getMyProfile(user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Employer)
  @Patch('me')
  updateMyProfile(
    @CurrentUser() user: RequestUser,
    @Body() dto: UpdateEmployerDto,
  ) {
    return this.service.updateMyProfile(user.id, dto);
  }

  // ─── Dashboard ────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Employer)
  @Get('me/dashboard')
  getDashboard(@CurrentUser() user: RequestUser) {
    return this.service.getDashboardStats(user.id);
  }

  // ─── Team Members ─────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Employer)
  @Get('me/members')
  listMembers(@CurrentUser() user: RequestUser) {
    return this.service.listMembers(user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Employer)
  @Post('me/members')
  @HttpCode(HttpStatus.CREATED)
  inviteMember(
    @CurrentUser() user: RequestUser,
    @Body() dto: InviteMemberDto,
  ) {
    return this.service.inviteMember(user.id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Employer)
  @Patch('me/members/:id/role')
  updateMemberRole(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.service.updateMemberRole(user.id, id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Employer)
  @Delete('me/members/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeMember(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
  ) {
    return this.service.removeMember(user.id, id);
  }

  // ─── Public Profile ───────────────────────────────────────────────────────

  @Public()
  @Get(':id')
  getPublicProfile(@Param('id') id: string) {
    return this.service.getPublicProfile(id);
  }
}
