import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@zivara/shared';
import { ApplicationsService } from './applications.service';
import { ApplyDto } from './dto/apply.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../auth/interfaces/jwt-payload.interface';

@Controller('applications')
export class ApplicationsController {
  constructor(private readonly service: ApplicationsService) {}

  // ─── Professional ─────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Professional)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  apply(
    @CurrentUser() user: RequestUser,
    @Body() dto: ApplyDto,
  ) {
    return this.service.apply(user.id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Professional)
  @Get('mine')
  getMyApplications(@CurrentUser() user: RequestUser) {
    return this.service.getMyApplications(user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Professional)
  @Post(':id/withdraw')
  @HttpCode(HttpStatus.OK)
  withdraw(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
  ) {
    return this.service.withdrawApplication(user.id, id);
  }

  // ─── Employer ─────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Employer)
  @Get('job/:jobId')
  getJobApplications(
    @CurrentUser() user: RequestUser,
    @Param('jobId') jobId: string,
  ) {
    return this.service.getJobApplications(user.id, jobId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Employer)
  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  updateStatus(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.service.updateApplicationStatus(user.id, id, dto);
  }
}
