// Bolle di Pelo — modello economico puro e deterministico. Gira anche in Node.
(function (radice) {
  const DATI = typeof module !== "undefined" && module.exports ? require("./dati.js") : radice.BDP_DATI;

  function rng(seme) {
    let a = seme >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function pesca(r, voci) {
    let tot = 0;
    for (const v of voci) tot += v.peso;
    let x = r() * tot;
    for (const v of voci) { x -= v.peso; if (x < 0) return v.valore; }
    return voci[voci.length - 1].valore;
  }

  function nuovaPartita(seme) {
    return {
      versione: DATI.versione,
      seme: (seme >>> 0) || 1,
      giorno: 1, // giorno da giocare
      cassa: DATI.cassaIniziale,
      debito: 0,
      stelle: DATI.stelleIniziali,
      fedeli: 0,
      locale: "vicolo",
      postazioni: 1,
      aiutanti: 0,
      affittoMaturato: 0,
      scelte: {
        prezzi: { bagno: 20, tosatura: 28, spa: 50 },
        prodotti: "normali",
        pubblicita: "nessuna"
      },
      storico: [], // un riepilogo breve per giorno
      mesi: [], // conto di ogni mese
      meseCorrente: nuovoMese(),
      finita: false
    };
  }

  function nuovoMese() {
    return { incassi: 0, prodotti: 0, stipendi: 0, utenze: 0, pubblicita: 0, affitto: 0, investimenti: 0, serviti: 0, rinunce: 0, rimandati: 0 };
  }

  function mese(giorno) { return Math.floor((giorno - 1) / DATI.giorniPerMese) + 1; }
  function giorniTotali() { return DATI.giorniPerMese * DATI.mesi; }
  function operatori(s) { return Math.min(1 + s.aiutanti, s.postazioni); }
  function minutiDisponibili(s) { return operatori(s) * DATI.minutiPerOperatore; }

  function minutiLavoro(razza, servizio) {
    const sv = DATI.servizi[servizio];
    let m = sv.minuti * DATI.taglie[razza.taglia].tempo;
    if (razza.pelo === "lungo" && servizio !== "bagno") m *= DATI.peloLungo;
    if (razza.specie === "gatto") m *= DATI.gatti;
    return Math.round(m);
  }

  function prezzoPagato(s, razza, servizio) {
    return Math.round(s.scelte.prezzi[servizio] * DATI.taglie[razza.taglia].prezzo);
  }

  // probabilità che un cliente accetti il prezzo
  function probAccetta(s, razza, servizio, fedele) {
    const rapporto = s.scelte.prezzi[servizio] / DATI.servizi[servizio].riferimento;
    const tolleranza = 0.8 + 0.08 * s.stelle;
    const sens = razza.sens * (fedele ? 0.6 : 1);
    return 1 / (1 + Math.exp(5 * sens * (rapporto / tolleranza - 1.15)));
  }

  function eventoDelGiorno(s) {
    const r = rng(s.seme * 7919 + s.giorno * 104729);
    if (s.giorno === 1 || r() >= DATI.probEvento) return null;
    return pesca(r, DATI.eventi.map(e => ({ peso: e.prob, valore: e })));
  }

  function giocaGiorno(stato) {
    const s = JSON.parse(JSON.stringify(stato));
    const r = rng(s.seme * 31337 + s.giorno * 7477);
    const ev = eventoDelGiorno(s);
    const loc = DATI.locali[s.locale];
    const pub = DATI.pubblicita[s.scelte.pubblicita];
    const prod = DATI.prodotti[s.scelte.prodotti];

    // 1. chi passa e ci pensa
    const attrattiva = (0.6 + 0.16 * s.stelle) * (1 + pub.effetto) * (ev && ev.passanti ? ev.passanti : 1);
    const media = loc.passanti * attrattiva;
    const nuovi = Math.max(0, Math.round(media * (0.8 + 0.4 * r())));
    let ritorni = 0;
    for (let i = 0; i < s.fedeli; i++) if (r() < DATI.fedeli.ritorno) ritorni++;

    const vociRazze = DATI.razze.map(z => {
      let peso = z.freq;
      if (ev && ev.specie && ev.specie[z.specie]) peso *= ev.specie[z.specie];
      return { peso, valore: z };
    });

    const clienti = [];
    for (let i = 0; i < nuovi + ritorni; i++) {
      const razza = pesca(r, vociRazze);
      const vociServ = Object.keys(DATI.servizi).map(k => {
        let peso = razza.serv[k];
        if (ev && ev[k] && (!ev.soloSpecie || ev.soloSpecie === razza.specie)) peso *= ev[k];
        return { peso, valore: k };
      });
      const servizio = pesca(r, vociServ);
      clienti.push({ razza: razza.id, servizio, fedele: i >= nuovi, ordine: r() });
    }
    clienti.sort((a, b) => a.ordine - b.ordine);

    // 2. prezzo, tempo e soddisfazione
    const minutiTot = minutiDisponibili(s);
    let minutiLiberi = minutiTot;
    const rep = {
      giorno: s.giorno, mese: mese(s.giorno), evento: ev ? ev.testo : null,
      clienti: [], potenziali: clienti.length, fedeliTornati: ritorni,
      rinunce: 0, rimandati: 0, serviti: 0, soddisfatti: 0, nuoviFedeli: 0, fedeliPersi: 0,
      perServizio: { bagno: 0, tosatura: 0, spa: 0 },
      incassi: 0, costi: { prodotti: 0, stipendi: 0, utenze: 0, pubblicita: 0, affitto: 0 },
      minutiTot, minutiUsati: 0, stellePrima: s.stelle
    };
    const accettati = [];
    for (const c of clienti) {
      const razza = DATI.razze.find(z => z.id === c.razza);
      const voce = { razza: c.razza, servizio: c.servizio, fedele: c.fedele, prezzo: prezzoPagato(s, razza, c.servizio), minuti: minutiLavoro(razza, c.servizio) };
      if (r() > probAccetta(s, razza, c.servizio, c.fedele)) {
        voce.esito = "prezzo"; rep.rinunce++;
        if (c.fedele) rep.fedeliPersi++;
      } else accettati.push({ voce, razza });
      rep.clienti.push(voce);
    }
    const domandaMinuti = accettati.reduce((t, a) => t + a.voce.minuti, 0);
    const fretta = domandaMinuti > minutiTot * 0.9; // si lavora di corsa
    const qualita = prod.qualita - (fretta ? 0.12 : 0);
    const costoProd = prod.costo * (ev && ev.costoProdotti ? ev.costoProdotti : 1);
    let punti = 0, voti = 0;
    for (const { voce, razza } of accettati) {
      if (voce.minuti > minutiLiberi) {
        voce.esito = "tempo"; rep.rimandati++;
        if (voce.fedele) rep.fedeliPersi++;
        punti += 1; voti++;
        continue;
      }
      minutiLiberi -= voce.minuti;
      rep.minutiUsati += voce.minuti;
      rep.serviti++;
      rep.perServizio[voce.servizio]++;
      rep.incassi += voce.prezzo;
      rep.costi.prodotti += DATI.servizi[voce.servizio].prodotti * DATI.taglie[razza.taglia].prodotti * costoProd;
      voce.soddisfatto = r() < qualita;
      if (voce.soddisfatto) {
        voce.esito = "felice"; rep.soddisfatti++; punti += 5;
        if (!voce.fedele && r() < DATI.fedeli.nuovi) rep.nuoviFedeli++;
      } else {
        voce.esito = "scontento"; punti += 1.5;
        if (voce.fedele) rep.fedeliPersi++;
      }
      voti++;
    }
    rep.fretta = fretta;

    // 3. costi del giorno
    rep.costi.prodotti = Math.round(rep.costi.prodotti);
    rep.costi.stipendi = s.aiutanti * DATI.stipendio;
    rep.costi.utenze = Math.round(DATI.utenze.fisso + DATI.utenze.perMinuto * rep.minutiUsati);
    rep.costi.pubblicita = pub.costo;
    s.affittoMaturato += loc.affitto / DATI.giorniPerMese;
    const fineMese = s.giorno % DATI.giorniPerMese === 0;
    if (fineMese) {
      rep.costi.affitto = Math.round(s.affittoMaturato);
      s.affittoMaturato = 0;
    }
    rep.totaleCosti = Object.values(rep.costi).reduce((a, b) => a + b, 0);
    rep.utile = rep.incassi - rep.totaleCosti;
    s.cassa += rep.utile;

    // 4. reputazione e clienti fedeli
    if (voti > 0) {
      const media = punti / voti;
      s.stelle = Math.max(0.5, Math.min(5, s.stelle * 0.8 + media * 0.2));
    }
    s.stelle = Math.round(s.stelle * 100) / 100;
    let persi = rep.fedeliPersi;
    for (let i = 0; i < s.fedeli; i++) if (r() < DATI.fedeli.perdita) persi++;
    s.fedeli = Math.max(0, s.fedeli + rep.nuoviFedeli - persi);
    rep.stelleDopo = s.stelle;
    rep.fedeli = s.fedeli;

    // 5. mese
    const m = s.meseCorrente;
    m.incassi += rep.incassi;
    for (const k of Object.keys(rep.costi)) m[k] += rep.costi[k];
    m.serviti += rep.serviti; m.rinunce += rep.rinunce; m.rimandati += rep.rimandati;

    rep.prestito = 0;
    if (s.cassa < 0) {
      s.cassa += DATI.prestito.importo;
      s.debito += DATI.prestito.restituzione;
      rep.prestito = DATI.prestito.importo;
    }

    if (fineMese) {
      m.numero = mese(s.giorno);
      m.utile = m.incassi - m.prodotti - m.stipendi - m.utenze - m.pubblicita - m.affitto;
      s.mesi.push(m);
      rep.contoMese = m;
      s.meseCorrente = nuovoMese();
    }

    rep.consigli = consigli(s, rep);
    s.storico.push({ giorno: s.giorno, incassi: rep.incassi, costi: rep.totaleCosti, utile: rep.utile, serviti: rep.serviti, stelle: s.stelle });
    s.giorno++;
    if (s.giorno > giorniTotali()) { s.finita = true; rep.finale = risultato(s); }
    return { stato: s, report: rep };
  }

  function consigli(s, rep) {
    const out = [];
    const pot = Math.max(1, rep.potenziali);
    if (rep.rinunce / pot > 0.45) {
      const peggiore = ["bagno", "tosatura", "spa"].map(k => ({ k, n: rep.clienti.filter(c => c.esito === "prezzo" && c.servizio === k).length })).sort((a, b) => b.n - a.n)[0];
      out.push(`${rep.rinunce} clienti su ${rep.potenziali} hanno trovato i prezzi troppo alti, soprattutto per ${DATI.servizi[peggiore.k].breve.toLowerCase()}. Più prezzo vuol dire meno clienti.`);
    }
    if (rep.rimandati > 0) out.push(`Hai dovuto rimandare ${rep.rimandati} ${rep.rimandati === 1 ? "cliente" : "clienti"}: non c'era tempo. Puoi alzare un po' i prezzi, oppure servono un aiutante e una postazione in più.`);
    else if (rep.minutiUsati < rep.minutiTot * 0.5 && s.giorno > 2) out.push(`Hai usato solo il ${Math.round(100 * rep.minutiUsati / rep.minutiTot)}% del tempo di lavoro. Con un po' di pubblicità o prezzi più bassi arriverebbero più clienti.`);
    if (s.aiutanti + 1 > s.postazioni) out.push("Hai più persone che postazioni: qualcuno resta senza tavolo. Compra una postazione o lascia a casa un aiutante.");
    if (s.postazioni > s.aiutanti + 1 && rep.rimandati > 0) out.push("Hai una postazione libera ma nessuno che ci lavori: assumi un aiutante.");
    if (rep.fretta) out.push("Oggi si è lavorato di corsa: con la fretta qualche cliente esce meno contento.");
    if (rep.serviti > 0 && rep.soddisfatti / rep.serviti < 0.7) out.push("Molti clienti non sono usciti contenti: prodotti migliori alzano le stelle, e con più stelle si possono chiedere prezzi più alti.");
    if (rep.costi.pubblicita > 0 && rep.potenziali < 6) out.push("La pubblicità costa: controlla che porti davvero clienti.");
    if (rep.prestito) out.push(`La cassa è andata sotto zero: la banca ti ha prestato ${DATI.prestito.importo} €, da restituire ${DATI.prestito.restituzione} €.`);
    if (rep.utile > 0 && out.length === 0) out.push("Bella giornata! Prova a cambiare una sola cosa alla volta per capire cosa funziona.");
    return out.slice(0, 3);
  }

  function valorePostazioni(s) { return Math.round(s.postazioni * DATI.postazione.costo * DATI.postazione.rivendita); }

  function patrimonio(s) { return s.cassa + valorePostazioni(s) - s.debito; }

  function risultato(s) {
    const p = patrimonio(s);
    const medaglia = DATI.medaglie.find(m => p >= m.min) || null;
    return { patrimonio: p, medaglia, stelle: s.stelle, fedeli: s.fedeli };
  }

  // azioni del pomeriggio: restituiscono un messaggio d'errore oppure null
  function assumi(s) {
    if (s.aiutanti >= DATI.maxAiutanti) return "Non c'è spazio per altri aiutanti.";
    s.aiutanti++; return null;
  }
  function licenzia(s) { if (s.aiutanti <= 0) return "Non hai aiutanti."; s.aiutanti--; return null; }
  function compraPostazione(s) {
    if (s.postazioni >= DATI.locali[s.locale].maxPostazioni) return "Il negozio è pieno: per altre postazioni serve un locale più grande.";
    if (s.cassa < DATI.postazione.costo) return "Non hai abbastanza soldi in cassa.";
    s.cassa -= DATI.postazione.costo; s.postazioni++; s.meseCorrente.investimenti += DATI.postazione.costo; return null;
  }
  function vendiPostazione(s) {
    if (s.postazioni <= 1) return "Ti serve almeno una postazione.";
    s.postazioni--; s.cassa += DATI.postazione.costo * DATI.postazione.rivendita; return null;
  }
  function trasloca(s, id) {
    if (id === s.locale || !DATI.locali[id]) return "Sei già qui.";
    if (s.cassa < DATI.trasloco) return "Non hai abbastanza soldi per il trasloco.";
    s.cassa -= DATI.trasloco;
    s.locale = id;
    const max = DATI.locali[id].maxPostazioni;
    while (s.postazioni > max) { s.postazioni--; s.cassa += DATI.postazione.costo * DATI.postazione.rivendita; }
    return null;
  }
  function restituisci(s) {
    if (s.debito <= 0) return "Non hai debiti.";
    if (s.cassa < s.debito) return "Non hai abbastanza soldi in cassa.";
    s.cassa -= s.debito; s.debito = 0; return null;
  }

  const ECO = { rng, nuovaPartita, giocaGiorno, eventoDelGiorno, probAccetta, minutiLavoro, prezzoPagato, minutiDisponibili, operatori, mese, giorniTotali, patrimonio, valorePostazioni, risultato, assumi, licenzia, compraPostazione, vendiPostazione, trasloca, restituisci };
  if (typeof module !== "undefined" && module.exports) module.exports = ECO;
  else radice.BDP_ECO = ECO;
})(this);
