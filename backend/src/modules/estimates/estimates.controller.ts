import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EstimatesService } from './estimates.service';

@ApiTags('estimates')
@Controller('estimates')
export class EstimatesController {
  constructor(private readonly estimatesService: EstimatesService) {}

  @Post()
  @ApiOperation({ summary: 'Create new estimate' })
  create(@Body() createEstimateDto: any, @Request() req: any) {
    return this.estimatesService.create(createEstimateDto, req.user?.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all estimates' })
  findAll(@Query() filters: any, @Request() req: any) {
    return this.estimatesService.findAll(req.user?.id, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get estimate by ID' })
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.estimatesService.findOne(id, req.user?.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update estimate' })
  update(
    @Param('id') id: string,
    @Body() updateEstimateDto: any,
    @Request() req: any,
  ) {
    return this.estimatesService.update(id, updateEstimateDto, req.user?.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete estimate' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.estimatesService.remove(id, req.user?.id);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate estimate' })
  duplicate(@Param('id') id: string, @Request() req: any) {
    return this.estimatesService.duplicate(id, req.user?.id);
  }
}
