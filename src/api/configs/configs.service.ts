import { Injectable } from '@nestjs/common'

import { EditConfigDto } from '@/api/configs/dto/edit.dto'
import { PrismaService } from '@/infra/prisma/prisma.service'

@Injectable()
export class ConfigsService {
    constructor(private readonly prisma: PrismaService) {}

    async getAll() {
        return {
            configs: await this.prisma.config.findMany()
        }
    }

    async edit(configId: number, dto: EditConfigDto) {
        await this.prisma.config.update({
            where: {
                id: configId
            },
            data: {
                value: dto.value
            }
        })

        return {
            message: 'Настройка успешно обновлена'
        }
    }
}
