import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { JobsRepository } from './jobs.repository';
import { EmployersModule } from '../employers/employers.module';

@Module({
  imports: [EmployersModule],
  controllers: [JobsController],
  providers: [JobsService, JobsRepository],
  exports: [JobsService, JobsRepository],
})
export class JobsModule {}
