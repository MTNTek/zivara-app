import { Module } from '@nestjs/common';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { ApplicationsRepository } from './applications.repository';
import { JobsModule } from '../jobs/jobs.module';
import { ProfessionalsModule } from '../professionals/professionals.module';
import { EmployersModule } from '../employers/employers.module';

@Module({
  imports: [JobsModule, ProfessionalsModule, EmployersModule],
  controllers: [ApplicationsController],
  providers: [ApplicationsService, ApplicationsRepository],
  exports: [ApplicationsService, ApplicationsRepository],
})
export class ApplicationsModule {}
