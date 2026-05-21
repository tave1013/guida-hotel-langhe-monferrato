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
import { BookingData, calculateBookingCosts, formatBookingSummary, formatBookingEmail, isBookingDataComplete, getNextBookingQuestion } from '@/app/lib/booking-manager'

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
type StoredChatPayload = { messages: ChatMessage[]; lastMessageAt: number }

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
  return text
    .replace(/!\[[^\]]*$/, '')
    .replace(/!\[[^\]]*\]\([^)]*$/, '')
    .replace(/!\[[^\]]*\]\((https?:\/\/[^\s)]+)\)/g, '')
    // Strip hidden booking JSON tag from visible output
    .replace(/<!--BOOKING_DATA:[\s\S]*?-->/g, '')
    .trimEnd()
}

const GRID_W = 244
const GRID_GAP = 3
const BOOKING_URL = 'https://www.hotellanghemonferrato.com/prenota'
const CHAT_STORAGE_KEY = 'alfred_widget_chat_v1'
const SESSION_TTL_MS = 12 * 60 * 60 * 1000
const BOOKING_STATE_KEY = 'alfred_booking_session_v1'

let NEXT_BOOKING_NUMBER = 1001

function getNextBookingNumber(): number {
  if (typeof window === 'undefined') return NEXT_BOOKING_NUMBER
  try {
    const stored = localStorage.getItem('alfred_next_booking_number')
    const num = stored ? parseInt(stored, 10) : NEXT_BOOKING_NUMBER
    const next = num + 1
    localStorage.setItem('alfred_next_booking_number', String(next))
    return num
  } catch {
    return NEXT_BOOKING_NUMBER++
  }
}

function saveBookingState(data: BookingData) {
  try {
    localStorage.setItem(BOOKING_STATE_KEY, JSON.stringify(data))
  } catch {
    // noop
  }
}

function loadBookingState(): BookingData | null {
  try {
    const raw = localStorage.getItem(BOOKING_STATE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function clearBookingState() {
  try {
    localStorage.removeItem(BOOKING_STATE_KEY)
  } catch {
    // noop
  }
}
function clearStoredChatSession() {
  try {
    localStorage.removeItem(CHAT_STORAGE_KEY)
  } catch {
    // noop
  }
}

function normalizeMessages(list: unknown): ChatMessage[] {
  if (!Array.isArray(list)) return []
  return list.filter((m) => m && (m.role === 'user' || m.role === 'assistant')) as ChatMessage[]
}

function loadStoredChatSession(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)

    // Backward compatibility with older payloads (array-only)
    if (Array.isArray(parsed)) {
      return normalizeMessages(parsed)
    }

    if (!parsed || typeof parsed !== 'object') return []
    const payload = parsed as Partial<StoredChatPayload>
    const lastMessageAt = typeof payload.lastMessageAt === 'number' ? payload.lastMessageAt : 0
    if (lastMessageAt > 0 && Date.now() - lastMessageAt > SESSION_TTL_MS) {
      clearStoredChatSession()
      return []
    }

    return normalizeMessages(payload.messages)
  } catch {
    return []
  }
}

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
  const normalized = value
    // Hide markdown heading syntax like ### Titolo
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    // Render markdown lists as plain bullets without showing raw '- '
    .replace(/^\s*[-*]\s+/gm, '• ')

  const output: ReactNode[] = []
  let lastIndex = 0
  let tokenIndex = 0
  TOKEN_REGEX.lastIndex = 0
  for (let m = TOKEN_REGEX.exec(normalized); m; m = TOKEN_REGEX.exec(normalized)) {
    if (m.index > lastIndex)
      output.push(...renderBoldText(normalized.slice(lastIndex, m.index), `text-${tokenIndex}`))
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
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          style={LINK_STYLE}
        >
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
  if (lastIndex < normalized.length)
    output.push(...renderBoldText(normalized.slice(lastIndex), `tail-${tokenIndex}`))
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
    return loadStoredChatSession()
  })
  const [input, setInput] = useState('')
  const [avatarSrc, setAvatarSrc] = useState('/Alfred.webp')
  const [lightbox, setLightbox] = useState<LightboxState>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showFeedbackScreen, setShowFeedbackScreen] = useState(false)
  const [hoverRating, setHoverRating] = useState<number | null>(null)
  const [selectedRating, setSelectedRating] = useState<number | null>(null)
  const [showThanks, setShowThanks] = useState(false)
  const [bookingData, setBookingData] = useState<BookingData | null>(() => loadBookingState())
  const [bookingStep, setBookingStep] = useState<'idle' | 'collecting' | 'reviewing' | 'sending' | 'sent'>('idle')
  const [showBookingSummary, setShowBookingSummary] = useState(false)
  const [bookingError, setBookingError] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const closeTimerRef = useRef<number | null>(null)

  const openLightbox = useCallback((images: ImageItem[], index: number) => {
    setLightbox({ images, index })
  }, [])
  const closeLightbox = useCallback(() => setLightbox(null), [])

  const { messages, sendMessage, status, error, setMessages, stop } = useChat({
    transport: new DefaultChatTransport({ api: '/api/alfred' }),
  })

  const isLoading = status === 'submitted' || status === 'streaming'

  const clearCurrentSession = useCallback(() => {
    setMessages([] as never)
    setInput('')
    clearStoredChatSession()
  }, [setMessages])

  const askCloseChat = useCallback(() => {
    setMenuOpen(false)
    if (isLoading) stop()
    setShowFeedbackScreen(true)
    setShowThanks(false)
    setHoverRating(null)
    setSelectedRating(null)
  }, [isLoading, stop])

  const finalizeAndCloseWidget = useCallback(() => {
    try {
      window.parent.postMessage({ type: 'alfred-close-panel' }, '*')
    } catch {
      // noop
    }
  }, [])

  const submitRating = useCallback(
    (value: number) => {
      const rounded = Math.max(0.5, Math.min(5, Math.round(value * 2) / 2))
      setSelectedRating(rounded)
      setHoverRating(null)
      setShowThanks(true)
      clearCurrentSession()

      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current)
      }
      closeTimerRef.current = window.setTimeout(() => {
        finalizeAndCloseWidget()
      }, 3000)
    },
    [clearCurrentSession, finalizeAndCloseWidget],
  )

  const submitBooking = useCallback(async () => {
    if (!bookingData || !isBookingDataComplete(bookingData)) {
      setBookingError('Dati prenotazione incompleti')
      return
    }
    setBookingError(null)
    setBookingStep('sending')
    try {
      const bookingNum = getNextBookingNumber()
      const costs = calculateBookingCosts(bookingData)
      const { subject, body } = formatBookingEmail(bookingData, costs, bookingNum)
      const response = await fetch('/api/send-booking-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'booking@hotellanghemonferrato.com',
          subject,
          body,
        }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Errore nell\'invio dell\'email')
      }
      setBookingStep('sent')
      setShowBookingSummary(false)
      // Update booking with confirmation details
      setBookingData((prev) =>
        prev
          ? { ...prev, confirmed: true, bookingNumber: bookingNum }
          : null
      )
      // Add success message to chat
      sendMessage({
        text: `✅ Prenotazione confermata! Numero prenotazione: ${bookingNum}. Riceverai un'email di conferma a breve.`,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Errore sconosciuto'
      setBookingError(msg)
      setBookingStep('reviewing')
    }
  }, [bookingData, sendMessage])

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
    const onClickOutside = (event: MouseEvent) => {
      if (!menuRef.current) return
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  useEffect(
    () => () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current)
      }
    },
    [],
  )

  useEffect(() => {
    try {
      const safeMessages = normalizeMessages(messages)
      if (!safeMessages.length) {
        clearStoredChatSession()
        return
      }
      const payload: StoredChatPayload = {
        messages: safeMessages,
        lastMessageAt: Date.now(),
      }
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(payload))
    } catch {
      // noop
    }
  }, [messages])

  useEffect(() => {
    if (bookingData) {
      saveBookingState(bookingData)
    }
  }, [bookingData])

  // Analyze assistant messages for booking data extraction
  useEffect(() => {
    const allMessages = messages as ChatMessage[]
    const lastAssistantMessage = allMessages
      .filter((m) => m.role === 'assistant')
      .pop()
    
    if (!lastAssistantMessage || bookingStep === 'reviewing' || bookingStep === 'sending' || bookingStep === 'sent') {
      return
    }

    const text = (lastAssistantMessage.content || '')
      .toLowerCase()
      .concat((lastAssistantMessage.parts?.[0]?.text || '').toLowerCase())

    // Check if Alfred is asking booking questions
    const bookingKeywords = [
      'prenotazione',
      'prenotare',
      'camere',
      'check-in',
      'check-out',
      'ospiti',
      'adulti',
      'bambini',
      'colazione',
      'late checkout',
      'animali',
      'pet',
      'numero di persone',
      'quantità di camere',
    ]

    const isBookingContext = bookingKeywords.some((kw) => text.includes(kw))

    if (isBookingContext && !bookingData) {
      // Initialize booking data if not already set
      setBookingData({
        adults: 0,
        children: 0,
        rooms: [],
        breakfast: 'esclusa',
        lateCheckout: false,
        petCount: 0,
        notes: '',
      })
      setBookingStep('collecting')
    }

    // Extract dates using regex patterns
    const datePattern = /(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/g
    const dates = text.match(datePattern) || []
    if (dates.length >= 1 && bookingData && !bookingData.checkIn) {
      // Try to extract dates in format DD/MM/YYYY
      const dateMatches = (lastAssistantMessage.content || '').match(
        /(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})/g
      )
      if (dateMatches && dateMatches.length > 0) {
        const parseDate = (dateStr: string) => {
          const parts = dateStr.split(/[/-]/)
          const day = parts[0].padStart(2, '0')
          const month = parts[1].padStart(2, '0')
          const year = parts[2].length === 2 ? '20' + parts[2] : parts[2]
          return `${year}-${month}-${day}`
        }
        if (dateMatches[0]) {
          setBookingData((prev) =>
            prev
              ? {
                  ...prev,
                  checkIn: parseDate(dateMatches[0]),
                }
              : null
          )
        }
        if (dateMatches[1]) {
          setBookingData((prev) =>
            prev
              ? {
                  ...prev,
                  checkOut: parseDate(dateMatches[1]),
                }
              : null
          )
        }
      }
    }

    // Extract numbers (for adults, children, rooms)
    const numberPattern = /(\d+)\s*(?:adulti?|persone|camere?|bambini?|notti?|animali?|pet)/gi
    let match
    while ((match = numberPattern.exec(text)) !== null) {
      const number = parseInt(match[1], 10)
      const context = match[0].toLowerCase()

      if (
        context.includes('adult') ||
        context.includes('persona') ||
        context.includes('ospite')
      ) {
        setBookingData((prev) =>
          prev ? { ...prev, adults: Math.max(prev.adults || 0, number) } : null
        )
      } else if (context.includes('bambin') || context.includes('child')) {
        setBookingData((prev) =>
          prev
            ? { ...prev, children: Math.max(prev.children || 0, number) }
            : null
        )
      } else if (context.includes('camera') || context.includes('room')) {
        setBookingData((prev) =>
          prev ? { ...prev, rooms: prev.rooms || [] } : null
        )
      } else if (context.includes('animale') || context.includes('pet')) {
        setBookingData((prev) =>
          prev ? { ...prev, petCount: Math.max(prev.petCount || 0, number) } : null
        )
      }
    }

    // Extract room types
    const roomTypes: Array<{ type: 'singola' | 'matrimoniale' | 'doppia' | 'tripla' | 'quadrupla' | 'suite'; count: number }> = []
    const roomTypePatterns = [
      { pattern: /(\d+)\s*singol/gi, type: 'singola' as const },
      { pattern: /(\d+)\s*matrimonial/gi, type: 'matrimoniale' as const },
      { pattern: /(\d+)\s*doppi/gi, type: 'doppia' as const },
      { pattern: /(\d+)\s*tripl/gi, type: 'tripla' as const },
      { pattern: /(\d+)\s*quadrupl/gi, type: 'quadrupla' as const },
      { pattern: /(\d+)\s*suit/gi, type: 'suite' as const },
    ]

    for (const { pattern, type } of roomTypePatterns) {
      let roomMatch
      while ((roomMatch = pattern.exec(text)) !== null) {
        const count = parseInt(roomMatch[1], 10)
        roomTypes.push({ type, count })
      }
    }

    if (roomTypes.length > 0 && bookingData && !bookingData.rooms?.length) {
      setBookingData((prev) =>
        prev ? { ...prev, rooms: roomTypes } : null
      )
    }

    // Check for breakfast mention
    if (/colazione|breakfast/.test(text) && bookingData) {
      if (/inclus|si|yes|prefer|vuole/.test(text)) {
        setBookingData((prev) =>
          prev ? { ...prev, breakfast: 'inclusa' } : null
        )
      }
    }

    // Check for late checkout
    if (/late\s*checkout|checkout\s*tard|check\s*out\s*tard/i.test(text)) {
      setBookingData((prev) =>
        prev ? { ...prev, lateCheckout: true } : null
      )
    }

    // If enough data collected, show summary
    if (
      bookingData &&
      bookingData.checkIn &&
      bookingData.checkOut &&
      bookingData.adults &&
      bookingData.rooms &&
      bookingData.rooms.length > 0 &&
      bookingStep === 'collecting' &&
      !showBookingSummary
    ) {
      // Calculate nights
      const checkIn = new Date(bookingData.checkIn)
      const checkOut = new Date(bookingData.checkOut)
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
      
      if (nights > 0) {
        setBookingData((prev) =>
          prev ? { ...prev, nights } : null
        )
        // Trigger summary display on next render
        setTimeout(() => {
          setShowBookingSummary(true)
          setBookingStep('reviewing')
        }, 500)
      }
    }
  }, [messages, bookingData, bookingStep, showBookingSummary])
  // Parse BOOKING_DATA JSON tag emitted by Alfred in booking-related responses
  useEffect(() => {
    if (bookingStep === 'sending' || bookingStep === 'sent') return

    const allMessages = messages as ChatMessage[]
    const lastAssistant = allMessages.filter((m) => m.role === 'assistant').pop()
    if (!lastAssistant) return

    const rawText =
      lastAssistant.content ||
      lastAssistant.parts?.map((p) => p.text || '').join('') ||
      ''

    const tagMatch = rawText.match(/<!--BOOKING_DATA:([\s\S]*?)-->/)
    if (!tagMatch) return

    let parsed: Partial<BookingData>
    try {
      parsed = JSON.parse(tagMatch[1])
    } catch {
      return
    }

    // Merge parsed data with existing, keeping non-null values only
    setBookingData((prev) => {
      const base: BookingData = prev ?? {
        adults: 0,
        children: 0,
        rooms: [],
        breakfast: 'esclusa',
        lateCheckout: false,
        petCount: 0,
        notes: '',
      }

      const merged: BookingData = {
        ...base,
        ...(parsed.checkIn ? { checkIn: parsed.checkIn } : {}),
        ...(parsed.checkOut ? { checkOut: parsed.checkOut } : {}),
        ...(parsed.nights != null ? { nights: parsed.nights } : {}),
        ...(parsed.adults != null && parsed.adults > 0 ? { adults: parsed.adults } : {}),
        ...(parsed.children != null ? { children: parsed.children } : {}),
        ...(parsed.rooms && parsed.rooms.length > 0 ? { rooms: parsed.rooms } : {}),
        ...(parsed.breakfast ? { breakfast: parsed.breakfast } : {}),
        ...(parsed.lateCheckout != null ? { lateCheckout: parsed.lateCheckout } : {}),
        ...(parsed.petCount != null ? { petCount: parsed.petCount } : {}),
        ...(parsed.name ? { name: parsed.name } : {}),
        ...(parsed.surname ? { surname: parsed.surname } : {}),
        ...(parsed.email ? { email: parsed.email } : {}),
        ...(parsed.phone ? { phone: parsed.phone } : {}),
        ...(parsed.arrivalTime ? { arrivalTime: parsed.arrivalTime } : {}),
        ...(parsed.notes ? { notes: parsed.notes } : {}),
      }

      // Recalculate nights if we have both dates
      if (merged.checkIn && merged.checkOut && !merged.nights) {
        const ci = new Date(merged.checkIn)
        const co = new Date(merged.checkOut)
        const n = Math.ceil((co.getTime() - ci.getTime()) / 86400000)
        if (n > 0) merged.nights = n
      }

      return merged
    })

    if (bookingStep === 'idle') setBookingStep('collecting')
  }, [messages, bookingStep])

  // Show summary overlay when all required fields are present
  useEffect(() => {
    if (
      bookingStep !== 'collecting' ||
      showBookingSummary ||
      !bookingData
    ) return

    const complete = isBookingDataComplete(bookingData)
    if (complete) {
      setTimeout(() => {
        setShowBookingSummary(true)
        setBookingStep('reviewing')
      }, 400)
    }
  }, [bookingData, bookingStep, showBookingSummary])

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
        position: 'relative',
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
        <div ref={menuRef} style={{ marginLeft: 'auto', position: 'relative' }}>
          <button
            type="button"
            aria-label="Apri menu chat"
            title="Apri menu chat"
            onClick={() => setMenuOpen((v) => !v)}
            style={{
              border: '1px solid #dbc6ac',
              background: '#fff',
              color: '#5a3e2b',
              width: 34,
              height: 34,
              borderRadius: 10,
              cursor: 'pointer',
              fontSize: 20,
              lineHeight: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ⋯
          </button>
          {menuOpen && (
            <div
              style={{
                position: 'absolute',
                top: 40,
                right: 0,
                background: '#fff',
                border: '1px solid #e1d2bf',
                borderRadius: 12,
                boxShadow: '0 10px 24px rgba(30,17,10,0.16)',
                minWidth: 190,
                zIndex: 30,
                padding: 6,
              }}
            >
              <button
                type="button"
                onClick={askCloseChat}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  border: 'none',
                  background: 'transparent',
                  color: '#5a3e2b',
                  borderRadius: 8,
                  padding: '10px 12px',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Chiudi chat e lascia un voto
              </button>
            </div>
          )}
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
                {text}
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

      {showBookingSummary && bookingData && (
        <section
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 40,
            background: 'linear-gradient(180deg, #f7f1e8 0%, #f2eadf 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 420,
              background: '#fff',
              border: '1px solid #e1d2bf',
              borderRadius: 18,
              boxShadow: '0 16px 36px rgba(30,17,10,0.16)',
              padding: '24px 18px',
            }}
          >
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, color: '#5a3e2b', marginBottom: 14 }}>
              📋 Riepilogo Prenotazione
            </div>

            {(() => {
              const costs = calculateBookingCosts(bookingData)
              return (
                <div style={{ fontSize: 14, color: '#3f2d1f', lineHeight: 1.7, marginBottom: 18 }}>
                  <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #e1d2bf' }}>
                    <strong>📅 Check-in:</strong> {bookingData?.checkIn}
                    <br />
                    <strong>📅 Check-out:</strong> {bookingData?.checkOut}
                    <br />
                    <strong>🌙 Notti:</strong> {bookingData?.nights}
                  </div>

                  <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #e1d2bf' }}>
                    <strong>👥 Ospiti:</strong> {bookingData?.adults} adulti
                    {(bookingData?.children ?? 0) > 0 && `, ${bookingData?.children} bambini`}
                    <br />
                    <strong>🚪 Camere:</strong> {bookingData?.rooms?.length ?? 0}
                    {(bookingData?.rooms?.length ?? 0) > 0 && ` (${bookingData?.rooms?.map(r => r.type).join(', ')})`}
                    {bookingData?.breakfast && (
                      <>
                        <br />
                        <strong>🍳 Colazione:</strong> Inclusa
                      </>
                    )}
                    {bookingData?.lateCheckout && (
                      <>
                        <br />
                        <strong>🕐 Late checkout:</strong> Richiesto
                      </>
                    )}
                    {(bookingData?.petCount ?? 0) > 0 && (
                      <>
                        <br />
                        <strong>🐾 Animali:</strong> {bookingData?.petCount}
                      </>
                    )}
                  </div>

                  <div
                    style={{
                      marginBottom: 12,
                      paddingBottom: 12,
                      borderBottom: '2px solid #d4cabd',
                      fontSize: 13,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span>Camere:</span>
                      <span>€{costs.roomsTotal.toFixed(2)}</span>
                    </div>
                    {costs.supplementsTotal > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span>Supplementi:</span>
                        <span>€{costs.supplementsTotal.toFixed(2)}</span>
                      </div>
                    )}
                    {costs.cityTaxTotal > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span>Tassa di soggiorno:</span>
                        <span>€{costs.cityTaxTotal.toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  <div style={{ fontSize: 16, fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                    <span>TOTALE:</span>
                    <span style={{ color: '#800020' }}>€{costs.grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              )
            })()}

            {bookingError && (
              <div
                style={{
                  background: '#fee2e2',
                  border: '1px solid #fecaca',
                  borderRadius: 8,
                  padding: '8px 12px',
                  marginBottom: 14,
                  fontSize: 13,
                  color: '#b91c1c',
                }}
              >
                ❌ {bookingError}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button
                type="button"
                onClick={() => {
                  setShowBookingSummary(false)
                  setBookingStep('collecting')
                }}
                disabled={bookingStep === 'sending'}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  border: '1px solid #d4cabd',
                  background: '#f7f1e8',
                  borderRadius: 8,
                  cursor: bookingStep === 'sending' ? 'not-allowed' : 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#5a3e2b',
                  opacity: bookingStep === 'sending' ? 0.5 : 1,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (bookingStep !== 'sending') {
                    e.currentTarget.style.background = '#ede1d0'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f7f1e8'
                }}
              >
                ✏️ Modifica
              </button>
              <button
                type="button"
                onClick={submitBooking}
                disabled={bookingStep === 'sending'}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  border: 'none',
                  background: bookingStep === 'sending' ? '#d4cabd' : '#800020',
                  borderRadius: 8,
                  cursor: bookingStep === 'sending' ? 'not-allowed' : 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#fff',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (bookingStep !== 'sending') {
                    e.currentTarget.style.background = '#600015'
                  }
                }}
                onMouseLeave={(e) => {
                  if (bookingStep !== 'sending') {
                    e.currentTarget.style.background = '#800020'
                  }
                }}
              >
                {bookingStep === 'sending' ? '📤 Invio...' : '✅ Confermo'}
              </button>
            </div>
          </div>
        </section>
      )}

      {showFeedbackScreen && (
        <section
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 40,
            background: 'linear-gradient(180deg, #f7f1e8 0%, #f2eadf 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 420,
              background: '#fff',
              border: '1px solid #e1d2bf',
              borderRadius: 18,
              boxShadow: '0 16px 36px rgba(30,17,10,0.16)',
              padding: '24px 18px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 26, color: '#5a3e2b', marginBottom: 10 }}>
              Grazie per aver chattato con Alfred
            </div>
            <p style={{ fontSize: 17, color: '#3f2d1f', lineHeight: 1.5, margin: '0 0 20px' }}>
              Ti sono stato utile? Vota Alfred, ci aiuta molto! 🎩
            </p>

            {!showThanks && (
              <>
                <div
                  style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 8 }}
                  onMouseLeave={() => setHoverRating(null)}
                >
                  {Array.from({ length: 5 }).map((_, idx) => {
                    const starIndex = idx + 1
                    const activeRating = hoverRating ?? selectedRating ?? 0
                    const fill = Math.max(0, Math.min(1, activeRating - idx))

                    return (
                      <div key={starIndex} style={{ position: 'relative', width: 38, height: 38 }}>
                        <span
                          aria-hidden="true"
                          style={{
                            position: 'absolute',
                            inset: 0,
                            color: '#d4cabd',
                            fontSize: 36,
                            lineHeight: '38px',
                            userSelect: 'none',
                          }}
                        >
                          ★
                        </span>
                        <span
                          aria-hidden="true"
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: `${fill * 100}%`,
                            overflow: 'hidden',
                            color: '#e3a72b',
                            fontSize: 36,
                            lineHeight: '38px',
                            userSelect: 'none',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          ★
                        </span>

                        <button
                          type="button"
                          aria-label={`Valuta ${starIndex - 0.5} stelle`}
                          onMouseEnter={() => setHoverRating(starIndex - 0.5)}
                          onFocus={() => setHoverRating(starIndex - 0.5)}
                          onClick={() => submitRating(starIndex - 0.5)}
                          onTouchStart={() => setHoverRating(starIndex - 0.5)}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '50%',
                            height: '100%',
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            padding: 0,
                          }}
                        />
                        <button
                          type="button"
                          aria-label={`Valuta ${starIndex} stelle`}
                          onMouseEnter={() => setHoverRating(starIndex)}
                          onFocus={() => setHoverRating(starIndex)}
                          onClick={() => submitRating(starIndex)}
                          onTouchStart={() => setHoverRating(starIndex)}
                          style={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            width: '50%',
                            height: '100%',
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            padding: 0,
                          }}
                        />
                      </div>
                    )
                  })}
                </div>
                <div style={{ fontSize: 13, color: '#7a6352' }}>Puoi scegliere anche mezze stelle</div>
              </>
            )}

            {showThanks && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#5a3e2b', marginBottom: 6 }}>
                  Grazie per il tuo feedback! A presto!
                </div>
                {selectedRating && (
                  <div style={{ fontSize: 14, color: '#7a6352' }}>Valutazione registrata: {selectedRating} / 5</div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {lightbox && (
        <Lightbox images={lightbox.images} initialIndex={lightbox.index} onClose={closeLightbox} />
      )}
    </main>
  )
}
