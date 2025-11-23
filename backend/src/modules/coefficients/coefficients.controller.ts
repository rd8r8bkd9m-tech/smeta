import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CoefficientsService } from './coefficients.service';

@ApiTags('coefficients')
@Controller('coefficients')
export class CoefficientsController {
  constructor(private readonly coefficientsService: CoefficientsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all coefficients' })
  getAll(@Query('category') category?: string) {
    return this.coefficientsService.getAllCoefficients(category);
  }

  @Get(':code')
  @ApiOperation({ summary: 'Get coefficient by code' })
  getByCode(@Param('code') code: string) {
    return this.coefficientsService.getCoefficient(code);
  }

  @Post('apply')
  @ApiOperation({ summary: 'Apply coefficients to base value' })
  apply(@Body() body: { baseValue: number; coefficients: string[] }) {
    return this.coefficientsService.applyCoefficients(
      body.baseValue,
      body.coefficients,
    );
  }
}
