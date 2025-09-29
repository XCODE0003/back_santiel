import { Injectable } from '@nestjs/common'

import { CountriesService } from './api/countries/countries.service'
import { DomainsService } from './api/domains/domains.service'

@Injectable()
export class AppService {
    constructor(
        private readonly countriesService: CountriesService,
        private readonly domains: DomainsService
    ) {}

    async onModuleInit() {
        await this.countriesService.initializeCountries()

        // TODO: maybe do there a condition if we in development mode?
        const findDomain = await this.domains.isExist('example.com')

        if (!findDomain) {
            await this.domains.create('example.com')
        }
    }
}
