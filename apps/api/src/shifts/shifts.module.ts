import { Module } from '@nestjs/common';
import { ShiftsController } from './shifts.controller';
import { ShiftsService } from './shifts.service';
import { ShiftsRepository } from './shifts.repository';
import { EmployersModule } from '../employers/employers.module';
import { ProfessionalsModule } from '../professionals/professionals.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [EmployersModule, ProfessionalsModule, NotificationsModule],
  controllers: [ShiftsController],
  providers: [ShiftsService, ShiftsRepository],
  exports: [ShiftsService, ShiftsRepository],
})
export class ShiftsModule {}
