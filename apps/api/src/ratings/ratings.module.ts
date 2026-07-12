import { Module } from '@nestjs/common';
import { RatingsController } from './ratings.controller';
import { RatingsService } from './ratings.service';
import { RatingsRepository } from './ratings.repository';
import { ShiftsModule } from '../shifts/shifts.module';
import { ProfessionalsModule } from '../professionals/professionals.module';
import { EmployersModule } from '../employers/employers.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [ShiftsModule, ProfessionalsModule, EmployersModule, NotificationsModule],
  controllers: [RatingsController],
  providers: [RatingsService, RatingsRepository],
  exports: [RatingsService, RatingsRepository],
})
export class RatingsModule {}
