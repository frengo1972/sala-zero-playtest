"use strict";

// Modello economico di Pettea. Nessun accesso al DOM: gira nel browser e in Node.
// È deterministico: a parità di seme e di azioni del giocatore dà sempre lo stesso risultato.
const PetteaEconomia = (() => {
  const D = typeof PetteaDati !== "undefined" ? PetteaDati : require("./dati.js");
  const ING = Object.fromEntries(D.ingredienti.map(i => [i.id, i]));
  const TIPI = Object.fromEntries(D.tipi.map(t => [t.id, t]));
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

  // Generatore casuale con seme (cyrb128 + mulberry32)
  function rng(seme) {
    let h = 1779033703 ^ seme.length;
    for (let i = 0; i < seme.length; i++) {
      h = Math.imul(h ^ seme.charCodeAt(i), 3432918353);
      h = h << 13 | h >>> 19;
    }
    h = Math.imul(h ^ h >>> 16, 2246822507);
    h = Math.imul(h ^ h >>> 13, 3266489909);
    let a = (h ^= h >>> 16) >>> 0;
    return () => {
      a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function semeSfida(data = new Date()) {
    const d = new Date(Date.UTC(data.getFullYear(), data.getMonth(), data.getDate()));
    const giorno = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - giorno);
    const inizio = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const settimana = Math.ceil(((d - inizio) / 86400000 + 1) / 7);
    return `sfida-${d.getUTCFullYear()}-w${String(settimana).padStart(2, "0")}`;
  }

  // ---------- Stato ----------

  function valoreScorte(s) {
    return s.lotti.reduce((t, l) => t + l.q * l.costo, 0);
  }

  function apriMese(s) {
    return {
      numero: Math.ceil(s.giorno / D.giorniMese),
      cassaInizio: s.cassa, scorteInizio: valoreScorte(s),
      vendite: 0, mance: 0, costoVenduto: 0, scaduti: 0, buttati: 0, acquisti: 0, giorni: []
    };
  }

  function nuovoStato({ modo = "carriera", seme = null } = {}) {
    const s = {
      versione: D.versione, modo,
      seme: seme || `carriera-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`,
      giorno: 1, cassa: D.cassaIniziale, prezzo: D.prezzoIniziale,
      lotti: [], stelle: [4, 4, 4, 4, 4], storico: [], ultimoGiorno: null, mese: null
    };
    for (const [id, q] of Object.entries(D.scorteIniziali)) {
      s.lotti.push({ id, q, costo: ING[id].costo, scade: ING[id].durata });
    }
    s.mese = apriMese(s);
    return s;
  }

  function valutazione(s) {
    const ultime = s.stelle.slice(-20);
    return Math.round(ultime.reduce((a, b) => a + b, 0) / ultime.length * 10) / 10;
  }

  function disponibile(s, id) {
    return s.lotti.reduce((t, l) => t + (l.id === id ? l.q : 0), 0);
  }

  function fresco(id) {
    return ING[id].durata <= 5;
  }

  function occupazione(s) {
    let frigo = 0, dispensa = 0;
    for (const l of s.lotti) fresco(l.id) ? frigo += l.q : dispensa += l.q;
    return { frigo, dispensa };
  }

  // Preleva una porzione, prima dal lotto che scade prima. Restituisce il costo.
  function preleva(s, id) {
    const lotto = s.lotti.filter(l => l.id === id && l.q > 0).sort((a, b) => a.scade - b.scade)[0];
    if (!lotto) return null;
    lotto.q--;
    if (lotto.q === 0) s.lotti.splice(s.lotti.indexOf(lotto), 1);
    return lotto.costo;
  }

  // ---------- Mercato ----------

  function prezziMercato(s, giorno = s.giorno) {
    const r = rng(`${s.seme}|mercato|${giorno}`);
    const out = {};
    for (const i of D.ingredienti) out[i.id] = Math.max(5, Math.round(i.costo * (0.9 + r() * 0.2)));
    return out;
  }

  function compra(s, id, lotti = 1) {
    const ing = ING[id];
    const q = ing.lotto * lotti;
    const spesa = prezziMercato(s)[id] * q;
    const occ = occupazione(s);
    if (fresco(id) && occ.frigo + q > D.capienzaFrigo) return { ok: false, motivo: "frigo" };
    if (!fresco(id) && occ.dispensa + q > D.capienzaDispensa) return { ok: false, motivo: "dispensa" };
    if (spesa > s.cassa) return { ok: false, motivo: "cassa" };
    s.cassa -= spesa;
    s.mese.acquisti += spesa;
    s.lotti.push({ id, q, costo: spesa / q, scade: s.giorno + ing.durata - 1 });
    return { ok: true, spesa };
  }

  // ---------- Domanda ----------

  function rifEffettivo(s, tipo) {
    return TIPI[tipo].rif * 100 * (1 + 0.05 * (valutazione(s) - 4));
  }

  function probAcquisto(s, tipo, prezzo = s.prezzo) {
    const r = rifEffettivo(s, tipo);
    return clamp(1 - TIPI[tipo].sens * (prezzo - r) / r, 0.05, 0.98);
  }

  function weekend(giorno) {
    return giorno % 7 === 6 || giorno % 7 === 0;
  }

  function visitatori(s, giorno = s.giorno) {
    return Math.round(D.visitatoriBase * (0.4 + 0.15 * valutazione(s)) * (weekend(giorno) ? 1.25 : 1));
  }

  function pesca(r, lista, chiave) {
    const tot = lista.reduce((t, x) => t + x[chiave], 0);
    let v = r() * tot;
    for (const x of lista) if ((v -= x[chiave]) < 0) return x;
    return lista[lista.length - 1];
  }

  function generaOrdine(r, tipo) {
    const ordine = [r() < 0.6 ? "riso" : "venere", r() < (tipo === "sportivo" ? 0.7 : 0.5) ? "salmone" : "tofu"];
    const topping = ["avocado", "edamame", "mango"];
    for (let i = topping.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [topping[i], topping[j]] = [topping[j], topping[i]];
    }
    const n = tipo === "turista" ? 2 + (r() < 0.4 ? 1 : 0) : 1 + (r() < 0.5 ? 1 : 0);
    ordine.push(...topping.slice(0, n), r() < 0.6 ? "soia" : "piccante");
    return ordine;
  }

  // Stima della domanda a un prezzo dato, per il pannello dei prezzi
  function stimaDomanda(s, prezzo) {
    const fine = weekend(s.giorno);
    const tot = D.tipi.reduce((t, x) => t + (fine ? x.pesoWeekend : x.peso), 0);
    const n = visitatori(s);
    let compratori = 0;
    const perTipo = D.tipi.map(t => {
      const p = probAcquisto(s, t.id, prezzo);
      compratori += n * (fine ? t.pesoWeekend : t.peso) / tot * p;
      return { tipo: t.id, prob: p };
    });
    return { visitatori: n, compratori, perTipo };
  }

  function pianoGiornata(s) {
    const g = s.giorno;
    const r = rng(`${s.seme}|giorno|${g}`);
    const pool = [];
    for (let i = 0; i < 48; i++) {
      const tipo = pesca(r, D.tipi, weekend(g) ? "pesoWeekend" : "peso").id;
      pool.push({ n: i, tipo, ordine: generaOrdine(r, tipo), dado: r(), jitter: r() });
    }
    const n = Math.min(pool.length, visitatori(s, g));
    const compratori = [], rinunce = {}, guardano = {};
    for (const v of pool.slice(0, n)) {
      guardano[v.tipo] = (guardano[v.tipo] || 0) + 1;
      if (v.dado < probAcquisto(s, v.tipo)) compratori.push(v);
      else rinunce[v.tipo] = (rinunce[v.tipo] || 0) + 1;
    }
    const span = D.durataServizio - 15;
    compratori.forEach((c, i) => { c.arrivo = 3 + i * span / Math.max(1, compratori.length) + c.jitter * 3; });
    return { giorno: g, visitatori: n, compratori, rinunce, guardano };
  }

  // ---------- Servizio ----------

  function creaServizio(s) {
    return {
      s, piano: pianoGiornata(s), t: 0, i: 0, coda: [], fine: false,
      log: { serviti: 0, sbagliati: 0, persiCoda: 0, impazienti: 0, esauriti: 0, chiusura: 0,
        vendite: 0, mance: 0, costoVenduto: 0, buttati: 0, serviti_tipo: {} }
    };
  }

  function stella(s, n) {
    s.stelle.push(n);
    if (s.stelle.length > 40) s.stelle.splice(0, s.stelle.length - 40);
  }

  function togli(sv, c) {
    sv.coda.splice(sv.coda.indexOf(c), 1);
  }

  function tick(sv, dt) {
    const eventi = [];
    if (sv.fine) return eventi;
    const s = sv.s, lista = sv.piano.compratori;
    sv.t += dt;
    while (sv.i < lista.length && lista[sv.i].arrivo <= sv.t) {
      const c = lista[sv.i++];
      if (sv.coda.length >= D.codaMax) {
        sv.log.persiCoda++;
        eventi.push({ tipo: "persoCoda", c });
      } else {
        sv.coda.push({ ...c, restante: D.pazienza, attesaEsaurito: 0 });
        eventi.push({ tipo: "arrivo", c });
      }
    }
    for (const c of [...sv.coda]) {
      c.restante -= dt;
      if (c.restante <= 0) {
        togli(sv, c);
        stella(s, 1);
        sv.log.impazienti++;
        eventi.push({ tipo: "impaziente", c });
      }
    }
    const primo = sv.coda[0];
    if (primo && primo.ordine.some(id => disponibile(s, id) === 0)) {
      primo.attesaEsaurito += dt;
      if (primo.attesaEsaurito >= 1.5) {
        togli(sv, primo);
        stella(s, 3);
        sv.log.esauriti++;
        eventi.push({ tipo: "esaurito", c: primo });
      }
    }
    const arrivatiTutti = sv.i >= lista.length;
    if (sv.t >= D.durataServizio && arrivatiTutti && sv.coda.length === 0) sv.fine = true;
    if (sv.t >= D.durataServizio + 25) {
      sv.log.chiusura += sv.coda.length + (lista.length - sv.i);
      sv.coda = [];
      sv.i = lista.length;
      sv.fine = true;
    }
    if (sv.fine) eventi.push({ tipo: "fine" });
    return eventi;
  }

  function stessaCiotola(a, b) {
    return a.length === b.length && a.every(id => b.includes(id));
  }

  function servi(sv, ciotola) {
    const s = sv.s, c = sv.coda[0];
    if (!c || ciotola.length === 0) return { ok: false, motivo: "vuota" };
    if (ciotola.some(id => disponibile(s, id) === 0)) return { ok: false, motivo: "scorte" };
    let costo = 0;
    for (const id of ciotola) costo += preleva(s, id);
    const tipo = TIPI[c.tipo], rif = tipo.rif * 100;
    const giusto = stessaCiotola(ciotola, c.ordine);
    const veloce = c.restante / D.pazienza >= 0.5;
    const incasso = giusto ? s.prezzo : Math.round(s.prezzo / 2);
    let pct = giusto ? (veloce ? 0.10 : 0.04) : 0;
    if (s.prezzo > rif) pct = Math.max(0, pct - 0.04);
    const mancia = Math.round(incasso * pct / 10) * 10;
    const stelle = giusto ? 5 - (veloce ? 0 : 1) - (s.prezzo > rif * 1.15 ? 1 : 0) : 2;
    stella(s, stelle);
    s.cassa += incasso + mancia;
    const L = sv.log;
    L.vendite += incasso;
    L.mance += mancia;
    L.costoVenduto += costo;
    giusto ? L.serviti++ : L.sbagliati++;
    L.serviti_tipo[c.tipo] = (L.serviti_tipo[c.tipo] || 0) + 1;
    togli(sv, c);
    return { ok: true, giusto, incasso, mancia, stelle, costo, c };
  }

  function butta(sv, ciotola) {
    let costo = 0;
    for (const id of ciotola) if (disponibile(sv.s, id) > 0) costo += preleva(sv.s, id);
    sv.log.buttati += costo;
    return costo;
  }

  // ---------- Fine giornata e conti ----------

  function utileDi(x) {
    return x.vendite + x.mance - x.costoVenduto - x.buttati - x.scaduti;
  }

  function chiudiGiornata(s, sv) {
    const g = s.giorno;
    let scaduti = 0;
    const scadutiDettaglio = {};
    s.lotti = s.lotti.filter(l => {
      if (l.scade > g) return true;
      scaduti += l.q * l.costo;
      scadutiDettaglio[l.id] = (scadutiDettaglio[l.id] || 0) + l.q;
      return false;
    });
    const L = sv.log, m = s.mese;
    m.vendite += L.vendite;
    m.mance += L.mance;
    m.costoVenduto += L.costoVenduto;
    m.buttati += L.buttati;
    m.scaduti += scaduti;
    const report = {
      giorno: g, prezzo: s.prezzo, weekend: weekend(g),
      visitatori: sv.piano.visitatori, guardano: sv.piano.guardano, rinunce: sv.piano.rinunce,
      compratori: sv.piano.compratori.length, ...L, scaduti, scadutiDettaglio,
      valutazione: valutazione(s), cassa: s.cassa
    };
    report.utile = utileDi(report);
    m.giorni.push(report);
    s.ultimoGiorno = report;
    s.giorno++;
    let fineMese = null;
    if ((s.giorno - 1) % D.giorniMese === 0) {
      fineMese = contoMese(s);
      s.storico.push(fineMese);
      s.mese = apriMese(s);
    }
    return { report, fineMese };
  }

  function contoMese(s) {
    const m = s.mese;
    const utile = utileDi(m);
    const stelle = valutazione(s);
    const medaglia = D.medaglie.find(x => utile >= x.utile && stelle >= x.stelle) || null;
    const somma = k => m.giorni.reduce((t, g) => t + g[k], 0);
    return {
      numero: m.numero, vendite: m.vendite, mance: m.mance, costoVenduto: m.costoVenduto,
      buttati: m.buttati, scaduti: m.scaduti, acquisti: m.acquisti, utile,
      cassaInizio: m.cassaInizio, cassaFine: s.cassa, scorteInizio: m.scorteInizio, scorteFine: valoreScorte(s),
      stelle, medaglia: medaglia && medaglia.id,
      clienti: somma("serviti") + somma("sbagliati"), persi: somma("persiCoda") + somma("impazienti") + somma("esauriti"),
      giorni: m.giorni.map(g => ({ giorno: g.giorno, prezzo: g.prezzo, utile: g.utile, serviti: g.serviti }))
    };
  }

  // Consigli della Dottoressa Gufa, dal più importante
  function consigli(r) {
    const out = [];
    const eur = c => (c / 100).toLocaleString("it-IT", { style: "currency", currency: "EUR" });
    const sprechi = r.scaduti + r.buttati;
    if (r.costoVenduto > 0 && sprechi > r.costoVenduto * 0.08) {
      const peggio = Object.entries(r.scadutiDettaglio || {}).sort((a, b) => b[1] - a[1])[0];
      out.push(`Hai sprecato ${eur(sprechi)} di ingredienti${peggio ? `, soprattutto ${ING[peggio[0]].nome.toLowerCase()}` : ""}. Compra lotti più piccoli e guarda quanti giorni durano.`);
    }
    if (r.esauriti > 0) out.push(`${r.esauriti} ${r.esauriti === 1 ? "cliente se n'è andato" : "clienti se ne sono andati"} perché mancava un ingrediente. Controlla le scorte al mercato.`);
    const persi = r.persiCoda + r.impazienti;
    if (persi >= 3) out.push(`${persi} clienti sono andati via per la coda o l'attesa. Un prezzo un po' più alto porta meno clienti, ma guadagni di più su ognuno e la coda si accorcia.`);
    const rinStud = (r.rinunce && r.rinunce.studente) || 0, guaStud = (r.guardano && r.guardano.studente) || 0;
    if (guaStud >= 4 && rinStud / guaStud > 0.4) out.push(`${rinStud} studenti su ${guaStud} hanno trovato il prezzo troppo alto. Gli studenti stanno attenti alla spesa: con un prezzo più basso ne arrivano di più.`);
    if (r.sbagliati > 0) out.push(`${r.sbagliati} ciotole erano sbagliate: il cliente paga metà e lascia 2 stelle. Meglio buttare e rifare, se te ne accorgi in tempo.`);
    if (!out.length) out.push(`Ottima giornata! Ogni ciotola ti ha lasciato in media ${eur(r.serviti ? (r.vendite - r.costoVenduto) / Math.max(1, r.serviti + r.sbagliati) : 0)} di margine.`);
    return out;
  }

  return {
    D, ING, TIPI, rng, semeSfida, nuovoStato, valutazione, disponibile, occupazione, valoreScorte,
    prezziMercato, compra, probAcquisto, stimaDomanda, weekend, creaServizio, tick, servi, butta,
    chiudiGiornata, contoMese, consigli, utileDi, stessaCiotola
  };
})();

if (typeof module !== "undefined") module.exports = PetteaEconomia;
