import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EstimatesController } from './estimates.controller';
import { EstimatesService } from './estimates.service';
import { Estimate } from './estimate.entity';
import { EstimateItem } from './estimate-item.entity';
import { NormsModule } from '../norms/norms.module';
import { CalculationEngine } from './calculation.engine';

@Module({
  imports: [TypeOrmModule.forFeature([Estimate, EstimateItem]), NormsModule],
  controllers: [EstimatesController],
  providers: [EstimatesService, CalculationEngine],
  exports: [EstimatesService],
})
export class EstimatesModule {}
