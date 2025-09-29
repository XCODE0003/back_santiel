// print-xpubs.js (CommonJS)
const axios = require('axios')
require('dotenv').config()

const BASE = process.env.TATUM_BASE_URL || 'https://api.tatum.io'
const KEY = process.env.TATUM_API_KEY
const MNEM = process.env.MNEMONIC

if (!KEY) {
  console.error('TATUM_API_KEY не задан')
  process.exit(1)
}

const chains = [
  { key: 'BTC_XPUB',  path: '/v3/bitcoin/wallet'   },
  { key: 'LTC_XPUB',  path: '/v3/litecoin/wallet'  },
  { key: 'ETH_XPUB',  path: '/v3/ethereum/wallet'  },
  { key: 'BSC_XPUB',  path: '/v3/bsc/wallet'       },
  { key: 'TRON_XPUB', path: '/v3/tron/wallet'      },
]

const client = axios.create({
  baseURL: BASE,
  timeout: 15000,
  headers: { 'x-api-key': KEY, 'Content-Type': 'application/json' },
})

function urlWithMnemonic(path) {
  if (!MNEM) return path
  const q = `mnemonic=${encodeURIComponent(MNEM)}`
  return path.includes('?') ? `${path}&${q}` : `${path}?${q}`
}

;(async () => {
  const out = {}
  for (const c of chains) {
    try {
      const u = urlWithMnemonic(c.path)
      const { data } = await client.get(u)
      const xpub = data?.xpub || data?.extendedPublicKey || data?.result?.xpub
      out[c.key] = xpub || ''
    } catch (e) {
      out[c.key] = ''
      console.error(`${c.key} error:`, e?.response?.data || e?.message)
    }
  }

  console.log(JSON.stringify(out, null, 2))
  console.log('')
  Object.entries(out).forEach(([k, v]) => {
    if (v) console.log(`${k}=${v}`)
  })
})().catch((e) => {
  console.error(e)
  process.exit(1)
})