import { Module } from '@nestjs/common';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { PdfExportService } from './pdf-export.service';
import { ExcelExportService } from './excel-export.service';
import { WordExportService } from './word-export.service';
import { EstimatesModule } from '../estimates/estimates.module';

@Module({
  imports: [EstimatesModule],
  controllers: [ExportController],
  providers: [
    ExportService,
    PdfExportService,
    ExcelExportService,
    WordExportService,
  ],
  exports: [ExportService],
})
export class ExportModule {}
