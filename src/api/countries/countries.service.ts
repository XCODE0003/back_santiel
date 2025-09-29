import { Injectable } from '@nestjs/common'
import { Country } from '@prisma/client'
import * as fs from 'node:fs'
import * as path from 'node:path'

import { PrismaService } from '@/infra/prisma/prisma.service'

@Injectable()
export class CountriesService {
    constructor(private readonly prismaService: PrismaService) {}

    async initializeCountries() {
        const countryCount = await this.prismaService.country.count()
        if (countryCount === 0) {
            const countriesFilePath = path.join(
                __dirname,
                '..',
                '..',
                '..',
                'src',
                'api',
                'countries',
                'data',
                'countries.json'
            )
            const countries: Country[] = JSON.parse(
                fs.readFileSync(countriesFilePath, 'utf-8')
            )

            if (countries.length) {
                await this.prismaService.country.createMany({
                    data: countries
                })
            }
            console.log('Countries initialized from JSON file')
        }
    }

    async getAllCountries(): Promise<Country[]> {
        return this.prismaService.country.findMany({
            orderBy: {
                name: 'asc'
            }
        })
    }
}
