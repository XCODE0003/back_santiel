import { Injectable, Logger } from '@nestjs/common'
import { InferenceClient, PROVIDERS } from '@huggingface/inference'

type ChatMsg = { role: 'user' | 'assistant' | 'system'; content: string }
type Provider = keyof typeof PROVIDERS

// --- детект мусора/эхо ---
const GARBAGE_PATTERNS = [
  /\[INST\]/i, /\[\/INST\]/i, /<\s*\/?s\s*>/i,
  /<\|assistant\|>/i, /<\|user\|>/i, /<\|system\|>/i,
]
const BAD_REPLY_PHRASES = [
  'sorry, i had trouble generating a reply. please try again.',
  'i’m sorry, i had trouble generating a reply. please try again.',
  'sorry, i had trouble generating a response. please try again.',
]

function looksGarbage(text: string) {
  const t = text.trim()
  return t.length === 0 || GARBAGE_PATTERNS.some((re) => re.test(t))
}
function isBadLLMReply(text: string) {
  const t = text.trim().toLowerCase()
  return BAD_REPLY_PHRASES.includes(t)
}
function norm(s: string) {
  return s.replace(/\s+/g, ' ').trim().toLowerCase()
}
// очень простая «похожесть»: доля общей подстроки
function isEcho(candidate: string, lastUser: string) {
  const a = norm(candidate), b = norm(lastUser)
  if (!a || !b) return false
  if (a === b) return true
  // если ответ очень короткий и почти весь содержится в юзер-тексте — считаем эхом
  if (a.length <= 12 && b.includes(a)) return true
  // грубая метрика: отношение длины пересечения к max(len)
  const common = a.length > b.length ? b.split(a).length === 1 && a.includes(b) ? b.length : 0
                                   : a.split(b).length === 1 && b.includes(a) ? a.length : 0
  const ratio = common / Math.max(a.length, b.length)
  return ratio >= 0.85
}

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name)
  private readonly client = new InferenceClient(process.env.HF_TOKEN)

  // твой провайдер: у токена доступен featherless-ai
  private readonly provider: Provider = 'featherless-ai'
  // оставляем Zephyr (он у тебя отвечает), можно добавить ещё 1–2, если у токена включены
  private readonly candidates: { model: string; provider: Provider }[] = [
    { model: process.env.HF_MODEL || 'HuggingFaceH4/zephyr-7b-beta', provider: this.provider },
    // пример альтернатив: раскомментируй, если включены в твоём Router-плане
    // { model: 'NousResearch/Hermes-2-Pro-Llama-3-8B', provider: 'featherless-ai' },
    // { model: 'mistralai/Mistral-7B-Instruct-v0.2',   provider: 'featherless-ai' },
  ]

  private readonly maxTokens = Math.min(Number(process.env.LLM_MAX_TOKENS ?? 256), 512)
  private readonly temperature = Number(process.env.LLM_TEMPERATURE ?? 0.6)

  // ——— helpers ———
  private sanitizeHistory(history: ChatMsg[]): ChatMsg[] {
    return history.filter((m) => m.role !== 'assistant' || !isBadLLMReply(m.content))
  }

  private buildMessages(history: ChatMsg[]): ChatMsg[] {
    const system: ChatMsg = {
      role: 'system',
      content: [
        'You are a friendly human support agent.',
        'Reply in natural, concise English. Be specific, helpful and empathetic.',
        'Do not repeat the user message verbatim. Avoid template markers like [INST], </s>, <|assistant|>.',
        'Never answer with generic failure messages.',
      ].join(' '),
    }

    // маленький few-shot против эха
    const shots: ChatMsg[] = [
      { role: 'user',      content: 'test' },
      { role: 'assistant', content: 'Got it. Could you tell me what exactly you want to test so I can help?' },
      { role: 'user',      content: 'hello' },
      { role: 'assistant', content: 'Hi! How can I help you today?' },
    ]

    return [system, ...shots, ...this.sanitizeHistory(history)]
  }

  private buildPrompt(history: ChatMsg[]): string {
    const sys =
      'System: You are a friendly human support agent. Reply in natural, concise English. Be specific, helpful and empathetic. Do not echo the user message. Do not output [INST], </s>, or <|assistant|>.\n'
    const lines = this.sanitizeHistory(history).map((m) => {
      const role = m.role === 'assistant' ? 'Assistant' : m.role === 'system' ? 'System' : 'User'
      return `${role}: ${m.content}`
    })
    return sys + lines.join('\n') + '\nAssistant:'
  }

  private cleanAndValidate(raw: string, lastUser: string) {
    let t = String(raw || '').trim().replace(/^assistant:\s*/i, '').trim()
    if (looksGarbage(t) || isBadLLMReply(t) || isEcho(t, lastUser)) return ''
    return t
  }

  // ——— main ———
  async generateReply(history: ChatMsg[]): Promise<string> {
    const safeHistory = this.sanitizeHistory(history)
    const lastUser = [...safeHistory].reverse().find((m) => m.role === 'user')?.content ?? ''
    const messages = this.buildMessages(history)
    const stop = ['[/INST]', '</s>']

    // 1) chatCompletion
    for (const { model, provider } of this.candidates) {
      try {
        const resp = await this.client.chatCompletion({
          provider,
          model,
          messages,
          max_tokens: this.maxTokens,
          temperature: this.temperature,
          stop,
        })

        this.logger.debug(`HF chatCompletion resp (model=${model}, provider=${provider}): ${JSON.stringify(resp).slice(0, 900)}...`)
        const raw = resp?.choices?.[0]?.message?.content ?? ''
        const text = this.cleanAndValidate(raw, lastUser)
        if (text) return text

        this.logger.warn(`ChatCompletion empty/garbage/echo (model=${model}), trying textGeneration…`)
      } catch (e: any) {
        const status = e?.response?.status ?? e?.name
        const body = e?.response?.data ?? e?.message ?? e
        this.logger.error(`HF chatCompletion error (model=${model}, provider=${provider}): [${status}] ${JSON.stringify(body)}`)
      }

      // 2) textGeneration fallback
      try {
        const prompt = this.buildPrompt(history)
        const resp = await this.client.textGeneration({
          provider,
          model,
          inputs: prompt,
          parameters: {
            max_new_tokens: this.maxTokens,
            temperature: this.temperature,
            return_full_text: false,
            stop,
          },
          options: { wait_for_model: true },
        })

        this.logger.debug(`HF textGeneration resp (model=${model}, provider=${provider}): ${JSON.stringify(resp).slice(0, 900)}...`)
        let out = ''
        if (Array.isArray(resp)) out = String(resp[0]?.generated_text ?? '')
        else if (typeof resp === 'object' && resp) out = String((resp as any).generated_text ?? '')
        else if (typeof resp === 'string') out = resp

        const text = this.cleanAndValidate(out, lastUser)
        if (text) return text

        this.logger.warn(`TextGeneration empty/garbage/echo (model=${model}), trying next candidate…`)
      } catch (e: any) {
        const status = e?.response?.status ?? e?.name
        const body = e?.response?.data ?? e?.message ?? e
        this.logger.error(`HF textGeneration error (model=${model}, provider=${provider}): [${status}] ${JSON.stringify(body)}`)
      }
    }

    // 3) мягкий fallback: делаем осмысленную уточняющую фразу по последнему вопросу
    if (lastUser) {
      return `Thanks! Could you share a bit more detail about "${lastUser}" so I can help better?`
    }
    return 'Thanks! Could you share a bit more detail so I can help better?'
  }
}
