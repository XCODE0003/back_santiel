import { Injectable } from '@nestjs/common'
import { Setting } from '@prisma/client'

import { UpdateSettingDto } from '@/api/settings/dto/update.dto'
import { PrismaService } from '@/infra/prisma/prisma.service'

@Injectable()
export class SettingsService {
    constructor(private readonly prismaService: PrismaService) {}

    async getSettings() {
        const settings = await this.prismaService.setting.findMany()

        return settings.map(setting => {
            switch (setting.type) {
                case 'BOOL':
                    return {
                        ...setting,
                        value: setting.value === '1'
                    }
                case 'NUMBER':
                    return {
                        ...setting,
                        value: Number(setting.value)
                    }
                case 'STRING':
                    return {
                        ...setting,
                        value: setting.value
                    }
            }
        })
    }

    async getUserSettings(userId: number): Promise<Setting[]> {
        const settings = await this.prismaService.setting.findMany()
        const userSetting = await this.prismaService.usersetting.findFirst({
            where: { user_id: userId }
        })

        return settings.map(setting => {
            const camelToSnake = (str: string) =>
                str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)

            const userSettingMap: Record<string, any> = {}

            if (userSetting) {
                for (const [key, value] of Object.entries(userSetting)) {
                    userSettingMap[camelToSnake(key)] = value
                }
            }

            let userValue: boolean | number | string

            switch (setting.type) {
                case 'BOOL':
                    userValue = Boolean(userSettingMap[setting.key])
                    break
                case 'NUMBER':
                    userValue = Number(userSettingMap[setting.key])
                    break
                case 'STRING':
                    userValue = String(userSettingMap[setting.key])
                    break
                default:
                    userValue = userSettingMap[setting.key as keyof Setting]
            }

            return {
                id: setting.id,
                userId: userSetting?.user_id,
                key: setting.key,
                type: setting.type,
                title: setting.title,
                description: setting.description,
                value:
                    userValue !== undefined ? String(userValue) : setting.value
            }
        })
    }

    async updateSetting(id: number, dto: UpdateSettingDto) {
        const setting = await this.prismaService.setting.findUnique({
            where: { id }
        })

        if (!setting) {
            throw new Error('Setting not found')
        }

        return this.prismaService.setting.update({
            where: { id },
            data: {
                value:
                    typeof dto.value === 'boolean'
                        ? dto.value === true
                            ? '1'
                            : '0'
                        : dto.value
            }
        })
    }

    async updateUserSetting(
        userId: number,
        settingId: number,
        value: string | number | boolean
    ) {
        const setting = await this.prismaService.setting.findUnique({
            where: { id: settingId }
        })

        if (!setting) {
            throw new Error('Setting not found')
        }

        const userSetting = await this.prismaService.usersetting.findFirst({
            where: { user_id: userId }
        })

        if (userSetting) {
            return this.prismaService.usersetting.update({
                where: { id: userSetting.id },
                data: {
                    [setting.key]: String(value)
                }
            })
        }

        return this.prismaService.usersetting.create({
            data: {
                user_id: userId,
                [setting.key]: String(value)
            }
        })
    }
}
