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
import { ShiftsService } from './shifts.service';
import { CreateShiftDto } from './dto/create-shift.dto';
import { CancelShiftDto } from './dto/cancel-shift.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../auth/interfaces/jwt-payload.interface';

@Controller('shifts')
@UseGuards(JwtAuthGuard)
export class ShiftsController {
  constructor(private readonly service: ShiftsService) {}

  // ─── Employer ─────────────────────────────────────────────────────────────

  @UseGuards(RolesGuard)
  @Roles(UserRole.Employer)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  createShift(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateShiftDto,
  ) {
    return this.service.createShift(user.id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.Employer)
  @Get('employer/mine')
  listEmployerShifts(@CurrentUser() user: RequestUser) {
    return this.service.listMyShiftsAsEmployer(user.id);
  }

  // ─── Professional ─────────────────────────────────────────────────────────

  @UseGuards(RolesGuard)
  @Roles(UserRole.Professional)
  @Get('professional/mine')
  listProfessionalShifts(@CurrentUser() user: RequestUser) {
    return this.service.listMyShiftsAsProfessional(user.id);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.Professional)
  @Post(':id/confirm')
  @HttpCode(HttpStatus.OK)
  confirmShift(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
  ) {
    return this.service.confirmShift(user.id, id);
  }

  // ─── Both roles ───────────────────────────────────────────────────────────

  @Get(':id')
  getShift(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
  ) {
    return this.service.getShift(user.id, id);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  cancelShift(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: CancelShiftDto,
  ) {
    return this.service.cancelShift(user.id, id, dto);
  }

  @Post(':id/confirm-completion')
  @HttpCode(HttpStatus.OK)
  confirmCompletion(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
  ) {
    return this.service.confirmCompletion(user.id, id);
  }

  @Post(':id/dispute')
  @HttpCode(HttpStatus.OK)
  raiseDispute(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
  ) {
    return this.service.raiseDispute(user.id, id);
  }
}
