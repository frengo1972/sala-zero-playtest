// Bolle di Pelo — tutti i numeri del gioco. Modificare qui per bilanciare.
(function (radice) {
  const DATI = {
    versione: "0.1.0",
    salvataggio: "bolle-di-pelo-v1",
    giorniPerMese: 10,
    mesi: 3,
    cassaIniziale: 1500,
    minutiPerOperatore: 480, // una giornata di lavoro (8 ore)

    taglie: {
      piccola: { nome: "piccola", prezzo: 1.0, tempo: 1.0, prodotti: 1.0 },
      media: { nome: "media", prezzo: 1.3, tempo: 1.4, prodotti: 1.4 },
      grande: { nome: "grande", prezzo: 1.7, tempo: 1.9, prodotti: 2.0 }
    },

    // prezzo di riferimento = quanto si aspetta di pagare un cliente medio per un animale di taglia piccola
    servizi: {
      bagno: { nome: "Bagno e asciugatura", breve: "Bagno", icona: "🛁", minuti: 30, prodotti: 3, riferimento: 20, minimo: 8, massimo: 50 },
      tosatura: { nome: "Taglio e tosatura", breve: "Tosatura", icona: "✂️", minuti: 45, prodotti: 2, riferimento: 28, minimo: 10, massimo: 70 },
      spa: { nome: "Coccole Spa (bagno, taglio, profumo e fiocchetto)", breve: "Spa", icona: "🎀", minuti: 80, prodotti: 7, riferimento: 50, minimo: 20, massimo: 120 }
    },

    // sens: sensibilità al prezzo (più alta = guarda di più il prezzo)
    // serv: quanto spesso chiede ciascun servizio
    razze: [
      { id: "chihuahua", nome: "Chihuahua", specie: "cane", taglia: "piccola", pelo: "corto", freq: 6, sens: 1.0, serv: { bagno: 6, tosatura: 1, spa: 3 }, colore: "#e9c49b", macchia: "#f7e6cf", orecchie: "punta" },
      { id: "pomerania", nome: "Volpino di Pomerania", specie: "cane", taglia: "piccola", pelo: "lungo", freq: 5, sens: 0.85, serv: { bagno: 3, tosatura: 4, spa: 4 }, colore: "#f3a75c", macchia: "#fde3c2", orecchie: "punta", soffice: true },
      { id: "bassotto", nome: "Bassotto", specie: "cane", taglia: "piccola", pelo: "corto", freq: 6, sens: 1.1, serv: { bagno: 7, tosatura: 1, spa: 2 }, colore: "#9a5e32", macchia: "#c98a55", orecchie: "cadenti" },
      { id: "shihtzu", nome: "Shih Tzu", specie: "cane", taglia: "piccola", pelo: "lungo", freq: 5, sens: 0.9, serv: { bagno: 2, tosatura: 5, spa: 4 }, colore: "#f6efe4", macchia: "#b98656", orecchie: "cadenti", soffice: true },
      { id: "barboncino", nome: "Barboncino", specie: "cane", taglia: "media", pelo: "lungo", freq: 5, sens: 0.8, serv: { bagno: 1, tosatura: 6, spa: 4 }, colore: "#fff6ea", macchia: "#fff6ea", orecchie: "cadenti", soffice: true },
      { id: "beagle", nome: "Beagle", specie: "cane", taglia: "media", pelo: "corto", freq: 6, sens: 1.15, serv: { bagno: 7, tosatura: 1, spa: 2 }, colore: "#c98546", macchia: "#ffffff", orecchie: "cadenti" },
      { id: "corgi", nome: "Corgi", specie: "cane", taglia: "media", pelo: "corto", freq: 5, sens: 1.0, serv: { bagno: 6, tosatura: 2, spa: 2 }, colore: "#eb9a4c", macchia: "#ffffff", orecchie: "punta" },
      { id: "cocker", nome: "Cocker spaniel", specie: "cane", taglia: "media", pelo: "lungo", freq: 4, sens: 0.95, serv: { bagno: 3, tosatura: 5, spa: 3 }, colore: "#b5652b", macchia: "#d48a4f", orecchie: "cadenti", soffice: true },
      { id: "labrador", nome: "Labrador", specie: "cane", taglia: "grande", pelo: "corto", freq: 6, sens: 1.1, serv: { bagno: 8, tosatura: 1, spa: 1 }, colore: "#f2d08c", macchia: "#f8e3b5", orecchie: "cadenti" },
      { id: "golden", nome: "Golden retriever", specie: "cane", taglia: "grande", pelo: "lungo", freq: 5, sens: 1.0, serv: { bagno: 5, tosatura: 3, spa: 2 }, colore: "#e2a95c", macchia: "#f3c98d", orecchie: "cadenti", soffice: true },
      { id: "husky", nome: "Husky", specie: "cane", taglia: "grande", pelo: "lungo", freq: 4, sens: 1.05, serv: { bagno: 4, tosatura: 4, spa: 2 }, colore: "#8f9aa8", macchia: "#ffffff", orecchie: "punta" },
      { id: "terranova", nome: "Terranova", specie: "cane", taglia: "grande", pelo: "lungo", freq: 2, sens: 0.9, serv: { bagno: 4, tosatura: 4, spa: 2 }, colore: "#6a5550", macchia: "#8f7a72", orecchie: "cadenti", soffice: true },

      { id: "europeo", nome: "Gatto europeo", specie: "gatto", taglia: "piccola", pelo: "corto", freq: 5, sens: 1.15, serv: { bagno: 6, tosatura: 1, spa: 2 }, colore: "#a3a3a3", macchia: "#6f6f6f", orecchie: "gatto", strisce: true },
      { id: "persiano", nome: "Persiano", specie: "gatto", taglia: "media", pelo: "lungo", freq: 4, sens: 0.8, serv: { bagno: 2, tosatura: 4, spa: 5 }, colore: "#f7efe6", macchia: "#e8d6c2", orecchie: "gatto", soffice: true },
      { id: "siamese", nome: "Siamese", specie: "gatto", taglia: "piccola", pelo: "corto", freq: 3, sens: 0.95, serv: { bagno: 5, tosatura: 1, spa: 3 }, colore: "#f3e5d0", macchia: "#5b4033", orecchie: "gatto", maschera: true },
      { id: "mainecoon", nome: "Maine Coon", specie: "gatto", taglia: "grande", pelo: "lungo", freq: 3, sens: 0.9, serv: { bagno: 3, tosatura: 4, spa: 3 }, colore: "#8c5b3b", macchia: "#c79a72", orecchie: "gatto", soffice: true, strisce: true },
      { id: "ragdoll", nome: "Ragdoll", specie: "gatto", taglia: "media", pelo: "lungo", freq: 3, sens: 0.85, serv: { bagno: 2, tosatura: 4, spa: 4 }, colore: "#f4ede2", macchia: "#7d6a5c", orecchie: "gatto", soffice: true, maschera: true },
      { id: "britannico", nome: "British Shorthair", specie: "gatto", taglia: "media", pelo: "corto", freq: 3, sens: 1.0, serv: { bagno: 5, tosatura: 1, spa: 3 }, colore: "#8d9ab0", macchia: "#a9b4c6", orecchie: "gatto" },

      // ai conigli non si fa il bagno in acqua: solo spazzolatura, unghie e taglio
      { id: "ariete", nome: "Coniglio ariete", specie: "coniglio", taglia: "piccola", pelo: "corto", freq: 4, sens: 1.05, serv: { bagno: 0, tosatura: 1, spa: 0 }, colore: "#d8b38b", macchia: "#fff4e6", orecchie: "coniglio-giu" },
      { id: "testadileone", nome: "Coniglio testa di leone", specie: "coniglio", taglia: "piccola", pelo: "lungo", freq: 3, sens: 0.95, serv: { bagno: 0, tosatura: 1, spa: 0 }, colore: "#f1e1cf", macchia: "#e0c4a4", orecchie: "coniglio-su", soffice: true }
    ],

    peloLungo: 1.3, // la tosatura e la spa di un pelo lungo durano di più
    gatti: 1.15, // i gatti vanno trattati con più calma

    prodotti: {
      economici: { nome: "Economici", costo: 0.6, qualita: 0.62, desc: "Costano poco, ma i clienti se ne accorgono." },
      normali: { nome: "Normali", costo: 1.0, qualita: 0.8, desc: "Il giusto mezzo." },
      premium: { nome: "Bio premium", costo: 1.8, qualita: 0.94, desc: "Profumatissimi: quasi tutti escono contenti." }
    },

    pubblicita: {
      nessuna: { nome: "Nessuna", costo: 0, effetto: 0, icona: "🤫" },
      volantini: { nome: "Volantini", costo: 15, effetto: 0.2, icona: "📄" },
      social: { nome: "Post sui social", costo: 35, effetto: 0.4, icona: "📱" },
      cartellone: { nome: "Cartellone", costo: 80, effetto: 0.7, icona: "🪧" }
    },

    // passanti = persone con un animale che ogni giorno passano davanti al negozio e ci pensano
    locali: {
      vicolo: { nome: "Bottega nel vicolo", affitto: 700, passanti: 11, maxPostazioni: 2, desc: "Piccola e nascosta, ma l'affitto è basso." },
      mercato: { nome: "Negozio in via del Mercato", affitto: 1500, passanti: 20, maxPostazioni: 3, desc: "Una via vivace, con tanta gente." },
      corso: { nome: "Salone sul Corso", affitto: 3000, passanti: 34, maxPostazioni: 5, desc: "La vetrina più vista della città." }
    },
    trasloco: 500,

    stipendio: 75, // al giorno per ogni aiutante (tu lavori gratis)
    postazione: { costo: 1000, rivendita: 0.5 },
    utenze: { fisso: 12, perMinuto: 0.02 }, // acqua calda e corrente
    maxAiutanti: 4,

    // reputazione in stelle (0,5–5): sposta la tolleranza al prezzo e il numero di clienti
    stelleIniziali: 2.5,
    fedeli: { ritorno: 0.12, perdita: 0.03, nuovi: 0.35 },

    prestito: { importo: 1500, restituzione: 1650 },

    eventi: [
      { id: "pioggia", testo: "🌧️ Pioggia e pozzanghere: tanti cani tornano infangati.", bagno: 2, prob: 1 },
      { id: "caldo", testo: "☀️ Arriva il caldo: tutti vogliono una sforbiciata.", tosatura: 2, prob: 1 },
      { id: "mostra", testo: "🏆 Domenica c'è la mostra canina: i cani vogliono essere bellissimi.", spa: 2.2, soloSpecie: "cane", prob: 1 },
      { id: "gatti", testo: "🐱 È la giornata del gatto: più mici del solito.", specie: { gatto: 3 }, prob: 1 },
      { id: "conigli", testo: "🐰 Fiera dei coniglietti in piazza.", specie: { coniglio: 3 }, prob: 0.7 },
      { id: "influencer", testo: "🤳 Un'influencer parla della tua via: +40% di passanti.", passanti: 1.4, prob: 0.8 },
      { id: "lavori", testo: "🚧 Lavori in strada: -40% di passanti.", passanti: 0.6, prob: 0.8 },
      { id: "shampoo", testo: "🧴 Lo shampoo è rincarato: prodotti +30% per oggi.", costoProdotti: 1.3, prob: 0.8 }
    ],
    probEvento: 0.35,

    // patrimonio finale (cassa + postazioni rivendute − debiti)
    medaglie: [
      { nome: "Oro", min: 10500, icona: "🥇" },
      { nome: "Argento", min: 8500, icona: "🥈" },
      { nome: "Bronzo", min: 6500, icona: "🥉" }
    ]
  };

  if (typeof module !== "undefined" && module.exports) module.exports = DATI;
  else radice.BDP_DATI = DATI;
})(this);
