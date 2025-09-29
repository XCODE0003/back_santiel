import { JsonRpcProvider } from 'ethers';

const RPCS = [
  'https://ethereum-rpc.publicnode.com',
  'https://eth.drpc.org',
  'https://eth.llamarpc.com',
].filter(Boolean);

if (RPCS.length === 0) {
  throw new Error('No RPC endpoints configured. Set RPC_URL / RPC_URL_PRIMARY / RPC_URL_SECONDARY');
}

function isRateOrRemoteError(e: any): boolean {
  const body = e?.info?.responseBody ?? '';
  const status = String(e?.info?.responseStatus ?? '');
  return (
    String(body).includes('1015') || // Cloudflare rate-limit
    status.includes('429') ||        // Too Many Requests
    status.startsWith('5')           // 5xx
  );
}

export class ProviderManager {
  private index = 0;
  private provider: JsonRpcProvider;

  constructor() {
    this.provider = new JsonRpcProvider(RPCS[this.index], 1); // chainId=1
  }

  public get(): JsonRpcProvider {
    return this.provider;
  }

  public rotate() {
    this.index = (this.index + 1) % RPCS.length;
    const url = RPCS[this.index];
    this.provider = new JsonRpcProvider(url, 1);
    return this.provider;
  }

  public async withProvider<T>(fn: (p: JsonRpcProvider) => Promise<T>): Promise<T> {
    let attempts = 0;
    let lastErr: unknown;
    while (attempts < RPCS.length) {
      const p = this.get();
      try {
        return await fn(p);
      } catch (e) {
        lastErr = e;
        if (isRateOrRemoteError(e)) {
          this.rotate();       // пробуем следующий RPC
          attempts++;
          continue;
        }
        throw e;               // другие ошибки не маскируем
      }
    }
    throw lastErr;
  }

  public shouldRotateOn(e: any) {
    return isRateOrRemoteError(e);
  }
}

// экспортируем синглтон
export const providerManager = new ProviderManager();