import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import { Estimate } from '../estimates/estimate.entity';

@Injectable()
export class PdfExportService {
  async generate(estimate: Estimate): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).text('СМЕТА', { align: 'center' }).moveDown();

      // Estimate info
      doc.fontSize(12);
      doc.text(`Название: ${estimate.title}`);
      if (estimate.client) doc.text(`Клиент: ${estimate.client}`);
      if (estimate.project) doc.text(`Проект: ${estimate.project}`);
      doc.text(`Дата: ${new Date(estimate.createdAt).toLocaleDateString('ru-RU')}`);
      doc.moveDown();

      // Table header
      const tableTop = doc.y;
      const colWidths = [40, 200, 60, 60, 70, 90];
      const headers = ['№', 'Наименование', 'Ед.изм.', 'Кол-во', 'Цена', 'Сумма'];

      doc.font('Helvetica-Bold');
      headers.forEach((header, i) => {
        const x = 50 + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
        doc.text(header, x, tableTop, { width: colWidths[i] });
      });

      // Draw line
      doc
        .moveTo(50, tableTop + 20)
        .lineTo(550, tableTop + 20)
        .stroke();

      // Table rows
      doc.font('Helvetica');
      let y = tableTop + 30;
      estimate.items.forEach((item, index) => {
        const x0 = 50;
        doc.text(String(index + 1), x0, y, { width: colWidths[0] });
        doc.text(item.name, x0 + colWidths[0], y, { width: colWidths[1] });
        doc.text(item.unit, x0 + colWidths[0] + colWidths[1], y, {
          width: colWidths[2],
        });
        doc.text(item.quantity.toString(), x0 + colWidths[0] + colWidths[1] + colWidths[2], y, {
          width: colWidths[3],
        });
        doc.text(
          item.unitPrice.toFixed(2),
          x0 + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3],
          y,
          { width: colWidths[4] }
        );
        doc.text(
          item.totalPrice.toFixed(2),
          x0 + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4],
          y,
          { width: colWidths[5] }
        );
        y += 25;
      });

      // Total
      doc.moveDown();
      doc
        .font('Helvetica-Bold')
        .fontSize(14)
        .text(`ИТОГО: ${estimate.totalCost.toFixed(2)} ${estimate.currency}`, { align: 'right' });

      doc.end();
    });
  }
}
