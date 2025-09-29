import { Module } from '@nestjs/common'

import { PrismaModule } from '@/infra/prisma/prisma.module'

import { CountriesController } from './countries.controller'
import { CountriesService } from './countries.service'

@Module({
    imports: [PrismaModule],
    providers: [CountriesService],
    controllers: [CountriesController],
    exports: [CountriesService]
})
export class CountriesModule {}
