import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe, Inject } from '@nestjs/common';
import { ListingsService } from './listings.service.js';
import { CreateListingDto } from './dto/create-listing.dto.js';
import { UpdateListingDto } from './dto/update-listing.dto.js';

@Controller('listings')
export class ListingsController {
  constructor(@Inject(ListingsService) private readonly listingsService: ListingsService) {}

  @Post()
  create(@Body() createListingDto: CreateListingDto) {
    return this.listingsService.create(createListingDto);
  }

  @Get()
  findAll(@Query() query: any) {
    // Will accept filters, sort, cursor
    return this.listingsService.findAll(query);
  }

  @Get('search')
  search(@Query() query: any) {
    return this.listingsService.search(query);
  }

  @Get('search/suggest')
  suggest(@Query('q') q: string) {
    return this.listingsService.suggest(q);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.listingsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateListingDto: UpdateListingDto) {
    return this.listingsService.update(id, updateListingDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.listingsService.remove(id);
  }
}
