import { Controller, Get, Param, ParseIntPipe, Inject } from '@nestjs/common';
import { FiltersService } from './filters.service.js';

@Controller('filters')
export class FiltersController {
  constructor(@Inject(FiltersService) private readonly filtersService: FiltersService) {}

  @Get()
  findAll() {
    return this.filtersService.findAll();
  }

  @Get(':categoryId')
  findByCategory(@Param('categoryId', ParseIntPipe) categoryId: number) {
    return this.filtersService.findByCategory(categoryId);
  }
}
