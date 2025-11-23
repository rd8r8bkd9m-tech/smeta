import { Injectable } from '@nestjs/common';
import { PdfExportService } from './pdf-export.service';
import { ExcelExportService } from './excel-export.service';
import { WordExportService } from './word-export.service';
import { Estimate } from '../estimates/estimate.entity';

export type ExportFormat = 'pdf' | 'excel' | 'word' | 'json';

@Injectable()
export class ExportService {
  constructor(
    private pdfExportService: PdfExportService,
    private excelExportService: ExcelExportService,
    private wordExportService: WordExportService,
  ) {}

  async export(
    estimate: Estimate,
    format: ExportFormat,
  ): Promise<Buffer | string> {
    switch (format) {
      case 'pdf':
        return this.pdfExportService.generate(estimate);
      case 'excel':
        return this.excelExportService.generate(estimate);
      case 'word':
        return this.wordExportService.generate(estimate);
      case 'json':
        return JSON.stringify(estimate, null, 2);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  getContentType(format: ExportFormat): string {
    const contentTypes = {
      pdf: 'application/pdf',
      excel:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      word: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      json: 'application/json',
    };
    return contentTypes[format];
  }

  getFileExtension(format: ExportFormat): string {
    const extensions = {
      pdf: 'pdf',
      excel: 'xlsx',
      word: 'docx',
      json: 'json',
    };
    return extensions[format];
  }
}
