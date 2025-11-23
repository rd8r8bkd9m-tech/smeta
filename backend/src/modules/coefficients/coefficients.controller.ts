import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CoefficientsService, CoefficientRule } from './coefficients.service';

@ApiTags('coefficients')
@Controller('coefficients')
export class CoefficientsController {
  constructor(private readonly coefficientsService: CoefficientsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all coefficients' })
  getAll(@Query('category') category?: string): CoefficientRule[] {
    return this.coefficientsService.getAllCoefficients(category);
  }

  @Get(':code')
  @ApiOperation({ summary: 'Get coefficient by code' })
  getByCode(@Param('code') code: string): CoefficientRule | undefined {
    return this.coefficientsService.getCoefficient(code);
  }

  @Post('apply')
  @ApiOperation({ summary: 'Apply coefficients to base value' })
  apply(@Body() body: { baseValue: number; coefficients: string[] }): {
    value: number;
    applied: CoefficientRule[];
  } {
    return this.coefficientsService.applyCoefficients(body.baseValue, body.coefficients);
  }
}
