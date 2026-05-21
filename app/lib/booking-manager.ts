/**
 * Booking Manager - Conversational booking flow with cost calculation
 */

export type RoomType = 'singola' | 'matrimoniale' | 'doppia' | 'tripla' | 'quadrupla' | 'suite'
export type BreakfastOption = 'inclusa' | 'esclusa'

export interface BookingData {
  // Dates
  checkIn?: string // YYYY-MM-DD
  checkOut?: string // YYYY-MM-DD
  nights?: number

  // Guests
  adults?: number
  children?: number

  // Rooms
  rooms?: Array<{ type: RoomType; count: number }>

  // Options
  breakfast?: BreakfastOption
  lateCheckout?: boolean
  petCount?: number

  // Special requests
  notes?: string

  // Contact
  name?: string
  surname?: string
  email?: string
  phone?: string
  arrivalTime?: string

  // Metadata
  confirmed?: boolean
  bookingNumber?: number
}

// Room prices per night (in EUR)
const ROOM_PRICES: Record<RoomType, number> = {
  singola: 60,
  matrimoniale: 90,
  doppia: 80,
  tripla: 110,
  quadrupla: 140,
  suite: 200,
}

const CITY_TAX_PER_PERSON_PER_NIGHT = 2 // EUR
const LATE_CHECKOUT_SUPPLEMENT = 15 // EUR flat
const PET_SUPPLEMENT_PER_NIGHT = 15 // EUR per pet per night
const BREAKFAST_SUPPLEMENT_PER_PERSON_PER_NIGHT = 12 // EUR (if added)

export function calculateBookingCosts(data: BookingData): {
  roomsTotal: number
  supplementsTotal: number
  cityTaxTotal: number
  grandTotal: number
  breakdown: Record<string, number>
} {
  const breakdown: Record<string, number> = {}

  // Room cost
  let roomsTotal = 0
  if (data.rooms && data.nights) {
    data.rooms.forEach(({ type, count }) => {
      const pricePerRoom = ROOM_PRICES[type] || 0
      const cost = pricePerRoom * count * data.nights!
      roomsTotal += cost
      breakdown[`Camere ${type} (${count}x${data.nights}n)`] = cost
    })
  }

  // Supplements
  let supplementsTotal = 0

  if (data.lateCheckout) {
    breakdown['Late Checkout'] = LATE_CHECKOUT_SUPPLEMENT
    supplementsTotal += LATE_CHECKOUT_SUPPLEMENT
  }

  if (data.petCount && data.petCount > 0 && data.nights) {
    const petCost = PET_SUPPLEMENT_PER_NIGHT * data.petCount * data.nights
    breakdown[`Animali (${data.petCount}x${data.nights}n)`] = petCost
    supplementsTotal += petCost
  }

  // Breakfast supplement (if "esclusa" by default, but could add dynamically)
  // For now, breakfast cost is already in room price or mentioned separately

  // City tax
  let cityTaxTotal = 0
  if (data.nights) {
    const guestCount = (data.adults || 0) + (data.children || 0)
    cityTaxTotal = CITY_TAX_PER_PERSON_PER_NIGHT * guestCount * data.nights
    breakdown['Tassa di soggiorno'] = cityTaxTotal
  }

  const grandTotal = roomsTotal + supplementsTotal + cityTaxTotal

  return {
    roomsTotal,
    supplementsTotal,
    cityTaxTotal,
    grandTotal,
    breakdown,
  }
}

export function isBookingDataComplete(data: BookingData): boolean {
  return Boolean(
    data.checkIn &&
      data.checkOut &&
      data.nights &&
      data.adults &&
      data.rooms &&
      data.rooms.length > 0 &&
      data.breakfast &&
      data.name &&
      data.surname &&
      data.email &&
      data.phone &&
      data.arrivalTime,
  )
}

export function getNextBookingQuestion(data: BookingData): string | null {
  if (!data.checkIn)
    return 'Quando prevedi di arrivare in hotel? (es. domani, 25 maggio, 2026-05-25)'
  if (!data.checkOut)
    return 'E quando parti? (es. 27 maggio, 2026-05-27)'
  if (!data.adults) return 'Quanti adulti in totale?'
  if (data.adults > 0 && data.children === undefined)
    return 'Ci sono bambini? Se no, puoi dire "nessuno".'
  if (!data.rooms || data.rooms.length === 0)
    return 'Che tipo di camere ti serve? (es. una matrimoniale e una singola, 2 doppie, una suite)'
  if (!data.breakfast) return 'Desideri la colazione inclusa?'
  if (data.lateCheckout === undefined) return 'Hai bisogno del late checkout?'
  if (data.petCount === undefined) return 'Porti animali domestici?'
  if (!data.notes) return 'Hai richieste speciali o intolleranze?'
  if (!data.name) return 'Qual è il tuo nome e cognome?'
  if (!data.email) return 'Qual è il tuo indirizzo email?'
  if (!data.phone) return 'Qual è il tuo numero di cellulare?'
  if (!data.arrivalTime)
    return 'A che ora contiamo di averti alla reception? (es. 14:00, pomeriggio, sera)'
  return null
}

export function formatBookingSummary(data: BookingData, costs: ReturnType<typeof calculateBookingCosts>): string {
  const nights = data.nights || 0
  const roomsStr = data.rooms?.map((r) => `${r.count} ${r.type}`).join(', ') || '-'
  const animalsStr = data.petCount ? `${data.petCount}` : 'Nessuno'
  const checkoutStr = data.lateCheckout ? 'Sì' : 'No'
  const fullName = `${data.name} ${data.surname}`.trim()
  const breakfastStr = data.breakfast === 'inclusa' ? 'Inclusa' : 'Esclusa'

  let summary = '*Ecco un riepilogo della tua richiesta:*\n\n'
  summary += `🗓️ *Soggiorno:* dal ${data.checkIn} al ${data.checkOut} (${nights} notte${nights !== 1 ? 'i' : ''})\n\n`
  summary += `🛏️ *Camere:* ${roomsStr}\n\n`
  summary += `🥐 *Colazione:* ${breakfastStr}\n\n`
  summary += `🐾 *Animali:* ${animalsStr} | ⏱️ *Late Checkout:* ${checkoutStr}\n\n`
  summary += `👤 *Ospite:* ${fullName}\n`
  summary += `📧 ${data.email}\n`
  summary += `📱 ${data.phone}\n`
  summary += `🕐 *Arrivo previsto:* ${data.arrivalTime}\n\n`
  summary += `*Dettaglio Economico:*\n`

  Object.entries(costs.breakdown).forEach(([key, value]) => {
    summary += `• ${key}: €${value.toFixed(2)}\n`
  })

  summary += `\n*💰 TOTALE COMPLESSIVO: €${costs.grandTotal.toFixed(2)}*\n\n`
  summary += `I dati sono corretti? Puoi dirmi "sì, conferma" oppure quale dato modificare.`

  return summary
}

export function formatBookingEmail(data: BookingData, costs: ReturnType<typeof calculateBookingCosts>, bookingNumber: number): {
  subject: string
  body: string
} {
  const fullName = `${data.name} ${data.surname}`.trim()
  const nights = data.nights || 0
  const roomsStr = data.rooms?.map((r) => `${r.count} ${r.type}`).join(', ') || '-'

  const subject = `Alfred - Richiesta Prenotazione #${bookingNumber} - ${fullName}`

  let body = `Nuova richiesta di prenotazione da Alfred Chat Widget\n\n`
  body += `NUMERO PRENOTAZIONE: #${bookingNumber}\n`
  body += `CLIENTE: ${fullName}\n`
  body += `EMAIL: ${data.email}\n`
  body += `TELEFONO: ${data.phone}\n\n`
  body += `--- DETTAGLI SOGGIORNO ---\n`
  body += `Check-in: ${data.checkIn} (ore ${data.arrivalTime || 'n.d.'})\n`
  body += `Check-out: ${data.checkOut}\n`
  body += `Numero notti: ${nights}\n`
  body += `Camere richieste: ${roomsStr}\n`
  body += `Ospiti: ${data.adults} adulti${data.children ? `, ${data.children} bambini` : ''}\n\n`
  body += `--- OPZIONI ---\n`
  body += `Colazione: ${data.breakfast === 'inclusa' ? 'Inclusa' : 'Esclusa'}\n`
  body += `Late Checkout: ${data.lateCheckout ? 'Sì (+€15)' : 'No'}\n`
  body += `Animali domestici: ${data.petCount || 0}\n\n`
  body += `--- NOTE SPECIALI ---\n`
  body += `${data.notes || '(nessuna)'}\n\n`
  body += `--- RIEPILOGO ECONOMICO ---\n`

  Object.entries(costs.breakdown).forEach(([key, value]) => {
    body += `${key}: €${value.toFixed(2)}\n`
  })

  body += `\nTOTALE COMPLESSIVO: €${costs.grandTotal.toFixed(2)}\n\n`
  body += `---\n`
  body += `Questa richiesta è stata inviata da Alfred, il concierge virtuale dell'Hotel Langhe & Monferrato.\n`
  body += `Si prega di contattare il cliente al numero fornito per confermare la disponibilità.\n`

  return { subject, body }
}
