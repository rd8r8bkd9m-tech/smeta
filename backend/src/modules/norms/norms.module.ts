import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NormsController } from './norms.controller';
import { NormsService } from './norms.service';
import { Norm } from './norm.entity';
import { NormMatchingService } from './norm-matching.service';

@Module({
  imports: [TypeOrmModule.forFeature([Norm])],
  controllers: [NormsController],
  providers: [NormsService, NormMatchingService],
  exports: [NormsService, NormMatchingService],
})
export class NormsModule {}
