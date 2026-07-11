import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@zivara/shared';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { SearchJobsDto } from './dto/search-jobs.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import type { RequestUser } from '../auth/interfaces/jwt-payload.interface';

@Controller('jobs')
export class JobsController {
  constructor(private readonly service: JobsService) {}

  // ─── Public: browse ───────────────────────────────────────────────────────

  @Public()
  @Get()
  searchJobs(@Query() dto: SearchJobsDto) {
    return this.service.searchJobs(dto);
  }

  @Public()
  @Get(':id')
  getJob(@Param('id') id: string) {
    return this.service.getPublicJob(id);
  }

  // ─── Employer: manage ─────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Employer)
  @Get('employer/mine')
  listMyJobs(@CurrentUser() user: RequestUser) {
    return this.service.listMyJobs(user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Employer)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  createJob(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateJobDto,
  ) {
    return this.service.createJob(user.id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Employer)
  @Patch(':id')
  updateJob(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateJobDto,
  ) {
    return this.service.updateJob(user.id, id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Employer)
  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  publishJob(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
  ) {
    return this.service.publishJob(user.id, id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Employer)
  @Post(':id/close')
  @HttpCode(HttpStatus.OK)
  closeJob(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
  ) {
    return this.service.closeJob(user.id, id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Employer)
  @Post(':id/duplicate')
  @HttpCode(HttpStatus.CREATED)
  duplicateJob(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
  ) {
    return this.service.duplicateJob(user.id, id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Employer)
  @Get(':id/stats')
  getJobStats(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
  ) {
    return this.service.getJobStats(user.id, id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Employer)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteJob(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
  ) {
    return this.service.deleteJob(user.id, id);
  }
}
