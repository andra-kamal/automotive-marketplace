import { Module } from '@nestjs/common';
import { ListingsService } from './listings.service.js';
import { ListingsController } from './listings.controller.js';

@Module({
  imports: [],
  controllers: [ListingsController],
  providers: [ListingsService],
})
export class ListingsModule {}
