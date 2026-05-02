'use client'
import React from 'react'
import { useRef, useState } from 'react'

type IconProps = {
  active?: boolean
  activeColor?: string
  inactiveColor?: string
  activeFill?: string
}

type ChatMessage = {
  id: string
  role: 'assistant' | 'user'
  text: string
}

// ─── SVG ICONS ───────────────────────────────────────────────────────────────

const IconHome = ({ active, activeColor, inactiveColor, activeFill }: IconProps) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M3 9.5L12 3L21 9.5V20C21 20.55 20.55 21 20 21H15V15H9V21H4C3.45 21 3 20.55 3 20V9.5Z"
      stroke={active ? (activeColor ?? '#5C0013') : (inactiveColor ?? '#5A3A2E')}
      strokeWidth="1.5"
      fill={active ? (activeFill ?? `${activeColor ?? '#5C0013'}22`) : 'none'}
      strokeLinejoin="round"/>
  </svg>
)
const IconBed = ({ active, activeColor, inactiveColor }: IconProps) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M3 7V17M3 13H21M21 17V11C21 9.9 20.1 9 19 9H11V13" stroke={active ? (activeColor ?? '#5C0013') : (inactiveColor ?? '#5A3A2E')} strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="7" cy="10" r="1.5" stroke={active ? (activeColor ?? '#5C0013') : (inactiveColor ?? '#5A3A2E')} strokeWidth="1.5"/>
  </svg>
)
const IconMap = ({ active, activeColor, inactiveColor }: IconProps) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M9 3L3 6V21L9 18L15 21L21 18V3L15 6L9 3Z" stroke={active ? (activeColor ?? '#5C0013') : (inactiveColor ?? '#5A3A2E')} strokeWidth="1.5" strokeLinejoin="round"/>
    <line x1="9" y1="3" x2="9" y2="18" stroke={active ? (activeColor ?? '#5C0013') : (inactiveColor ?? '#5A3A2E')} strokeWidth="1.5"/>
    <line x1="15" y1="6" x2="15" y2="21" stroke={active ? (activeColor ?? '#5C0013') : (inactiveColor ?? '#5A3A2E')} strokeWidth="1.5"/>
  </svg>
)
const IconFork = ({ active, activeColor, inactiveColor }: IconProps) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M3 2V8C3 10.2 4.8 12 7 12V22" stroke={active ? (activeColor ?? '#5C0013') : (inactiveColor ?? '#5A3A2E')} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M7 2V8" stroke={active ? (activeColor ?? '#5C0013') : (inactiveColor ?? '#5A3A2E')} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M17 2C17 2 21 5 21 9C21 11.2 19.5 13 17.5 13.5L17 22" stroke={active ? (activeColor ?? '#5C0013') : (inactiveColor ?? '#5A3A2E')} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)
const IconCar = ({ active, activeColor, inactiveColor }: IconProps) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M5 11L7 5H17L19 11" stroke={active ? (activeColor ?? '#5C0013') : (inactiveColor ?? '#5A3A2E')} strokeWidth="1.5" strokeLinejoin="round"/>
    <rect x="3" y="11" width="18" height="7" rx="2" stroke={active ? (activeColor ?? '#5C0013') : (inactiveColor ?? '#5A3A2E')} strokeWidth="1.5"/>
    <circle cx="7.5" cy="18" r="2" stroke={active ? (activeColor ?? '#5C0013') : (inactiveColor ?? '#5A3A2E')} strokeWidth="1.5"/>
    <circle cx="16.5" cy="18" r="2" stroke={active ? (activeColor ?? '#5C0013') : (inactiveColor ?? '#5A3A2E')} strokeWidth="1.5"/>
  </svg>
)
const IconUser = ({ active, activeColor, inactiveColor }: IconProps) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="8" r="3.5" stroke={active ? (activeColor ?? '#5C0013') : (inactiveColor ?? '#5A3A2E')} strokeWidth="1.5" />
    <path d="M5.5 20C6.2 16.8 8.8 14.5 12 14.5C15.2 14.5 17.8 16.8 18.5 20" stroke={active ? (activeColor ?? '#5C0013') : (inactiveColor ?? '#5A3A2E')} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)
const IconWifi = ({ color = '#5A3A2E' }: { color?: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M5 12.5C7.8 9.7 12 8.5 16 9.5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M2 9C6.5 4.5 13.5 3 20 6" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M8.5 16C9.8 14.7 11.5 14 13 14.3" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="13" cy="19" r="1.5" fill={color}/>
  </svg>
)
const IconKey = ({ color = '#5A3A2E' }: { color?: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <circle cx="8" cy="10" r="5" stroke={color} strokeWidth="1.5"/>
    <path d="M13 10H22M19 10V13" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)
const IconDoor = ({ color = '#5A3A2E' }: { color?: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <rect x="4" y="3" width="16" height="19" rx="1" stroke={color} strokeWidth="1.5"/>
    <circle cx="16" cy="12" r="1.2" fill={color}/>
  </svg>
)
const IconNavArrow = ({ color = '#5A3A2E' }: { color?: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M12 2L20 20L12 16L4 20L12 2Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
  </svg>
)
const IconChevron = ({ color = '#5A3A2E' }: { color?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M9 18L15 12L9 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const IconWine = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
    <path d="M7 3H17L16 10C16 13.3 14.2 16 12 16C9.8 16 8 13.3 8 10L7 3Z" stroke="#5A3A2E" strokeWidth="1.5" strokeLinejoin="round"/>
    <line x1="12" y1="16" x2="12" y2="20" stroke="#5A3A2E" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="8" y1="20" x2="16" y2="20" stroke="#5A3A2E" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)
const IconTruffle = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
    <ellipse cx="12" cy="13" rx="7" ry="6" stroke="#5A3A2E" strokeWidth="1.5"/>
    <path d="M9 7C9 5.3 10.3 4 12 4C13.7 4 15 5.3 15 7" stroke="#5A3A2E" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="10" cy="12" r="1" fill="#5A3A2E"/>
    <circle cx="14" cy="14" r="1" fill="#5A3A2E"/>
  </svg>
)
const IconCastle = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
    <path d="M4 20V10H7V8H4V4H6V6H8V4H10V8H14V4H16V6H18V4H20V8H17V10H20V20H4Z" stroke="#5A3A2E" strokeWidth="1.5" strokeLinejoin="round" fill="none"/>
    <rect x="10" y="14" width="4" height="6" stroke="#5A3A2E" strokeWidth="1.5"/>
  </svg>
)
const IconStar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="#5A3A2E">
    <path d="M12 2L15.1 8.3L22 9.3L17 14.2L18.2 21L12 17.8L5.8 21L7 14.2L2 9.3L8.9 8.3L12 2Z"/>
  </svg>
)
const IconPhone = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M6.6 10.8C7.8 13.2 9.8 15.2 12.2 16.4L14.2 14.4C14.5 14.1 14.9 14 15.2 14.2C16.3 14.6 17.5 14.8 18.8 14.8C19.4 14.8 19.9 15.3 19.9 15.9V18.9C19.9 19.5 19.4 20 18.8 20C9.7 20 4 14.3 4 5.2C4 4.6 4.5 4.1 5.1 4.1H8.1C8.7 4.1 9.2 4.6 9.2 5.2C9.2 6.5 9.4 7.7 9.8 8.8C9.9 9.1 9.8 9.5 9.6 9.8L6.6 10.8Z" stroke="#5A3A2E" strokeWidth="1.5"/>
  </svg>
)
const IconClock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke="#5A3A2E" strokeWidth="1.5"/>
    <path d="M12 7V12L15 15" stroke="#5A3A2E" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)
const IconParking = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="18" height="18" rx="3" stroke="#5A3A2E" strokeWidth="1.5"/>
    <path d="M9 17V7H13C15.2 7 17 8.8 17 11C17 13.2 15.2 15 13 15H9" stroke="#5A3A2E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const IconTrain = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
    <rect x="5" y="3" width="14" height="15" rx="3" stroke="#5A3A2E" strokeWidth="1.5"/>
    <line x1="5" y1="11" x2="19" y2="11" stroke="#5A3A2E" strokeWidth="1.5"/>
    <circle cx="9" cy="15" r="1.5" stroke="#5A3A2E" strokeWidth="1.5"/>
    <circle cx="15" cy="15" r="1.5" stroke="#5A3A2E" strokeWidth="1.5"/>
    <path d="M7 21L9 18M17 21L15 18" stroke="#5A3A2E" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)
const IconPlane = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
    <path d="M21 16L13 8.5L14 3L12 3L9 7.5L5 7L3 9L7 10.5L4 14L6 15L10 12.5L16 21L18 20L16.5 14.5L21 16Z" stroke="#5A3A2E" strokeWidth="1.5" strokeLinejoin="round"/>
  </svg>
)
const IconTaxi = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
    <path d="M7 10L8.5 5H15.5L17 10" stroke="#5A3A2E" strokeWidth="1.5" strokeLinecap="round"/>
    <rect x="3" y="10" width="18" height="8" rx="2" stroke="#5A3A2E" strokeWidth="1.5"/>
    <circle cx="7.5" cy="18" r="1.5" stroke="#5A3A2E" strokeWidth="1.5"/>
    <circle cx="16.5" cy="18" r="1.5" stroke="#5A3A2E" strokeWidth="1.5"/>
    <path d="M9.5 4.5H14.5" stroke="#5A3A2E" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

// ─── COLORS ──────────────────────────────────────────────────────────────────

const C = {
  brownDark: '#4A0010',
  brownMid: '#5C0013',
  brownAccent: '#6E1A2A',
  gold: '#b29664',
  goldLight: '#b29664',
  goldPale: '#b29664',
  cream: '#F5F0E8',
  creamDark: '#EDE5D4',
  creamWhite: '#FDFAF5',
  textMid: '#5A3A2E',
  textLight: '#7A5B4B',
}

// ─── DATA ─────────────────────────────────────────────────────────────────────

const ITINERARI = [
  {
    id: 'barolo',
    icon: <IconWine />,
    title: 'La Strada del Barolo',
    subtitle: 'Tra Barolo, La Morra e Serralunga',
    duration: '1 giorno',
    difficulty: 'Facile',
    desc: 'Un percorso tra i vigneti più celebri del Piemonte. Partendo da Costigliole d\'Asti, raggiungi La Morra per una vista indimenticabile sulle Langhe, poi scendi verso Barolo e il suo castello. Chiudi la giornata a Serralunga d\'Alba.',
    tappe: [
      { nome: 'La Morra & Belvedere', km: '25 km', note: 'Vista panoramica sulle Langhe' },
      { nome: 'Barolo — Castello Falletti', km: '+8 km', note: 'Museo del Vino WiMu' },
      { nome: 'Serralunga d\'Alba', km: '+6 km', note: 'Castello medievale' },
      { nome: 'Enoteca regionale', km: '+4 km', note: 'Degustazione finale' },
    ],
    color: '#6B2D3E',
    colorLight: '#F8EFF1',
  },
  {
    id: 'tartufo',
    icon: <IconTruffle />,
    title: 'Alba & il Tartufo Bianco',
    subtitle: 'La capitale delle Langhe',
    duration: 'Mezza giornata',
    difficulty: 'Facile',
    desc: 'Alba è a soli 20 minuti: passeggia nel centro storico medievale, visita il mercato del tartufo (ottobre–novembre) e fermati in una delle storiche enoteche. Pranzo tipico nei vicoli del centro.',
    tappe: [
      { nome: 'Centro storico di Alba', km: '20 km', note: 'Torri medievali e duomo' },
      { nome: 'Mercato del Tartufo', km: '—', note: 'Ott–Nov, Piazza Medford' },
      { nome: 'Piazza Risorgimento', km: '—', note: 'Caffè storici' },
      { nome: 'Enoteca di Alba', km: '—', note: 'Selezione Nebbiolo e Dolcetto' },
    ],
    color: '#5C4A1E',
    colorLight: '#F8F4EB',
  },
  {
    id: 'castelli',
    icon: <IconCastle />,
    title: 'Castelli del Monferrato',
    subtitle: 'Storia e paesaggi da fiaba',
    duration: '1 giorno',
    difficulty: 'Facile',
    desc: 'Il Monferrato è punteggiato di castelli medievali e borghi arroccati. Da Costigliole raggiungi Canelli con le sue cattedrali sotterranee del vino, poi Nizza Monferrato e il castello di Mombaldone.',
    tappe: [
      { nome: 'Canelli — Cattedrali del Vino', km: '10 km', note: 'Patrimonio UNESCO' },
      { nome: 'Nizza Monferrato', km: '+15 km', note: 'Mercato storico e Barbera' },
      { nome: 'Mombaldone', km: '+20 km', note: 'Borgo autentico, vista mozzafiato' },
      { nome: 'Cassinasco', km: '+12 km', note: 'Tramonto sul Monferrato' },
    ],
    color: '#2C4A3E',
    colorLight: '#EBF2EF',
  },
]

const NEGOZI = [
  {
    cat: 'Ristoranti',
    colorIcon: '#6B2D3E',
    colorBg: '#F8EFF1',
    posti: [
      { nome: 'Ristorante Il Cascinale Nuovo', stars: 5, tipo: 'Cucina piemontese contemporanea', distanza: '5 min', prezzo: '€€€€', note: 'Menu degustazione con vini abbinati. Prenotazione consigliata.' },
      { nome: 'Osteria dell\'Arco — Alba', stars: 5, tipo: 'Tradizione Langhe & Tartufo', distanza: '25 min', prezzo: '€€€', note: 'Tajarin al tartufo e agnolotti del plin imperdibili.' },
    ]
  },
  {
    cat: 'Trattorie',
    colorIcon: '#7A4A2E',
    colorBg: '#F7EFE7',
    posti: [
      { nome: 'Trattoria La Libera', stars: 4, tipo: 'Cucina casalinga piemontese', distanza: '3 min', prezzo: '€€', note: 'Bagna cauda, vitello tonnato e tajarin fatti in casa.' },
      { nome: 'Da Gemma', stars: 5, tipo: 'Cucina di territorio', distanza: '15 min', prezzo: '€€', note: 'Leggendaria lasagna al ragù e braciole piemontesi.' },
      { nome: 'Osteria della Piazza', stars: 4, tipo: 'Trattoria tradizionale', distanza: '9 min', prezzo: '€€', note: 'Piatti tipici piemontesi e menù pranzo conveniente.' },
    ]
  },
  {
    cat: 'Bar',
    colorIcon: '#5C4A1E',
    colorBg: '#F8F4EB',
    posti: [
      { nome: 'Caffè Costigliole', stars: 4, tipo: 'Bar & Brunch', distanza: '1 min', prezzo: '€', note: 'Colazione con cornetti e cappuccino. Aperitivo con Barbera locale.' },
      { nome: 'Bar Centrale', stars: 4, tipo: 'Caffetteria e aperitivi', distanza: '4 min', prezzo: '€', note: 'Ottimo per colazione veloce e aperitivo serale.' },
      { nome: 'Enoteca Murivecchi', stars: 4, tipo: 'Wine bar', distanza: '8 min', prezzo: '€€', note: 'Taglieri e vini locali, atmosfera rilassata.' },
    ]
  },
  {
    cat: 'Pasticcerie',
    colorIcon: '#2C3A5C',
    colorBg: '#EBEEf5',
    posti: [
      { nome: 'Pasticceria Dolce Langhe', stars: 4, tipo: 'Pasticceria artigianale', distanza: '6 min', prezzo: '€€', note: 'Bignè, torte e specialità piemontesi da colazione.' },
      { nome: 'Pasticceria Roma', stars: 4, tipo: 'Dolci & caffetteria', distanza: '10 min', prezzo: '€€', note: 'Ideale per una merenda o una torta su ordinazione.' },
    ]
  },
  {
    cat: 'Supermercati',
    colorIcon: '#2C4A3E',
    colorBg: '#EBF2EF',
    posti: [
      { nome: 'Market Costigliole', stars: 4, tipo: 'Supermercato di paese', distanza: '5 min', prezzo: '€€', note: 'Spesa quotidiana, acqua, snack e prodotti base.' },
      { nome: 'Conad City', stars: 4, tipo: 'Supermercato', distanza: '12 min', prezzo: '€€', note: 'Reparti completi, apertura continuata in settimana.' },
      { nome: 'Carrefour Express', stars: 4, tipo: 'Mini market', distanza: '15 min', prezzo: '€€', note: 'Comodo per acquisti rapidi e prodotti essenziali.' },
    ]
  },
  {
    cat: 'Farmacie',
    colorIcon: '#2C5C5A',
    colorBg: '#EAF6F5',
    posti: [
      { nome: 'Farmacia Costigliole', stars: 5, tipo: 'Farmacia', distanza: '4 min', prezzo: '€€', note: 'Farmaci da banco, parafarmacia e servizi base.' },
      { nome: 'Farmacia Comunale Asti Sud', stars: 4, tipo: 'Farmacia', distanza: '14 min', prezzo: '€€', note: 'Ampia disponibilità prodotti e consulenza al banco.' },
      { nome: 'Parafarmacia San Carlo', stars: 4, tipo: 'Parafarmacia', distanza: '11 min', prezzo: '€€', note: 'Integratori, igiene personale e prodotti per bambini.' },
    ]
  },
]

const MUOVERSI = [
  {
    icon: <IconCar />,
    title: 'In Auto',
    colorBg: '#F8F4EB',
    info: [
      { label: 'Parcheggio Hotel', val: 'Gratuito, disponibile 24h' },
      { label: 'Asti Centro', val: '15 min (A21)' },
      { label: 'Alba', val: '20 min (SS231)' },
      { label: 'Torino', val: '1h (A21 + A6)' },
      { label: 'Milano', val: '1h 45min (A21 + A7)' },
    ]
  },
  {
    icon: <IconTrain />,
    title: 'Treno',
    colorBg: '#EBEEf5',
    info: [
      { label: 'Stazione più vicina', val: 'Costigliole d\'Asti (5 min a piedi)' },
      { label: 'Asti FS', val: '12 min, ogni 30 min' },
      { label: 'Torino Porta Nuova', val: '1h da Asti' },
      { label: 'Milano Centrale', val: '1h 30 da Asti' },
    ]
  },
  {
    icon: <IconPlane />,
    title: 'Aeroporti',
    colorBg: '#EBF2EF',
    info: [
      { label: 'Torino Caselle (TRN)', val: '50 min in auto' },
      { label: 'Milano Malpensa (MXP)', val: '1h 45 in auto' },
      { label: 'Milano Linate (LIN)', val: '1h 30 in auto' },
      { label: 'Genova (GOA)', val: '1h 15 in auto' },
    ]
  },
  {
    icon: <IconTaxi />,
    title: 'Taxi & Transfer',
    colorBg: '#F8EFF1',
    info: [
      { label: 'Taxi Costigliole', val: '+39 0141 96 XXXX' },
      { label: 'Transfer su prenotazione', val: 'Chiedere alla reception' },
      { label: 'Noleggio auto', val: 'Europcar Asti — 15 min' },
    ]
  },
]

// ─── COMPONENTS ───────────────────────────────────────────────────────────────

function InfoBar() {
  const ivory = '#F2EBDD'

  return (
    <div style={{ background: C.brownMid, borderBottom: `1px solid ${C.brownAccent}` }}
      className="flex items-center justify-around px-4 py-3">
      {[
        { icon: <IconKey color={ivory} />, label: 'CHECK-IN', val: '15:00' },
        { icon: <IconDoor color={ivory} />, label: 'CHECK-OUT', val: '11:00' },
        { icon: <IconWifi color={ivory} />, label: 'WIFI', val: '600 Mbps' },
        { icon: <IconNavArrow color={ivory} />, label: 'NAVIGA', val: 'Maps' },
      ].map((item, i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          {item.icon}
          <span style={{ color: C.textLight, fontSize: 9, letterSpacing: '0.08em', fontFamily: 'Lato' }}>{item.label}</span>
          <span style={{ color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: 'Lato' }}>{item.val}</span>
        </div>
      ))}
    </div>
  )
}

function WelcomeCard() {
  return (
    <div style={{
      background: `linear-gradient(135deg, ${C.brownMid} 0%, ${C.brownAccent} 100%)`,
      borderRadius: 20,
      padding: '22px 20px',
      margin: '16px',
      boxShadow: '0 8px 32px rgba(30,17,10,0.25)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative circle */}
      <div style={{
        position: 'absolute', top: -20, right: -20, width: 100, height: 100,
        borderRadius: '50%', border: `1px solid ${C.gold}22`, opacity: 0.5
      }} />
      <div style={{
        position: 'absolute', top: 10, right: 10, width: 60, height: 60,
        borderRadius: '50%', border: `1px solid ${C.gold}33`, opacity: 0.4
      }} />

      <h2 style={{ color: '#fff', fontFamily: 'Playfair Display, serif', fontSize: 22, marginBottom: 8 }}>
        Benvenuto! 🤌
      </h2>
      <p className="mobile-hide" style={{ color: '#D4B896', fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>
        Siamo felici di ospitarvi nel cuore delle Langhe e del Monferrato.
        Questa guida contiene tutto ciò che vi serve per un soggiorno indimenticabile
        tra vigneti, castelli e sapori autentici del Piemonte.
      </p>
      <div className="mobile-hide" style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: `${C.gold}22`, border: `1px solid ${C.gold}55`,
        borderRadius: 20, padding: '6px 14px'
      }}>
        <IconStar />
        <span style={{ color: C.goldLight, fontSize: 13, fontWeight: 700 }}>Hotel Langhe & Monferrato</span>
      </div>
    </div>
  )
}

function GuideCard({ icon, title, subtitle, onClick }: { icon: React.ReactNode; title: string; subtitle: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      background: C.creamWhite,
      border: `1px solid ${C.creamDark}`,
      borderRadius: 16,
      padding: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      width: '100%',
      cursor: 'pointer',
      transition: 'all 0.2s',
      boxShadow: '0 2px 8px rgba(30,17,10,0.06)',
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: 14, background: C.goldPale,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>{icon}</div>
      <div style={{ textAlign: 'left', flex: 1 }}>
        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 16, color: C.brownMid, fontWeight: 600 }}>{title}</div>
        <div style={{ fontSize: 13, color: C.textLight, marginTop: 2 }}>{subtitle}</div>
      </div>
      <div style={{
        width: 28, height: 28, borderRadius: '50%', background: C.goldPale,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
      }}>
        <IconChevron color="#F2EBDD" />
      </div>
    </button>
  )
}

// ─── TABS ─────────────────────────────────────────────────────────────────────

function HomeTab({ setTab }: { setTab: (tab: string) => void }) {
  const ivory = '#F2EBDD'

  return (
    <div>
      <InfoBar />
      <WelcomeCard />
      <div style={{ padding: '4px 16px 0' }}>
        <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, color: C.brownMid, marginBottom: 4 }}>
          Esplora la guida
        </h3>
        <p style={{ color: C.textLight, fontSize: 13, marginBottom: 16 }}>Tutto quello che ti serve in un tap</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '0 16px 24px' }}>
        <GuideCard icon={<IconBed active activeColor={ivory} activeFill={`${ivory}22`} />} title="Il tuo Soggiorno" subtitle="Check-in, regole, parcheggio, WiFi" onClick={() => setTab('soggiorno')} />
        <GuideCard icon={<IconMap active activeColor={ivory} />} title="Esperienze nelle Langhe" subtitle="Visitare ed esperienze da vivere" onClick={() => setTab('esperienze')} />
        <GuideCard icon={<IconFork active activeColor={ivory} />} title="Negozi & Food" subtitle="Ristoranti, trattorie, bar, supermercati e farmacie" onClick={() => setTab('negozi')} />
        <GuideCard icon={<IconCar active activeColor={ivory} />} title="Come Muoversi" subtitle="Auto, treno, taxi, aeroporti" onClick={() => setTab('muoversi')} />
      </div>
    </div>
  )
}

function SoggiornoTab() {
  const rules = [
    { t: 'Check-in', v: 'dalle 15:00 — Reception sempre disponibile' },
    { t: 'Check-out', v: 'entro le 11:00 — Late check-out su richiesta' },
    { t: 'WiFi', v: 'Rete: HotelLanghe | Password: langhe2024' },
    { t: 'Parcheggio', v: 'Gratuito e custodito 24h nel cortile interno' },
    { t: 'Colazione', v: 'Servita dalle 7:30 alle 10:00 in sala ristorante' },
    { t: 'Animali', v: 'Animali domestici benvenuti — segnalare alla prenotazione' },
    { t: 'Silenzio notturno', v: 'Si prega di mantenere il silenzio dopo le 22:00' },
    { t: 'Fumo', v: 'Vietato in tutte le aree interne. Spazio fumatori in giardino' },
  ]
  return (
    <div style={{ padding: '16px' }}>
      <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, color: C.brownMid, marginBottom: 4 }}>Il tuo Soggiorno</h2>
      <p style={{ color: C.textLight, fontSize: 13, marginBottom: 20 }}>Tutto quello che devi sapere</p>

      {/* Quick info boxes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        {[
          { icon: <IconKey />, label: 'Check-in', val: '15:00' },
          { icon: <IconDoor />, label: 'Check-out', val: '11:00' },
          { icon: <IconWifi />, label: 'WiFi', val: '600 Mbps' },
          { icon: <IconParking />, label: 'Parcheggio', val: 'Gratuito' },
        ].map((item, i) => (
          <div key={i} style={{
            background: C.creamWhite, borderRadius: 14, padding: '14px',
            border: `1px solid ${C.creamDark}`, textAlign: 'center',
            boxShadow: '0 2px 8px rgba(30,17,10,0.06)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>{item.icon}</div>
            <div style={{ fontSize: 10, color: C.textLight, letterSpacing: '0.06em', marginBottom: 4 }}>{item.label.toUpperCase()}</div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, color: C.brownMid, fontWeight: 600 }}>{item.val}</div>
          </div>
        ))}
      </div>
      {/* Rules */}
      <div style={{ background: C.creamWhite, borderRadius: 16, overflow: 'hidden', border: `1px solid ${C.creamDark}`, boxShadow: '0 2px 8px rgba(30,17,10,0.06)' }}>
        <div style={{ padding: '14px 16px', background: C.brownMid, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'Playfair Display, serif', color: '#fff', fontSize: 16 }}>Informazioni & Regole</span>
        </div>
        {rules.map((r, i) => (
          <div key={i} style={{
            padding: '12px 16px',
            borderBottom: i < rules.length - 1 ? `1px solid ${C.creamDark}` : 'none',
            display: 'flex', flexDirection: 'column', gap: 2,
          }}>
            <span style={{ fontSize: 11, color: C.gold, fontWeight: 700, letterSpacing: '0.06em' }}>{r.t.toUpperCase()}</span>
            <span style={{ fontSize: 14, color: C.textMid }}>{r.v}</span>
          </div>
        ))}
      </div>

      {/* Emergency */}
      <div style={{
        marginTop: 16, background: `${C.brownMid}`, borderRadius: 16,
        padding: '16px', boxShadow: '0 4px 16px rgba(30,17,10,0.15)',
      }}>
        <div style={{ color: C.goldLight, fontFamily: 'Playfair Display, serif', fontSize: 15, marginBottom: 12 }}>Contatti Reception</div>
        {[
          { l: 'Reception 24h', v: '+39 0141 96 XXXX' },
          { l: 'WhatsApp Hotel', v: '+39 XXX XXX XXXX' },
          { l: 'Email', v: 'info@hotellanghe.it' },
        ].map((c, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < 2 ? `1px solid ${C.brownAccent}` : 'none' }}>
            <span style={{ color: '#D4B896', fontSize: 13 }}>{c.l}</span>
            <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>{c.v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function EsperienzeTab() {
  const [open, setOpen] = useState<string | null>(null)
  const [cat, setCat] = useState<'visitare' | 'esperienze'>('visitare')

  return (
    <div>
      <div style={{ padding: '16px 16px 0' }}>
        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, color: C.brownMid, marginBottom: 4 }}>Esperienze</h2>
        <p style={{ color: C.textLight, fontSize: 13, marginBottom: 16 }}>Esplora le Langhe e il Monferrato</p>
      </div>

      {/* Sub-menu tabs */}
      <div style={{ display: 'flex', gap: 8, padding: '0 16px 16px', overflowX: 'auto' }}>
        {[
          { id: 'visitare' as const, label: 'Visitare' },
          { id: 'esperienze' as const, label: 'Esperienze' },
        ].map((item) => (
          <button key={item.id} onClick={() => setCat(item.id)} style={{
            padding: '8px 16px', borderRadius: 20, cursor: 'pointer', whiteSpace: 'nowrap',
            background: cat === item.id ? C.brownMid : C.creamWhite,
            color: cat === item.id ? '#fff' : C.textMid,
            fontSize: 13, fontWeight: 600,
            boxShadow: cat === item.id ? '0 4px 12px rgba(30,17,10,0.2)' : '0 1px 4px rgba(30,17,10,0.08)',
            border: cat === item.id ? 'none' : `1px solid ${C.creamDark}`,
            transition: 'all 0.2s',
          }}>{item.label}</button>
        ))}
      </div>

      {cat === 'visitare' && (
        <div style={{ padding: '0 16px 24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {ITINERARI.map((it) => (
              <div key={it.id} style={{
                background: C.creamWhite, borderRadius: 18,
                border: `1px solid ${C.creamDark}`,
                overflow: 'hidden', boxShadow: '0 2px 12px rgba(30,17,10,0.08)',
              }}>
                {/* Header */}
                <button onClick={() => setOpen(open === it.id ? null : it.id)}
                  style={{
                    width: '100%', padding: '16px', display: 'flex',
                    alignItems: 'center', gap: 12, cursor: 'pointer',
                    background: 'none', border: 'none', textAlign: 'left',
                  }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 14, background: it.colorLight,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>{it.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 16, color: C.brownMid, fontWeight: 600 }}>{it.title}</div>
                    <div style={{ fontSize: 13, color: C.textLight, marginTop: 2 }}>{it.subtitle}</div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <span style={{ fontSize: 11, color: it.color, fontWeight: 700 }}>{it.duration}</span>
                      <span style={{ fontSize: 11, color: C.textLight }}>•</span>
                      <span style={{ fontSize: 11, color: C.textLight }}>{it.difficulty}</span>
                    </div>
                  </div>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', background: it.colorLight,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    transform: open === it.id ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.2s',
                  }}>
                    <IconChevron />
                  </div>
                </button>

                {/* Expanded */}
                {open === it.id && (
                  <div style={{ padding: '0 16px 16px', borderTop: `1px solid ${C.creamDark}` }}>
                    <p style={{ fontSize: 14, color: C.textMid, lineHeight: 1.65, margin: '12px 0' }}>{it.desc}</p>
                    <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 13, color: C.gold, marginBottom: 8, letterSpacing: '0.04em' }}>
                      TAPPE
                    </div>
                    {it.tappe.map((t, i) => (
                      <div key={i} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                        padding: '8px 0', borderBottom: i < it.tappe.length - 1 ? `1px solid ${C.creamDark}` : 'none',
                      }}>
                        <div>
                          <div style={{ fontSize: 14, color: C.brownMid, fontWeight: 600 }}>{t.nome}</div>
                          <div style={{ fontSize: 12, color: C.textLight }}>{t.note}</div>
                        </div>
                        <span style={{ fontSize: 12, color: it.color, fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>{t.km}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {cat === 'esperienze' && (
        <div style={{ padding: '0 16px 24px' }}>
          <div style={{
            background: C.creamWhite, borderRadius: 16,
            border: `1px solid ${C.creamDark}`,
            padding: '16px', boxShadow: '0 2px 8px rgba(30,17,10,0.06)',
          }}>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, color: C.brownMid, marginBottom: 6 }}>Esperienze</div>
            <p style={{ fontSize: 14, color: C.textLight, lineHeight: 1.6 }}>
              In arrivo: aggiungeremo presto tutte le esperienze consigliate in questa sezione.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function NegoziTab() {
  const [cat, setCat] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const pillsRef = useRef<HTMLDivElement | null>(null)
  const dragStartXRef = useRef(0)
  const dragStartScrollLeftRef = useRef(0)
  const isMouseDownRef = useRef(false)
  const movedRef = useRef(false)
  const suppressNextButtonClickRef = useRef(false)
  const cats = NEGOZI.map(r => r.cat)

  const handlePillsWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!pillsRef.current) return
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault()
      pillsRef.current.scrollLeft += e.deltaY
    }
  }

  const handlePillsMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!pillsRef.current) return
    isMouseDownRef.current = true
    movedRef.current = false
    dragStartXRef.current = e.clientX
    dragStartScrollLeftRef.current = pillsRef.current.scrollLeft
    setIsDragging(true)
  }

  const handlePillsMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMouseDownRef.current || !pillsRef.current) return
    const dx = e.clientX - dragStartXRef.current
    if (Math.abs(dx) > 6) movedRef.current = true
    pillsRef.current.scrollLeft = dragStartScrollLeftRef.current - dx
  }

  const endPillsDrag = () => {
    if (!isMouseDownRef.current) return
    isMouseDownRef.current = false
    setIsDragging(false)
    suppressNextButtonClickRef.current = movedRef.current
  }

  return (
    <div>
      <div style={{ padding: '16px 16px 0' }}>
        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, color: C.brownMid, marginBottom: 4 }}>Negozi & Food</h2>
        <p style={{ color: C.textLight, fontSize: 13, marginBottom: 16 }}>Ristoranti, trattorie, bar, pasticcerie, supermercati e farmacie nelle vicinanze</p>
      </div>

      {/* Sub-menu tabs */}
      <div
        ref={pillsRef}
        onWheel={handlePillsWheel}
        onMouseDown={handlePillsMouseDown}
        onMouseMove={handlePillsMouseMove}
        onMouseUp={endPillsDrag}
        onMouseLeave={endPillsDrag}
        style={{
          display: 'flex',
          gap: 8,
          padding: '0 16px 16px',
          overflowX: 'auto',
          overflowY: 'hidden',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-x',
          scrollBehavior: 'smooth',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: isDragging ? 'none' : 'auto',
        }}>
        {cats.map((c, i) => (
          <button key={i} onClick={() => {
            if (suppressNextButtonClickRef.current) {
              suppressNextButtonClickRef.current = false
              return
            }
            setCat(i)
          }} style={{
            padding: '8px 16px', borderRadius: 20, cursor: 'pointer', whiteSpace: 'nowrap',
            background: cat === i ? C.brownMid : C.creamWhite,
            color: cat === i ? '#fff' : C.textMid,
            fontSize: 13, fontWeight: 600,
            flexShrink: 0,
            boxShadow: cat === i ? '0 4px 12px rgba(30,17,10,0.2)' : '0 1px 4px rgba(30,17,10,0.08)',
            border: cat === i ? 'none' : `1px solid ${C.creamDark}`,
            transition: 'all 0.2s',
          }}>{c}</button>
        ))}
      </div>

      {/* Risultati */}
      <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {NEGOZI[cat].posti.map((p, i) => (
          <div key={i} style={{
            background: C.creamWhite, borderRadius: 16,
            border: `1px solid ${C.creamDark}`,
            padding: '16px', boxShadow: '0 2px 8px rgba(30,17,10,0.06)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 15, color: C.brownMid, fontWeight: 600, flex: 1, marginRight: 8 }}>{p.nome}</div>
              <span style={{
                background: NEGOZI[cat].colorBg, color: NEGOZI[cat].colorIcon,
                fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 8, flexShrink: 0,
              }}>{p.prezzo}</span>
            </div>
            <div style={{ fontSize: 12, color: C.gold, fontWeight: 700, marginBottom: 4 }}>{p.tipo}</div>
            <div style={{ fontSize: 13, color: C.textLight, lineHeight: 1.5, marginBottom: 10 }}>{p.note}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 2 }}>
                {Array.from({ length: p.stars }).map((_, j) => <IconStar key={j} />)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <IconClock />
                <span style={{ fontSize: 12, color: C.textLight }}>{p.distanza} dall\'hotel</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MuoversiTab() {
  return (
    <div style={{ padding: '16px' }}>
      <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, color: C.brownMid, marginBottom: 4 }}>Come Muoversi</h2>
      <p style={{ color: C.textLight, fontSize: 13, marginBottom: 20 }}>Tutto per spostarsi in libertà</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {MUOVERSI.map((m, i) => (
          <div key={i} style={{
            background: C.creamWhite, borderRadius: 16,
            border: `1px solid ${C.creamDark}`,
            overflow: 'hidden', boxShadow: '0 2px 8px rgba(30,17,10,0.06)',
          }}>
            <div style={{
              padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
              borderBottom: `1px solid ${C.creamDark}`, background: m.colorBg,
            }}>
              {m.icon}
              <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 17, color: C.brownMid }}>{m.title}</span>
            </div>
            {m.info.map((row, j) => (
              <div key={j} style={{
                padding: '10px 16px',
                borderBottom: j < m.info.length - 1 ? `1px solid ${C.creamDark}` : 'none',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: 13, color: C.textLight }}>{row.label}</span>
                <span style={{ fontSize: 13, color: C.brownMid, fontWeight: 700, textAlign: 'right', maxWidth: '55%' }}>{row.val}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function AlfredTab() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      role: 'assistant',
      text: 'Ciao! Sono Alfred 👋\nSto diventando il tuo assistente digitale dell\'hotel. Scrivimi una richiesta e prepariamo la chat per gli ospiti.',
    },
  ])
  const [input, setInput] = useState('')

  const sendMessage = () => {
    const text = input.trim()
    if (!text) return

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text,
    }

    const botMsg: ChatMessage = {
      id: `a-${Date.now()}`,
      role: 'assistant',
      text: 'Perfetto, ricevuto. Questa è la base chat pronta: nel prossimo step colleghiamo Alfred al tuo agente reale.',
    }

    setMessages((prev) => [...prev, userMsg, botMsg])
    setInput('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100svh - 170px)', maxHeight: 'calc(100svh - 170px)' }}>
      <div style={{ padding: '16px 16px 8px' }}>
        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, color: C.brownMid, marginBottom: 4 }}>Alfred</h2>
        <p style={{ color: C.textLight, fontSize: 13 }}>Chat concierge dell'hotel</p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              padding: '10px 12px',
              borderRadius: 14,
              background: m.role === 'user' ? C.brownMid : C.creamWhite,
              color: m.role === 'user' ? '#F2EBDD' : C.textMid,
              border: m.role === 'user' ? 'none' : `1px solid ${C.creamDark}`,
              boxShadow: '0 2px 8px rgba(30,17,10,0.06)',
              whiteSpace: 'pre-line',
              fontSize: 14,
              lineHeight: 1.45,
            }}
          >
            {m.text}
          </div>
        ))}
      </div>

      <div style={{
        marginTop: 'auto',
        padding: '10px 16px 12px',
        background: 'linear-gradient(180deg, rgba(245,240,232,0.92) 0%, rgba(245,240,232,1) 35%)',
        borderTop: `1px solid ${C.creamDark}`,
      }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') sendMessage()
            }}
            placeholder="Scrivi un messaggio ad Alfred..."
            style={{
              flex: 1,
              borderRadius: 12,
              border: `1px solid ${C.creamDark}`,
              padding: '11px 12px',
              fontSize: 16,
              outline: 'none',
              color: C.textMid,
              background: C.creamWhite,
            }}
          />
          <button
            onClick={sendMessage}
            style={{
              border: 'none',
              background: C.brownMid,
              color: '#F2EBDD',
              borderRadius: 12,
              padding: '11px 14px',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Invia
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── BOTTOM NAV ───────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: 'home', label: 'Home', Icon: IconHome },
  { id: 'soggiorno', label: 'Soggiorno', Icon: IconBed },
  { id: 'esperienze', label: 'Esperienze', Icon: IconMap },
  { id: 'negozi', label: 'Negozi', Icon: IconFork },
  { id: 'muoversi', label: 'Muoversi', Icon: IconCar },
  { id: 'alfred', label: 'Alfred', Icon: IconUser },
]

// ─── APP ──────────────────────────────────────────────────────────────────────

export default function GuestGuide() {
  const [tab, setTab] = useState('home')

  const renderTab = () => {
    switch (tab) {
      case 'home': return <HomeTab setTab={setTab} />
      case 'soggiorno': return <SoggiornoTab />
      case 'esperienze': return <EsperienzeTab />
      case 'negozi': return <NegoziTab />
      case 'muoversi': return <MuoversiTab />
      case 'alfred': return <AlfredTab />
      default: return null
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      background: '#D4C4A8',
    }}>
      {/* Phone shell */}
      <div style={{
        width: '100%',
        maxWidth: 430,
        minHeight: '100vh',
        background: '#F5F0E8',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}>
        {/* Header */}
        <div className="mobile-compact-header" style={{
          background: `linear-gradient(135deg, ${C.brownDark} 0%, ${C.brownMid} 100%)`,
          padding: '16px 16px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <div className="mobile-hide" style={{ fontFamily: 'Playfair Display, serif', color: C.gold, fontSize: 11, letterSpacing: '0.12em', marginBottom: 2 }}>
              COSTIGLIOLE D'ASTI — PIEMONTE
            </div>
            <div style={{ fontFamily: 'Playfair Display, serif', color: '#fff', fontSize: 17, fontWeight: 600 }}>
              Hotel Langhe & Monferrato
            </div>
          </div>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            border: `1.5px solid ${C.gold}55`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontFamily: 'Playfair Display, serif', color: C.gold, fontSize: 16, fontStyle: 'italic' }}>L</span>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 90 }}>
          {renderTab()}
        </div>

        {/* Bottom Nav */}
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 430,
          background: C.creamWhite,
          borderTop: `1px solid ${C.creamDark}`,
          display: 'flex',
          justifyContent: 'space-between',
          padding: '8px 0 16px',
          boxShadow: '0 -4px 20px rgba(30,17,10,0.12)',
          zIndex: 100,
        }}>
          {NAV_ITEMS.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setTab(id)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              flex: 1, minWidth: 0,
              gap: 3, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 2px',
            }}>
              <div style={{ transform: 'scale(0.9)', transformOrigin: 'center' }}>
                <Icon active={tab === id} />
              </div>
              <span style={{
                fontSize: 9, fontWeight: 700, letterSpacing: '0.02em', whiteSpace: 'nowrap',
                color: tab === id ? C.gold : C.textLight,
                transition: 'color 0.2s',
              }}>{label.toUpperCase()}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
