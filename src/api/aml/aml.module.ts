import { Module } from '@nestjs/common';
import { AmlService } from './aml.service';
import { AmlController } from './aml.controller';
import { PrismaModule } from '@/infra/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [AmlService],
  controllers: [AmlController],
})
export class AmlModule {}