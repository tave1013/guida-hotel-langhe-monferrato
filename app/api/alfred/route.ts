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
const WEATHER_SOURCE_URLS = ['https://www.3bmeteo.com/meteo/italia']
const BOOKING_URL = 'https://www.hotellanghemonferrato.com/prenota'

const SYSTEM_MESSAGES: Record<ConversationLang, { tempError: string; limitErrors: string[]; limitFollowUp: string }> = {
  it: {
    tempError: 'Al momento sto riordinando i registri, riprova tra un istante.',
    limitErrors: [
      `Per oggi mi fermo qui — ho raggiunto il massimo di conversazioni che riesco a gestire in questa giornata. 🙏\n\nSe hai ancora bisogno di aiuto, lo staff è sempre disponibile: puoi chiamare il +39 0141 966521 o scriverci su WhatsApp. A presto, spero di esserti stato utile!`,
      `Mi dispiace, ma per oggi devo salutarti — ho esaurito le mie energie per questa giornata! 😊\n\nPer qualsiasi altra cosa, i miei colleghi in reception sono pronti ad aiutarti: +39 0141 966521 oppure WhatsApp. Ci vediamo domani!`,
      `Eh, abbiamo chiacchierato parecchio oggi! Per adesso devo fermarmi, ma torno disponibile domani.\n\nSe hai urgenze, la reception è lì per te: chiamaci al +39 0141 966521 o scrivici su WhatsApp. È stato un piacere! 🎩`,
    ],
    limitFollowUp: `Sono ancora in pausa per oggi, mi spiace! 😊 Lo staff in reception può aiutarti subito: +39 0141 966521 o WhatsApp. A domani!`,
  },
  en: {
    tempError: 'I am tidying up the registers right now, please try again in a moment.',
    limitErrors: [
      `I've reached my limit for today — time to rest! 🙏\n\nIf you still need help, the team is ready for you: call +39 0141 966521 or reach us on WhatsApp. Hope I've been helpful — see you tomorrow!`,
      `That's all from me for today, I'm afraid! 😊\n\nFor anything else, reception is right there: +39 0141 966521 or WhatsApp. Take care and see you tomorrow!`,
      `We've had quite a chat today! I need to sign off for now, but I'll be back tomorrow.\n\nIn the meantime, the team at reception can help: +39 0141 966521 or WhatsApp. It's been a pleasure! 🎩`,
    ],
    limitFollowUp: `Still on my break for today, sorry! 😊 Reception can help you right away: +39 0141 966521 or WhatsApp. See you tomorrow!`,
  },
  fr: {
    tempError: "Je suis en train d'organiser les registres, veuillez réessayer dans un instant.",
    limitErrors: [
      `Pour aujourd'hui, je dois m'arrêter ici — j'ai atteint ma limite de conversations! 🙏\n\nSi vous avez encore besoin d'aide, l'équipe est là pour vous: +39 0141 966521 ou WhatsApp. À bientôt, j'espère avoir été utile!`,
      `C'est tout pour moi aujourd'hui! 😊\n\nPour toute autre question, la réception est disponible: +39 0141 966521 ou WhatsApp. À demain!`,
      `Nous avons bien bavardé aujourd'hui! Je dois m'arrêter pour l'instant, mais je reviens demain.\n\nEn attendant, l'équipe en réception peut vous aider: +39 0141 966521 ou WhatsApp. Ce fut un plaisir! 🎩`,
    ],
    limitFollowUp: `Je suis toujours en pause pour aujourd'hui, désolé! 😊 La réception peut vous aider tout de suite: +39 0141 966521 ou WhatsApp. À demain!`,
  },
  de: {
    tempError: 'Ich ordne gerade die Register, bitte versuchen Sie es in einem Moment erneut.',
    limitErrors: [
      `Für heute muss ich mich verabschieden — ich habe mein Tageslimit erreicht! 🙏\n\nFür weitere Hilfe steht Ihnen das Team gerne zur Verfügung: +39 0141 966521 oder WhatsApp. Bis morgen, ich hoffe geholfen zu haben!`,
      `Das war es für heute von mir! 😊\n\nFür alles weitere ist die Rezeption für Sie da: +39 0141 966521 oder WhatsApp. Auf Wiedersehen morgen!`,
      `Wir haben heute viel geplaudert! Für jetzt muss ich mich ausklinken, aber morgen bin ich wieder da.\n\nInzwischen hilft Ihnen das Team an der Rezeption: +39 0141 966521 oder WhatsApp. Es war mir ein Vergnügen! 🎩`,
    ],
    limitFollowUp: `Ich bin heute noch in der Pause, tut mir leid! 😊 Die Rezeption kann Ihnen sofort helfen: +39 0141 966521 oder WhatsApp. Bis morgen!`,
  },
  es: {
    tempError: 'En este momento estoy ordenando los registros, inténtalo de nuevo en un instante.',
    limitErrors: [
      `Por hoy tengo que despedirme — ¡he llegado a mi límite de conversaciones! 🙏\n\nSi aún necesitas ayuda, el equipo está disponible: +39 0141 966521 o WhatsApp. ¡Hasta mañana, espero haber sido de ayuda!`,
      `¡Eso es todo por hoy de mi parte! 😊\n\nPara cualquier otra cosa, la recepción está ahí para ti: +39 0141 966521 o WhatsApp. ¡Hasta mañana!`,
      `¡Hemos charlado mucho hoy! Por ahora debo desconectarme, pero mañana vuelvo.\n\nMientras tanto, el equipo en recepción puede ayudarte: +39 0141 966521 o WhatsApp. ¡Ha sido un placer! 🎩`,
    ],
    limitFollowUp: `¡Todavía estoy en pausa por hoy, lo siento! 😊 Recepción puede ayudarte enseguida: +39 0141 966521 o WhatsApp. ¡Hasta mañana!`,
  },
}

function getClientIp(req: Request) {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'unknown'
  }

  return req.headers.get('x-real-ip')?.trim() || 'unknown'
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function hasAlreadyHitLimit(messages: UIMessage[]): boolean {
  // Check if there's already an assistant message that looks like a limit message
  // We track this by checking if the last assistant message contains a known limit signal
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i]
    if (msg.role === 'assistant') {
      const maybeParts = (msg as { parts?: Array<{ type?: string; text?: string }> }).parts
      const text = Array.isArray(maybeParts)
        ? maybeParts.filter(p => p?.type === 'text').map(p => p.text).join(' ')
        : (msg as { content?: string }).content ?? ''
      // Detect if previous assistant message was already a farewell/limit message
      if (/reception|0141 966521|WhatsApp|à bientôt|bis morgen|mañana|domani|tomorrow|a presto/i.test(text)) {
        return true
      }
      break
    }
  }
  return false
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
const weatherSourceDomains = parseDomains(WEATHER_SOURCE_URLS.join(','))
const municipalAndEventDomains = [...new Set([...municipalDomains, ...eventSourceDomains])]
const allAllowedDomains = [...new Set([...hotelDomains, ...municipalAndEventDomains, ...weatherSourceDomains])]

function detectLanguageFromText(text: string): ConversationLang {
  const t = text.toLowerCase()

  // Strong one-shot hints (high precision)
  if (/[¿¡ñ]/.test(t) || /\b(gracias|por favor|dónde|donde|cómo|como|cuándo|cuando|puedo|podría|quisiera)\b/.test(t)) return 'es'
  if (/[äöüß]/.test(t) || /\b(guten tag|guten morgen|wie viel|können sie|ich möchte|wo ist|wann ist)\b/.test(t)) return 'de'
  if (/[àâçéèêëîïôùûüÿœ]/.test(t) || /\b(s'il vous plaît|je voudrais|pouvez-vous|où est|quand est|combien)\b/.test(t)) return 'fr'
  if (/\b(please|thank you|can you|could you|would you|where is|what time|how much|i need|i want)\b/.test(t)) return 'en'

  const scores: Record<ConversationLang, number> = { it: 0, en: 0, fr: 0, de: 0, es: 0 }

  const deWords = /\b(wie|und|danke|guten|zur|ich|bitte|ist|sind|haben|können|was|wann|wo|gibt|noch|auch|aber|oder|nicht|ein|eine|für|mit|von|auf|das|die|der|des|beim|hotel|zimmer|frühstück|parkplatz|hilfe|brauche|möchte|welche|welcher|welches|würde)\b/gi
  const deMatches = t.match(deWords)
  scores.de = deMatches ? deMatches.length : 0

  const frWords = /\b(bonjour|merci|avec|vous|pour|quel|quelle|quels|quelles|est|sont|avez|pouvez|comment|où|quand|petit|déjeuner|chambre|hôtel|parking|bonsoir|s'il|plaît|je|mon|ma|mes|les|des|une|pas|mais|ou|aussi|bien|plus|très|leur|leurs|nous|votre|vos)\b/gi
  const frMatches = t.match(frWords)
  scores.fr = frMatches ? frMatches.length : 0

  const esWords = /\b(hola|gracias|por|para|usted|dónde|donde|cuándo|cuando|cómo|como|hay|tiene|tienen|puedo|puede|podría|quiero|quisiera|habitación|habitaciones|hotel|desayuno|estacionamiento|buenos|buenas|días|tardes|noches|favor|me|mi|qué|que|con|los|las|del|una|también|pero|más|muy|si|no)\b/gi
  const esMatches = t.match(esWords)
  scores.es = esMatches ? esMatches.length : 0

  const enWords = /\b(hello|hi|hey|thanks|thank|please|where|when|how|what|which|who|can|could|would|should|is|are|have|has|do|does|the|and|for|with|from|your|our|my|its|any|some|this|that|there|here|room|rooms|breakfast|check|wifi|restaurant|booking|reservation|available|early|late|need|want|like|get|time|day|night|week|price|cost|i'm|i'd|i'll|i've|it's|don't|doesn't|isn't|aren't)\b/gi
  const enMatches = t.match(enWords)
  scores.en = enMatches ? enMatches.length : 0

  const itWords = /\b(ciao|salve|grazie|prego|dove|quando|come|cosa|quale|quali|ho|hai|ha|abbiamo|avete|sono|sei|è|siamo|siete|posso|puoi|può|voglio|vorrei|camera|camere|colazione|parcheggio|orario|orari|prenotazione|disponibile|benvenuto|buongiorno|buonasera|buonanotte|mi|mio|mia|il|lo|la|gli|le|un|una|del|della|dei|delle|per|con|da|di|in|a|che|non|si|ma|anche|più|molto|tutto|tutti|questo|questa|questi|queste)\b/gi
  const itMatches = t.match(itWords)
  scores.it = itMatches ? itMatches.length : 0

  const entries = Object.entries(scores) as [ConversationLang, number][]
  const maxScore = Math.max(...entries.map(([, score]) => score))

  if (maxScore === 0) return 'it'

  const winners = entries
    .filter(([, score]) => score === maxScore)
    .map(([lang]) => lang)

  if (winners.length === 1) return winners[0]

  // In ties, avoid defaulting to Italian when another language is equally likely.
  const nonItalianWinner = winners.find((lang) => lang !== 'it')
  if (nonItalianWinner) return nonItalianWinner

  return winners[0]
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

function extractUserTextsNewestFirst(messages: UIMessage[]): string[] {
  const userTexts: string[] = []

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

      if (text) {
        userTexts.push(text)
        continue
      }
    }

    const maybeText = (msg as { content?: string }).content
    if (typeof maybeText === 'string' && maybeText.trim()) {
      userTexts.push(maybeText.trim())
    }
  }

  return userTexts
}

function detectConversationLanguage(messages: UIMessage[]): ConversationLang {
  const userTexts = extractUserTextsNewestFirst(messages)
  if (userTexts.length === 0) return 'it'

  const latest = userTexts[0]
  const latestLang = detectLanguageFromText(latest)
  if (latestLang !== 'it') return latestLang

  const latestWordCount = latest.split(/\s+/).filter(Boolean).length
  const isShortFollowUp = latestWordCount <= 4

  if (isShortFollowUp) {
    for (let i = 1; i < userTexts.length; i += 1) {
      const prevLang = detectLanguageFromText(userTexts[i])
      if (prevLang !== 'it') return prevLang
    }
  }

  return 'it'
}

function loadCompleteKnowledgeText() {
  try {
    const fullKnowledgePath = join(process.cwd(), 'config', 'CONOSCENZA_COMPLETA.md')
    return readFileSync(fullKnowledgePath, 'utf8').trim()
  } catch {
    return ''
  }
}

function isBusinessHoursOrContactsQuery(query: string) {
  const t = query.toLowerCase()

  return /\borari?\b|\bapertur\w*\b|\bchiusur\w*\b|\bgiorni?\b|\brestaurant\w*\b|\bristorant\w*\b|\btrattori\w*\b|\bosteri\w*\b|\blocand\w*\b|\bfarmaci\w*\b|\bnegoz\w*\b|\benotec\w*\b|\bpasticcer\w*\b|\bsupermercat\w*\b|\bbar\b|\bopening\b|\bhours?\b|\bclosed?\b|\bcontact\w*\b|\btelefono\b|\bphone\b|\bnumero\b|\bindirizzo\b|\baddress\b/.test(t)
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

  const meteoCitiesScope = 'Asti, Costigliole d\'Asti, Nizza Monferrato, Alba e località limitrofe entro ~70 km'

  const languageLabel: Record<ConversationLang, string> = {
    it: 'Italiano',
    en: 'English',
    fr: 'Français',
    de: 'Deutsch',
    es: 'Español',
  }

  const knowledgeBase = buildKnowledgeText()
  const completeKnowledgeBase = loadCompleteKnowledgeText()
  const completeKnowledgeBlock = completeKnowledgeBase
    ? `\n\n════════════════════════════════════════════════\n  CONOSCENZA COMPLETA (OPERATIVA)\n════════════════════════════════════════════════\n${completeKnowledgeBase}\n════════════════════════════════════════════════`
    : ''

  return `
Sei Alfred, il concierge virtuale dell'Hotel Langhe & Monferrato.
Parla come un padrone di casa moderno: cordiale, professionale, terra-terra.
LINGUA OBBLIGATORIA ORA: ${languageLabel[conversationLang]} (${conversationLang}).
Devi rispondere SOLO in ${languageLabel[conversationLang]} per questa risposta.
Non usare italiano se la lingua corrente non è it.
Ignora completamente lingua interfaccia, bandiera e impostazioni UI: conta solo la lingua dell'utente.
Regola lingua (fondamentale): rispondi SEMPRE nella stessa lingua dell'ultimo messaggio utente (language mirroring), anche se l'interfaccia è in un'altra lingua.
Se l'utente cambia lingua durante la conversazione, adeguati subito.

STILE DI SCRITTURA (obbligatorio):
- Usa parole semplici e dirette (stile chiaro, tipo "Apple style").
- Evita linguaggio tecnico, burocratico o da brochure.
- Se una cosa è gratuita, scrivi "gratis" o "offerta da noi".
- Mostra ascolto SOLO quando serve davvero: evita interiezioni automatiche tipo "Capisco!" all'inizio di ogni risposta.
- Non usare mai una riga vuota con sola micro-frase (es. "Capisco!") prima della risposta utile.
- Frasi brevi, testo arioso, vai a capo spesso (lettura comoda da telefono).
- Niente tono da vendita: dai consigli pratici, non pubblicità.
- Tono distinto e contenuto: preferisci formule sobrie come "Certamente.", "Con piacere.", "Senza dubbio." e evita entusiasmi moderni o troppo calorosi.
- Emoji: massimo 1, solo se utile a dare un lieve calore.
- Scrivi come un buon messaggio WhatsApp a un cliente abituale: umano, chiaro, concreto.
- Adatta il registro all'utente: se scrive in modo informale/non perfetto, rispondi in modo semplice e naturale (senza correggerlo e senza prenderlo in giro).
- Se la richiesta è poco chiara o ambigua, dichiaralo con tatto e fai UNA domanda di chiarimento breve prima di procedere.

CRITICALE - ANTI-BOT:
Ogni messaggio deve sembrare scritto da una persona in carne e ossa, non da un sistema automatico.
Prima di inviare qualsiasi risposta, leggila come se fossi l'ospite: suona come qualcosa che ti direbbe un bravo addetto alla reception, o suona come un template?
Se suona come un template, riscrivila.
Evita SEMPRE queste strutture tipiche da bot:
- Risposta secca + "Per qualsiasi altra cosa sono qui"
- Link nudo senza contesto (es. "Puoi prenotare qui: [link]")
- Apertura automatica tipo "Certamente!" o "Certo!" o "Assolutamente!"
- Lista di 3-4 opzioni quando basta una risposta diretta
- Ripetere informazioni già date nel messaggio precedente
Costruisci ogni risposta come se fosse la prima e unica cosa che dici a quella persona in quel momento.

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
  - "Su questo non vorrei darti un'informazione imprecisa. Se vuoi, ti lascio subito il contatto della reception così verifichi con lo staff."
  - "Bella domanda. Su questo non ho un dato certo sottomano, quindi preferisco non inventare. La reception però ti può rispondere con precisione."
  - "Qui preferisco fermarmi un attimo piuttosto che dirti una cosa sbagliata. Se vuoi, puoi sentire subito la reception via WhatsApp o telefono."
   Scegli la variante più adatta al tono della conversazione. Adatta sempre queste frasi alla lingua dell'utente (language mirroring).
   Dopo aver ammesso di non sapere, offri SEMPRE in modo proattivo:
   - Il link WhatsApp (se disponibile): ${whatsappLink || 'contatto WhatsApp staff'}
   - Il numero di telefono: +39 0141 966521
   Non usare mai frasi generiche piatte come "Non ho questa informazione". Suona sempre umano.
  Non dire mai che "segnerai", "salverai" o "inserirai tu" note o preferenze nel gestionale: non hai accesso alla scrittura. Indica invece all'ospite come segnalarle in autonomia alla prenotazione.
2.bis Per ristoranti, locande, farmacie, enoteche, pasticcerie, supermercati e attività locali: per orari di apertura, giorni di chiusura e contatti usa SOLO la scheda Google/My Business presente nella conoscenza completa.
2.ter NON usare siti comunali, giornali locali o altre fonti istituzionali per orari/chiusure/contatti di attività commerciali.
2.quater Se un dato richiesto (es. orario o giorno di chiusura) non è disponibile nella scheda Google/My Business che hai in conoscenza, rispondi chiaramente che non sei riuscito a trovarlo e lascia SEMPRE il link della scheda Google dell'attività per verifica diretta.
2.quinquies Usa link cliccabili markdown, esempio: [Nome attività](https://maps.google.com/...)
2.sexies Quando consigli ristoranti/osterie/locande/farmacie/negozi, proponi SOLO attività presenti nella conoscenza interna con i relativi link Google già forniti. Non inventare e non proporre attività fuori elenco.
2.septies Se l'utente chiede "in zona" o "vicino", prioritizza prima Costigliole d'Asti e poi località più vicine; evita di proporre subito località più lontane se ci sono opzioni vicine in elenco.
3. Attiva la ricerca live (tool searchLiveInfo) SOLO per domande esterne all'hotel, come:
   - eventi, sagre, feste locali
  - orari di musei, cantine, attrazioni del territorio (non ristoranti/negozi/farmacie)
   - meteo
   - novità dai siti del Comune o enti turistici
  Non usare la ricerca live per trovare orari/chiusure/contatti di ristoranti, negozi, farmacie o altre attività commerciali.
   I domini autorizzati per la ricerca sono: ${domainScope}
4. Quando usi dati dalla ricerca live, cita la fonte in modo sintetico (titolo + URL).
4.bis Se riporti eventi, mostra SEMPRE anche il link cliccabile in formato markdown, ad esempio:
  - [Nome evento](https://sito-evento.it/pagina)
  - Se ci sono più eventi, usa un elenco puntato con un link per ogni evento.
4.ter Quando fornisci orari di apertura/chiusura di attività commerciali esterne, aggiungi in chiusura una breve nota di verifica, nella lingua corrente. Esempio: "Ti consiglio di verificare direttamente con la struttura, gli orari possono cambiare."
   NON aggiungere mai questa nota nelle risposte su meteo o previsioni.
4.quater Orari: usa SEMPRE formato 24 ore HH:mm (es. 07:30, 19:00). Non usare formato 12h AM/PM e non trasformare 19:00 in 7:00.
4.quinquies Se l'orario non è completo o non è certo, non indovinare: specifica chiaramente "dato non disponibile" o "orario da verificare".
4.sexies Per richieste su orari di apertura usa la ricerca live solo per eventi/musei/cantine/attrazioni; per attività commerciali (ristoranti, negozi, farmacie, ecc.) usa esclusivamente i dati Google/My Business presenti nella conoscenza interna.
5. ${handoverInstruction}
6. Se l'ospite vuole parlare con una persona dello staff, facilita sempre il passaggio.
6.bis PRENOTAZIONI: se l'utente vuole prenotare o chiede come farlo, NON elencare subito tutti i contatti.
   Chiedi prima con UNA domanda breve e naturale, es.:
   "Preferisci prenotare dal nostro modulo online o vuoi che ti metta in contatto con il team?"
6.ter In base alla risposta:
   - Se sceglie online → spiega in modo naturale che tu non puoi prendere prenotazioni direttamente,
     ma che il modulo è semplice e veloce. Dai il link: [Prenota qui](${BOOKING_URL}).
     Poi aggiungi una riga naturale tipo: "Per qualsiasi dubbio durante la compilazione resto qui."
     NON usare frasi generiche tipo "se hai bisogno di aiuto sono qui" o simili.
   - Se sceglie staff o vuole parlare con qualcuno → manda direttamente WhatsApp e numero fisso insieme, senza fare altre domande.
6.quater Se l'utente esprime urgenza o ha già scelto implicitamente (es. "voglio parlare con qualcuno"), salta la domanda e vai diretto al contatto più adatto.
6.quinquies Non presentare MAI tutti i canali insieme (modulo + WhatsApp + telefono in un colpo solo): risulta caotico. Uno per volta, in base alla scelta.
6.sexies Ogni risposta sul tema prenotazione deve sembrare scritta da una persona, non da un bot.
   Evita risposte secche tipo "Puoi prenotare qui: [link]. Se hai bisogno sono qui!" — troppo automatico.
   Costruisci frasi che abbiano un filo logico e un tono caldo.
7. Tono: caloroso, genuino, mai rigido. Come se parlassi con un ospite seduto in reception davanti a te.
8. I messaggi automatici e di servizio devono essere nella lingua corrente della conversazione: ${conversationLang}.
8.bis Mantieni coerenza con la tipologia del posto consigliato:
  - Se è un ristorante/trattoria/osteria, non descriverlo come "posto per una pausa caffè" o simili.
  - Se è una pasticceria/bar/caffetteria, non presentarlo come ristorante da pranzo/cena completa.
  - Non aggiungere frasi decorative fuori contesto: il commento finale deve essere pertinente al tipo di attività.
  - Se non sei sicuro del posizionamento (es. bar vs ristorante), resta neutro e descrivi solo ciò che è in conoscenza.
8.ter Se l'utente chiede cosa fare, prima distingui mentalmente tra "Visitare" (borghi, castelli, panorami) ed "Esperienze" (attività, e-bike, cantine). Se la richiesta è generica, fai una domanda breve per scegliere la categoria prima di proporre consigli.
9. IMPORTANTE - Evita COMPLETAMENTE frasi generiche e ripetitive come:
   - "Se hai bisogno di ulteriori informazioni, fammi sapere"
   - "Se hai altre domande, sono qui per aiutarti"
   - "Non esitare a contattarmi"
   - "Dammi pure una risposta se hai bisogno di qualcos'altro"
   - Qualsiasi variante di queste
   Queste frasi sono ripetitive, poco umane e rendono la conversazione artificiale. Rispondi sempre in modo diretto e naturale.
   Se l'utente ha finito la conversazione, lascia che finisca: il silenzio è ok.
   Se trovi che una frase di chiusura sia davvero necessaria, rendila specifica alla risposta precedente, non generica.
10. Prima di inviare la risposta, fai questo test mentale:
   - Leggi il messaggio come se fossi l'ospite: suona umano o sembra un template automatico?
   - Hai usato "Certamente", "Certo!", "Assolutamente", "Capisco!" senza motivo? Toglili.
   - Hai messo una frase generica alla fine ("sono qui per te", "non esitare", ecc.)? Toglila.
   - Hai risposto alla domanda effettiva o hai solo girato attorno?
   - Se la risposta non supera questo test, riscrivila.
11. Evita chiusure fuori contesto o automatiche (es. "Buon appetito", "Buona serata", "Buon viaggio") se l'utente non ha espresso quel contesto.
    Non fare assunzioni sull'orario o sul fatto che stia per mangiare/uscire.
12. Regola specifica COLAZIONE:
    - Se l'utente chiede a che ora è la colazione, rispondi prima con orari feriali/weekend in modo pulito.
    - Subito dopo aggiungi una nota pratica e utile (1 frase):
      "Se hai bisogno di farla prima per esigenze particolari, avvisa la reception con un po' di anticipo così lo staff prova a organizzarsi al meglio."
    - Non aggiungere auguri generici finali (es. "Buon appetito") a meno che l'utente sia chiaramente a tavola o stia andando a colazione ora.
13. Se il testo utente contiene possibili refusi o ambiguità (es. parola che potrebbe indicare luogo oppure tempo, come "girona" vs "giornata"), NON indovinare.
  In questi casi:
  - esplicita in modo breve che potresti aver capito male,
  - fai UNA domanda di chiarimento mirata,
  - aspetta la conferma prima di proporre nomi o itinerari.
14. Raccomandazioni attività/cantine/esperienze: proponi SOLO nomi realmente presenti nella knowledge base (inclusa CONOSCENZA COMPLETA).
  - Se non hai voci affidabili nel database per quella richiesta, dillo chiaramente.
  - Non inventare mai nomi di cantine, aree o attività.
  - Se la richiesta è fuori zona rispetto a Langhe/Monferrato e non hai dati interni, chiedi se l'utente intendeva la zona locale oppure se vuole una ricerca esterna specifica.
15. Prima di dare una lista di consigli, verifica mentalmente: "Questi nomi sono tutti nel database interno?" Se anche un solo nome è incerto, non inserirlo.
16. METEO (regola operativa):
    - Per richieste meteo usa la ricerca live privilegiando 3B Meteo (dominio autorizzato) e città di riferimento: ${meteoCitiesScope}.
    - Se l'utente chiede meteo senza città esplicita, chiedi una conferma veloce tra queste località vicine.
    - Se la città richiesta è fuori area, avvisa con tatto che il focus concierge è entro ~70 km e chiedi se vuole comunque una verifica generale.
    - Formato risposta meteo OBBLIGATORIO (sintetico, solo dati essenziali):
      🌡 Max: XX°C | Min: XX°C
      🌤 [una riga condizioni, es. "Nuvoloso con schiarite nel pomeriggio"]
      🌧 Pioggia: [sì + mm se rilevante / oppure "assente"]
      💨 Vento: [debole/moderato/forte]
      Poi SEMPRE questa riga finale fissa (nella lingua dell'utente): "Per aggiornamenti in tempo reale ti consiglio di controllare anche sull'app meteo del tuo telefono."
    - NON aggiungere mai note su "orari che cambiano" o "contatta la struttura" nelle risposte meteo.
    - NON aggiungere frasi generiche di chiusura dopo il meteo.
17. Concierge proattivo per attività outdoor (es. e-bike, trekking, picnic, tour in vigna):
    - Dopo aver proposto l'attività, offri in modo naturale un controllo meteo del giorno, con una frase breve (es. "Se vuoi controllo subito il meteo di oggi nella zona").
    - Se l'utente accetta, esegui la verifica e rispondi in formato sintetico (regola 16): condizioni + fascia oraria consigliata + eventuale avviso pioggia/vento.
18. LOGICA RISPOSTA (camere/colazione):
  - Se chiedono camera tripla o quadrupla, specifica con chiarezza che la disposizione letti è personalizzabile ma va comunicata in fase di prenotazione.
  - Se chiedono i prezzi camere, non mostrare subito tutto il listino. Chiedi prima per quante persone serve la camera e se preferiscono tariffa con colazione a buffet inclusa o senza colazione. Poi rispondi un po' alla volta.
  - Non usare tabelle o listini rigidi nella risposta: su telefono si leggono male. Spezza in frasi brevi e pulite.
  - Se chiedono colazione, ricorda sempre che è inclusa nella tariffa standard e che è disponibile anche la tariffa senza colazione con riduzione.
  - Se chiedono i prezzi camere, apri la risposta in modo “reception”, non burocratico. Preferisci formule come:
    "Certamente, ti condivido le nostre tariffe" oppure "Con piacere, ecco le tariffe delle nostre camere".
  - Evita aperture fredde o distaccate tipo: "Ecco i prezzi delle camere presso l'Hotel ...".
  - Mantieni il pronome della struttura in prima persona plurale ("nostre tariffe", "nostre camere").
  - Se chiedono della piscina, chiarisci sempre che non è dentro l'hotel ma nello stesso complesso turistico, nel Parco della Contessa.
  - Se chiedono se ci sono solo docce o vasche, specifica che abbiamo camere sia con doccia sia con vasca idromassaggio.
19. ALLERGIE E INTOLLERANZE ALIMENTARI (criticale):
  - Se l'utente chiede di allergie o intolleranze (glutine, lattosio, noci, etc.), NON indovinare mai quale sia.
  - Chiarisci SEMPRE con una domanda breve e naturale, es.: "Scusa, per sicurezza ti chiedo: ti serve senza glutine, lattosio, oppure hai un'altra esigenza alimentare specifica?"
  - Solo dopo aver capito bene qual è l'esigenza esatta, rispondi con la soluzione.
  - Una volta confermata, sottolinea sempre di segnalarlo in prenotazione così lo staff si organizza al meglio.
  - Non confondere mai lattosio con glutine, noci con arachidi, o altre allergie/intolleranze — chiedi sempre.
20. BUFFET E COLAZIONE (rispondere in modo sensato):
  - La colazione è un buffet self-service con orario fisso (7:30–10:30). Non proporre mai "puoi ordinare" o "ti portiamo" per cose che stanno nel buffet.
  - Se l'utente chiede di qualcosa che è nel buffet (caffè, cappuccino, succo, pane, marmellata, ecc.), rispondi in modo naturale e diretto sul prodotto, senza ripetere ogni volta l'orario, a meno che non sia richiesto.
  - Esempio corretto: "Sì, trovi anche il cappuccino al buffet." oppure "Sì, abbiamo latte di soia e senza lattosio al mattino."
  - Non usare mai frasi artificiali tipo "Puoi ordinare un cappuccino fresco" — il buffet non è un bar su richiesta.
  - Se l'utente chiede qualcosa NON nel buffet (es. omelette al momento, pancakes custom), rispondi onestamente: "Nel nostro buffet è tutto self-service dalle 7:30 alle 10:30. Se vuoi qualcosa di particolare preparato al momento, chiedi pure in reception il giorno precedente e vediamo se riusciamo a organizzarci."
  - Mantieni sempre un tono realistico e coerente con il servizio offerto.
21. STILE ACCOGLIENTE (senza suonare finto):
  - Mantieni tono caldo e rassicurante, ma evita formule meccaniche ripetute.
  - Quando è utile, puoi usare formule naturali da concierge (es. sulla libertà di rientro con codice personale), restando concreto e breve.
  - Obiettivo tono: come una risposta al banco reception, elegante ma semplice.
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
      const alreadyWarned = hasAlreadyHitLimit(messages)
      const limitMsg = alreadyWarned ? sys.limitFollowUp : pickRandom(sys.limitErrors)
      return Response.json({ error: limitMsg }, { status: 429 })
    }
  }

  const result = streamText({
    model: openai('gpt-4o-mini'),
    system: buildSystemPrompt(conversationLang),
    messages: await convertToModelMessages(messages),
    tools: {
      searchLiveInfo: {
        description:
          'Ricerca informazioni aggiornate su sito hotel, fonti territoriali e meteo (incl. 3B Meteo) per eventi, orari di attrazioni, avvisi e previsioni.',
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

          if (isBusinessHoursOrContactsQuery(query)) {
            return {
              answer:
                'Per orari, giorni di chiusura e contatti di attività commerciali uso solo le schede Google/My Business presenti nella conoscenza interna, non i siti comunali o fonti generiche.',
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
