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
import { ProfessionalsService } from './professionals.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SetVisibilityDto } from './dto/set-visibility.dto';
import { AddExperienceDto } from './dto/add-experience.dto';
import { UpdateExperienceDto } from './dto/update-experience.dto';
import { AddSkillDto } from './dto/add-skill.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import type { RequestUser } from '../auth/interfaces/jwt-payload.interface';

@Controller('professionals')
export class ProfessionalsController {
  constructor(private readonly service: ProfessionalsService) {}

  // ─── My Profile ───────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Professional)
  @Get('me')
  getMyProfile(@CurrentUser() user: RequestUser) {
    return this.service.getMyProfile(user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Professional)
  @Patch('me')
  updateMyProfile(
    @CurrentUser() user: RequestUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.service.updateMyProfile(user.id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Professional)
  @Patch('me/visibility')
  @HttpCode(HttpStatus.OK)
  setVisibility(
    @CurrentUser() user: RequestUser,
    @Body() dto: SetVisibilityDto,
  ) {
    return this.service.setProfileVisibility(user.id, dto.isPublic);
  }

  // ─── Public Profile ───────────────────────────────────────────────────────

  @Public()
  @Get(':id')
  getPublicProfile(@Param('id') id: string) {
    return this.service.getPublicProfile(id);
  }

  // ─── Experience ───────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Professional)
  @Post('me/experience')
  @HttpCode(HttpStatus.CREATED)
  addExperience(
    @CurrentUser() user: RequestUser,
    @Body() dto: AddExperienceDto,
  ) {
    return this.service.addExperience(user.id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Professional)
  @Patch('me/experience/:id')
  updateExperience(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateExperienceDto,
  ) {
    return this.service.updateExperience(user.id, id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Professional)
  @Delete('me/experience/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteExperience(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
  ) {
    return this.service.deleteExperience(user.id, id);
  }

  // ─── Skills ───────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Professional)
  @Get('me/skills')
  listSkills(@CurrentUser() user: RequestUser) {
    return this.service.listSkills(user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Professional)
  @Post('me/skills')
  @HttpCode(HttpStatus.CREATED)
  addSkill(
    @CurrentUser() user: RequestUser,
    @Body() dto: AddSkillDto,
  ) {
    return this.service.addSkill(user.id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Professional)
  @Delete('me/skills/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteSkill(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
  ) {
    return this.service.deleteSkill(user.id, id);
  }
}
