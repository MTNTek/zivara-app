import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@zivara/shared';
import { AdminService } from './admin.service';
import { ReviewVerificationDto } from './dto/review-verification.dto';
import { SuspendAccountDto } from './dto/suspend-account.dto';
import { ModerateRatingDto } from './dto/moderate-rating.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../auth/interfaces/jwt-payload.interface';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Admin)
export class AdminController {
  constructor(private readonly service: AdminService) {}

  // ─── Dashboard ────────────────────────────────────────────────────────────

  @Get('dashboard')
  getDashboard() {
    return this.service.getDashboard();
  }

  // ─── Verifications ────────────────────────────────────────────────────────

  @Get('verifications')
  getPendingVerifications() {
    return this.service.getPendingVerifications();
  }

  @Post('verifications/professionals/:id')
  @HttpCode(HttpStatus.OK)
  reviewProfessionalVerification(
    @CurrentUser() admin: RequestUser,
    @Param('id') id: string,
    @Body() dto: ReviewVerificationDto,
  ) {
    return this.service.reviewProfessionalVerification(admin.id, id, dto);
  }

  @Post('verifications/employers/:id')
  @HttpCode(HttpStatus.OK)
  reviewEmployerVerification(
    @CurrentUser() admin: RequestUser,
    @Param('id') id: string,
    @Body() dto: ReviewVerificationDto,
  ) {
    return this.service.reviewEmployerVerification(admin.id, id, dto);
  }

  // ─── User management ──────────────────────────────────────────────────────

  @Post('users/:id/suspend')
  @HttpCode(HttpStatus.OK)
  suspendAccount(
    @CurrentUser() admin: RequestUser,
    @Param('id') id: string,
    @Body() dto: SuspendAccountDto,
  ) {
    return this.service.suspendAccount(admin.id, id, dto);
  }

  @Post('users/:id/unsuspend')
  @HttpCode(HttpStatus.OK)
  unsuspendAccount(
    @CurrentUser() admin: RequestUser,
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    return this.service.unsuspendAccount(admin.id, id, reason ?? 'Suspension lifted by admin');
  }

  // ─── Ratings moderation ───────────────────────────────────────────────────

  @Get('ratings/flagged')
  getFlaggedRatings() {
    return this.service.getFlaggedRatings();
  }

  @Post('ratings/:id/moderate')
  @HttpCode(HttpStatus.OK)
  moderateRating(
    @CurrentUser() admin: RequestUser,
    @Param('id') id: string,
    @Body() dto: ModerateRatingDto,
  ) {
    return this.service.moderateRating(admin.id, id, dto);
  }

  // ─── Disputes ─────────────────────────────────────────────────────────────

  @Get('disputes')
  getDisputedShifts() {
    return this.service.getDisputedShifts();
  }

  @Post('disputes/:shiftId/resolve')
  @HttpCode(HttpStatus.OK)
  resolveDispute(
    @CurrentUser() admin: RequestUser,
    @Param('shiftId') shiftId: string,
    @Body('resolution') resolution: 'completed' | 'cancelled',
    @Body('reason') reason: string,
  ) {
    return this.service.resolveDispute(admin.id, shiftId, resolution, reason);
  }

  // ─── Analytics + Audit ────────────────────────────────────────────────────

  @Get('analytics')
  getAnalytics() {
    return this.service.getAnalytics();
  }

  @Get('audit-logs')
  getAuditLogs() {
    return this.service.getAuditLogs();
  }
}
