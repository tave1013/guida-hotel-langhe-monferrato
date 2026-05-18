'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'

type ChatPart = { type?: string; text?: string }

type ChatMessage = {
  id: string
  role: string
  parts?: ChatPart[]
  content?: string
}

type ConversationLang = 'it' | 'en' | 'fr' | 'de' | 'es'

const LOADING_TEXT: Record<ConversationLang, string> = {
  it: 'Alfred sta scrivendo...',
  en: 'Alfred is writing...',
  fr: "Alfred est in train d'écrire...",
  de: 'Alfred schreibt...',
  es: 'Alfred está escribiendo...',
}

const LINK_STYLE = {
  color: '#800020',
  textDecoration: 'underline',
  fontWeight: 600,
} as const

const TOKEN_REGEX = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|((?:https?:\/\/|www\.)[^\s<]+)|([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})|(\+?\d[\d\s()./-]{7,}\d)/gi
const BOLD_REGEX = /\*\*(.+?)\*\*/g

function cleanTrailingPunctuation(value: string) {
  return value.replace(/[),.;!?]+$/g, '')
}

function renderBoldText(value: string, keyPrefix: string): ReactNode[] {
  const output: ReactNode[] = []
  let lastIndex = 0
  let matchIndex = 0
  BOLD_REGEX.lastIndex = 0

  for (let match = BOLD_REGEX.exec(value); match; match = BOLD_REGEX.exec(value)) {
    if (match.index > lastIndex) {
      output.push(value.slice(lastIndex, match.index))
    }

    output.push(<strong key={`${keyPrefix}-b-${matchIndex++}`}>{match[1]}</strong>)
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < value.length) {
    output.push(value.slice(lastIndex))
  }

  return output
}

function renderRichText(value: string): ReactNode[] {
  const output: ReactNode[] = []
  let lastIndex = 0
  let tokenIndex = 0
  TOKEN_REGEX.lastIndex = 0

  for (let match = TOKEN_REGEX.exec(value); match; match = TOKEN_REGEX.exec(value)) {
    if (match.index > lastIndex) {
      output.push(...renderBoldText(value.slice(lastIndex, match.index), `text-${tokenIndex}`))
    }

    const [fullMatch, markdownLabel, markdownUrl, rawUrl, rawEmail, rawPhone] = match
    const cleanedToken = cleanTrailingPunctuation(fullMatch)
    const trailing = fullMatch.slice(cleanedToken.length)
    const key = `token-${tokenIndex++}`

    if (markdownLabel && markdownUrl) {
      const href = cleanTrailingPunctuation(markdownUrl)
      output.push(
        <a key={key} href={href} target="_blank" rel="noopener noreferrer" style={LINK_STYLE}>
          {markdownLabel}
        </a>,
      )
    } else if (rawUrl) {
      const normalized = cleanTrailingPunctuation(rawUrl)
      const href = normalized.startsWith('www.') ? `https://${normalized}` : normalized
      output.push(
        <a key={key} href={href} target="_blank" rel="noopener noreferrer" style={LINK_STYLE}>
          {normalized}
        </a>,
      )
    } else if (rawEmail) {
      const email = cleanTrailingPunctuation(rawEmail)
      output.push(
        <a key={key} href={`mailto:${email}`} target="_blank" rel="noopener noreferrer" style={LINK_STYLE}>
          {email}
        </a>,
      )
    } else if (rawPhone) {
      const phone = cleanTrailingPunctuation(rawPhone)
      const tel = phone.replace(/[^+\d]/g, '')
      output.push(
        <a key={key} href={`tel:${tel}`} target="_blank" rel="noopener noreferrer" style={LINK_STYLE}>
          {phone}
        </a>,
      )
    } else {
      output.push(...renderBoldText(cleanedToken, `fallback-${tokenIndex}`))
    }

    if (trailing) {
      output.push(trailing)
    }

    lastIndex = match.index + fullMatch.length
  }

  if (lastIndex < value.length) {
    output.push(...renderBoldText(value.slice(lastIndex), `tail-${tokenIndex}`))
  }

  return output
}

function getMessageText(message: ChatMessage): string {
  const partsText = Array.isArray(message.parts)
    ? message.parts
        .filter((part) => part?.type === 'text' && typeof part?.text === 'string')
        .map((part) => part.text as string)
        .join(' ')
        .trim()
    : ''

  if (partsText) return partsText
  if (typeof message.content === 'string') return message.content.trim()
  return ''
}

function detectLanguageFromText(text: string): ConversationLang {
  const t = text.toLowerCase()
  if (!t.trim()) return 'en'

  const scores: Record<ConversationLang, number> = { it: 0, en: 0, fr: 0, de: 0, es: 0 }

  const patterns: Record<ConversationLang, RegExp> = {
    it: /\b(ciao|grazie|camera|camere|colazione|prenotazione|orario|per|con|senza)\b/gi,
    en: /\b(hello|thanks|room|rooms|breakfast|booking|time|with|without|please)\b/gi,
    fr: /\b(bonjour|merci|chambre|petit[- ]déjeuner|réservation|horaire|avec|sans)\b/gi,
    de: /\b(hallo|danke|zimmer|frühstück|buchung|uhrzeit|mit|ohne)\b/gi,
    es: /\b(hola|gracias|habitación|desayuno|reserva|horario|con|sin)\b/gi,
  }

  ;(Object.keys(patterns) as ConversationLang[]).forEach((lang) => {
    const matches = t.match(patterns[lang])
    scores[lang] = matches ? matches.length : 0
  })

  const ordered = (Object.entries(scores) as [ConversationLang, number][]).sort((a, b) => b[1] - a[1])
  if (ordered[0][1] === 0) return 'en'
  return ordered[0][0]
}

export default function AlfredChatWidget() {
  const [input, setInput] = useState('')
  const [avatarSrc, setAvatarSrc] = useState('/Alfred.webp')
  const endRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: '/api/alfred' }),
  })

  const isLoading = status === 'submitted' || status === 'streaming'

  const loadingText = useMemo(() => {
    const allMessages = messages as ChatMessage[]
    for (let i = allMessages.length - 1; i >= 0; i -= 1) {
      const message = allMessages[i]
      if (message.role !== 'user' && message.role !== 'assistant') continue
      const text = getMessageText(message)
      if (!text) continue
      const lang = detectLanguageFromText(text)
      return LOADING_TEXT[lang] ?? LOADING_TEXT.en
    }
    return LOADING_TEXT.en
  }, [messages])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const welcomeText = useMemo(
    () =>
      'Benvenuto. Sono Alfred, il concierge dell’Hotel Langhe & Monferrato. Posso aiutarti con camere, servizi e consigli sul territorio, con piacere e discrezione.',
    [],
  )

  const onSend = () => {
    const text = input.trim()
    if (!text || isLoading) return
    sendMessage({ text })
    setInput('')
  }

  return (
    <main
      style={{
        height: '100dvh',
        width: '100%',
        background: 'linear-gradient(180deg, #f7f1e8 0%, #f2eadf 100%)',
        display: 'flex',
        flexDirection: 'column',
        color: '#2f2317',
      }}
    >
      <header
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid #e1d2bf',
          background: 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <img
          src={avatarSrc}
          alt="Alfred"
          onError={() => setAvatarSrc('/Alfred.webp')}
          style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            objectFit: 'cover',
            border: '1px solid #d8c4aa',
            boxShadow: '0 4px 12px rgba(30,17,10,0.15)',
            background: '#fff',
          }}
        />
        <div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, lineHeight: 1.05 }}>Alfred</div>
          <div style={{ fontSize: 12, opacity: 0.78 }}>Concierge virtuale • Hotel Langhe & Monferrato</div>
        </div>
      </header>

      <section
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: '16px 14px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {messages.length === 0 && (
          <article
            style={{
              alignSelf: 'flex-start',
              maxWidth: '88%',
              background: '#fff',
              border: '1px solid #e1d2bf',
              boxShadow: '0 8px 24px rgba(30,17,10,0.08)',
              borderRadius: 16,
              padding: '12px 14px',
              lineHeight: 1.45,
              fontSize: 14,
            }}
          >
            {welcomeText}
          </article>
        )}

        {(messages as ChatMessage[]).map((message) => {
          if (message.role !== 'assistant' && message.role !== 'user') return null
          const text = getMessageText(message)
          if (!text) return null

          const isUser = message.role === 'user'

          return (
            <article
              key={message.id}
              style={{
                alignSelf: isUser ? 'flex-end' : 'flex-start',
                maxWidth: '88%',
                background: isUser ? '#6c4a2f' : '#fff',
                color: isUser ? '#f5eee4' : '#2f2317',
                border: isUser ? 'none' : '1px solid #e1d2bf',
                boxShadow: '0 8px 24px rgba(30,17,10,0.08)',
                borderRadius: 16,
                padding: '12px 14px',
                lineHeight: 1.45,
                fontSize: 14,
                whiteSpace: 'pre-wrap',
              }}
            >
              {renderRichText(text)}
            </article>
          )
        })}

        {isLoading && (
          <div
            style={{
              alignSelf: 'flex-start',
              background: '#fff',
              border: '1px solid #e1d2bf',
              borderRadius: 16,
              padding: '9px 12px',
              boxShadow: '0 8px 24px rgba(30,17,10,0.08)',
              fontSize: 13,
              opacity: 0.85,
            }}
          >
            {loadingText}
          </div>
        )}

        {error && (
          <div
            style={{
              alignSelf: 'flex-start',
              background: '#fff',
              border: '1px solid #e1d2bf',
              borderRadius: 16,
              padding: '10px 12px',
              boxShadow: '0 8px 24px rgba(30,17,10,0.08)',
              fontSize: 13,
              lineHeight: 1.4,
            }}
          >
            In questo momento non riesco a completare la risposta. Ti invito a riprovare tra qualche istante.
          </div>
        )}

        <div ref={endRef} />
      </section>

      <footer
        style={{
          borderTop: '1px solid #e1d2bf',
          background: 'rgba(247,241,232,0.94)',
          backdropFilter: 'blur(6px)',
          padding: '10px 12px calc(10px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 8,
            border: '1px solid #dbc6ac',
            borderRadius: 15,
            background: '#fff',
            padding: 6,
            boxShadow: '0 6px 16px rgba(30,17,10,0.06)',
          }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                onSend()
              }
            }}
            rows={1}
            placeholder="Scrivi qui la tua richiesta…"
            style={{
              width: '100%',
              border: 'none',
              resize: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: 16,
              lineHeight: 1.35,
              padding: '7px 8px',
              color: '#2f2317',
              minHeight: 38,
              maxHeight: 120,
            }}
          />
          <button
            type="button"
            onClick={onSend}
            disabled={isLoading || !input.trim()}
            aria-label="Invia messaggio"
            style={{
              border: 'none',
              background: isLoading || !input.trim() ? '#cdb79b' : '#6c4a2f',
              color: '#f8f3ea',
              width: 40,
              height: 40,
              borderRadius: 12,
              cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
              boxShadow: '0 6px 14px rgba(30,17,10,0.18)',
              fontSize: 18,
            }}
          >
            ➤
          </button>
        </div>
      </footer>
    </main>
  )
}
