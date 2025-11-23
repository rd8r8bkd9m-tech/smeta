import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { Estimate } from '../estimates/estimate.entity';

@Injectable()
export class ExcelExportService {
  async generate(estimate: Estimate): Promise<Buffer> {
    // Create workbook
    const wb = XLSX.utils.book_new();

    // Prepare data
    const data = [
      ['СМЕТА'],
      [],
      ['Название:', estimate.title],
      ['Клиент:', estimate.client || ''],
      ['Проект:', estimate.project || ''],
      ['Дата:', new Date(estimate.createdAt).toLocaleDateString('ru-RU')],
      [],
      ['№', 'Наименование', 'Ед.изм.', 'Количество', 'Цена за ед.', 'Сумма'],
    ];

    // Add items
    estimate.items.forEach((item, index) => {
      data.push([index + 1, item.name, item.unit, item.quantity, item.unitPrice, item.totalPrice]);
    });

    // Add total
    data.push([]);
    data.push(['', '', '', '', 'ИТОГО:', estimate.totalCost]);

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Set column widths
    ws['!cols'] = [{ wch: 5 }, { wch: 40 }, { wch: 10 }, { wch: 12 }, { wch: 15 }, { wch: 15 }];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Смета');

    // Generate buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
  }
}
