import { Controller, Get, Post, Body, Param, Query, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MaterialsService } from './materials.service';

@ApiTags('materials')
@Controller('materials')
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Post()
  @ApiOperation({ summary: 'Create new material' })
  create(@Body() createMaterialDto: any) {
    return this.materialsService.create(createMaterialDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all materials with filters' })
  findAll(@Query() filters: any) {
    return this.materialsService.findAll(filters);
  }

  @Get(':code')
  @ApiOperation({ summary: 'Get material by code' })
  findByCode(@Param('code') code: string) {
    return this.materialsService.findByCode(code);
  }

  @Patch(':id/price')
  @ApiOperation({ summary: 'Update material price' })
  updatePrice(@Param('id') id: string, @Body() body: { price: number; priceDate: string }) {
    return this.materialsService.updatePrice(id, body.price, new Date(body.priceDate));
  }
}
