import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EstimatesModule } from './modules/estimates/estimates.module';
import { NormsModule } from './modules/norms/norms.module';
import { MaterialsModule } from './modules/materials/materials.module';
import { ExportModule } from './modules/export/export.module';
import { AuthModule } from './modules/auth/auth.module';
import { CoefficientsModule } from './modules/coefficients/coefficients.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: configService.get('DB_TYPE') as any,
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('DB_SYNC') === 'true',
        logging: configService.get('NODE_ENV') === 'development',
      }),
    }),
    AuthModule,
    EstimatesModule,
    NormsModule,
    MaterialsModule,
    ExportModule,
    CoefficientsModule,
  ],
})
export class AppModule {}
