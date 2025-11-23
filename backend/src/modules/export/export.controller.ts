import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { ExportService, ExportFormat } from './export.service';
import { EstimatesService } from '../estimates/estimates.service';

@ApiTags('export')
@Controller('export')
export class ExportController {
  constructor(
    private readonly exportService: ExportService,
    private readonly estimatesService: EstimatesService,
  ) {}

  @Get(':id')
  @ApiOperation({ summary: 'Export estimate in specified format' })
  async export(
    @Param('id') id: string,
    @Query('format') format: ExportFormat = 'pdf',
    @Res() res: Response,
    @Request() req: any,
  ) {
    const estimate = await this.estimatesService.findOne(id, req.user?.id);

    if (!estimate) {
      return res.status(404).json({ message: 'Estimate not found' });
    }

    const data = await this.exportService.export(estimate, format);
    const contentType = this.exportService.getContentType(format);
    const extension = this.exportService.getFileExtension(format);

    res.setHeader('Content-Type', contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=estimate-${estimate.id}.${extension}`,
    );

    if (typeof data === 'string') {
      res.send(data);
    } else {
      res.send(data);
    }
  }
}
