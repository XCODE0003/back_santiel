import axios from 'axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TatumService {
  private baseURL: string;
  private apiKey: string;
  private webhookSecret: string;

  constructor(private readonly config: ConfigService) {
    this.baseURL = this.config.get<string>('TATUM_BASE_URL')!;
    this.apiKey = this.config.get<string>('TATUM_API_KEY')!;
    this.webhookSecret = this.config.get<string>('TATUM_WEBHOOK_SECRET')!;
  }

  private client() {
    return axios.create({
      baseURL: this.baseURL,
      headers: { 'x-api-key': this.apiKey, 'Content-Type': 'application/json' },
      timeout: 15000,
    });
  }

  async createVirtualAccount(currency: string, xpub: string, customerId: string): Promise<string> {
    const { data } = await this.client().post('/v3/ledger/account', {
      currency,
      xpub,
      customer: { externalId: customerId },
    });
    return data?.id;
  }

  async createDepositAddress(accountId: string): Promise<{ address: string; derivationKey?: number }> {
    const { data } = await this.client().post(`/v3/offchain/account/${accountId}/address`);
    return { address: data?.address || data, derivationKey: data?.derivationKey };
  }

  async subscribeIncomingNative(
    chain: 'ethereum-mainnet'|'bsc-mainnet'|'tron-mainnet'|'bitcoin-mainnet'|'litecoin-core-mainnet'|'base-mainnet'|'ripple-mainnet'|'solana-mainnet',
    address: string,
    callbackUrl: string,
  ): Promise<{ id: string }> {
    const { data } = await this.client().post('/v4/subscription', {
      type: 'INCOMING_NATIVE_TX',
      attr: {
        chain,
        address,
        url: callbackUrl,
      },
    });
    return data;
  }
  async cancelSubscription(id: string): Promise<void> {
    await this.client().delete(`/v4/subscription/${id}`);
  }

  async createVirtualAccountByAddress(currency: string, address: string, customerId: string): Promise<string> {
    const { data } = await this.client().post('/v3/ledger/account', {
      currency,
      address,
      customer: { externalId: customerId },
    });
    return data?.id;
  }

  async generateSolanaWallet(): Promise<{ address?: string; privateKey?: string; mnemonic?: string }> {
    const { data } = await this.client().get('/v3/solana/wallet');
    return data || {};
  }

  async generateXrpAccount(): Promise<{ address?: string; secret?: string; privateKey?: string }> {
    const { data } = await this.client().get('/v3/xrp/account');
    return data || {};
  }
}

