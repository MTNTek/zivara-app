import { Module } from '@nestjs/common';
import { EmployersController } from './employers.controller';
import { EmployersService } from './employers.service';
import { EmployersRepository } from './employers.repository';

@Module({
  controllers: [EmployersController],
  providers: [EmployersService, EmployersRepository],
  exports: [EmployersService, EmployersRepository],
})
export class EmployersModule {}
