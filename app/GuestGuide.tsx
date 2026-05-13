'use client'
import React from 'react'
import { useEffect, useRef, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { T, type Lang } from './translations'

type IconProps = {
  active?: boolean
  activeColor?: string
  inactiveColor?: string
  activeFill?: string
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
const IconFork = ({ active, activeColor, inactiveColor, color }: IconProps & { color?: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M3 2V8C3 10.2 4.8 12 7 12V22" stroke={color ?? (active ? (activeColor ?? '#5C0013') : (inactiveColor ?? '#5A3A2E'))} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M7 2V8" stroke={color ?? (active ? (activeColor ?? '#5C0013') : (inactiveColor ?? '#5A3A2E'))} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M17 2C17 2 21 5 21 9C21 11.2 19.5 13 17.5 13.5L17 22" stroke={color ?? (active ? (activeColor ?? '#5C0013') : (inactiveColor ?? '#5A3A2E'))} strokeWidth="1.5" strokeLinecap="round"/>
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
const IconWine = ({ color = '#5A3A2E' }: { color?: string }) => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
    <path d="M7 3H17L16 10C16 13.3 14.2 16 12 16C9.8 16 8 13.3 8 10L7 3Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
    <line x1="12" y1="16" x2="12" y2="20" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="8" y1="20" x2="16" y2="20" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
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
const IconStar = ({ color = '#5A3A2E' }: { color?: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill={color}>
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
const IconBag = ({ color = '#5A3A2E' }: { color?: string }) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <path d="M6 7H18L19 19H5L6 7Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M9 7C9 5.3 10.3 4 12 4C13.7 4 15 5.3 15 7" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)
const IconCross = ({ color = '#5A3A2E' }: { color?: string }) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="18" height="18" rx="3" stroke={color} strokeWidth="1.5"/>
    <path d="M12 8V16M8 12H16" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
)
const IconHazelnut = ({ color = '#5A3A2E' }: { color?: string }) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <ellipse cx="12" cy="14" rx="6" ry="5.5" stroke={color} strokeWidth="1.5"/>
    <path d="M12 8.5C12 6.5 14 4 16 4" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M12 8.5C12 6.5 10 4 8 4" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M12 8.5V14" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)
const IconCake = ({ color = '#5A3A2E' }: { color?: string }) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="11" width="18" height="9" rx="2" stroke={color} strokeWidth="1.5"/>
    <path d="M7 11V9C7 7.3 8.3 6 10 6H14C15.7 6 17 7.3 17 9V11" stroke={color} strokeWidth="1.5"/>
    <path d="M8 6C8 4.5 9 3 10 3" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M12 6C12 4.5 12 3 12 2" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M16 6C16 4.5 15 3 14 3" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)
const IconStarMed = ({ color = '#5A3A2E' }: { color?: string }) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill={color}>
    <path d="M12 2L15.1 8.3L22 9.3L17 14.2L18.2 21L12 17.8L5.8 21L7 14.2L2 9.3L8.9 8.3L12 2Z"/>
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

const ALFRED_AVATAR_PRIMARY = '/alfred.webp'
const ALFRED_AVATAR_FALLBACK = '/Alfred.webp'

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
      { nome: 'La Morra & Belvedere', km: '30 km', note: 'Vista panoramica sulle Langhe' },
      { nome: 'Barolo, Castello Falletti', km: '+8 km', note: 'Museo del Vino WiMu' },
      { nome: 'Serralunga d\'Alba', km: '+12 km', note: 'Castello medievale' },
      { nome: 'Enoteca Regionale', km: 'Totale: circa 50 km', note: 'Degustazione finale' },
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
    desc: 'Alba è a soli 20 minuti: passeggia nel centro storico medievale, visita il mercato del tartufo (ottobre–dicembre) e fermati in una delle storiche enoteche. Pranzo tipico nei vicoli del centro.',
    tappe: [
      { nome: 'Centro storico di Alba', km: '22 km', note: 'Torri medievali e Duomo' },
      { nome: 'Mercato del Tartufo', km: 'n.d.', note: 'Ott–Dic, Piazza Medford' },
      { nome: 'Piazza Risorgimento', km: 'n.d.', note: 'Caffè storici' },
      { nome: 'Enoteca di Alba', km: 'n.d.', note: 'Selezione Nebbiolo e Dolcetto' },
    ],
    color: '#5C4A1E',
    colorLight: '#F8F4EB',
  },
  {
    id: 'castelli',
    icon: <IconCastle />,
    title: 'Castelli del Monferrato',
    subtitle: 'Borghi arroccati, cattedrali del vino e paesaggi UNESCO',
    duration: '1 giorno',
    difficulty: 'Facile',
    desc: 'Borghi arroccati, cattedrali del vino e paesaggi UNESCO. Da Costigliole scendi verso Nizza Monferrato, poi Canelli con le sue cattedrali sotterranee, e infine sali verso i borghi più autentici dell\'Alta Langa.',
    tappe: [
      { nome: 'Nizza Monferrato', km: '16 km', note: 'Mercato storico e Barbera' },
      { nome: 'Canelli, Cattedrali del Vino', km: '+10 km', note: 'Patrimonio UNESCO' },
      { nome: 'Cassinasco', km: '+12 km', note: 'Borgo panoramico tra le vigne' },
      { nome: 'Mombaldone', km: '+12 km', note: 'Borgo medievale arroccato, vista mozzafiato' },
      { nome: 'Totale percorso', km: 'Totale: circa 50 km', note: 'Itinerario completo' },
    ],
    color: '#2C4A3E',
    colorLight: '#EBF2EF',
  },
  {
    id: 'barbera',
    icon: <IconWine />,
    title: 'Strada del Barbera',
    subtitle: "Il cuore della Barbera d'Asti",
    duration: 'Mezza giornata',
    difficulty: 'Facile',
    desc: "Il cuore della Barbera d'Asti tra colline rosse e vigneti storici. Da Costigliole raggiungi Nizza Monferrato, capitale indiscussa della Barbera, poi sali verso Vinchio e il suo piccolo gioiello di Vaglio Serra, dove le vigne raccontano secoli di storia.",
    tappe: [
      { nome: 'Nizza Monferrato', km: '16 km', note: "Capitale della Barbera d'Asti" },
      { nome: 'Vinchio', km: '+8 km', note: 'Cantine storiche e Bric Tre Vescovi' },
      { nome: 'Vaglio Serra', km: '+3 km', note: 'Borgo autentico tra i vigneti' },
      { nome: 'Totale percorso', km: 'Totale: circa 27 km', note: 'Itinerario completo' },
    ],
    color: '#6B2D3E',
    colorLight: '#F8EFF1',
  },
  {
    id: 'moscato',
    icon: <IconWine />,
    title: 'Strada del Moscato',
    subtitle: 'La Langa astigiana del Moscato Bianco',
    duration: 'Mezza giornata',
    difficulty: 'Facile',
    desc: "Il profumo dolce del Moscato Bianco tra i borghi della Langa astigiana. Un percorso che tocca i luoghi di Cesare Pavese e le colline patrimonio UNESCO dove nasce l'Asti Spumante.",
    tappe: [
      { nome: 'Santo Stefano Belbo', km: '12 km', note: 'Luoghi di Cesare Pavese e vigneti di Moscato' },
      { nome: 'Canelli', km: '+8 km', note: 'Cattedrali Sotterranee UNESCO' },
      { nome: 'Castiglione Tinella', km: '+12 km', note: 'Panorama mozzafiato sulle Langhe' },
      { nome: 'Totale percorso', km: 'Totale: circa 32 km', note: 'Itinerario completo' },
    ],
    color: '#5C4A1E',
    colorLight: '#F8F4EB',
  },
  {
    id: 'asti-spumante',
    icon: <IconWine />,
    title: "Strada dell'Asti Spumante",
    subtitle: 'Anello tra i borghi delle bollicine',
    duration: 'Mezza giornata',
    difficulty: 'Facile',
    desc: "Un anello breve e scenografico tra i borghi che hanno dato i natali alle prime bollicine italiane. Paesaggi vitivinicoli UNESCO a pochi minuti dall'hotel.",
    tappe: [
      { nome: 'Calosso', km: '10 km', note: "Borgo d'altura, crutin e vigneti di Moscato" },
      { nome: 'Canelli', km: '+10 km', note: "Cantine Gancia, Coppo, Contratto. Le prime bollicine d'Italia" },
      { nome: "Costigliole d'Asti", km: '+15 km', note: 'Rientro tra i vigneti di Barbera' },
      { nome: 'Totale percorso', km: 'Totale: circa 35 km', note: 'Itinerario completo' },
    ],
    color: '#2C4A3E',
    colorLight: '#EBF2EF',
  },
  {
    id: 'alta-langa',
    icon: <IconCastle />,
    title: 'Alta Langa, Borghi Autentici',
    subtitle: 'La parte più selvaggia e autentica del territorio',
    duration: '1 giorno',
    difficulty: 'Facile',
    desc: 'L\'Alta Langa è la parte più selvaggia e autentica del territorio: boschi, borghi silenziosi e formaggi DOP. Lontano dai circuiti turistici, vicino all\'essenziale.',
    tappe: [
      { nome: 'Cessole', km: '30 km', note: 'Borgo medievale tra boschi e vigneti' },
      { nome: 'Monastero Bormida', km: '+10 km', note: 'Abbazia benedettina e castello sul fiume Bormida' },
      { nome: 'Roccaverano', km: '+15 km', note: "Robiola DOP e panorami sull'Appennino" },
      { nome: 'Totale percorso', km: 'Totale: circa 55 km', note: 'Itinerario completo' },
    ],
    color: '#2C4A3E',
    colorLight: '#EBF2EF',
  },
  {
    id: 'borghi-belli',
    icon: <IconCastle />,
    title: "I Borghi Più Belli d'Italia",
    subtitle: 'Architettura, vino e storia tra Langhe e Roero',
    duration: '1 giorno',
    difficulty: 'Facile',
    desc: "Tre borghi certificati tra i più belli d'Italia, in un unico percorso tra Langhe e Roero. Architettura, vino e storia a pochi chilometri dall'hotel.",
    tappe: [
      { nome: 'Neive', km: '22 km', note: 'Centro storico medievale, Barbaresco e Dolcetto' },
      { nome: 'Guarene', km: '+8 km', note: 'Palazzo del Roero e vista sulla valle del Tanaro' },
      { nome: 'Cherasco', km: '+20 km', note: 'Borgo sabaudo, cioccolatini e lumache IGP' },
      { nome: 'Totale percorso', km: 'Totale: circa 50 km', note: 'Itinerario completo' },
    ],
    color: '#6B2D3E',
    colorLight: '#F8EFF1',
  },
  {
    id: 'acqui-terme',
    icon: <IconCastle />,
    title: 'Acqui Terme, La Città Romana',
    subtitle: 'Centro storico romano, acque sulfuree e buon vino',
    duration: '1 giorno',
    difficulty: 'Facile',
    desc: "A meno di un'ora dall'hotel, Acqui Terme è una delle città termali più antiche d'Italia. Centro storico romano, acque sulfuree e buon vino.",
    tappe: [
      { nome: 'Centro storico di Acqui Terme', km: '40 km', note: 'Cattedrale, Palazzo Vescovile e musei' },
      { nome: 'La Bollente', km: 'a piedi', note: 'La fontana di acqua sulfurea a 75° in piazza' },
      { nome: 'Terme e Stabilimenti', km: 'a piedi', note: 'Relax nelle acque curative' },
      { nome: 'Totale percorso', km: 'Totale: circa 40 km (andata)', note: 'Itinerario completo' },
    ],
    color: '#5C4A1E',
    colorLight: '#F8F4EB',
  },
  {
    id: 'rio-bragna',
    icon: <IconMap />,
    title: 'Riserva Naturale del Rio Bragna',
    subtitle: "Un'oasi naturalistica vicino all'hotel",
    duration: 'Mezza giornata',
    difficulty: 'Facile',
    desc: "Un'oasi naturalistica a due passi dall'hotel, poco conosciuta ma ricca di biodiversità. Boschi, canneti, fauna selvatica e vigneti UNESCO tutto intorno.",
    tappe: [
      { nome: 'Bricco Lu', km: 'a piedi dal centro', note: 'Panchina Gigante e panorama a 360° su Langhe, Monferrato e Alpi' },
      { nome: 'Riserva Naturale del Rio Bragna', km: 'percorso locale', note: 'Oasi LIPU, boschi di acero e fauna selvatica' },
      { nome: 'Calosso', km: '8 km', note: "Borgo d'altura con crutin e vigneti di Moscato" },
      { nome: 'Totale percorso', km: 'Totale: giornata breve, ideale per famiglie', note: 'Itinerario completo' },
    ],
    color: '#2C4A3E',
    colorLight: '#EBF2EF',
  },
  {
    id: 'valle-belbo-bici',
    icon: <IconMap />,
    title: 'Valle Belbo in Bici',
    subtitle: 'Percorso dolce tra vigneti e luoghi letterari',
    duration: 'Mezza giornata',
    difficulty: 'Facile',
    desc: 'Il fiume Belbo scorre tra vigneti UNESCO e colline letterarie. Un percorso dolce tra i luoghi di Cesare Pavese, perfetto per chi ama pedalare senza fatica.',
    tappe: [
      { nome: 'Santo Stefano Belbo', km: '12 km', note: 'Casa natale di Cesare Pavese, vigneti di Moscato' },
      { nome: 'Valle Belbo', km: 'percorso fluviale', note: 'Percorso lungo il fiume tra Langhe e Monferrato' },
      { nome: 'Canelli', km: '+8 km', note: 'Cattedrali Sotterranee e Castello Gancia' },
      { nome: 'Totale percorso', km: 'Totale: circa 20 km (andata/ritorno ~35 km)', note: 'Itinerario completo' },
    ],
    color: '#6B2D3E',
    colorLight: '#F8EFF1',
  },
  {
    id: 'panorami-roero',
    icon: <IconMap />,
    title: 'Panorami del Roero',
    subtitle: 'Rocche, boschi e castelli con vista sulle Alpi',
    duration: '1 giorno',
    difficulty: 'Facile',
    desc: 'Sulla sponda opposta del Tanaro, il Roero offre un paesaggio completamente diverso dalle Langhe: rocche, boschi e castelli barocchi con vista sulle Alpi.',
    tappe: [
      { nome: 'Guarene', km: '25 km', note: 'Castello barocco e belvedere sul Tanaro' },
      { nome: 'Govone', km: '+8 km', note: 'Residenza Sabauda UNESCO e centro storico' },
      { nome: 'Montà', km: '+12 km', note: 'Rocche del Roero e sentieri naturalistici' },
      { nome: 'Totale percorso', km: 'Totale: circa 45 km', note: 'Itinerario completo' },
    ],
    color: '#5C4A1E',
    colorLight: '#F8F4EB',
  },
]

const ESPERIENZE = [
  {
    id: 'bosca-cattedrali',
    icon: <IconWine />,
    title: 'Visita alle Cattedrali Sotterranee Bosca',
    subtitle: 'Patrimonio UNESCO tra storia e degustazione',
    duration: '70 minuti',
    difficulty: 'Su prenotazione',
    desc: 'Un viaggio nel cuore della storia spumantistica italiana, tra gallerie sotterranee dichiarate Patrimonio UNESCO. Scavate nel tufo nel corso dell\'Ottocento, le cantine si estendono per oltre 8 km di gallerie a una temperatura costante di 12°C, custodendo milioni di bottiglie in un silenzio quasi sacrale. Un\'esperienza unica che unisce storia, architettura sotterranea e il piacere della degustazione, difficile da dimenticare.',
    details: [
      { label: 'Cosa è incluso', value: 'Visita guidata alle cantine sotterranee e degustazione di 2 spumanti.' },
      { label: 'Prezzo a persona', value: '€25' },
      { label: 'Prenotazione', value: 'Si prega di avvisare in anticipo. Per gruppi superiori a 20 persone si consiglia di prenotare con almeno 1-2 mesi di anticipo.' },
      { label: 'Nota', value: 'Chiedi in reception per organizzare la tua esperienza.' },
    ],
    color: '#6B2D3E',
    colorLight: '#F8EFF1',
  },
  {
    id: 'birrificio-nicese',
    icon: <IconFork />,
    title: 'Nuovo Birrificio Nicese, Tour e Degustazione',
    subtitle: 'Birrificio artigianale nel cuore di Nizza Monferrato',
    duration: 'Su prenotazione',
    difficulty: 'Facile',
    desc: 'Nel cuore di Nizza Monferrato, questo birrificio artigianale è una delle realtà più interessanti e giovani del territorio astigiano. Qui la passione per la fermentazione incontra i sapori locali in un abbinamento insolito e sorprendente. Un\'esperienza perfetta per chi vuole scoprire un lato inedito del territorio, lontano dal solito percorso enologico, con tanta curiosità e qualche risata di mezzo.',
    details: [
      { label: 'Cosa è incluso', value: 'Visita allo stabilimento produttivo e degustazione di 3 birre artigianali abbinate a 3 sfiziosità del territorio.' },
      { label: 'Prezzo a persona', value: '€15' },
      { label: 'Prenotazione', value: 'Si prega di avvisare almeno 2-3 giorni prima così da poter organizzare al meglio e garantire la disponibilità dei posti.' },
      { label: 'Nota', value: 'Chiedi in reception per organizzare la tua esperienza.' },
    ],
    color: '#5C4A1E',
    colorLight: '#F8F4EB',
  },
  {
    id: 'tenuta-ronzano-degustazione',
    icon: <IconWine />,
    title: 'Tenuta Ronzano, Degustazione e Visita ai Vigneti',
    subtitle: 'Passeggiata tra i filari e degustazione finale',
    duration: '90 minuti',
    difficulty: 'Adatto a tutti',
    desc: 'Immersa tra le colline del Monferrato, la Tenuta Ronzano è una realtà familiare che produce vini di grande personalità nel rispetto della tradizione piemontese. Passeggiando tra i filari si capisce il territorio meglio che in qualsiasi libro: i vigneti raccontano stagioni, fatiche e passioni. La degustazione finale, accompagnata dalla storia dell\'azienda, chiude un cerchio perfetto tra paesaggio, cultura e buon vino. Adatto a tutti, anche ai più piccoli.',
    details: [
      { label: 'Cosa è incluso', value: 'Visita ai vigneti, storia dell\'azienda e degustazione.' },
      { label: 'Orari disponibili', value: '11:00, 14:30, 17:00' },
      { label: 'Giorni disponibili', value: 'lunedì, martedì, venerdì, sabato, domenica' },
      { label: 'Lingue', value: 'italiano, inglese, spagnolo' },
      { label: 'Animali e bambini', value: 'Animali al guinzaglio ammessi. Bambini fino a 17 anni gratuiti.' },
      { label: 'Prezzo a persona', value: '€35' },
      { label: 'Prenotazione', value: 'Si prega di avvisare almeno 1 ora prima così da poter organizzare al meglio e garantire la disponibilità dei posti.' },
      { label: 'Nota', value: 'Chiedi in reception per organizzare la tua esperienza.' },
    ],
    color: '#2C4A3E',
    colorLight: '#EBF2EF',
  },
  {
    id: 'tenuta-ronzano-tartufo',
    icon: <IconTruffle />,
    title: 'Tenuta Ronzano, Caccia al Tartufo',
    subtitle: 'Uscita in bosco con tartufaio professionista',
    duration: 'Su prenotazione',
    difficulty: 'Adatto a tutti',
    desc: 'Il tartufo bianco delle Langhe è uno dei prodotti più preziosi e misteriosi della gastronomia mondiale, e cercarlo nei boschi con un cane trufolatore addestrato è un\'emozione difficile da spiegare a parole. Accompagnati da un tartufaio esperto che conosce ogni angolo del territorio, scoprirete i segreti di questa antica tradizione: come si riconosce, come si conserva e soprattutto come si valorizza in cucina. Un\'esperienza autentica, lontana dai circuiti turistici, che rimane nel ricordo.',
    details: [
      { label: 'Cosa è incluso', value: 'Uscita in bosco con tartufaio professionista, ricerca e raccolta tartufi in stagione, lezione sulla ricerca, identificazione e usi in cucina.' },
      { label: 'Orari disponibili', value: '11:00, 14:30, 17:00' },
      { label: 'Giorni disponibili', value: 'lunedì, martedì, venerdì, sabato, domenica' },
      { label: 'Lingue', value: 'italiano, inglese, spagnolo' },
      { label: 'Animali e bambini', value: 'Animali non ammessi. Bambini fino a 17 anni gratuiti.' },
      { label: 'Prezzo a persona', value: '€87' },
      { label: 'Prenotazione', value: 'Si prega di verificare la disponibilità e avvisare in anticipo così da poter organizzare al meglio e garantire la disponibilità dei posti.' },
      { label: 'Nota', value: 'Chiedi in reception per organizzare la tua esperienza.' },
    ],
    color: '#6B2D3E',
    colorLight: '#F8EFF1',
  },
  {
    id: 'girobike',
    icon: <IconCar />,
    title: 'GiroBike, Noleggio E-Bike e Tour Guidati',
    subtitle: 'Pedalare tra vigneti UNESCO e borghi medievali',
    duration: 'Mezza giornata o più giorni',
    difficulty: 'Tutti i livelli',
    desc: 'Non c\'è modo migliore di scoprire Langhe e Monferrato che pedalare tra i vigneti con una bicicletta elettrica, sentendo il vento tra le colline e fermandosi dove si vuole, senza fretta. I percorsi proposti da GiroBike attraversano paesaggi UNESCO, borghi medievali, cantine e belvedere mozzafiato, con itinerari calibrati per ogni livello e ogni durata. Che sia una mezza giornata o un\'avventura di più giorni, ogni pedalata diventa un ricordo.',
    details: [
      { label: 'Cosa è incluso', value: 'E-bike, casco, zainetto, lucchetto, bomboletta riparazioni e mantellina antipioggia. Seggiolino bimbo disponibile su richiesta.' },
      { label: 'Percorsi disponibili', value: 'Canelli, Acqui Terme, Barbaresco, Nizza Monferrato e altri. Dai 40 agli 80 km, adatti a tutti i livelli.' },
      { label: 'Prezzi', value: 'Mezza giornata 8:00-12:30 oppure 15:00-19:30: €35 a persona.\n1 giorno 8:00-19:30: €45 a persona.\n2 giorni: €80 a persona.\n3 giorni: €110 a persona.' },
      { label: 'Trasporto dall\'hotel', value: '€20 a persona' },
      { label: 'Prenotazione', value: 'Si prega di avvisare in anticipo così da poter organizzare al meglio e garantire la disponibilità dei posti.' },
      { label: 'Nota', value: 'Chiedi in reception per organizzare la tua esperienza.' },
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
    icon: <IconFork color="#6B2D3E" />,
    posti: [
      { nome: 'Caffè Roma', city: "Costigliole d'Asti", tipo: 'Bar & Ristorante', distanza: '5 min · 2 km', prezzo: '', note: 'Punto di ritrovo storico del paese. Ottimo per colazione, pranzo veloce e aperitivo serale.', stars: 0, mapsUrl: 'https://maps.google.com/?cid=9928516582427539485' },
      { nome: 'Da Maddalena', city: "Costigliole d'Asti", tipo: 'Ristorante', distanza: '4 min · 2 km', prezzo: '', note: 'Cucina casalinga piemontese con ricette tramandate di generazione in generazione. Ambiente familiare e accogliente.', stars: 0, mapsUrl: 'https://maps.google.com/?cid=4775818953578267005' },
      { nome: 'Caffè Roma', city: "Costigliole d'Asti", tipo: 'Bar & Ristorante', distanza: '5 min · 2 km', prezzo: '', note: 'Bar e ristorante nel centro di Costigliole. Adatto per colazione, pranzo o un aperitivo veloce.', stars: 0, mapsUrl: 'https://maps.google.com/?cid=9928516582427539485' },
      { nome: 'Da Maddalena', city: "Costigliole d'Asti", tipo: 'Ristorante', distanza: '4 min · 2 km', prezzo: '', note: 'Ristorante locale a Costigliole. Cucina del territorio in un contesto familiare.', stars: 0, mapsUrl: 'https://maps.google.com/?cid=4775818953578267005' },
      { nome: 'Cascina Collavini', city: "Costigliole d'Asti", tipo: 'Ristorante', distanza: '7 min · 4 km', prezzo: '', note: 'Ristorante in cascina nelle vicinanze di Costigliole, immerso nel paesaggio delle colline.', stars: 0, mapsUrl: 'https://maps.google.com/?cid=18017544325139911957' },
      { nome: 'Osteria degli Aviatori', city: "Costigliole d'Asti", tipo: 'Osteria', distanza: '6 min · 3 km', prezzo: '', note: 'Osteria tradizionale vicino a Costigliole. Cucina piemontese e atmosfera informale.', stars: 0, mapsUrl: 'https://maps.google.com/?cid=3983580385303917586' },
      { nome: 'Campanarò', city: 'Asti', tipo: 'Ristorante', distanza: '20 min · 17 km', prezzo: '', note: 'Ristorante nel centro di Asti. Cucina piemontese in un ambiente curato.', stars: 0, mapsUrl: 'https://maps.google.com/?cid=1345060148191744011' },
      { nome: 'Osteria della Piazza', city: 'Asti', tipo: 'Osteria', distanza: '20 min · 17 km', prezzo: '', note: 'Osteria nel centro storico di Asti. Propone piatti tipici piemontesi in un contesto autentico.', stars: 0, mapsUrl: 'https://www.google.com/maps/place/?q=place_id:ChIJEX__-CGTh0cRqxVy-wmppLo' },
      { nome: 'Osteria del Diavolo', city: 'Asti', tipo: 'Osteria', distanza: '20 min · 17 km', prezzo: '', note: 'Osteria ad Asti con cucina del territorio. Ambiente caratteristico nel cuore della città.', stars: 0, mapsUrl: 'https://maps.google.com/?cid=14400559155194160874' },
      { nome: 'Osteria del Palio', city: 'Asti', tipo: 'Osteria', distanza: '20 min · 17 km', prezzo: '', note: 'Osteria tradizionale ad Asti, nei pressi della storica piazza del Palio.', stars: 0, mapsUrl: 'https://maps.google.com/?cid=1440883249581363485' },
      { nome: 'Osteria del Vicoletto', city: 'Alba', tipo: 'Osteria', distanza: '30 min · 25 km', prezzo: '', note: 'Osteria nel centro di Alba. Cucina delle Langhe in un ambiente raccolto e informale.', stars: 0, mapsUrl: 'https://maps.google.com/?cid=14774139596113606519' },
      { nome: 'Osteria dei Sognatori', city: 'Alba', tipo: 'Osteria', distanza: '30 min · 25 km', prezzo: '', note: 'Osteria ad Alba con cucina tipica del territorio. Atmosfera accogliente e menu legato alla stagione.', stars: 0, mapsUrl: 'https://maps.google.com/?cid=1051563570100926980' },
      { nome: 'Trattoria del Bollito', city: 'Alba', tipo: 'Trattoria', distanza: '30 min · 25 km', prezzo: '', note: 'Trattoria ad Alba incentrata sulla tradizione piemontese del bollito misto.', stars: 0, mapsUrl: 'https://maps.google.com/?cid=13184869369088396700' },
      { nome: 'Il Ritrovo Osteria', city: 'Alba', tipo: 'Osteria', distanza: '30 min · 25 km', prezzo: '', note: 'Osteria nel centro di Alba. Buona scelta per un pranzo o una cena in città.', stars: 0, mapsUrl: 'https://www.google.com/maps/place/?q=place_id:ChIJL2DCspuz0hIRCySlqDvcM1Y' },
    ]
  },
  {
    cat: 'Stellati',
    colorIcon: '#7A4A2E',
    colorBg: '#F7EFE7',
    icon: <IconStarMed color="#7A4A2E" />,
    posti: [
      { nome: 'Cannavacciuolo Le Cattedrali', city: 'Asti', tipo: 'Alta cucina stellata', distanza: '20 min · 17 km', prezzo: '€€€€€', note: 'Ristorante stellato negli spazi delle Cattedrali Sotterranee di Canelli. Alta cucina in un contesto unico.', stars: 0, mapsUrl: 'https://maps.google.com/?cid=1534933755741241525' },
      { nome: 'Il Cascinalenuovo', city: 'Asti', tipo: 'Alta cucina stellata', distanza: '18 min · 15 km', prezzo: '€€€€', note: 'Ristorante stellato Michelin in provincia di Asti. Cucina piemontese di alto livello.', stars: 0, mapsUrl: 'https://maps.google.com/?cid=1078124689107863587' },
      { nome: 'Piazza Duomo', city: 'Alba', tipo: 'Alta cucina stellata', distanza: '30 min · 25 km', prezzo: '€€€€€', note: 'Ristorante pluristellato Michelin nel centro di Alba. Uno dei più importanti indirizzi gastronomici d\'Italia.', stars: 0, mapsUrl: 'https://maps.google.com/?cid=12655798270026763359' },
      { nome: 'La Ciau del Tornavento', city: 'Alba', tipo: 'Alta cucina stellata', distanza: '35 min · 30 km', prezzo: '€€€€', note: 'Ristorante stellato Michelin a Treiso, nelle Langhe. Cucina del territorio con vista sulle colline.', stars: 0, mapsUrl: 'https://www.google.com/maps/place/?q=place_id:ChIJ0VNxv-O00hIR8ji-_VcmTxY' },
    ]
  },
  {
    cat: 'Pasticcerie',
    colorIcon: '#2C3A5C',
    colorBg: '#EBEEf5',
    icon: <IconCake color="#2C3A5C" />,
    posti: [
      { nome: 'Pasticceria Bisco', city: "Costigliole d'Asti", tipo: 'Pasticceria', distanza: '5 min · 2 km', prezzo: '', note: 'Pasticceria a Costigliole. Dolci freschi e prodotti da forno artigianali.', stars: 0, mapsUrl: 'https://www.google.com/maps/place/?q=place_id:ChIJ59Mb5JiMh0cRB3FO3UtUDDE' },
      { nome: 'Pasticceria Panetteria Austa', city: "Costigliole d'Asti", tipo: 'Pasticceria e panetteria', distanza: '5 min · 2 km', prezzo: '', note: 'Panetteria e pasticceria a Costigliole. Ideale per pane fresco, grissini e dolci da colazione.', stars: 0, mapsUrl: 'https://www.google.com/maps/place/?q=place_id:ChIJ_6BWGZyMh0cR8jizT5lDlXI' },
      { nome: 'Pasticceria Delizie', city: 'Alba', tipo: 'Pasticceria', distanza: '30 min · 25 km', prezzo: '', note: 'Pasticceria nel centro di Alba. Buona selezione di dolci e prodotti da forno.', stars: 0, mapsUrl: 'https://www.google.com/maps/place/?q=place_id:ChIJJR33DG-z0hIR4m5pMprXtCo' },
      { nome: "Pasticceria Sucrè", city: 'Alba', tipo: 'Pasticceria', distanza: '30 min · 25 km', prezzo: '', note: 'Pasticceria ad Alba. Dolci e creazioni artigianali da gustare in loco o portare con sé.', stars: 0, mapsUrl: 'https://www.google.com/maps/place/?q=place_id:ChIJ3-Af6Cyz0hIR4EJ0dAtSyEw' },
      { nome: 'Il Paradiso del Goloso', city: 'Alba', tipo: 'Pasticceria artigianale', distanza: '30 min · 25 km', prezzo: '', note: 'Pasticceria e cioccolateria artigianale ad Alba. Prodotti tipici delle Langhe tra cui nocciole e cioccolato.', stars: 0, mapsUrl: 'https://www.google.com/maps/place/?q=place_id:ChIJCXFUo3az0hIRMzk8FVBez9Y' },
      { nome: 'Corte di Canobbio', city: 'Cortemilia', tipo: 'Azienda agricola', distanza: '45 min · 38 km', prezzo: '', note: 'Azienda agricola a Cortemilia, nella zona delle nocciole Tonda Gentile delle Langhe. Vendita diretta di prodotti locali.', stars: 0, mapsUrl: 'https://www.google.com/maps/place/?q=place_id:ChIJbdwAK-zI0hIRtWk4E-F8CGc' },
    ]
  },
  {
    cat: 'Enoteche',
    colorIcon: '#4A1E5C',
    colorBg: '#F0EBF5',
    icon: <IconWine color="#4A1E5C" />,
    posti: [
      { nome: 'Vino & Bottega', city: "Costigliole d'Asti", tipo: 'Enoteca', distanza: '5 min · 2 km', prezzo: '', note: 'Enoteca a Costigliole con selezione di vini locali e prodotti tipici del territorio.', stars: 0, mapsUrl: 'https://www.google.com/maps/place/?q=place_id:ChIJSaravSaNh0cRjKgET_FzVrY' },
      { nome: 'Enoteca Regionale di Nizza', city: 'Nizza Monferrato', tipo: 'Enoteca regionale', distanza: '15 min · 12 km', prezzo: '', note: "Enoteca regionale a Nizza Monferrato. Punto di riferimento per i vini del Monferrato, in particolare la Barbera d'Asti.", stars: 0, mapsUrl: 'https://www.google.com/maps/place/?q=place_id:ChIJRatnKdyFh0cR1XJetBd39VY' },
      { nome: 'Cichin Vin e Crije', city: 'Alba', tipo: 'Enoteca', distanza: '30 min · 25 km', prezzo: '', note: 'Enoteca nel centro di Alba con selezione di vini delle Langhe e del Piemonte.', stars: 0, mapsUrl: 'https://www.google.com/maps/place/?q=place_id:ChIJB8l0bEOz0hIRipe1-vXhRyM' },
      { nome: 'Fracchia & Berchialla', city: 'Alba', tipo: 'Enoteca', distanza: '30 min · 25 km', prezzo: '', note: 'Enoteca ad Alba con mescita e prodotti del territorio. Buona sosta durante una visita in città.', stars: 0, mapsUrl: 'https://www.google.com/maps/place/?q=place_id:ChIJleEdM0Oz0hIRKxwy-6F3GVQ' },
      { nome: 'Enoteca Le Torri', city: 'Alba', tipo: 'Enoteca', distanza: '30 min · 25 km', prezzo: '', note: 'Enoteca nel centro storico di Alba. Vendita e degustazione di vini del territorio.', stars: 0, mapsUrl: 'https://www.google.com/maps/place/?q=place_id:ChIJKwQu1kKz0hIRw6VL-PwHAa8' },
    ]
  },
  {
    cat: 'Supermercati',
    colorIcon: '#2C4A3E',
    colorBg: '#EBF2EF',
    icon: <IconBag color="#2C4A3E" />,
    posti: [
      { nome: 'Conad', city: "Costigliole d'Asti", tipo: 'Supermercato', distanza: '5 min · 2 km', prezzo: '€', note: "Supermercato a Costigliole, il più vicino all'hotel. Prodotti freschi, acqua e tutto il necessario.", stars: 0, mapsUrl: 'https://maps.google.com/?cid=12127032683925357428' },
      { nome: 'Eurospin', city: 'Nizza Monferrato', tipo: 'Supermercato', distanza: '15 min · 12 km', prezzo: '€', note: 'Supermercato a Nizza Monferrato. Comodo se si è già in zona durante una gita.', stars: 0, mapsUrl: 'https://www.google.com/maps/place/?q=place_id:ChIJO9Dty9qFh0cRYoQvk3p48UI' },
      { nome: 'Spazio Conad', city: 'Alba', tipo: 'Supermercato', distanza: '30 min · 25 km', prezzo: '€€', note: 'Grande supermercato ad Alba. Utile se si visita la città e si vuole fare una spesa più completa.', stars: 0, mapsUrl: 'https://www.google.com/maps/place/?q=place_id:ChIJYV2HV0yz0hIRI3jCSCiqxMc' },
    ]
  },
  {
    cat: 'Farmacie',
    colorIcon: '#2C5C5A',
    colorBg: '#EAF6F5',
    icon: <IconCross color="#2C5C5A" />,
    posti: [
      { nome: 'Farmacia Verri', city: "Costigliole d'Asti", tipo: 'Farmacia', distanza: '5 min · 2 km', prezzo: '', note: 'Farmacia a Costigliole. Per farmaci da banco, parafarmacia e consigli di base.', stars: 0, mapsUrl: 'https://maps.google.com/?cid=11426589209451269087' },
      { nome: 'Farmacia del Boglietto', city: "Costigliole d'Asti", tipo: 'Farmacia', distanza: '5 min · 2 km', prezzo: '', note: 'Seconda farmacia a Costigliole, alternativa comoda in paese.', stars: 0, mapsUrl: 'https://maps.google.com/?cid=3812143189205499732' },
      { nome: 'Farmacia Dova', city: 'Nizza Monferrato', tipo: 'Farmacia', distanza: '15 min · 12 km', prezzo: '', note: 'Farmacia a Nizza Monferrato. Utile se si è in zona durante una visita in città.', stars: 0, mapsUrl: 'https://www.google.com/maps/place/?q=place_id:ChIJG1DSJdyFh0cRH3QOMPbcEFs' },
      { nome: 'Farmacia San Rocco', city: 'Nizza Monferrato', tipo: 'Farmacia', distanza: '15 min · 12 km', prezzo: '', note: 'Farmacia a Nizza Monferrato. Buona alternativa in caso di necessità durante una gita.', stars: 0, mapsUrl: 'https://www.google.com/maps/place/?q=place_id:ChIJcQhGxeWFh0cRwVK3OYWYZpk' },
      { nome: 'Farmacia Baldi', city: 'Nizza Monferrato', tipo: 'Farmacia', distanza: '15 min · 12 km', prezzo: '', note: 'Farmacia a Nizza Monferrato. Terza opzione in città per prodotti da banco e parafarmacia.', stars: 0, mapsUrl: 'https://www.google.com/maps/place/?q=place_id:ChIJawHUONyFh0cRGH41S6W_JWI' },
      { nome: 'Farmacia Centrale', city: 'Asti', tipo: 'Farmacia', distanza: '20 min · 17 km', prezzo: '', note: 'Farmacia nel centro di Asti. Comoda se si è in città per una visita o una gita.', stars: 0, mapsUrl: 'https://www.google.com/maps/place/?q=place_id:ChIJh8QkmiSTh0cRqOeVVI0CJ9w' },
      { nome: 'Lafarmacia Piazza Roma', city: 'Asti', tipo: 'Farmacia', distanza: '20 min · 17 km', prezzo: '', note: 'Farmacia in piazza Roma ad Asti. Facile da raggiungere nel centro città.', stars: 0, mapsUrl: 'https://www.google.com/maps/place/?q=place_id:ChIJrwRPASWTh0cRtmOypQifMDc' },
      { nome: 'Lafarmacia Divin Maestro', city: 'Alba', tipo: 'Farmacia', distanza: '30 min · 25 km', prezzo: '', note: 'Farmacia ad Alba. Utile se si è in zona durante una visita in città.', stars: 0, mapsUrl: 'https://www.google.com/maps/place/?q=place_id:ChIJQ4rQ3BKz0hIRgg31odOhUV4' },
    ]
  },
]

const MUOVERSI = [
  {
    icon: <IconCar />,
    title: 'In Auto',
    colorBg: '#F8F4EB',
    info: [
      { label: 'Asti Centro', val: '20 min, 17 km' },
      { label: 'Alba', val: '25 min, 20 km' },
      { label: 'Torino', val: '1 h, 79 km' },
      { label: 'Milano', val: '1h 45min, 140 km' },
      { label: 'Canelli', val: '20 minuti, 16 km' },
    ]
  },
  {
    icon: <IconTrain />,
    title: 'Mezzi Pubblici',
    colorBg: '#EBEEf5',
    info: [
      { label: 'Treno Costigliole d\'Asti', val: '5 km' },
      { label: 'Treno Vigliano d\'Asti', val: '7 km' },
    ]
  },
  {
    icon: <IconPlane />,
    title: 'Aeroporti',
    colorBg: '#EBF2EF',
    info: [
      { label: 'Aeroporto di Cuneo - Levaldigi', val: '65 km' },
      { label: 'Aeroporto di Torino', val: '106 km' },
      { label: 'Aeroporto di Genova-Sestri', val: '95 km' },
    ]
  },
  {
    icon: <IconTaxi />,
    title: 'Taxi & Transfer',
    colorBg: '#F8EFF1',
    info: [
      { label: 'Taxi Costigliole', val: '+39 0141 96 XXXX' },
      { label: 'Transfer su prenotazione', val: 'Chiedere alla reception' },
    ]
  },
]

// ─── COMPONENTS ───────────────────────────────────────────────────────────────

function InfoBar({ lang }: { lang: Lang }) {
  const ivory = '#FFFFFF'
  const txt = T.infoBar[lang]

  return (
    <div style={{ background: '#171312', borderBottom: `1px solid ${C.brownMid}` }}
      className="flex items-center justify-around px-4 pt-3 pb-5">
      {[
        { icon: <IconKey color={ivory} />, label: txt.checkin, val: txt.checkinVal },
        { icon: <IconDoor color={ivory} />, label: txt.checkout, val: txt.checkoutVal },
        { icon: <IconWifi color={ivory} />, label: txt.wifi, val: txt.wifiVal },
        { icon: <IconNavArrow color={ivory} />, label: txt.navigate, val: txt.navigateVal },
      ].map((item, i) => (
        <div key={i} className="flex flex-col items-center gap-1" style={{ paddingBottom: 6 }}>
          {item.icon}
          <span style={{ color: C.gold, fontSize: 10, lineHeight: '14px', fontWeight: 700, letterSpacing: '0.08em', fontFamily: 'Lato', minWidth: 64, textAlign: 'center' }}>{item.label}</span>
          <span style={{ color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: 'Lato' }}>{item.val}</span>
        </div>
      ))}
    </div>
  )
}

function WelcomeCard({ lang }: { lang: Lang }) {
  const txt = T.welcome[lang]
  const headerTxt = T.header[lang]

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
        {txt.title}
      </h2>
      <p style={{ color: '#FFFFFF', fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>
        {txt.body}
      </p>
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: `${C.gold}22`, border: `1px solid ${C.gold}55`,
          borderRadius: 20, padding: '6px 14px', width: 'fit-content'
        }}>
          <div style={{ display: 'inline-flex', gap: 2 }}>
            {Array.from({ length: (txt as any).stars || 4 }).map((_, i) => <IconStar key={i} color={C.gold} />)}
          </div>
          <span style={{ color: '#FFFFFF', fontSize: 13, fontWeight: 700 }}>{headerTxt.hotelName}</span>
        </div>
        <p style={{ color: '#FFFFFF', fontSize: 12, opacity: 0.9, margin: 0 }}>
          {(txt as any).description}
        </p>
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
        width: 52, height: 52, borderRadius: 14, background: C.brownMid,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>{icon}</div>
      <div style={{ textAlign: 'left', flex: 1 }}>
        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 16, color: C.brownMid, fontWeight: 600 }}>{title}</div>
        <div style={{ fontSize: 13, color: C.textLight, marginTop: 2 }}>{subtitle}</div>
      </div>
      <div style={{
        width: 28, height: 28, borderRadius: '50%', background: C.brownMid,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
      }}>
        <IconChevron color="#FFFFFF" />
      </div>
    </button>
  )
}

// ─── TABS ─────────────────────────────────────────────────────────────────────

function HomeTab({ setTab, lang }: { setTab: (tab: string) => void; lang: Lang }) {
  const ivory = '#FFFFFF'
  const txt = T.home[lang]

  return (
    <div>
      <InfoBar lang={lang} />
      <WelcomeCard lang={lang} />
      <div style={{ padding: '4px 16px 0' }}>
        <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, color: C.brownMid, marginBottom: 4 }}>
          {txt.exploreTitle}
        </h3>
        <p style={{ color: C.textLight, fontSize: 13, marginBottom: 16 }}>{txt.exploreSubtitle}</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '0 16px 24px' }}>
        <GuideCard icon={<IconBed active activeColor={ivory} activeFill={`${ivory}22`} />} title={txt.card1Title} subtitle={txt.card1Sub} onClick={() => setTab('soggiorno')} />
        <GuideCard icon={<IconMap active activeColor={ivory} />} title={txt.card2Title} subtitle={txt.card2Sub} onClick={() => setTab('esperienze')} />
        <GuideCard icon={<IconFork active activeColor={ivory} />} title={txt.card3Title} subtitle={txt.card3Sub} onClick={() => setTab('negozi')} />
        <GuideCard icon={<IconCar active activeColor={ivory} />} title={txt.card4Title} subtitle={txt.card4Sub} onClick={() => setTab('muoversi')} />
      </div>
    </div>
  )
}

function SoggiornoTab({ lang }: { lang: Lang }) {
  const txt = T.soggiorno[lang]
  const rules = txt.rules
  return (
    <div style={{ padding: '16px' }}>
      <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, color: C.brownMid, marginBottom: 4 }}>{txt.title}</h2>
      <p style={{ color: C.textLight, fontSize: 13, marginBottom: 20 }}>{txt.subtitle}</p>

      {/* Quick info boxes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        {[
          { icon: <IconKey />, label: txt.checkin, val: txt.quickCheckinRange },
          { icon: <IconDoor />, label: txt.checkout, val: txt.quickCheckoutRange },
          { icon: <IconWifi />, label: txt.wifi, val: txt.free },
          { icon: <IconParking />, label: txt.parking, val: txt.free },
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
          <span style={{ fontFamily: 'Playfair Display, serif', color: '#fff', fontSize: 16 }}>{txt.rulesTitle}</span>
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
        <div style={{ color: '#FFFFFF', fontFamily: 'Playfair Display, serif', fontSize: 15, marginBottom: 12 }}>{txt.contactsTitle}</div>
        {[
          { l: txt.contactsTitle.includes('Reception') ? 'Reception' : (lang === 'fr' ? 'Réception' : lang === 'de' ? 'Rezeption' : lang === 'es' ? 'Recepción' : 'Reception'), v: '+39 0141 961853', href: 'tel:+390141961853' },
          { l: 'WhatsApp', v: '+39 3518011730', href: 'https://wa.me/393518011730' },
          { l: 'Email', v: 'prenota@hotellanghemonferrato.com', href: 'mailto:prenota@hotellanghemonferrato.com' },
        ].map((c, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < 2 ? `1px solid ${C.brownAccent}` : 'none' }}>
            <span style={{ color: '#FFFFFF', fontSize: 13 }}>{c.l}</span>
            <a href={c.href} target={c.l === 'WhatsApp' ? '_blank' : undefined} rel={c.l === 'WhatsApp' ? 'noopener noreferrer' : undefined} style={{ color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>{c.v}</a>
          </div>
        ))}
      </div>
    </div>
  )
}

function EsperienzeTab({ lang }: { lang: Lang }) {
  const [open, setOpen] = useState<string | null>(null)
  const [cat, setCat] = useState<'visitare' | 'esperienze'>('visitare')
  const txt = T.esperienze[lang]
  const contentLang: 'it' | 'en' | 'fr' | 'de' | 'es' = lang

  const itinerari = ITINERARI.map((it) => {
    const tr = (T.itinerari[contentLang] as unknown as readonly any[]).find((x: any) => x.id === it.id)
    return tr ? { ...it, ...tr, tappe: tr.tappe } : it
  })

  const esperienzeData = ESPERIENZE.map((it) => {
    const tr = (T.esperienzeDati[contentLang] as unknown as readonly any[]).find((x: any) => x.id === it.id)
    return tr ? { ...it, ...tr, details: tr.details } : it
  })

  return (
    <div>
      <div style={{ padding: '16px 16px 0' }}>
        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, color: C.brownMid, marginBottom: 4 }}>{txt.title}</h2>
        <p style={{ color: C.textLight, fontSize: 13, marginBottom: 16 }}>{txt.subtitle}</p>
      </div>

      {/* Sub-menu tabs */}
      <div style={{ display: 'flex', gap: 8, padding: '0 16px 16px', overflowX: 'auto' }}>
        {[
          { id: 'visitare' as const, label: txt.tabVisitare },
          { id: 'esperienze' as const, label: txt.tabEsperienze },
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
            {itinerari.map((it) => (
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
                      {txt.labelTappe}
                    </div>
                    {it.tappe.map((t: any, i: number) => (
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {esperienzeData.map((it) => (
              <div key={it.id} style={{
                background: C.creamWhite, borderRadius: 18,
                border: `1px solid ${C.creamDark}`,
                overflow: 'hidden', boxShadow: '0 2px 12px rgba(30,17,10,0.08)',
              }}>
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

                {open === it.id && (
                  <div style={{ padding: '0 16px 16px', borderTop: `1px solid ${C.creamDark}` }}>
                    <p style={{ fontSize: 14, color: C.textMid, lineHeight: 1.65, margin: '12px 0' }}>{it.desc}</p>
                    <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 13, color: C.gold, marginBottom: 8, letterSpacing: '0.04em' }}>
                      {txt.labelDettagli}
                    </div>
                    {it.details.map((d: any, i: number) => (
                      <div key={i} style={{
                        display: 'flex', flexDirection: 'column', gap: 2,
                        padding: '8px 0', borderBottom: i < it.details.length - 1 ? `1px solid ${C.creamDark}` : 'none',
                      }}>
                        <span style={{ fontSize: 11, color: it.color, fontWeight: 700, letterSpacing: '0.04em' }}>{d.label.toUpperCase()}</span>
                        <span style={{ fontSize: 13, color: C.textLight, lineHeight: 1.55, whiteSpace: 'pre-line' }}>{d.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function NegoziTab({ lang }: { lang: Lang }) {
  const [cat, setCat] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const pillsRef = useRef<HTMLDivElement | null>(null)
  const dragStartXRef = useRef(0)
  const dragStartScrollLeftRef = useRef(0)
  const isMouseDownRef = useRef(false)
  const movedRef = useRef(false)
  const suppressNextButtonClickRef = useRef(false)
  const cats = NEGOZI.map(r => r.cat)
  const txt = T.negozi[lang]
  const notesLang: 'it' | 'en' | 'fr' | 'de' = lang === 'es' ? 'en' : lang
  const translatedNotes = T.negoziNotes[notesLang] as unknown as Record<string, readonly string[]>
  const catLang: 'it' | 'en' | 'fr' | 'de' | 'es' = lang
  const translatedCats = T.negoziCategories[catLang] as unknown as Record<string, string>

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
        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, color: C.brownMid, marginBottom: 4 }}>{txt.title}</h2>
        <p style={{ color: C.textLight, fontSize: 13, marginBottom: 16 }}>{txt.subtitle}</p>
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
          }}>{translatedCats[c] || c}</button>
        ))}
      </div>

      {/* Risultati */}
      <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {NEGOZI[cat].posti.map((p, i) => (
          <div key={i} style={{
            background: C.creamWhite, borderRadius: 18,
            border: `1px solid ${C.creamDark}`,
            overflow: 'hidden', boxShadow: '0 2px 12px rgba(30,17,10,0.08)',
          }}>
            {/* Header row: icon + info */}
            <div style={{ padding: '14px 14px 0', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              {/* Icon box */}
              <div style={{
                width: 48, height: 48, borderRadius: 12, background: NEGOZI[cat].colorBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>{NEGOZI[cat].icon}</div>
              {/* Text info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                  <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 15, color: C.brownMid, fontWeight: 600, lineHeight: 1.3 }}>{p.nome}</div>
                  {p.prezzo && <span style={{
                    background: NEGOZI[cat].colorBg, color: NEGOZI[cat].colorIcon,
                    fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, flexShrink: 0,
                  }}>{p.prezzo}</span>}
                </div>
                {/* City pill + tipo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
                  <span style={{
                    background: NEGOZI[cat].colorBg, color: NEGOZI[cat].colorIcon,
                    fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5, letterSpacing: 0.3,
                  }}>{p.city}</span>
                  <span style={{ fontSize: 12, color: C.gold, fontWeight: 700 }}>{p.tipo}</span>
                </div>
                {/* Distance */}
                {p.distanza && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 5 }}>
                    <IconClock />
                    <span style={{ fontSize: 12, color: C.textLight }}>{p.distanza} {txt.fromHotel}</span>
                  </div>
                )}
              </div>
            </div>
            {/* Descrizione */}
            {p.note && (
              <div style={{ padding: '8px 14px 0' }}>
                <p style={{ fontSize: 13, color: C.textLight, lineHeight: 1.55, margin: 0 }}>{translatedNotes[NEGOZI[cat].cat]?.[i] ?? p.note}</p>
              </div>
            )}
            {/* Footer: Maps button */}
            {p.mapsUrl && (
              <div style={{ padding: '10px 14px 14px', display: 'flex', justifyContent: 'flex-start' }}>
                <a href={p.mapsUrl} target="_blank" rel="noopener noreferrer" style={{
                  fontSize: 12, fontWeight: 700, color: '#fff',
                  background: C.brownMid, padding: '6px 14px', borderRadius: 8,
                  textDecoration: 'none',
                }}>{txt.mapsButton}</a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function MuoversiTab({ lang }: { lang: Lang }) {
  const txt = T.muoversi[lang]

  return (
    <div style={{ padding: '16px' }}>
      <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, color: C.brownMid, marginBottom: 4 }}>{txt.title}</h2>
      <p style={{ color: C.textLight, fontSize: 13, marginBottom: 20 }}>{txt.subtitle}</p>

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
              <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 17, color: C.brownMid }}>{txt.sections[i]?.title ?? m.title}</span>
            </div>
            {(txt.sections[i]?.info ?? m.info).map((row, j) => (
              <div key={j} style={{
                padding: '10px 16px',
                borderBottom: j < (txt.sections[i]?.info ?? m.info).length - 1 ? `1px solid ${C.creamDark}` : 'none',
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

const ALFRED_UI_TEXT: Record<Lang, {
  subtitle: string
  welcome: string
  placeholder: string
  send: string
  tempError: string
  loadingMessages: string[]
}> = {
  it: {
    subtitle: "Chat concierge dell'hotel",
    welcome: 'Ciao! Sono Alfred, il tuo concierge personale! 👋\nCome posso aiutarti?',
    placeholder: 'Scrivi un messaggio...',
    send: 'Invia',
    tempError: 'Al momento sto riordinando i registri, riprova tra un istante.',
    loadingMessages: [
      'Sto recuperando le informazioni per te...',
      'Un attimo di pazienza, sto controllando...',
      'Fammi un secondo, sto cercando il meglio per te...',
      'Sto verificando i dettagli...',
    ],
  },
  en: {
    subtitle: 'Hotel concierge chat',
    welcome: "Hi! I'm Alfred 👋\nHow can I help you during your stay?",
    placeholder: 'Type a message...',
    send: 'Send',
    tempError: 'I am tidying up the registers right now, please try again in a moment.',
    loadingMessages: [
      'Gathering information for you...',
      'One moment, checking that for you...',
      'Give me a second, finding the best for you...',
      'Verifying the details...',
    ],
  },
  fr: {
    subtitle: "Chat concierge de l'hôtel",
    welcome: 'Bonjour ! Je suis Alfred 👋\nComment puis-je vous aider pendant votre séjour ?',
    placeholder: 'Écrivez un message...',
    send: 'Envoyer',
    tempError: "Je suis en train d'organiser les registres, veuillez réessayer dans un instant.",
    loadingMessages: [
      'Je récupère les informations pour vous...',
      'Un instant, je vérifie cela...',
      'Donnez-moi une seconde, je trouve le mieux pour vous...',
      'Je vérifie les détails...',
    ],
  },
  de: {
    subtitle: 'Hotel-Concierge-Chat',
    welcome: 'Hallo! Ich bin Alfred 👋\nWie kann ich Ihnen während Ihres Aufenthalts helfen?',
    placeholder: 'Nachricht eingeben...',
    send: 'Senden',
    tempError: 'Ich ordne gerade die Register, bitte versuchen Sie es in einem Moment erneut.',
    loadingMessages: [
      'Ich hole die Informationen für Sie...',
      'Einen Moment, ich überprüfe das...',
      'Geben Sie mir eine Sekunde, ich finde das Beste für Sie...',
      'Ich verifiziere die Details...',
    ],
  },
  es: {
    subtitle: 'Chat de conserjería del hotel',
    welcome: '¡Hola! Soy Alfred 👋\n¿Cómo puedo ayudarte durante tu estancia?',
    placeholder: 'Escribe un mensaje...',
    send: 'Enviar',
    tempError: 'En este momento estoy ordenando los registros, inténtalo de nuevo en un instante.',
    loadingMessages: [
      'Estoy recabando información para ti...',
      'Un momento, déjame verificar eso...',
      'Dame un segundo, estoy buscando lo mejor para ti...',
      'Estoy verificando los detalles...',
    ],
  },
}

function AlfredTab({
  lang,
  hasSeenWelcome,
  onWelcomeShown,
  onBackHome,
}: {
  lang: Lang
  hasSeenWelcome: boolean
  onWelcomeShown: () => void
  onBackHome: () => void
}) {
  const uiTxt = ALFRED_UI_TEXT[lang]
  const personalConciergeLabel: Record<Lang, string> = {
    it: 'Il tuo concierge personale',
    en: 'Your personal concierge',
    fr: 'Votre concierge personnel',
    de: 'Ihr persönlicher Concierge',
    es: 'Tu conserje personal',
  }
  const backHomeLabel: Record<Lang, string> = {
    it: 'Torna alla Home',
    en: 'Back to Home',
    fr: "Retour à l'accueil",
    de: 'Zurück zur Startseite',
    es: 'Volver a Inicio',
  }
  const { messages, sendMessage: sendChatMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: '/api/alfred' }),
  })
  const [input, setInput] = useState('')
  const [showWelcome, setShowWelcome] = useState(hasSeenWelcome)
  const [animateWelcome, setAnimateWelcome] = useState(false)
  const [loadingElapsed, setLoadingElapsed] = useState(0)
  const [selectedLoadingMessage, setSelectedLoadingMessage] = useState('')
  const loading = status === 'submitted' || status === 'streaming'
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const loadingTimerRef = useRef<number | null>(null)

  useEffect(() => {
    if (hasSeenWelcome) {
      setShowWelcome(true)
      setAnimateWelcome(false)
      return
    }

    setShowWelcome(false)
    setAnimateWelcome(false)

    const timer = window.setTimeout(() => {
      setShowWelcome(true)
      setAnimateWelcome(true)
      onWelcomeShown()
    }, 1000)

    return () => {
      window.clearTimeout(timer)
    }
  }, [hasSeenWelcome, onWelcomeShown])

  useEffect(() => {
    if (!loading) {
      setLoadingElapsed(0)
      setSelectedLoadingMessage('')
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current)
        loadingTimerRef.current = null
      }
      return
    }

    setLoadingElapsed(0)
    
    loadingTimerRef.current = window.setTimeout(() => {
      const messages = uiTxt.loadingMessages
      const randomMessage = messages[Math.floor(Math.random() * messages.length)]
      setSelectedLoadingMessage(randomMessage)
      setLoadingElapsed(5000)
    }, 5000)

    return () => {
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current)
        loadingTimerRef.current = null
      }
    }
  }, [loading, uiTxt.loadingMessages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    setTimeout(scrollToBottom, 50)
  }, [messages, loading, error])

  const onSendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return

    sendChatMessage({ text })
    setInput('')
  }

  const getMessageText = (parts: Array<{ type: string; text?: string }>) =>
    parts
      .filter((part) => part.type === 'text' && typeof part.text === 'string')
      .map((part) => part.text)
      .join('\n')

  const getReadableErrorMessage = (rawMessage?: string) => {
    if (!rawMessage) return uiTxt.tempError

    const trimmed = rawMessage.trim()

    try {
      const parsed = JSON.parse(trimmed) as { error?: string; message?: string }
      if (typeof parsed.error === 'string' && parsed.error.trim()) return parsed.error
      if (typeof parsed.message === 'string' && parsed.message.trim()) return parsed.message
    } catch {
      // ignore parse errors and fallback below
    }

    return trimmed
  }

  const renderMessageContent = (rawText: string, role: 'assistant' | 'user') => {
    const normalizedText = rawText.replace(/\*([^*\n][^*\n]{0,120})\*\*/g, '**$1**')

    const regularLinkStyle = {
      color: role === 'user' ? '#F2EBDD' : C.brownMid,
      textDecoration: 'underline' as const,
      fontWeight: 600,
    }

    const renderInlineBold = (text: string, keyPrefix: string): React.ReactNode[] => {
      const boldRegex = /\*\*([^*]+)\*\*/g
      const inlineNodes: React.ReactNode[] = []
      let inlineLastIndex = 0
      let inlineMatch: RegExpExecArray | null

      while ((inlineMatch = boldRegex.exec(text)) !== null) {
        const [fullMatch, boldText] = inlineMatch
        const inlineIndex = inlineMatch.index

        if (inlineIndex > inlineLastIndex) {
          inlineNodes.push(text.slice(inlineLastIndex, inlineIndex).replace(/\*/g, ''))
        }

        inlineNodes.push(
          <strong key={`${keyPrefix}-bold-${inlineIndex}`} style={{ fontWeight: 700 }}>
            {boldText}
          </strong>,
        )

        inlineLastIndex = inlineIndex + fullMatch.length
      }

      if (inlineLastIndex < text.length) {
        inlineNodes.push(text.slice(inlineLastIndex).replace(/\*/g, ''))
      }

      return inlineNodes.length > 0 ? inlineNodes : [text.replace(/\*/g, '')]
    }

    const pushAutoLinked = (textChunk: string, keyPrefix: string, targetNodes: React.ReactNode[]) => {
      const autoLinkRegex = /([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\+?\d[\d\s().-]{6,}\d)/gi
      let subLastIndex = 0
      let autoMatch: RegExpExecArray | null

      while ((autoMatch = autoLinkRegex.exec(textChunk)) !== null) {
        const [fullMatch] = autoMatch
        const autoIndex = autoMatch.index

        if (autoIndex > subLastIndex) {
          targetNodes.push(...renderInlineBold(textChunk.slice(subLastIndex, autoIndex), `${keyPrefix}-inline-${autoIndex}`))
        }

        const isEmail = fullMatch.includes('@')

        if (isEmail) {
          targetNodes.push(
            <a key={`${keyPrefix}-email-${autoIndex}`} href={`mailto:${fullMatch}`} style={regularLinkStyle}>
              {fullMatch}
            </a>,
          )
        } else {
          const normalizedPhone = fullMatch.replace(/[^\d+]/g, '')
          const digitCount = normalizedPhone.replace(/\D/g, '').length
          if (digitCount >= 7) {
            targetNodes.push(
              <a key={`${keyPrefix}-phone-${autoIndex}`} href={`tel:${normalizedPhone}`} style={regularLinkStyle}>
                {fullMatch}
              </a>,
            )
          } else {
            targetNodes.push(fullMatch)
          }
        }

        subLastIndex = autoIndex + fullMatch.length
      }

      if (subLastIndex < textChunk.length) {
        targetNodes.push(...renderInlineBold(textChunk.slice(subLastIndex), `${keyPrefix}-inline-end`))
      }
    }

    const processLine = (lineText: string, lineKeyPrefix: string, targetNodes: React.ReactNode[]) => {
      const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g
      let lastIndex = 0
      let match: RegExpExecArray | null

      while ((match = linkRegex.exec(lineText)) !== null) {
        const [fullMatch, label, url] = match
        const matchIndex = match.index

        if (matchIndex > lastIndex) {
          pushAutoLinked(lineText.slice(lastIndex, matchIndex), `${lineKeyPrefix}-pre-${matchIndex}`, targetNodes)
        }

        const isWhatsapp = /^https?:\/\/wa\.me\/\d+/.test(url)
        const isAssistantWhatsapp = role === 'assistant' && isWhatsapp

        targetNodes.push(
          <a
            key={`${lineKeyPrefix}-link-${matchIndex}`}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={isAssistantWhatsapp
              ? {
                  display: 'inline-block',
                  marginTop: 8,
                  padding: '6px 10px',
                  borderRadius: 8,
                  background: '#25D366',
                  color: '#ffffff',
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: 12,
                }
              : regularLinkStyle}
          >
            {label}
          </a>,
        )

        lastIndex = matchIndex + fullMatch.length
      }

      if (lastIndex < lineText.length) {
        pushAutoLinked(lineText.slice(lastIndex), `${lineKeyPrefix}-final`, targetNodes)
      }
    }

    const allNodes: React.ReactNode[] = []
    const lines = normalizedText.split('\n')

    lines.forEach((line, lineIdx) => {
      const headingMatch = line.match(/^(#{1,3})\s+(.+)/)

      if (headingMatch) {
        const level = headingMatch[1].length
        const headingText = headingMatch[2]
        allNodes.push(
          <strong
            key={`heading-${lineIdx}`}
            style={{
              display: 'block',
              fontWeight: 700,
              fontSize: level === 1 ? 16 : level === 2 ? 15 : 14,
              marginTop: lineIdx > 0 ? 10 : 0,
              marginBottom: 2,
            }}
          >
            {headingText}
          </strong>,
        )
      } else {
        processLine(line, `line-${lineIdx}`, allNodes)
        if (lineIdx < lines.length - 1) {
          allNodes.push('\n')
        }
      }
    })

    return allNodes.length > 0 ? allNodes : renderInlineBold(normalizedText, 'fallback')
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        boxSizing: 'border-box',
        paddingBottom: 'calc(8px + env(safe-area-inset-bottom, 0px))',
      }}
    >
      <div style={{ padding: '16px 16px 8px' }}>
        <button
          onClick={onBackHome}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            border: 'none',
            background: 'transparent',
            color: C.textLight,
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            padding: '2px 0 8px',
          }}
        >
          <span style={{ fontSize: 14, lineHeight: 1 }}>←</span>
          <span>{backHomeLabel[lang]}</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              background: '#FFFFFF',
              border: `1px solid ${C.creamDark}`,
              boxShadow: '0 2px 8px rgba(30,17,10,0.10)',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            <img
              src={ALFRED_AVATAR_PRIMARY}
              alt="Alfred"
              onError={(e) => {
                const img = e.currentTarget
                if (img.src.includes(ALFRED_AVATAR_PRIMARY)) {
                  img.src = ALFRED_AVATAR_FALLBACK
                }
              }}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, color: C.brownMid }}>Alfred</h2>
            <span style={{ color: C.textLight, fontSize: 13 }}>- {personalConciergeLabel[lang]}</span>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '8px 16px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.length === 0 && showWelcome && (
          <div
            style={{
              alignSelf: 'flex-start',
              maxWidth: '85%',
              padding: '10px 12px',
              borderRadius: 14,
              background: C.creamWhite,
              color: C.textMid,
              border: `1px solid ${C.creamDark}`,
              boxShadow: '0 2px 8px rgba(30,17,10,0.06)',
              whiteSpace: 'pre-line',
              fontSize: 14,
              lineHeight: 1.45,
              animation: animateWelcome ? 'alfredWelcomeIn 420ms cubic-bezier(0.22, 1, 0.36, 1)' : 'none',
            }}
          >
            {uiTxt.welcome}
          </div>
        )}
        {messages.map((m) => {
          if (m.role !== 'user' && m.role !== 'assistant') return null

          const text = getMessageText((m.parts ?? []) as Array<{ type: string; text?: string }>).trim()
          if (!text) return null

          return (
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
              {renderMessageContent(text, m.role)}
            </div>
          )
        })}
        {error && (
          <div style={{
            alignSelf: 'flex-start',
            maxWidth: '85%',
            padding: '10px 12px',
            borderRadius: 14,
            background: C.creamWhite,
            color: C.textMid,
            border: `1px solid ${C.creamDark}`,
            boxShadow: '0 2px 8px rgba(30,17,10,0.06)',
            whiteSpace: 'pre-line',
            fontSize: 14,
            lineHeight: 1.45,
          }}>
            {getReadableErrorMessage(error.message)}
          </div>
        )}
        {loading && (
          <>
            {(() => {
              const hasAssistantContent = messages.some((m) => {
                if (m.role !== 'assistant') return false
                const text = getMessageText((m.parts ?? []) as Array<{ type: string; text?: string }>).trim()
                return text.length > 0
              })
              return !hasAssistantContent
            })() && loadingElapsed < 5000 && (
              <div style={{
                alignSelf: 'flex-start',
                maxWidth: '85%',
                padding: '10px 14px',
                borderRadius: 14,
                background: C.creamWhite,
                border: `1px solid ${C.creamDark}`,
                boxShadow: '0 2px 8px rgba(30,17,10,0.06)',
                display: 'flex',
                gap: 5,
                alignItems: 'center',
              }}>
                {[0, 1, 2].map((i) => (
                  <span key={i} style={{
                    width: 7, height: 7, borderRadius: '50%',
                    background: C.brownMid, opacity: 0.4,
                    animation: `alfredDot 1.2s ${i * 0.2}s infinite ease-in-out`,
                    display: 'inline-block',
                  }} />
                ))}
              </div>
            )}
            {(() => {
              const hasAssistantContent = messages.some((m) => {
                if (m.role !== 'assistant') return false
                const text = getMessageText((m.parts ?? []) as Array<{ type: string; text?: string }>).trim()
                return text.length > 0
              })
              return !hasAssistantContent
            })() && loadingElapsed >= 5000 && selectedLoadingMessage && (
              <div style={{
                alignSelf: 'flex-start',
                maxWidth: '85%',
                padding: '10px 12px',
                borderRadius: 14,
                background: C.creamWhite,
                color: C.textMid,
                border: `1px solid ${C.creamDark}`,
                boxShadow: '0 2px 8px rgba(30,17,10,0.06)',
                whiteSpace: 'pre-line',
                fontSize: 14,
                lineHeight: 1.45,
                fontStyle: 'italic',
                opacity: 0.8,
              }}>
                {selectedLoadingMessage}
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={{
        marginTop: 'auto',
        padding: '8px 16px 10px',
        background: 'linear-gradient(180deg, rgba(245,240,232,0.92) 0%, rgba(245,240,232,1) 35%)',
        borderTop: `1px solid ${C.creamDark}`,
      }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: C.creamWhite, border: `1px solid ${C.creamDark}`, borderRadius: 16, padding: 6, boxShadow: '0 2px 8px rgba(30,17,10,0.05)' }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onInput={(e) => {
              const el = e.currentTarget
              el.style.height = 'auto'
              el.style.height = `${Math.min(el.scrollHeight, 120)}px`
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                onSendMessage()
              }
            }}
            placeholder={uiTxt.placeholder}
            rows={1}
            style={{
              flex: 1,
              borderRadius: 14,
              border: 'none',
              padding: '8px 6px 8px 8px',
              fontSize: 16,
              outline: 'none',
              color: C.textMid,
              background: 'transparent',
              resize: 'none',
              minHeight: 42,
              maxHeight: 120,
              lineHeight: 1.4,
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          />
          <button
            onClick={onSendMessage}
            disabled={loading}
            style={{
              border: 'none',
              background: loading ? C.textLight : C.brownMid,
              color: '#F2EBDD',
              borderRadius: 13,
              padding: '0 14px',
              minHeight: 40,
              fontSize: 13,
              fontWeight: 700,
              cursor: loading ? 'default' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            {uiTxt.send}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── BOTTOM NAV ───────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: 'home', key: 'home', Icon: IconHome },
  { id: 'soggiorno', key: 'soggiorno', Icon: IconBed },
  { id: 'esperienze', key: 'esperienze', Icon: IconMap },
  { id: 'negozi', key: 'negozi', Icon: IconFork },
  { id: 'muoversi', key: 'muoversi', Icon: IconCar },
  { id: 'alfred', key: 'alfred', Icon: IconUser },
]

// ─── APP ──────────────────────────────────────────────────────────────────────

const LANGS = [
  { code: 'it' as Lang, label: 'Italiano', flag: '🇮🇹' },
  { code: 'en' as Lang, label: 'English', flag: '🇬🇧' },
  { code: 'fr' as Lang, label: 'Français', flag: '🇫🇷' },
  { code: 'de' as Lang, label: 'Deutsch', flag: '🇩🇪' },
  { code: 'es' as Lang, label: 'Español', flag: '🇪🇸' },
]

export default function GuestGuide() {
  const [tab, setTab] = useState('home')
  const [lang, setLang] = useState<Lang>('it')
  const [langOpen, setLangOpen] = useState(false)
  const [hasSeenAlfredWelcome, setHasSeenAlfredWelcome] = useState(false)
  const headerTxt = T.header[lang]
  const navTxt = T.nav[lang]
  const isAlfredTab = tab === 'alfred'

  useEffect(() => {
    if (typeof window === 'undefined') return
    const seen = window.sessionStorage.getItem('alfred-welcome-seen') === '1'
    if (seen) {
      setHasSeenAlfredWelcome(true)
    }
  }, [])

  const markAlfredWelcomeSeen = React.useCallback(() => {
    setHasSeenAlfredWelcome(true)
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('alfred-welcome-seen', '1')
    }
  }, [])

  const renderTab = () => {
    switch (tab) {
      case 'home': return <HomeTab setTab={setTab} lang={lang} />
      case 'soggiorno': return <SoggiornoTab lang={lang} />
      case 'esperienze': return <EsperienzeTab lang={lang} />
      case 'negozi': return <NegoziTab lang={lang} />
      case 'muoversi': return <MuoversiTab lang={lang} />
      case 'alfred': return <AlfredTab lang={lang} hasSeenWelcome={hasSeenAlfredWelcome} onWelcomeShown={markAlfredWelcomeSeen} onBackHome={() => setTab('home')} />
      default: return null
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      height: '100dvh',
      display: 'flex',
      justifyContent: 'center',
      background: '#D4C4A8',
      overflow: 'hidden',
    }}>
      {/* Phone shell */}
      <div style={{
        width: '100%',
        maxWidth: 430,
        minHeight: '100dvh',
        height: '100dvh',
        background: '#F5F0E8',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Header */}
        {!isAlfredTab && (
          <div className="mobile-compact-header" style={{
            background: '#171312',
            padding: '16px 16px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <div className="mobile-hide" style={{ fontFamily: 'Playfair Display, serif', color: C.gold, fontSize: 11, letterSpacing: '0.12em', marginBottom: 2 }}>
                {headerTxt.location}
              </div>
              <div style={{ fontFamily: 'Playfair Display, serif', color: '#fff', fontSize: 17, fontWeight: 600 }}>
                {headerTxt.hotelName}
              </div>
            </div>
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setLangOpen(o => !o)}
                style={{
                  width: 44, height: 44, borderRadius: 12,
                  border: 'none',
                  background: langOpen ? '#FFFFFF18' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                  cursor: 'pointer', padding: 0,
                }}
              >
                <span style={{ fontSize: 22, lineHeight: 1 }}>{LANGS.find(l => l.code === lang)?.flag}</span>
                <span style={{ color: '#FFFFFF88', fontSize: 10, lineHeight: 1 }}>▾</span>
              </button>
              {langOpen && (
                <div style={{
                  position: 'absolute', top: 50, right: 0,
                  background: '#1E1512',
                  border: `1px solid ${C.brownMid}`,
                  borderRadius: 14,
                  overflow: 'hidden',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                  zIndex: 100,
                  minWidth: 150,
                }}>
                  {LANGS.map((l, i) => (
                    <button
                      key={l.code}
                      onClick={() => { setLang(l.code); setLangOpen(false) }}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                        padding: '11px 16px',
                        background: lang === l.code ? `${C.brownMid}55` : 'transparent',
                        borderBottom: i < LANGS.length - 1 ? '1px solid #FFFFFF11' : 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <span style={{ fontSize: 20 }}>{l.flag}</span>
                      <span style={{
                        fontFamily: 'Lato, sans-serif', fontSize: 13, fontWeight: lang === l.code ? 700 : 400,
                        color: lang === l.code ? C.gold : '#FFFFFFCC',
                      }}>{l.label}</span>
                      {lang === l.code && <span style={{ marginLeft: 'auto', color: C.gold, fontSize: 12 }}>✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: isAlfredTab ? 'hidden' : 'auto',
            paddingBottom: isAlfredTab ? 0 : 90,
          }}
        >
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
          display: isAlfredTab ? 'none' : 'flex',
          justifyContent: 'space-between',
          padding: '8px 0 16px',
          boxShadow: '0 -4px 20px rgba(30,17,10,0.12)',
          zIndex: 100,
        }}>
          {NAV_ITEMS.map(({ id, key, Icon }) => (
            <button key={id} onClick={() => setTab(id)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              flex: 1, minWidth: 0,
              gap: 3, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 2px',
            }}>
              {id === 'alfred' ? (
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: '#FFFFFF',
                    border: `1px solid ${tab === id ? C.gold : C.creamDark}`,
                    boxShadow: tab === id ? '0 0 0 1px rgba(178,150,100,0.35)' : 'none',
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={ALFRED_AVATAR_PRIMARY}
                    alt="Alfred"
                    onError={(e) => {
                      const img = e.currentTarget
                      if (img.src.includes(ALFRED_AVATAR_PRIMARY)) {
                        img.src = ALFRED_AVATAR_FALLBACK
                      }
                    }}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              ) : (
                <div style={{ transform: 'scale(0.9)', transformOrigin: 'center' }}>
                  <Icon active={tab === id} />
                </div>
              )}
              <span style={{
                fontSize: 9, fontWeight: 700, letterSpacing: '0.02em', whiteSpace: 'nowrap',
                color: tab === id ? C.gold : C.textLight,
                transition: 'color 0.2s',
              }}>{navTxt[key as keyof typeof navTxt].toUpperCase()}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
