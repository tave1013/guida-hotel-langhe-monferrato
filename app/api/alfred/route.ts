import { openai } from '@ai-sdk/openai'
import { tavily } from '@tavily/core'
import { convertToModelMessages, stepCountIs, streamText, type UIMessage } from 'ai'
import { z } from 'zod'
import { buildKnowledgeText } from '@/config/alfred-knowledge'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export const runtime = 'nodejs'
export const maxDuration = 30

type RateLimitRecord = {
  count: number
  resetAt: number
}

type ConversationLang = 'it' | 'en' | 'fr' | 'de' | 'es'

declare global {
  // eslint-disable-next-line no-var
  var __alfredRateLimitMap: Map<string, RateLimitRecord> | undefined
}

const rateLimitMap = globalThis.__alfredRateLimitMap ?? new Map<string, RateLimitRecord>()
if (!globalThis.__alfredRateLimitMap) {
  globalThis.__alfredRateLimitMap = rateLimitMap
}

const MAX_QUESTIONS_PER_IP = Number(process.env.ALFRED_MAX_QUESTIONS_PER_IP ?? '30')
const ONE_DAY_MS = 24 * 60 * 60 * 1000
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const TAVILY_API_KEY = process.env.TAVILY_API_KEY
const EVENT_SOURCE_URLS = [
  'https://www.comune.asti.it/vivere-comune/eventi',
  'https://visitalba.eu/eventi/',
]

const SYSTEM_MESSAGES: Record<ConversationLang, { tempError: string; limitError: string }> = {
  it: {
    tempError: 'Al momento sto riordinando i registri, riprova tra un istante.',
    limitError: `Hai raggiunto il limite giornaliero di ${MAX_QUESTIONS_PER_IP} domande. Scrivici su WhatsApp per assistenza diretta oppure riprova domani.`,
  },
  en: {
    tempError: 'I am tidying up the registers right now, please try again in a moment.',
    limitError: `You have reached the daily limit of ${MAX_QUESTIONS_PER_IP} questions. Please contact us on WhatsApp for direct assistance or try again tomorrow.`,
  },
  fr: {
    tempError: "Je suis en train d'organiser les registres, veuillez réessayer dans un instant.",
    limitError: `Vous avez atteint la limite quotidienne de ${MAX_QUESTIONS_PER_IP} questions. Veuillez nous contacter sur WhatsApp pour une assistance directe ou réessayer demain.`,
  },
  de: {
    tempError: 'Ich ordne gerade die Register, bitte versuchen Sie es in einem Moment erneut.',
    limitError: `Sie haben das tägliche Limit von ${MAX_QUESTIONS_PER_IP} Fragen erreicht. Bitte kontaktieren Sie uns per WhatsApp für direkte Unterstützung oder versuchen Sie es morgen erneut.`,
  },
  es: {
    tempError: 'En este momento estoy ordenando los registros, inténtalo de nuevo en un instante.',
    limitError: `Has alcanzado el límite diario de ${MAX_QUESTIONS_PER_IP} preguntas. Escríbenos por WhatsApp para asistencia directa o vuelve a intentarlo mañana.`,
  },
}

function getClientIp(req: Request) {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'unknown'
  }

  return req.headers.get('x-real-ip')?.trim() || 'unknown'
}

function consumeQuestion(ip: string) {
  const now = Date.now()
  const current = rateLimitMap.get(ip)

  if (!current || current.resetAt <= now) {
    const freshRecord = { count: 1, resetAt: now + ONE_DAY_MS }
    rateLimitMap.set(ip, freshRecord)
    return { allowed: true, used: 1, remaining: Math.max(0, MAX_QUESTIONS_PER_IP - 1) }
  }

  const nextCount = current.count + 1
  const updated = { ...current, count: nextCount }
  rateLimitMap.set(ip, updated)

  return {
    allowed: nextCount <= MAX_QUESTIONS_PER_IP,
    used: nextCount,
    remaining: Math.max(0, MAX_QUESTIONS_PER_IP - nextCount),
  }
}

function parseDomains(value: string | undefined) {
  if (!value) return []

  const domains = value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
    .map((raw) => {
      try {
        const normalized = raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`
        return new URL(normalized).hostname.replace(/^www\./, '')
      } catch {
        return raw.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
      }
    })
    .filter(Boolean)

  return [...new Set(domains)]
}

function getRomeHour() {
  const hour = new Intl.DateTimeFormat('it-IT', {
    hour: '2-digit',
    hour12: false,
    timeZone: 'Europe/Rome',
  }).format(new Date())

  return Number.parseInt(hour, 10)
}

const hotelDomains = parseDomains(process.env.HOTEL_SITE_URL)
const municipalDomains = parseDomains(process.env.MUNICIPAL_SITES)
const eventSourceDomains = parseDomains(EVENT_SOURCE_URLS.join(','))
const municipalAndEventDomains = [...new Set([...municipalDomains, ...eventSourceDomains])]
const allAllowedDomains = [...new Set([...hotelDomains, ...municipalAndEventDomains])]

function detectLanguageFromText(text: string): ConversationLang {
  const t = text.toLowerCase()

  if (/(\bwie\b|\bund\b|\bdanke\b|\bguten\b|\bzur\b|\bich\b|\bbitte\b)/i.test(t)) return 'de'
  if (/(\bbonjour\b|\bmerci\b|\bavec\b|\bvous\b|\bété\b|\bpour\b|\bquel\b)/i.test(t)) return 'fr'
  if (/(\bhola\b|\bgracias\b|\bpor\b|\bpara\b|\busted\b|\bdónde\b|\bcuándo\b)/i.test(t)) return 'es'
  if (/(\bhello\b|\bthanks\b|\bplease\b|\bwhere\b|\bwhen\b|\bhow\b|\bcan i\b)/i.test(t)) return 'en'

  return 'it'
}

function extractLastUserText(messages: UIMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const msg = messages[i]
    if (msg.role !== 'user') continue

    const maybeParts = (msg as { parts?: Array<{ type?: string; text?: string }> }).parts
    if (Array.isArray(maybeParts)) {
      const text = maybeParts
        .filter((part) => part?.type === 'text' && typeof part?.text === 'string')
        .map((part) => part.text)
        .join(' ')
        .trim()

      if (text) return text
    }

    const maybeText = (msg as { content?: string }).content
    if (typeof maybeText === 'string' && maybeText.trim()) {
      return maybeText.trim()
    }
  }

  return ''
}

function detectConversationLanguage(messages: UIMessage[]): ConversationLang {
  const lastUserText = extractLastUserText(messages)
  if (!lastUserText) return 'it'
  return detectLanguageFromText(lastUserText)
}

function loadCompleteKnowledgeText() {
  try {
    const fullKnowledgePath = join(process.cwd(), 'config', 'CONOSCENZA_COMPLETA.md')
    return readFileSync(fullKnowledgePath, 'utf8').trim()
  } catch {
    return ''
  }
}

function buildSystemPrompt(conversationLang: ConversationLang) {
  const hour = getRomeHour()
  const businessHours = hour >= 8 && hour < 22
  const whatsappNumber = (process.env.WHATSAPP_NUMBER ?? '').replace(/\D/g, '')
  const whatsappLink = whatsappNumber ? `https://wa.me/${whatsappNumber}` : ''

  const handoverInstruction = businessHours
    ? whatsappLink
      ? `Se l'ospite chiede supporto umano/urgenza, proponi subito WhatsApp: ${whatsappLink}`
      : "Se l'ospite chiede supporto umano/urgenza, proponi il contatto WhatsApp dell'hotel."
    : "Se l'ospite chiede supporto umano/urgenza, spiega con gentilezza che il team è disponibile dalle 08:00 alle 22:00 e che verrà ricontattato al mattino."

  const domainScope =
    allAllowedDomains.length > 0
      ? allAllowedDomains.join(', ')
      : 'sito hotel e siti istituzionali/turistici della zona'

  const knowledgeBase = buildKnowledgeText()
  const completeKnowledgeBase = loadCompleteKnowledgeText()
  const completeKnowledgeBlock = completeKnowledgeBase
    ? `\n\n════════════════════════════════════════════════\n  CONOSCENZA COMPLETA (OPERATIVA)\n════════════════════════════════════════════════\n${completeKnowledgeBase}\n════════════════════════════════════════════════`
    : ''

  return `
Sei Alfred, il concierge virtuale dell'Hotel Langhe & Monferrato.
Parla come un padrone di casa moderno: cordiale, professionale, terra-terra.
Regola lingua (fondamentale): rispondi SEMPRE nella stessa lingua dell'ultimo messaggio utente (language mirroring), anche se l'interfaccia è in un'altra lingua.
Se l'utente cambia lingua durante la conversazione, adeguati subito.

STILE DI SCRITTURA (obbligatorio):
- Usa parole semplici e dirette (stile chiaro, tipo "Apple style").
- Evita linguaggio tecnico, burocratico o da brochure.
- Se una cosa è gratuita, scrivi "gratis" o "offerta da noi".
- Mostra ascolto con una micro-frase naturale (es. "Capisco"), poi vai subito al punto.
- Frasi brevi, testo arioso, vai a capo spesso (lettura comoda da telefono).
- Niente tono da vendita: dai consigli pratici, non pubblicità.
- Emoji: massimo 1-2, solo se utili a scaldare il tono.
- Scrivi come un buon messaggio WhatsApp a un cliente abituale: umano, chiaro, concreto.

════════════════════════════════════════════════
  KNOWLEDGE BASE — HOTEL LANGHE & MONFERRATO
════════════════════════════════════════════════
${knowledgeBase}
════════════════════════════════════════════════
${completeKnowledgeBlock}

REGOLE DI RISPOSTA:
1. Per tutto ciò che riguarda l'hotel (orari, camere, colazione, servizi, pacchetti, parcheggio, animali, Wi-Fi, ecc.)
   rispondi ESCLUSIVAMENTE con le informazioni della knowledge base qui sopra. Non inventare nulla.
1.bis La sezione "CONOSCENZA COMPLETA (OPERATIVA)" è parte della tua fonte di verità: usala per esperienze, itinerari, negozi/food, farmacie, mobilità e dettagli estesi.
2. Se un'informazione non è presente nella knowledge base, ammettilo in modo umano e proattivo. Usa varianti come:
   - "Sai, su questo non vorrei darti un'informazione sbagliata. Se vuoi, posso passarti subito il contatto della reception così parli direttamente con lo staff che saprà aiutarti al meglio!"
   - "Bella domanda! Purtroppo non ho ancora questo dettaglio sottomano. Ti consiglio di chiedere direttamente ai miei colleghi in albergo, sono preparatissimi e sapranno dirti tutto."
   - "Su questo mi prendi un po' alla sprovvista. Per essere sicuri al 100%, preferirei che chiedessi allo staff dell'hotel. Se vuoi ti lascio qui il loro numero o il link WhatsApp!"
   Scegli la variante più adatta al tono della conversazione. Adatta sempre queste frasi alla lingua dell'utente (language mirroring).
   Dopo aver ammesso di non sapere, offri SEMPRE in modo proattivo:
   - Il link WhatsApp (se disponibile): ${whatsappLink || 'contatto WhatsApp staff'}
   - Il numero di telefono: +39 0141 966521
   Non usare mai frasi generiche piatte come "Non ho questa informazione". Suona sempre umano.
2.bis Se consigli ristoranti, farmacie, enoteche, pasticcerie, supermercati o attività, includi SEMPRE il link della scheda Google/My Business presente nella conoscenza completa.
2.ter Usa link cliccabili markdown, esempio: [Nome attività](https://maps.google.com/...)
3. Attiva la ricerca live (tool searchLiveInfo) SOLO per domande esterne all'hotel, come:
   - eventi, sagre, feste locali
   - orari di musei, cantine, attrazioni del territorio
   - meteo
   - novità dai siti del Comune o enti turistici
   I domini autorizzati per la ricerca sono: ${domainScope}
4. Quando usi dati dalla ricerca live, cita la fonte in modo sintetico (titolo + URL).
4.bis Se riporti eventi, mostra SEMPRE anche il link cliccabile in formato markdown, ad esempio:
  - [Nome evento](https://sito-evento.it/pagina)
  - Se ci sono più eventi, usa un elenco puntato con un link per ogni evento.
4.ter Quando fornisci orari di apertura/chiusura di attività esterne (ristoranti, farmacie, negozi, attrazioni), aggiungi sempre in chiusura una breve nota di verifica, nella lingua corrente. Esempio italiano: "Gli orari indicati provengono da Google e potrebbero variare: consigliamo una verifica diretta prima di andare."
4.quater Orari: usa SEMPRE formato 24 ore HH:mm (es. 07:30, 19:00). Non usare formato 12h AM/PM e non trasformare 19:00 in 7:00.
4.quinquies Se l'orario non è completo o non è certo, non indovinare: specifica chiaramente "dato non disponibile" o "orario da verificare".
4.sexies Per richieste su orari di apertura di attività esterne, esegui prima la ricerca live e riporta gli orari in modo fedele alla fonte.
5. ${handoverInstruction}
6. Se l'ospite vuole parlare con una persona dello staff, facilita sempre il passaggio.
7. Tono: caloroso, genuino, mai rigido. Come se parlassi con un ospite seduto in reception davanti a te.
8. I messaggi automatici e di servizio devono essere nella lingua corrente della conversazione: ${conversationLang}.
9. Evita chiusure generiche ripetitive come "Se hai bisogno di altre informazioni, sono qui per aiutarti" salvo che l'utente lo chieda esplicitamente.
`.trim()
}


export async function POST(req: Request) {
  const { messages = [] }: { messages: UIMessage[] } = await req.json()
  const conversationLang = detectConversationLanguage(messages)
  const sys = SYSTEM_MESSAGES[conversationLang]

  if (!OPENAI_API_KEY) {
    return Response.json({ error: sys.tempError }, { status: 503 })
  }

  if (messages.length > 0 && messages[messages.length - 1]?.role === 'user') {
    const ip = getClientIp(req)
    const limit = consumeQuestion(ip)

    if (!limit.allowed) {
      return Response.json({ error: sys.limitError }, { status: 429 })
    }
  }

  const result = streamText({
    model: openai('gpt-4o-mini'),
    system: buildSystemPrompt(conversationLang),
    messages: await convertToModelMessages(messages),
    tools: {
      searchLiveInfo: {
        description:
          'Ricerca informazioni aggiornate sul sito dell\'hotel e siti comunali (eventi, orari, avvisi, contatti).',
        inputSchema: z.object({
          query: z.string().min(3),
          focus: z.enum(['hotel', 'events', 'general']).default('general'),
        }),
        execute: async ({ query, focus }) => {
          if (!TAVILY_API_KEY) {
            return {
              error: sys.tempError,
              results: [],
            }
          }

          const tavilyClient = tavily({ apiKey: TAVILY_API_KEY })

          if (allAllowedDomains.length === 0) {
            return {
              error: sys.tempError,
              results: [],
            }
          }

          const includeDomains =
            focus === 'hotel'
              ? hotelDomains
              : focus === 'events'
                ? municipalAndEventDomains.length > 0
                  ? municipalAndEventDomains
                  : allAllowedDomains
                : allAllowedDomains

          const response = await tavilyClient.search(query, {
            searchDepth: 'advanced',
            topic: focus === 'events' ? 'news' : 'general',
            maxResults: 5,
            includeAnswer: 'advanced',
            includeRawContent: 'text',
            includeDomains,
          })

          return {
            answer: response.answer ?? null,
            results: response.results.map((r) => ({
              title: r.title,
              url: r.url,
              content: r.content,
              publishedDate: r.publishedDate,
            })),
          }
        },
      },
    },
    stopWhen: stepCountIs(5),
  })

  return result.toUIMessageStreamResponse({
    onError: () => sys.tempError,
  })
}
