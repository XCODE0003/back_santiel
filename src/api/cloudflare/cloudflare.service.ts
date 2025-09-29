import { Injectable, BadRequestException } from '@nestjs/common'
import Cloudflare from 'cloudflare'

@Injectable()
export class CloudflareService {
  /**
   * Вспомогательный фабричный метод — каждый раз создаём новый клиент
   */
  private getClient(apiToken: string) {
    return new Cloudflare({ apiToken })
  }

  /**
   * Создаёт зону в Cloudflare.
   * @returns zoneId и массив name_servers
   */
  async createZone(
    apiToken: string,
    domain: string,
    accountId: string
  ): Promise<{ zoneId: string; nameServers: string[] }> {
    const cf = this.getClient(apiToken)

    // проверяем, не зарегистрирована ли уже такая зона
    const listResp = await cf.zones.list({ name: domain })
    const existingZone = listResp.result.find(z => z.name === domain)
    if (existingZone) {
      throw new BadRequestException(`Domain ${domain} already exists in Cloudflare`)
    }

    // создаём зону
    const newZone = await cf.zones.create({
      account: { id: accountId },
      name: domain
    })

    return {
      zoneId: newZone.id,
      // name_servers приходит из API как string[]
      nameServers: newZone.name_servers as string[]
    }
  }

  /**
   * Добавляет DNS-запись в указанную зону.
   * @param apiToken токен, как и в createZone
   * @param zoneId  ID зоны (из createZone)
   * @param type    'A' или 'CNAME'
   * @param name    либо '@' (корень), либо 'www', либо полный домен
   * @param content IP-адрес для A-записи или цель для CNAME
   * @param ttl     время жизни (в секундах), по умолчанию 3600
   * @param proxied вкл/выкл прокси Cloudflare (по умолчанию false)
   */
  async createDNSRecord(
    apiToken: string,
    zoneId: string,
    type: 'A' | 'CNAME',
    name: string,
    content: string,
    ttl = 3600,
    proxied = false
  ) {
    const cf = this.getClient(apiToken)

    // Низкоуровневый вызов
    const resp = await cf.request({
      method: 'post',                              // lowercase!
      url: `/zones/${zoneId}/dns_records`,         // <-- здесь
      body: { type, name, content, ttl, proxied }
    } as any)

    // Проверяем успех — сам API всегда возвращает обёртку { success, result, errors }
    if (!resp || !(resp as any).success) {
      const err = (resp as any).errors?.[0]?.message ?? 'unknown error'
      throw new BadRequestException(`Failed to create DNS record: ${err}`)
    }

    return (resp as any).result
  }
}
