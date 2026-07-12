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
import { RatingsService } from './ratings.service';
import { SubmitRatingDto } from './dto/submit-rating.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import type { RequestUser } from '../auth/interfaces/jwt-payload.interface';

@Controller('ratings')
export class RatingsController {
  constructor(private readonly service: RatingsService) {}

  /** Submit a rating after a completed shift */
  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  submitRating(
    @CurrentUser() user: RequestUser,
    @Body() dto: SubmitRatingDto,
  ) {
    return this.service.submitRating(user.id, dto);
  }

  /** Get all approved ratings for a user — used on public profiles */
  @Public()
  @Get('user/:userId')
  getRatingsForUser(@Param('userId') userId: string) {
    return this.service.getRatingsForUser(userId);
  }

  /** Get just the average rating and count — lightweight for embedding in cards */
  @Public()
  @Get('user/:userId/average')
  getAverageRating(@Param('userId') userId: string) {
    return this.service.getAverageRating(userId);
  }
}
