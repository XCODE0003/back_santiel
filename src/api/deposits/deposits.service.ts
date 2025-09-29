import { Injectable, NotFoundException } from '@nestjs/common'

import { GetAllDepositsDto } from '@/api/deposits/dto/get-all'
import { PrismaService } from '@/infra/prisma/prisma.service'
import { formatPath } from '@/libs/formatPath'
import { ethers } from 'ethers'
import { ConfigService } from '@nestjs/config'
import { TatumService } from '@/common/services/tatum/tatum.service'

@Injectable()
export class DepositsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly config: ConfigService,
        private readonly tatum: TatumService,
    ) {}

    async getAll(dto: GetAllDepositsDto, userId?: number) {
        const limit = 25
        const page = (dto.page - 1) * limit

        if (userId) {
            if (dto.search.length) {
                return {
                    deposits: await this.prisma.deposit.findMany({
                        where: {
                            user: {
                                workerId: userId
                            },
                            OR: [
                                {
                                    address: {
                                        contains: dto.search
                                    }
                                },
                                {
                                    txId: {
                                        contains: dto.search
                                    }
                                },
                                {
                                    user: {
                                        email: {
                                            contains: dto.search
                                        }
                                    }
                                }
                            ]
                        },
                        include: {
                            user: true,
                            coin: true
                        },
                        skip: page,
                        take: limit
                    })
                }
            } else {
                return {
                    deposits: await this.prisma.deposit.findMany({
                        where: {
                            user: {
                                workerId: userId
                            }
                        },
                        include: {
                            user: true,
                            coin: true
                        },
                        skip: page,
                        take: limit
                    })
                }
            }
        }

        if (dto.search) {
            return {
                deposits: await this.prisma.deposit.findMany({
                    where: {
                        OR: [
                            {
                                address: {
                                    contains: dto.search
                                }
                            },
                            {
                                txId: {
                                    contains: dto.search
                                }
                            },
                            {
                                user: {
                                    email: {
                                        contains: dto.search
                                    }
                                }
                            }
                        ]
                    },
                    include: {
                        user: true,
                        coin: true
                    },
                    skip: page,
                    take: limit
                })
            }
        } else {
            return {
                deposits: await this.prisma.deposit.findMany({
                    include: {
                        user: true,
                        coin: true
                    },
                    skip: page,
                    take: limit
                })
            }
        }
    }

    async getDepositAddress(userId: number, coinSymbol: string) {
        const coin = await this.prisma.coin.findUnique({
          where: { symbol: coinSymbol },
        });
        if (!coin) {
          throw new NotFoundException(`Coin not found: ${coinSymbol}`);
        }

        const existing = await this.prisma.deposit.findFirst({
          where: { userId, coinId: coin.id, status: 'pending' },
        });
        if (existing) {
            const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
            if (existing.createdAt < twelveHoursAgo) {
              return { address: existing.address };
            }
            else {
              await this.prisma.deposit.delete({
                where: { id: existing.id },
              });
            }
        }

        const sym = coin.symbol.toUpperCase();

        const xpubEnvMap: Record<string, string> = {
          BTC: 'BTC_XPUB',
          LTC: 'LTC_XPUB',
          ETH: 'ETH_XPUB',
          BNB: 'BSC_XPUB',
          BSC: 'BSC_XPUB',
          TRX: 'TRON_XPUB',
          TRON: 'TRON_XPUB',
        };

        const currencyMap: Record<string, string> = {
          BTC: 'BTC',
          LTC: 'LTC',
          ETH: 'ETH',
          BNB: 'BSC',
          BSC: 'BSC',
          TRX: 'TRON',
          TRON: 'TRON',
        };

        const xpubKeyName = xpubEnvMap[sym] || xpubEnvMap[currencyMap[sym] || ''];
        if (!xpubKeyName) throw new Error(`Unsupported coin: ${sym}`);

        const xpub = this.config.get<string>(xpubKeyName)!;
        if (!xpub) throw new Error(`${xpubKeyName} not set`);

        const customerId = `u:${userId}:${currencyMap[sym] || sym}`;
        const accountId = await this.tatum.createVirtualAccount(currencyMap[sym] || sym, xpub, customerId);
        const created = await this.tatum.createDepositAddress(accountId);
        const addressRaw = created.address;
        const derivationKey = created.derivationKey ?? null;

        const evmSet = new Set(['ETH','BSC','BNB']);
        const addrToStore = evmSet.has((currencyMap[sym] || sym)) ? String(addressRaw).toLowerCase() : String(addressRaw);

        const COIN_TYPE: Record<string, number> = { BTC: 0, LTC: 2, ETH: 60, BSC: 60, BNB: 60, TRON: 195 };
        const coinType = COIN_TYPE[currencyMap[sym] || sym] ?? 60;
        const hdPath = derivationKey != null ? `m/44'/${coinType}'/0'/0/${derivationKey}` : null;

        const chainsV4: Record<string,
          'ethereum-mainnet'|'bsc-mainnet'|'tron-mainnet'|'bitcoin-mainnet'|'litecoin-core-mainnet'
        > = {
          ETH: 'ethereum-mainnet',
          BSC: 'bsc-mainnet',
          BTC: 'bitcoin-mainnet',
          LTC: 'litecoin-core-mainnet',
          TRON: 'tron-mainnet',
        };
        const chainV4 = chainsV4[currencyMap[sym] || sym];

        let subId: string | null = null;
        // if (chainV4) {
        //   const publicUrl = this.config.get<string>('PUBLIC_URL') || '';
        //   const cb = `${publicUrl}/api/v1/deposits/ipn/tatum`;
        //   const sub = await this.tatum.subscribeIncomingNative(chainV4, addrToStore, cb);
        //   subId = sub?.id || null;
        // }

        await this.prisma.deposit.create({
          data: {
            userId,
            coinId: coin.id,
            address: addrToStore,
            pathIndex: derivationKey,
            amount: '0',
            sum: '0',
            txId: '',
            status: 'pending',
            tatumAccountId: accountId,
            tatumSubscriptionId: subId,
            xpub,
            currency: currencyMap[sym] || sym,
            chain: chainV4 || null,
            hdPath,
          }
        });

        return { address: addrToStore };

      }

      async generateDepositAddress(userId: number, coinSymbol: string) {
        const coin = await this.prisma.coin.findUnique({
          where: { symbol: coinSymbol },
        });
        if (!coin) throw new NotFoundException(`Coin not found: ${coinSymbol}`);

        const existing = await this.prisma.deposit.findFirst({
          where: { userId, coinId: coin.id },
        });
        if (existing) return { address: existing.address };



      }
}
