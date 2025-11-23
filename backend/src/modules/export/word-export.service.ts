import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { Estimate } from '../estimates/estimate.entity';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class WordExportService {
  private readonly templatePath: string;

  constructor(private configService: ConfigService) {
    // Get template path from environment or use default
    const templatesDir = this.configService.get('TEMPLATES_DIR') || 
                        path.join(process.cwd(), 'templates');
    this.templatePath = path.join(templatesDir, 'estimate-template.docx');
  }

  async generate(estimate: Estimate): Promise<Buffer> {
    // Load template
    const templatePath = this.templatePath;
    
    // If template doesn't exist, generate simple document
    if (!fs.existsSync(templatePath)) {
      return this.generateSimple(estimate);
    }

    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Prepare data for template
    const data = {
      title: estimate.title,
      client: estimate.client || '',
      project: estimate.project || '',
      date: new Date(estimate.createdAt).toLocaleDateString('ru-RU'),
      items: estimate.items.map((item, index) => ({
        number: index + 1,
        name: item.name,
        unit: item.unit,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toFixed(2),
        totalPrice: item.totalPrice.toFixed(2),
      })),
      totalCost: estimate.totalCost.toFixed(2),
      currency: estimate.currency,
    };

    doc.render(data);

    const buffer = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    return buffer;
  }

  private generateSimple(estimate: Estimate): Buffer {
    // Simple text-based Word document generation
    let content = `СМЕТА\n\n`;
    content += `Название: ${estimate.title}\n`;
    content += `Клиент: ${estimate.client || ''}\n`;
    content += `Проект: ${estimate.project || ''}\n`;
    content += `Дата: ${new Date(estimate.createdAt).toLocaleDateString('ru-RU')}\n\n`;
    content += `№\tНаименование\tЕд.изм.\tКол-во\tЦена\tСумма\n`;
    
    estimate.items.forEach((item, index) => {
      content += `${index + 1}\t${item.name}\t${item.unit}\t${item.quantity}\t${item.unitPrice.toFixed(2)}\t${item.totalPrice.toFixed(2)}\n`;
    });
    
    content += `\nИТОГО: ${estimate.totalCost.toFixed(2)} ${estimate.currency}`;
    
    return Buffer.from(content, 'utf-8');
  }
}
