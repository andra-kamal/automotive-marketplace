import { Module } from '@nestjs/common';
import { FiltersService } from './filters.service.js';
import { FiltersController } from './filters.controller.js';

@Module({
  controllers: [FiltersController],
  providers: [FiltersService],
})
export class FiltersModule {}
