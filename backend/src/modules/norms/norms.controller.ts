import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { NormsService } from './norms.service';
import { NormMatchingService } from './norm-matching.service';

@ApiTags('norms')
@Controller('norms')
export class NormsController {
  constructor(
    private readonly normsService: NormsService,
    private readonly normMatchingService: NormMatchingService
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create new norm' })
  create(@Body() createNormDto: any) {
    return this.normsService.create(createNormDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all norms with filters' })
  findAll(@Query() filters: any) {
    return this.normsService.findAll(filters);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search norms by description' })
  search(@Query('q') query: string) {
    return this.normsService.findSimilar(query);
  }

  @Get(':code/:type')
  @ApiOperation({ summary: 'Get norm by code and type' })
  findByCode(@Param('code') code: string, @Param('type') type: any) {
    return this.normsService.findByCode(code, type);
  }

  @Post('match')
  @ApiOperation({ summary: 'Match work description to norms' })
  matchWork(@Body() body: { description: string; quantity?: number; unit?: string }) {
    return this.normMatchingService.matchNormToWork(body);
  }

  @Post('generate-estimate')
  @ApiOperation({ summary: 'Generate estimate from text description' })
  generateEstimate(@Body() body: { text: string }) {
    return this.normMatchingService.generateEstimateFromText(body.text);
  }

  @Post('bulk-import')
  @ApiOperation({ summary: 'Bulk import norms from CSV/JSON' })
  bulkImport(@Body() body: { norms: any[] }) {
    return this.normsService.bulkImport(body.norms);
  }
}
