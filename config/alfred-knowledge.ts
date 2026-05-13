/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  ALFRED KNOWLEDGE BASE — Hotel Langhe & Monferrato
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const hotelInfo = {
  name: 'Hotel Langhe & Monferrato',
  tagline: 'Ospitalità nel cuore dei paesaggi vitivinicoli UNESCO.',
  address: 'Via Alba 15, 14010 Costigliole d’Asti (AT)',
  phone: '+39 0141 966521',
  email: 'info@hotellanghemonferrato.com',
  website: 'https://www.hotellanghemonferrato.com',
  description: `L'Hotel Langhe & Monferrato si trova a Costigliole d'Asti, in posizione strategica per visitare Asti e Alba. Offre 43 camere accoglienti e un moderno centro congressi, ideale per chi viaggia per piacere o per lavoro tra le colline del Piemonte.`,
}

export const checkInOut = {
  checkIn: {
    from: '14:00',
    until: '23:00',
    note: 'Per arrivi dopo le 23:00 è necessario avvisare la reception per organizzare l’accesso.',
  },
  checkOut: {
    until: '11:00',
    lateCheckOutNote: 'Il late check-out è possibile su richiesta e secondo disponibilità (può comportare un supplemento).',
  },
  earlyCheckInNote: 'È possibile richiedere l’entrata anticipata se la camera è già disponibile.',
}

export const colazione = {
  tipo: 'Buffet dolce e salato con prodotti del territorio',
  orario: {
    feriali: '07:00 – 10:00',
    weekend: '07:30 – 10:30',
  },
  dove: 'Sala colazioni al piano terra.',
  note: 'Segnalare eventuali intolleranze alimentari al momento della prenotazione.',
  prodottiNotevoli: [
    'Torte e crostate artigianali',
    'Salumi e formaggi locali',
    'Selezione di yogurt e cereali',
    'Caffetteria espressa',
  ],
}

export const camere = [
  {
    tipologia: 'Camera Standard',
    descrizione: 'Soluzione pratica e confortevole, dotata di tutti i servizi essenziali.',
    dotazioni: ['Wi-Fi gratuito', 'Aria condizionata', 'TV satellitare', 'Cassaforte', 'Minibar', 'Asciugacapelli'],
    dimensioni: '18 m²',
    note: 'Prezzi da 85€ a 110€ circa.',
  },
  {
    tipologia: 'Camera Superior',
    descrizione: 'Camera più spaziosa, spesso dotata di balcone con vista sulle colline circostanti.',
    dotazioni: ['Wi-Fi gratuito', 'Aria condizionata', 'Balcone (nella maggior parte)', 'TV', 'Minibar'],
    dimensioni: '25 m²',
    note: 'Prezzi da 110€ a 140€ circa.',
  },
  {
    tipologia: 'Junior Suite',
    descrizione: 'Ampia camera con angolo soggiorno per un maggiore comfort durante il soggiorno.',
    dotazioni: ['Angolo salotto', 'Wi-Fi gratuito', 'Aria condizionata', 'Minibar'],
    dimensioni: '35 m²',
    note: 'Prezzi da 145€ a 180€ circa.',
  },
  {
    tipologia: 'Suite con Jacuzzi',
    descrizione: 'La nostra sistemazione più esclusiva con vasca idromassaggio privata in camera.',
    dotazioni: ['Vasca idromassaggio Jacuzzi', 'Letto matrimoniale ampio', 'Set cortesia superiore'],
    dimensioni: '45 m²',
    note: 'Prezzi da 190€ a 260€ circa.',
  },
]

export const servizi = {
  gratuiti: [
    'Connessione Wi-Fi gratuita in tutta la struttura',
    'Ampio parcheggio esterno gratuito (anche per bus)',
    'Deposito bagagli',
    'Assistenza per prenotazione tour e ristoranti',
  ],
  aRichiesta: [
    'Noleggio biciclette ed E-Bike',
    'Servizio navetta/transfer su prenotazione',
    'Prenotazione di visite in cantina',
    'Culla per bambini (su richiesta)',
  ],
  parcheggio: {
    disponibile: true,
    gratuito: true,
    note: 'Ampio parcheggio privato disponibile gratuitamente davanti all’hotel.',
  },
  animali: {
    ammessi: true,
    note: 'Gli animali di piccola taglia sono i benvenuti con un supplemento di 15€ per la pulizia finale.',
  },
  wifi: {
    gratuito: true,
    note: 'Connessione Wi-Fi disponibile gratuitamente nelle camere e nelle aree comuni.',
  },
}

export const ristorazione = {
  ristorante: {
    disponibile: true,
    nome: 'Servizio Ristorazione',
    descrizione: 'L’hotel collabora con ottimi ristoranti locali e dispone di sale per cene di gruppo e business.',
    orari: { pranzo: 'Su richiesta', cena: '19:30 - 21:30' },
    note: 'Consigliamo di chiedere alla reception per prenotazioni nei migliori locali tipici di Costigliole d’Asti.',
  },
  bar: {
    disponibile: true,
    orario: 'Aperto fino alle 23:00',
    note: 'Ideale per un caffè o un calice di vino locale.',
  },
  ristaurantiConsigliati: [
    { nome: 'Ristoranti di Costigliole d’Asti', dove: 'Centro paese', tipo: 'Cucina tipica piemontese', prenotazione: 'Consigliata' },
  ],
}

export const pacchetti = [
  {
    nome: 'Soggiorno Relax & Wellness',
    descrizione: 'Pernottamento in Suite con Jacuzzi e colazione inclusa.',
    durata: 'Minimo 1 notte',
    include: ['Pernottamento in Suite', 'Uso Jacuzzi privata', 'Colazione a buffet'],
    prezzoOrientativo: 'Contattare per offerta personalizzata',
    note: 'Perfetto per coppie.',
  },
]

export const territorio = {
  introduzione: `Ci troviamo a Costigliole d'Asti, punto d'incontro tra Langhe e Monferrato, territori famosi per i vini e il tartufo.`,
  distanze: [
    { luogo: 'Asti', km: '15 km', minuti: '15 min' },
    { luogo: 'Alba', km: '20 km', minuti: '20 min' },
    { luogo: 'Acqui Terme', km: '40 km', minuti: '40 min' },
    { luogo: 'Torino', km: '75 km', minuti: '55 min' },
  ],
  attivitaConsigliate: [
    'Visita alle cantine della Barbera d’Asti e del Moscato',
    'Gite al Castello di Costigliole d’Asti',
    'Ricerca del tartufo con guida e cane (stagionale)',
    'Percorsi in bicicletta tra i vigneti UNESCO',
  ],
}

export const faq = [
  { domanda: 'C’è il parcheggio?', risposta: 'Sì, l’hotel dispone di un ampio parcheggio gratuito proprio davanti all’ingresso.' },
  { domanda: 'Gli animali possono venire?', risposta: 'Sì, accettiamo animali di piccola taglia con un supplemento di 15 euro.' },
  { domanda: 'Avete il Wi-Fi?', risposta: 'Sì, la connessione Wi-Fi è gratuita e disponibile in tutte le camere.' },
]

export function buildKnowledgeText(): string {
  const camereText = camere
    .map(
      (c) =>
        `- ${c.tipologia} (${c.dimensioni}): ${c.descrizione}\n  Dotazioni: ${c.dotazioni.join(', ')}\n  Note: ${c.note}`,
    )
    .join('\n')

  const pacchettText = pacchetti
    .map(
      (p) =>
        `- ${p.nome} (${p.durata}): ${p.descrizione}\n  Include: ${p.include.join(', ')}\n  Prezzo orientativo: ${p.prezzoOrientativo}\n  Note: ${p.note}`,
    )
    .join('\n')

  const faqText = faq
    .map((f) => `D: ${f.domanda}\nR: ${f.risposta}`)
    .join('\n\n')

  const distanzeText = territorio.distanze
    .map((d) => `  - ${d.luogo}: ${d.km} (${d.minuti})`)
    .join('\n')

  return `
══════════════════════════════════════════════
  HOTEL: ${hotelInfo.name}
══════════════════════════════════════════════
${hotelInfo.description}
Indirizzo: ${hotelInfo.address}
Telefono: ${hotelInfo.phone}
Email: ${hotelInfo.email}
Sito: ${hotelInfo.website}

── CHECK-IN / CHECK-OUT ──────────────────────
Check-in: dalle ${checkInOut.checkIn.from} alle ${checkInOut.checkIn.until}
${checkInOut.checkIn.note}
Check-out: entro le ${checkInOut.checkOut.until}
${checkInOut.checkOut.lateCheckOutNote}

── COLAZIONE ──────────────────────────────────
Tipo: ${colazione.tipo}
Feriali: ${colazione.orario.feriali} | Weekend: ${colazione.orario.weekend}
Note: ${colazione.note}
Prodotti: ${colazione.prodottiNotevoli.join(', ')}

── CAMERE ─────────────────────────────────────
${camereText}

── SERVIZI ────────────────────────────────────
Gratuiti: ${servizi.gratuiti.join(', ')}
Su richiesta: ${servizi.aRichiesta.join(', ')}
Parcheggio: ${servizi.parcheggio.note}
Animali: ${servizi.animali.note}
Wi-Fi: ${servizi.wifi.note}

── RISTORAZIONE ───────────────────────────────
${ristorazione.ristorante.nome}: ${ristorazione.ristorante.descrizione}
Orari Cena: ${ristorazione.ristorante.orari.cena}
Bar: ${ristorazione.bar.orario} — ${ristorazione.bar.note}

── TERRITORIO ─────────────────────────────────
${territorio.introduzione}
Distanze:
${distanzeText}

── FAQ ────────────────────────────────────────
${faqText}
══════════════════════════════════════════════
`.trim()
}