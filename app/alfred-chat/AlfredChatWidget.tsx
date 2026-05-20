'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type TouchEvent,
} from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'

// ─── Types ────────────────────────────────────────────────────────────────────

type ChatPart = { type?: string; text?: string }
type ChatMessage = {
  id: string
  role: string
  parts?: ChatPart[]
  content?: string
}
type ConversationLang = 'it' | 'en' | 'fr' | 'de' | 'es'
type ImageItem = { alt: string; src: string }
type TextBlock = { type: 'text'; content: string }
type ImagesBlock = { type: 'images'; items: ImageItem[] }
type MessageBlock = TextBlock | ImagesBlock
type LightboxState = { images: ImageItem[]; index: number } | null

// ─── Constants ────────────────────────────────────────────────────────────────

const LOADING_TEXT: Record<ConversationLang, string> = {
  it: 'Alfred sta scrivendo...',
  en: 'Alfred is writing...',
  fr: "Alfred est en train d'écrire...",
  de: 'Alfred schreibt...',
  es: 'Alfred está escribiendo...',
}

const LINK_STYLE = {
  color: '#800020',
  textDecoration: 'underline',
  fontWeight: 600,
} as const

const TOKEN_REGEX =
  /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|((?:https?:\/\/|www\.)[^\s<]+)|([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})|(\+?\d[\d\s()./-]{7,}\d)/gi
const BOLD_REGEX = /\*\*(.+?)\*\*/g

// Matches absolute image URLs only (Alfred now always sends absolute URLs)
const IMAGE_MD_REGEX = /!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g

// Strips any partial/incomplete image markdown syntax that leaks during streaming
// e.g. "![Camera" or "![Camera](https://...partial" etc.
function cleanStreamingArtifacts(text: string): string {
  // Remove any incomplete image markdown (started but not closed)
  return text
    .replace(/!\[[^\]]*$/, '')                          // ![...  (open bracket, no close)
    .replace(/!\[[^\]]*\]\([^)]*$/, '')                 // ![...]( url not closed
    .replace(/!\[[^\]]*\]\((https?:\/\/[^\s)]+)\)/g, '') // fully matched images (already in blocks)
    .trimEnd()
}

const GRID_W = 244
const GRID_GAP = 3
const BOOKING_URL = 'https://www.hotellanghemonferrato.com/prenota'
const CHAT_STORAGE_KEY = 'alfred_widget_chat_v1'

function isBookingLink(href: string): boolean {
  try {
    const url = new URL(href)
    const host = url.hostname.replace(/^www\./, '')
    return host === 'hotellanghemonferrato.com' && url.pathname.startsWith('/prenota')
  } catch {
    return false
  }
}

function openBookingInSameTab(href: string) {
  try {
    window.parent.postMessage({ type: 'alfred-booking-open', url: href }, '*')
  } catch {
    // noop
  }

  try {
    window.top!.location.href = href
  } catch {
    window.location.href = href
  }
}

// ─── Text rendering ───────────────────────────────────────────────────────────

function cleanTrailingPunctuation(value: string) {
  return value.replace(/[),.;!?]+$/g, '')
}

function renderBoldText(value: string, keyPrefix: string): ReactNode[] {
  const output: ReactNode[] = []
  let lastIndex = 0
  let matchIndex = 0
  BOLD_REGEX.lastIndex = 0
  for (let m = BOLD_REGEX.exec(value); m; m = BOLD_REGEX.exec(value)) {
    if (m.index > lastIndex) output.push(value.slice(lastIndex, m.index))
    output.push(<strong key={`${keyPrefix}-b-${matchIndex++}`}>{m[1]}</strong>)
    lastIndex = m.index + m[0].length
  }
  if (lastIndex < value.length) output.push(value.slice(lastIndex))
  return output
}

function renderRichText(value: string): ReactNode[] {
  const output: ReactNode[] = []
  let lastIndex = 0
  let tokenIndex = 0
  TOKEN_REGEX.lastIndex = 0
  for (let m = TOKEN_REGEX.exec(value); m; m = TOKEN_REGEX.exec(value)) {
    if (m.index > lastIndex)
      output.push(...renderBoldText(value.slice(lastIndex, m.index), `text-${tokenIndex}`))
    const [fullMatch, markdownLabel, markdownUrl, rawUrl, rawEmail, rawPhone] = m
    const cleanedToken = cleanTrailingPunctuation(fullMatch)
    const trailing = fullMatch.slice(cleanedToken.length)
    const key = `token-${tokenIndex++}`
    if (markdownLabel && markdownUrl) {
      const href = cleanTrailingPunctuation(markdownUrl)
      const bookingLink = isBookingLink(href)
      output.push(
        <a
          key={key}
          href={href}
          target={bookingLink ? '_top' : '_blank'}
          rel={bookingLink ? undefined : 'noopener noreferrer'}
          style={LINK_STYLE}
          onClick={(e) => {
            if (!bookingLink) return
            e.preventDefault()
            openBookingInSameTab(href)
          }}
        >
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
    const trailingText = markdownLabel && markdownUrl ? trailing.replace(/^\)+/, '') : trailing
    if (trailingText) output.push(trailingText)
    lastIndex = m.index + fullMatch.length
  }
  if (lastIndex < value.length)
    output.push(...renderBoldText(value.slice(lastIndex), `tail-${tokenIndex}`))
  return output
}

// ─── Message parsing ──────────────────────────────────────────────────────────

function parseMessageBlocks(text: string): MessageBlock[] {
  const blocks: MessageBlock[] = []
  let lastIndex = 0
  let pendingImages: ImageItem[] = []
  IMAGE_MD_REGEX.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = IMAGE_MD_REGEX.exec(text)) !== null) {
    const before = text.slice(lastIndex, m.index).replace(/^\n+/, '').trimEnd()
    const cleanBefore = cleanStreamingArtifacts(before)
    if (cleanBefore) {
      if (pendingImages.length) {
        blocks.push({ type: 'images', items: pendingImages })
        pendingImages = []
      }
      blocks.push({ type: 'text', content: cleanBefore })
    }
    pendingImages.push({ alt: m[1], src: m[2] })
    lastIndex = m.index + m[0].length
  }
  if (pendingImages.length) blocks.push({ type: 'images', items: pendingImages })
  const tail = text.slice(lastIndex).replace(/^\n+/, '').trimEnd()
  // Strip any partial/leaked image markdown from the final text tail
  const cleanTail = cleanStreamingArtifacts(tail)
  if (cleanTail) blocks.push({ type: 'text', content: cleanTail })
  return blocks
}

// ─── Smart image grid ─────────────────────────────────────────────────────────

const CELL_STYLE: React.CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  borderRadius: 10,
  cursor: 'zoom-in',
}

const IMG_FILL: React.CSSProperties = {
  display: 'block',
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  userSelect: 'none',
}

function SmartImageGrid({
  items,
  onImageClick,
}: {
  items: ImageItem[]
  onImageClick: (images: ImageItem[], index: number) => void
}) {
  const MAX = 4
  const shown = items.slice(0, MAX)
  const overflow = items.length - MAX
  const half = Math.floor((GRID_W - GRID_GAP) / 2)

  if (shown.length === 1) {
    return (
      <div
        style={{ ...CELL_STYLE, width: GRID_W, height: 176, borderRadius: 12 }}
        onClick={() => onImageClick(items, 0)}
      >
        <img src={shown[0].src} alt={shown[0].alt} style={IMG_FILL} loading="eager" />
      </div>
    )
  }

  if (shown.length === 2) {
    return (
      <div style={{ display: 'flex', gap: GRID_GAP, width: GRID_W, height: 132 }}>
        {shown.map((item, i) => (
          <div key={i} style={{ ...CELL_STYLE, flex: 1, minWidth: 0, height: 132 }} onClick={() => onImageClick(items, i)}>
            <img src={item.src} alt={item.alt} style={IMG_FILL} loading="eager" />
          </div>
        ))}
      </div>
    )
  }

  if (shown.length === 3) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: GRID_GAP, width: GRID_W }}>
        <div style={{ ...CELL_STYLE, height: 148 }} onClick={() => onImageClick(items, 0)}>
          <img src={shown[0].src} alt={shown[0].alt} style={IMG_FILL} loading="eager" />
        </div>
        <div style={{ display: 'flex', gap: GRID_GAP, height: 108 }}>
          {shown.slice(1).map((item, i) => (
            <div
              key={i}
              style={{ ...CELL_STYLE, flex: 1, minWidth: 0, height: 108 }}
              onClick={() => onImageClick(items, i + 1)}
            >
              <img src={item.src} alt={item.alt} style={IMG_FILL} loading="eager" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // 2×2 (4 shown, overflow overlay on last)
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `${half}px ${half}px`,
        gridTemplateRows: `${half}px ${half}px`,
        gap: GRID_GAP,
        width: GRID_W,
      }}
    >
      {shown.map((item, i) => {
        const isLast = i === MAX - 1 && overflow > 0
        return (
          <div key={i} style={CELL_STYLE} onClick={() => onImageClick(items, i)}>
            <img src={item.src} alt={item.alt} style={IMG_FILL} loading="eager" />
            {isLast && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0,0,0,0.54)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 28,
                  fontWeight: 700,
                  borderRadius: 10,
                }}
              >
                +{overflow}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────

function navBtnStyle(side: 'left' | 'right'): React.CSSProperties {
  return {
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    color: '#fff',
    fontSize: 44,
    lineHeight: 1,
    cursor: 'pointer',
    padding: '16px 12px',
    flexShrink: 0,
    borderRadius: side === 'left' ? '0 8px 8px 0' : '8px 0 0 8px',
    userSelect: 'none',
  } as React.CSSProperties
}

function Lightbox({
  images,
  initialIndex,
  onClose,
}: {
  images: ImageItem[]
  initialIndex: number
  onClose: () => void
}) {
  const [index, setIndex] = useState(initialIndex)
  const touchStartX = useRef<number | null>(null)

  const prev = useCallback(
    () => setIndex((i) => (i > 0 ? i - 1 : images.length - 1)),
    [images.length],
  )
  const next = useCallback(
    () => setIndex((i) => (i < images.length - 1 ? i + 1 : 0)),
    [images.length],
  )

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, prev, next])

  // Ask parent iframe to go full screen
  useEffect(() => {
    try { window.parent.postMessage({ type: 'alfred-lightbox-open' }, '*') } catch (_) {}
    return () => {
      try { window.parent.postMessage({ type: 'alfred-lightbox-close' }, '*') } catch (_) {}
    }
  }, [])

  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }
  const handleTouchEnd = (e: TouchEvent) => {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 40) dx < 0 ? next() : prev()
    touchStartX.current = null
  }

  return (
    <div
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(0,0,0,0.93)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Close */}
      <button
        onClick={onClose}
        aria-label="Chiudi"
        style={{
          position: 'absolute',
          top: 14,
          right: 18,
          background: 'rgba(255,255,255,0.12)',
          border: 'none',
          color: '#fff',
          fontSize: 26,
          lineHeight: 1,
          cursor: 'pointer',
          zIndex: 2,
          borderRadius: 8,
          width: 40,
          height: 40,
        }}
      >
        ×
      </button>

      {/* Counter */}
      {images.length > 1 && (
        <div
          style={{
            position: 'absolute',
            top: 18,
            left: '50%',
            transform: 'translateX(-50%)',
            color: 'rgba(255,255,255,0.7)',
            fontSize: 13,
            zIndex: 2,
            whiteSpace: 'nowrap',
          }}
        >
          {index + 1} / {images.length}
        </div>
      )}

      {/* Image row with nav arrows */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          paddingTop: 48,
          paddingBottom: 8,
        }}
      >
        {images.length > 1 && (
          <button onClick={(e) => { e.stopPropagation(); prev() }} style={navBtnStyle('left')}>
            ‹
          </button>
        )}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 6px',
            overflow: 'hidden',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <img
            key={index}
            src={images[index].src}
            alt={images[index].alt}
            style={{
              maxWidth: '100%',
              maxHeight: '78vh',
              borderRadius: 10,
              objectFit: 'contain',
              boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
              userSelect: 'none',
              display: 'block',
            }}
          />
        </div>
        {images.length > 1 && (
          <button onClick={(e) => { e.stopPropagation(); next() }} style={navBtnStyle('right')}>
            ›
          </button>
        )}
      </div>

      {/* Dot indicators */}
      {images.length > 1 && (
        <div
          style={{ display: 'flex', gap: 7, paddingBottom: 22, paddingTop: 6 }}
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((_, i) => (
            <div
              key={i}
              onClick={() => setIndex(i)}
              style={{
                width: i === index ? 22 : 8,
                height: 8,
                borderRadius: 4,
                background: i === index ? '#fff' : 'rgba(255,255,255,0.32)',
                transition: 'width 0.2s, background 0.2s',
                cursor: 'pointer',
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMessageText(message: ChatMessage): string {
  const partsText = Array.isArray(message.parts)
    ? message.parts
        .filter((p) => p?.type === 'text' && typeof p?.text === 'string')
        .map((p) => p.text as string)
        .join(' ')
        .trim()
    : ''
  if (partsText) return partsText
  if (typeof message.content === 'string') return message.content.trim()
  return ''
}

function getLastUserText(messages: ChatMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const m = messages[i]
    if (m.role !== 'user') continue
    const text = getMessageText(m)
    if (text) return text
  }
  return ''
}

function detectLanguageFromText(text: string): ConversationLang {
  const t = text.toLowerCase()
  if (!t.trim()) return 'it'

  // Strong hints first
  if (/[¿¡ñ]/.test(t) || /\b(gracias|por favor|dónde|donde|cómo|como|cuándo|cuando|puedo|podría|quisiera)\b/.test(t)) return 'es'
  if (/[äöüß]/.test(t) || /\b(guten tag|guten morgen|wie viel|können sie|ich möchte|wo ist|wann ist)\b/.test(t)) return 'de'
  if (/[àâçéèêëîïôùûüÿœ]/.test(t) || /\b(s'il vous plaît|je voudrais|pouvez-vous|où est|quand est|combien)\b/.test(t)) return 'fr'
  if (/\b(please|thank you|can you|could you|would you|where is|what time|how much|i need|i want)\b/.test(t)) return 'en'

  const scores: Record<ConversationLang, number> = { it: 0, en: 0, fr: 0, de: 0, es: 0 }
  const patterns: Record<ConversationLang, RegExp> = {
    it: /\b(ciao|salve|grazie|camera|camere|colazione|prenotazione|orario|foto|hotel|albergo|per|con|senza|dove|quando|come)\b/gi,
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
  if (ordered[0][1] === 0) return 'it'
  return ordered[0][0]
}

// ─── Bubble styles ────────────────────────────────────────────────────────────

const BUBBLE_BASE: React.CSSProperties = {
  maxWidth: '88%',
  borderRadius: 16,
  lineHeight: 1.45,
  fontSize: 14,
  whiteSpace: 'pre-wrap',
  padding: '12px 14px',
}

const ALFRED_BUBBLE: React.CSSProperties = {
  ...BUBBLE_BASE,
  background: '#fff',
  color: '#2f2317',
  border: '1px solid #e1d2bf',
  boxShadow: '0 8px 24px rgba(30,17,10,0.08)',
}

const USER_BUBBLE: React.CSSProperties = {
  ...BUBBLE_BASE,
  background: '#6c4a2f',
  color: '#f5eee4',
  border: 'none',
  boxShadow: '0 8px 24px rgba(30,17,10,0.08)',
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AlfredChatWidget() {
  const [initialMessages] = useState<ChatMessage[]>(() => {
    try {
      const raw = localStorage.getItem(CHAT_STORAGE_KEY)
      if (!raw) return []
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) return []
      return parsed.filter((m) => m && (m.role === 'user' || m.role === 'assistant'))
    } catch {
      return []
    }
  })
  const [input, setInput] = useState('')
  const [avatarSrc, setAvatarSrc] = useState('/Alfred.webp')
  const [lightbox, setLightbox] = useState<LightboxState>(null)
  const endRef = useRef<HTMLDivElement>(null)

  const openLightbox = useCallback((images: ImageItem[], index: number) => {
    setLightbox({ images, index })
  }, [])
  const closeLightbox = useCallback(() => setLightbox(null), [])

  const { messages, sendMessage, status, error, setMessages, stop } = useChat({
    transport: new DefaultChatTransport({ api: '/api/alfred' }),
  })

  const isLoading = status === 'submitted' || status === 'streaming'

  const loadingText = useMemo(() => {
    const all = messages as ChatMessage[]
    const lastUserText = getLastUserText(all)
    const lang = detectLanguageFromText(lastUserText)
    return LOADING_TEXT[lang] ?? LOADING_TEXT.it
  }, [messages])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])


  useEffect(() => {
    if (!initialMessages.length) return
    setMessages(initialMessages as never)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages))
    } catch {
      // noop
    }
  }, [messages])

  const onSend = useCallback(() => {
    const text = input.trim()
    if (!text || isLoading) return
    sendMessage({ text })
    setInput('')
  }, [input, isLoading, sendMessage])

  const onStop = useCallback(() => {
    if (!isLoading) return
    stop()
  }, [isLoading, stop])

  const chatMessages = messages as ChatMessage[]

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
      {/* ── Header ── */}
      <header
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid #e1d2bf',
          background: 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexShrink: 0,
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
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, lineHeight: 1.05 }}>
            Alfred
          </div>
          <div style={{ fontSize: 12, opacity: 0.78 }}>
            Concierge virtuale • Hotel Langhe &amp; Monferrato
          </div>
        </div>
      </header>

      {/* ── Messages ── */}
      <section
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: '16px 14px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        {messages.length === 0 && (
          <article style={ALFRED_BUBBLE}>
            Benvenuto. Sono Alfred, il concierge dell&apos;Hotel Langhe &amp; Monferrato. Posso
            aiutarti con camere, servizi e consigli sul territorio, con piacere e discrezione.
          </article>
        )}

        {chatMessages.map((message) => {
          if (message.role !== 'assistant' && message.role !== 'user') return null
          const text = getMessageText(message)
          if (!text) return null
          const isUser = message.role === 'user'

          if (isUser) {
            return (
              <article key={message.id} style={{ alignSelf: 'flex-end', ...USER_BUBBLE }}>
                {renderRichText(text)}
              </article>
            )
          }

          const blocks = parseMessageBlocks(text)

          return (
            <div
              key={message.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                alignItems: 'flex-start',
              }}
            >
              {blocks.map((block, bi) =>
                block.type === 'text' ? (
                  <article key={bi} style={ALFRED_BUBBLE}>
                    {renderRichText(block.content)}
                  </article>
                ) : (
                  <div key={bi} style={{ alignSelf: 'flex-start', paddingLeft: 2 }}>
                    <SmartImageGrid items={block.items} onImageClick={openLightbox} />
                  </div>
                ),
              )}
            </div>
          )
        })}

        {isLoading && (
          <div
            style={{
              alignSelf: 'flex-start',
              fontSize: 13,
              opacity: 0.6,
              paddingLeft: 4,
              fontStyle: 'italic',
              color: '#5a3e2b',
            }}
          >
            {loadingText}
          </div>
        )}

        {error && (
          <article style={{ ...ALFRED_BUBBLE, fontSize: 13, lineHeight: 1.4 }}>
            In questo momento non riesco a completare la risposta. Ti invito a riprovare tra qualche
            istante.
          </article>
        )}

        <div ref={endRef} />
      </section>

      {/* ── Footer ── */}
      <footer
        style={{
          borderTop: '1px solid #e1d2bf',
          background: 'rgba(247,241,232,0.94)',
          backdropFilter: 'blur(6px)',
          padding: '10px 12px calc(10px + env(safe-area-inset-bottom, 0px))',
          flexShrink: 0,
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
                if (isLoading) {
                  onStop()
                } else {
                  onSend()
                }
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
            onClick={isLoading ? onStop : onSend}
            disabled={!isLoading && !input.trim()}
            aria-label={isLoading ? 'Interrompi risposta' : 'Invia messaggio'}
            title={isLoading ? 'Interrompi risposta' : 'Invia messaggio'}
            style={{
              border: 'none',
              background: !isLoading && !input.trim() ? '#cdb79b' : '#6c4a2f',
              color: '#f8f3ea',
              width: 40,
              height: 40,
              borderRadius: 12,
              cursor: !isLoading && !input.trim() ? 'not-allowed' : 'pointer',
              boxShadow: '0 6px 14px rgba(30,17,10,0.18)',
              fontSize: isLoading ? 0 : 18,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isLoading ? (
              <span
                aria-hidden="true"
                style={{
                  width: 13,
                  height: 13,
                  background: '#f8f3ea',
                  borderRadius: 3,
                  display: 'block',
                }}
              />
            ) : (
              '➤'
            )}
          </button>
        </div>
      </footer>

      {lightbox && (
        <Lightbox images={lightbox.images} initialIndex={lightbox.index} onClose={closeLightbox} />
      )}
    </main>
  )
}
