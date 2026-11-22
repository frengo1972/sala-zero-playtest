"use strict";

// Dati di gioco di Pettea, capitolo 1. Gli importi sono in centesimi di euro.
const PetteaDati = {
  versione: "0.2.0",
  salvataggio: "pettea-v1-playtest",

  giorniMese: 10,
  durataServizio: 120,   // secondi di servizio per giornata
  pazienza: 20,          // secondi prima che un cliente se ne vada
  codaMax: 4,
  visitatoriBase: 21,    // passanti che guardano il menù, con 4 stelle
  cassaIniziale: 25000,
  prezzoIniziale: 1000,
  prezzoMin: 600,
  prezzoMax: 1800,
  capienzaFrigo: 130,    // porzioni di ingredienti freschi
  capienzaDispensa: 120, // porzioni di ingredienti secchi

  categorie: [
    { id: "base", nome: "Base" },
    { id: "proteina", nome: "Proteina" },
    { id: "topping", nome: "Topping", max: 3 },
    { id: "salsa", nome: "Salsa" }
  ],

  // durata = giorni in cui l'ingrediente si può usare; lotto = porzioni per acquisto
  ingredienti: [
    { id: "riso", nome: "Riso bianco", breve: "Riso", cat: "base", costo: 50, durata: 30, lotto: 10, colore: "#fbf6ea" },
    { id: "venere", nome: "Riso venere", breve: "Venere", cat: "base", costo: 70, durata: 30, lotto: 10, colore: "#5b4a6b" },
    { id: "salmone", nome: "Salmone", breve: "Salmone", cat: "proteina", costo: 200, durata: 2, lotto: 5, colore: "#ff9f80" },
    { id: "tofu", nome: "Tofu", breve: "Tofu", cat: "proteina", costo: 90, durata: 4, lotto: 5, colore: "#f3d9a0" },
    { id: "avocado", nome: "Avocado", breve: "Avocado", cat: "topping", costo: 60, durata: 3, lotto: 5, colore: "#9ccf6a" },
    { id: "edamame", nome: "Edamame", breve: "Edamame", cat: "topping", costo: 30, durata: 5, lotto: 5, colore: "#6fbf73" },
    { id: "mango", nome: "Mango", breve: "Mango", cat: "topping", costo: 50, durata: 3, lotto: 5, colore: "#ffc94d" },
    { id: "soia", nome: "Salsa di soia", breve: "Soia", cat: "salsa", costo: 10, durata: 30, lotto: 10, colore: "#7a4a32" },
    { id: "piccante", nome: "Maionese piccante", breve: "Piccante", cat: "salsa", costo: 15, durata: 30, lotto: 10, colore: "#ff7a7a" }
  ],

  scorteIniziali: { riso: 20, venere: 15, salmone: 15, tofu: 15, avocado: 15, edamame: 15, mango: 15, soia: 20, piccante: 20 },

  // rif = prezzo di riferimento in euro; sens = sensibilità al prezzo
  tipi: [
    { id: "studente", nome: "Studenti", singolare: "Studente", animale: "criceto", rif: 9, sens: 1.6, peso: 35, pesoWeekend: 25 },
    { id: "sportivo", nome: "Sportivi", singolare: "Sportivo", animale: "cagnolino", rif: 11, sens: 1.1, peso: 25, pesoWeekend: 20 },
    { id: "famiglia", nome: "Famiglie", singolare: "Famiglia", animale: "ochetta", rif: 10, sens: 1.3, peso: 20, pesoWeekend: 25 },
    { id: "turista", nome: "Turisti", singolare: "Turista", animale: "orsetto", rif: 13, sens: 0.6, peso: 20, pesoWeekend: 30 }
  ],

  // obiettivi del mese, capitolo 1 (utile in centesimi)
  medaglie: [
    { id: "oro", nome: "Oro", utile: 155000, stelle: 4.4 },
    { id: "argento", nome: "Argento", utile: 110000, stelle: 4.0 },
    { id: "bronzo", nome: "Bronzo", utile: 70000, stelle: 0 }
  ],

  // Quaderno dell'imprenditrice: si sblocca un concetto alla volta
  quaderno: [
    { id: "prezzo", titolo: "Prezzo", dopoGiorno: 1,
      testo: "È quanto chiedi per una ciotola. Se è alto guadagni di più su ogni cliente, ma alcuni rinunciano. Se è basso arrivano più clienti, ma rischi la coda.",
      domanda: "Se alzi il prezzo di 1 €, chi rinuncia per primo: gli studenti o i turisti?" },
    { id: "margine", titolo: "Margine", dopoGiorno: 1,
      testo: "È la differenza tra il prezzo e il costo degli ingredienti. Una ciotola a 10 € con 3 € di ingredienti ha un margine di 7 €: è quello che resta per pagare tutto il resto.",
      domanda: "Una ciotola con salmone ha lo stesso margine di una con tofu?" },
    { id: "mancia", titolo: "Mancia", dopoGiorno: 1,
      testo: "È un regalo del cliente quando il servizio gli piace. Dipende dalla velocità, dalla precisione e da quanto il prezzo gli sembra giusto.",
      domanda: "Perché i clienti lasciano meno mancia quando il prezzo supera quello che si aspettano?" },
    { id: "scorte", titolo: "Scorte e scadenze", dopoGiorno: 2,
      testo: "Gli ingredienti freschi durano pochi giorni. Se ne compri troppi scadono e li butti; se ne compri pochi finiscono e i clienti se ne vanno.",
      domanda: "Conviene comprare il salmone per tre giorni in una volta sola?" },
    { id: "sprechi", titolo: "Sprechi", dopoGiorno: 2,
      testo: "Gli ingredienti scaduti o buttati sono soldi spesi che non tornano. Nel conto si sottraggono come un costo.",
      domanda: "Quale ingrediente hai sprecato di più finora?" },
    { id: "domanda", titolo: "Domanda e tipi di clienti", dopoGiorno: 3,
      testo: "Ogni tipo di cliente ha un prezzo che considera giusto. I turisti spendono volentieri, gli studenti stanno attenti. La domanda è quanti clienti comprano a ogni prezzo.",
      domanda: "Nel fine settimana arrivano più turisti: cambieresti il prezzo?" },
    { id: "utile", titolo: "Utile", dopoGiorno: 10,
      testo: "Ricavi più mance, meno il costo degli ingredienti venduti e meno gli sprechi. È quanto l'attività ha guadagnato davvero nel mese.",
      domanda: "Il tuo utile è cresciuto o calato rispetto al primo giorno?" },
    { id: "cassa", titolo: "Cassa e utile non sono uguali", dopoGiorno: 10,
      testo: "La cassa sono i soldi che hai. L'utile è quanto hai guadagnato. Se compri tante scorte la cassa scende subito, ma il costo entra nel conto solo quando le usi.",
      domanda: "Perché a fine mese la cassa e l'utile non coincidono?" }
  ],

  nomiAnimaletto: ["Mochi", "Pepe", "Nuvola", "Biscotto", "Miele", "Tofu"],
  pelo: [
    { id: "crema", nome: "Crema", colore: "#f6e3c6" },
    { id: "grigio", nome: "Grigio", colore: "#c9c6d6" },
    { id: "arancio", nome: "Arancio", colore: "#f6b27a" },
    { id: "nero", nome: "Nero", colore: "#5a5164" },
    { id: "bianco", nome: "Bianco", colore: "#ffffff" }
  ],
  accessori: [
    { id: "nessuno", nome: "Nessuno" },
    { id: "fiocco", nome: "Fiocco" },
    { id: "bandana", nome: "Bandana" },
    { id: "cappello", nome: "Cappello da cuoco" }
  ],
  coloriAccessorio: [
    { id: "corallo", colore: "#ff8f8f" },
    { id: "menta", colore: "#7fd6b3" },
    { id: "lavanda", colore: "#b9a2ee" }
  ]
};

if (typeof module !== "undefined") module.exports = PetteaDati;
