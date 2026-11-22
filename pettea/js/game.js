"use strict";

(() => {
  const E = PetteaEconomia, D = PetteaDati, A = PetteaAvatar;
  const $ = id => document.getElementById(id);
  const eur = c => (Math.round(c) / 100 || 0).toLocaleString("it-IT", { style: "currency", currency: "EUR" });
  const meno = c => c > 0 ? `−${eur(c)}` : eur(0);
  const stelleTesto = v => `★ ${v.toLocaleString("it-IT", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`;
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const GIORNI = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];
  const nomeGiorno = g => GIORNI[g % 7];

  // ---------- Salvataggi ----------
  const CHIAVI = {
    carriera: D.salvataggio, sfida: `${D.salvataggio}-sfida`,
    avatar: `${D.salvataggio}-avatar`, record: `${D.salvataggio}-record`,
    impostazioni: `${D.salvataggio}-impostazioni`
  };
  function leggi(k, def = null) {
    try { const v = JSON.parse(localStorage.getItem(k)); return v ?? def; } catch { return def; }
  }
  function scrivi(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* memoria non disponibile: si gioca senza salvare */ }
  }
  function cancella(k) {
    try { localStorage.removeItem(k); } catch { /* niente */ }
  }

  let avatar = leggi(CHIAVI.avatar, { nome: "Mochi", pelo: "crema", accessorio: "cappello", coloreAcc: "corallo" });
  const TINTA_BASE = { fiocco: 0, bandana: 155 };
  const avatarSvg = (posa = "felice") => {
    const tinta = D.coloriAccessorio.find(c => c.id === avatar.coloreAcc).tinta;
    const base = TINTA_BASE[avatar.accessorio];
    return A.gattino({
      filtro: D.pelo.find(p => p.id === avatar.pelo).filtro,
      accessorio: avatar.accessorio,
      coloreAcc: base === undefined ? null : `hue-rotate(${tinta - base}deg)${tinta === 255 ? " saturate(.8)" : ""}`,
      posa
    });
  };

  // ---------- Impostazioni e audio ----------
  let imp = leggi(CHIAVI.impostazioni, { musica: true, suoni: true });
  PetteaAudio.imposta(imp);
  const suono = tipo => PetteaAudio.effetto(tipo);

  function impostazioniHtml() {
    return `<div class="scelte impostazioni">
      <button type="button" data-imp="musica" aria-pressed="${imp.musica}">♪ Musica</button>
      <button type="button" data-imp="suoni" aria-pressed="${imp.suoni}">♫ Suoni</button></div>`;
  }

  // ---------- Stato della partita ----------
  let s = null;           // stato economico
  let sv = null;          // servizio in corso
  let ciotola = [];
  let scheda = "giornata";
  let raf = 0, ultimoT = 0, inPausa = false;

  function salva() {
    if (s) scrivi(CHIAVI[s.modo], s);
  }

  function mostra(id) {
    for (const el of document.querySelectorAll(".schermo")) el.hidden = el.id !== id;
    window.scrollTo(0, 0);
  }

  // ---------- Titolo ----------
  function aggiornaTitolo() {
    $("anteprimaTitolo").innerHTML = avatarSvg();
    const salvata = leggi(CHIAVI.carriera);
    $("btnCarriera").textContent = salvata ? `Continua · giorno ${salvata.giorno}` : "Inizia la carriera";
    $("btnNuova").hidden = !salvata;
    const seme = E.semeSfida();
    const sfida = leggi(CHIAVI.sfida);
    const rec = leggi(CHIAVI.record, {}).sfide?.[seme];
    $("btnSfida").textContent = sfida && sfida.seme === seme && sfida.giorno <= D.giorniMese
      ? `Sfida della settimana · giorno ${sfida.giorno}`
      : rec ? `Sfida della settimana · record ${eur(rec.utile)}` : "Sfida della settimana";
  }

  function avvia(modo, nuova = false) {
    if (modo === "carriera") {
      s = !nuova && leggi(CHIAVI.carriera);
      if (!s || !Array.isArray(s.lotti)) s = E.nuovoStato({ modo });
    } else {
      const seme = E.semeSfida();
      s = leggi(CHIAVI.sfida);
      if (!s || s.seme !== seme || s.giorno > D.giorniMese || !Array.isArray(s.lotti)) s = E.nuovoStato({ modo, seme });
    }
    s.versione = D.versione;
    salva();
    scheda = "giornata";
    PetteaAudio.avviaMusica();
    apriSera();
    if (s.giorno === 1) benvenuto();
  }

  function benvenuto() {
    finestra(`<div class="gufa carta"><div>${A.gufa("spiega")}</div><div>
      <p><strong>Benvenuta, benvenuto a Pettea!</strong> Sono la Dottoressa Gufa e ti aiuterò con i conti.</p>
      <p>${s.modo === "sfida"
        ? "Nella <strong>sfida della settimana</strong> tutti giocano lo stesso mese, con gli stessi clienti. Vince chi chiude con l'utile più alto."
        : "Questo chiosco è tuo. Ogni giornata servi le ciotole; la sera compri le scorte, scegli il prezzo e controlli i conti."}</p>
      <p>Prima di aprire dai un'occhiata a <strong>Mercato</strong> e <strong>Prezzo</strong>. Hai già qualche scorta per il primo giorno.</p>
    </div></div>`, [{ testo: "Si comincia!", primario: true }]);
  }

  // ---------- Sera ----------
  function apriSera() {
    mostra("schermoSera");
    $("titoloSera").textContent = s.giorno === 1 && !s.ultimoGiorno
      ? `Prima dell'apertura · ${nomeGiorno(s.giorno)}`
      : `Sera · prepara il giorno ${s.giorno}`;
    $("btnApri").textContent = `Apri il chiosco · giorno ${s.giorno} ▶`;
    disegnaSchede();
  }

  function concettiSbloccati() {
    return D.quaderno.filter(q => q.dopoGiorno < s.giorno);
  }

  function disegnaSchede() {
    $("seraCassa").textContent = eur(s.cassa);
    const nuovi = new Set(concettiSbloccati().filter(q => q.dopoGiorno === s.giorno - 1).map(q => q.id));
    for (const b of document.querySelectorAll(".schede button")) {
      const sel = b.dataset.scheda === scheda;
      b.setAttribute("aria-selected", sel);
      b.querySelector(".nuovo")?.remove();
      if (b.dataset.scheda === "quaderno" && nuovi.size) b.insertAdjacentHTML("beforeend", '<span class="nuovo" aria-label="novità"></span>');
    }
    const p = $("pannello");
    p.innerHTML = { giornata: pannelloGiornata, mercato: pannelloMercato, prezzo: pannelloPrezzo, conti: pannelloConti,
      quaderno: pannelloQuaderno, aspetto: pannelloAspetto, record: pannelloRecord }[scheda]();
    p.scrollTop = 0;
    collegaPannello();
  }

  function boxGufa(righe, umore = "spiega") {
    return `<div class="carta gufa"><div>${A.gufa(umore)}</div><div>${righe.map(r => `<p>${r}</p>`).join("")}</div></div>`;
  }

  function pannelloGiornata() {
    const r = s.ultimoGiorno;
    if (!r) {
      const stima = E.stimaDomanda(s, s.prezzo);
      return boxGufa([
        `Domani è ${nomeGiorno(s.giorno).toLowerCase()}${E.weekend(s.giorno) ? ": nel fine settimana arrivano più turisti" : ""}. Mi aspetto circa <strong>${Math.round(stima.compratori)} clienti</strong> con la ciotola a ${eur(s.prezzo)}.`,
        "Durante il servizio tocca gli ingredienti chiesti nella nuvoletta del primo cliente, poi premi <strong>Servi</strong>. Se sbagli, premi <strong>Butta</strong> e rifai.",
        "Sul computer puoi usare i tasti da 1 a 9, Invio per servire e Backspace per buttare."
      ]);
    }
    const sprechi = r.scaduti + r.buttati;
    const tipi = D.tipi.map(t => {
      const g = r.guardano[t.id] || 0, n = r.rinunce[t.id] || 0;
      return `<tr><td>${t.nome}</td><td class="num">${g}</td><td class="num">${g - n}</td><td class="num">${n}</td></tr>`;
    }).join("");
    const consigli = E.consigli(r);
    return `${boxGufa(consigli, consigli[0].startsWith("Ottima") ? "contenta" : "preoccupata")}
      <div class="carta"><h3>Giorno ${r.giorno} · ${nomeGiorno(r.giorno)}</h3>
        <table class="tabella">
          <tr><td>Clienti serviti</td><td class="num">${r.serviti}${r.sbagliati ? ` + ${r.sbagliati} sbagliati` : ""}</td></tr>
          <tr><td>Persi in coda o per l'attesa</td><td class="num">${r.persiCoda + r.impazienti}</td></tr>
          <tr><td>Persi per ingredienti finiti</td><td class="num">${r.esauriti}</td></tr>
          <tr><td>Incassi</td><td class="num">${eur(r.vendite)}</td></tr>
          <tr><td>Mance</td><td class="num">${eur(r.mance)}</td></tr>
          <tr><td>Costo degli ingredienti usati</td><td class="num negativo">${meno(r.costoVenduto)}</td></tr>
          <tr><td>Sprechi (scaduti e buttati)</td><td class="num negativo">${meno(sprechi)}</td></tr>
          <tr class="totale"><td>Utile della giornata</td><td class="num ${r.utile >= 0 ? "positivo" : "negativo"}">${eur(r.utile)}</td></tr>
        </table>
        <p class="spiega">Valutazione dei clienti: ${stelleTesto(r.valutazione)}. Prezzo della ciotola: ${eur(r.prezzo)}.</p>
      </div>
      <div class="carta"><h3>Chi è passato davanti al chiosco</h3>
        <table class="tabella"><tr><th>Tipo</th><th class="num">Passati</th><th class="num">Comprato</th><th class="num">Rinunce</th></tr>${tipi}</table>
        <p class="spiega">Chi rinuncia trova il prezzo troppo alto per sé. Ogni tipo di cliente ha un prezzo che considera giusto.</p>
      </div>`;
  }

  function pannelloMercato() {
    const prezzi = E.prezziMercato(s);
    const occ = E.occupazione(s);
    const stima = E.stimaDomanda(s, s.prezzo);
    const quota = { base: "½", proteina: "½", topping: "circa ½", salsa: "½" };
    const righe = D.ingredienti.map(i => {
      const disp = E.disponibile(s, i.id);
      const domani = s.lotti.filter(l => l.id === i.id && l.scade === s.giorno).reduce((t, l) => t + l.q, 0);
      return `<div class="riga-mercato">
        <div><strong class="nome-mercato"><span class="icona-mini">${A.ingrediente(i.id)}</span> ${i.nome}</strong>
          <div class="info">In scorta: ${disp}${domani ? ` · <span class="negativo">${domani} scadono domani sera</span>` : ""} · dura ${i.durata} ${i.durata === 1 ? "giorno" : "giorni"} · ${eur(prezzi[i.id])} a porzione · ${quota[i.cat]} a ciotola</div></div>
        <button type="button" data-compra="${i.id}">+${i.lotto} · ${eur(prezzi[i.id] * i.lotto)}</button>
      </div>`;
    }).join("");
    const pf = occ.frigo / D.capienzaFrigo, pd = occ.dispensa / D.capienzaDispensa;
    return `<div class="carta"><h3>Mercato della sera</h3>
        <p class="spiega">Domani (${nomeGiorno(s.giorno).toLowerCase()}) aspetti circa <strong>${Math.round(stima.compratori)} clienti</strong>. Ogni ciotola usa una base, una proteina, da 1 a 3 topping e una salsa. Gli ingredienti freschi scadono presto: compra quello che pensi di usare.</p>
        ${righe}</div>
      <div class="carta"><h3>Spazio</h3>
        <p class="spiega">Frigo (freschi): ${occ.frigo} su ${D.capienzaFrigo}</p><div class="barra ${pf > 0.9 ? "piena" : ""}"><span style="width:${Math.min(100, pf * 100)}%"></span></div>
        <p class="spiega">Dispensa (riso e salse): ${occ.dispensa} su ${D.capienzaDispensa}</p><div class="barra ${pd > 0.9 ? "piena" : ""}"><span style="width:${Math.min(100, pd * 100)}%"></span></div>
      </div>`;
  }

  function costoMedioCiotola() {
    const p = E.prezziMercato(s);
    return Math.round(0.6 * p.riso + 0.4 * p.venere + 0.5 * p.salmone + 0.5 * p.tofu
      + 0.55 * (p.avocado + p.edamame + p.mango) + 0.6 * p.soia + 0.4 * p.piccante);
  }

  function pannelloPrezzo() {
    return `<div class="carta"><h3>Prezzo della ciotola</h3>
        <div class="prezzo-grande" id="prezzoValore">${eur(s.prezzo)}</div>
        <input id="prezzoSlider" type="range" min="${D.prezzoMin}" max="${D.prezzoMax}" step="50" value="${s.prezzo}" aria-label="Prezzo della ciotola">
      </div><div id="prezzoDettagli" style="display:grid;gap:12px">${dettagliPrezzo()}</div>`;
  }

  function dettagliPrezzo() {
    const st = E.stimaDomanda(s, s.prezzo);
    const costo = costoMedioCiotola();
    const tipi = st.perTipo.map(x => {
      const t = E.TIPI[x.tipo];
      return `<div class="domanda-tipo"><span>${t.nome}</span><div class="barra"><span style="width:${Math.round(x.prob * 100)}%"></span></div><span>${Math.round(x.prob * 100)}%</span></div>`;
    }).join("");
    const margine = s.prezzo - costo;
    return `<div class="carta">
        <p class="spiega" style="margin:0">Costo medio degli ingredienti di una ciotola: ${eur(costo)} · margine: <strong class="${margine >= 0 ? "positivo" : "negativo"}">${eur(margine)}</strong> a ciotola.</p>
      </div>
      <div class="carta"><h3>Chi compra a questo prezzo</h3>${tipi}
        <table class="tabella">
          <tr><td>Passanti attesi domani</td><td class="num">${st.visitatori}${E.weekend(s.giorno) ? " (fine settimana)" : ""}</td></tr>
          <tr><td>Clienti attesi</td><td class="num">${Math.round(st.compratori)}</td></tr>
          <tr><td>Margine stimato della giornata</td><td class="num">${eur(Math.round(st.compratori) * margine)}</td></tr>
        </table>
        <p class="spiega">È una stima: arriva solo chi trova il prezzo giusto, e lo servi solo se ce la fai prima che perda la pazienza. Se il prezzo supera di molto quello che si aspetta, il cliente lascia meno mancia e una stella in meno.</p>
      </div>`;
  }

  function rigaConto(nome, valore, classe = "") {
    return `<tr class="${classe}"><td>${nome}</td><td class="num">${valore}</td></tr>`;
  }

  function tabellaConto(m) {
    const sprechi = m.scaduti + m.buttati;
    const utile = E.utileDi(m);
    return `<table class="tabella">
      ${rigaConto("Ricavi dalle vendite", eur(m.vendite))}
      ${rigaConto("Mance", eur(m.mance))}
      ${rigaConto("Costo degli ingredienti venduti", `<span class="negativo">${meno(m.costoVenduto)}</span>`)}
      ${rigaConto("Sprechi", `<span class="negativo">${meno(sprechi)}</span>`)}
      ${rigaConto("Affitto ed energia", "capitolo 2", "bloccato")}
      ${rigaConto("Pubblicità", "capitolo 2", "bloccato")}
      ${rigaConto("Ammortamenti", "capitolo 3", "bloccato")}
      ${rigaConto("IVA e imposte", "capitolo 4", "bloccato")}
      ${rigaConto("Utile", `<span class="${utile >= 0 ? "positivo" : "negativo"}">${eur(utile)}</span>`, "totale")}
    </table>`;
  }

  function pannelloConti() {
    const m = s.mese;
    const storico = s.storico.map(x => `<tr><td>Mese ${x.numero}</td><td class="num">${eur(x.utile)}</td><td class="num">${stelleTesto(x.stelle)}</td></tr>`).join("");
    return `<div class="carta"><h3>Conto economico · mese ${m.numero} (${m.giorni.length} di ${D.giorniMese} giornate)</h3>${tabellaConto(m)}
        <p class="spiega">Le voci grigie arrivano nei prossimi capitoli: per ora il chiosco è un regalo della città.</p></div>
      <div class="carta"><h3>Cassa del mese</h3><table class="tabella">
        ${rigaConto("Cassa a inizio mese", eur(m.cassaInizio))}
        ${rigaConto("+ incassi e mance", eur(m.vendite + m.mance))}
        ${rigaConto("− acquisti al mercato", `<span class="negativo">${meno(m.acquisti)}</span>`)}
        ${rigaConto("Cassa adesso", eur(s.cassa), "totale")}
        ${rigaConto("Valore delle scorte in frigo e dispensa", eur(Math.round(E.valoreScorte(s))))}
      </table>
      <p class="spiega">La cassa scende quando compri, l'utile solo quando usi o butti gli ingredienti: per questo i due numeri sono diversi.</p></div>
      ${storico ? `<div class="carta"><h3>Mesi passati</h3><table class="tabella"><tr><th>Mese</th><th class="num">Utile</th><th class="num">Stelle</th></tr>${storico}</table></div>` : ""}`;
  }

  function pannelloQuaderno() {
    return `<p class="spiega">Il quaderno dell'imprenditrice raccoglie i concetti che scopri giocando.</p>` + D.quaderno.map(q => q.dopoGiorno < s.giorno
      ? `<div class="carta concetto"><h3>${q.titolo}</h3><p>${q.testo}</p><p class="domanda">${q.domanda}</p></div>`
      : `<div class="carta concetto bloccato"><h3>${q.titolo}</h3><p>Si sblocca dopo il giorno ${q.dopoGiorno}.</p></div>`).join("");
  }

  function pannelloAspetto() {
    const scelte = (nome, lista, attuale, campione) => `<div><h3>${nome}</h3><div class="scelte">${lista.map(x =>
      `<button type="button" data-aspetto="${nome}" data-valore="${x.id}" aria-pressed="${x.id === attuale}" ${campione ? `class="campione" style="background:${x.colore}" aria-label="${x.nome || x.id}"` : ""}>${campione ? "" : esc(x.nome)}</button>`).join("")}</div></div>`;
    return `<div class="carta editor">
      <div class="anteprima">${avatarSvg()}</div>
      ${scelte("Nome", D.nomiAnimaletto.map(n => ({ id: n, nome: n })), avatar.nome)}
      ${scelte("Pelo", D.pelo, avatar.pelo, true)}
      ${scelte("Accessorio", D.accessori, avatar.accessorio)}
      ${scelte("Colore", D.coloriAccessorio, avatar.coloreAcc, true)}
      <p class="spiega">Per ora c'è solo il gattino: cagnolini, ochette, coniglietti e altri animaletti arriveranno nei prossimi aggiornamenti.</p>
    </div>`;
  }

  function pannelloRecord() {
    const rec = leggi(CHIAVI.record, { carriera: [], sfide: {} });
    const sfide = Object.entries(rec.sfide || {}).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 8)
      .map(([k, v]) => `<tr><td>${k.replace("sfida-", "").replace("-w", " · sett. ")}</td><td class="num">${eur(v.utile)}</td><td class="num">${stelleTesto(v.stelle)}</td><td>${medagliaIcona(v.medaglia)}</td></tr>`).join("");
    const carr = (rec.carriera || []).slice().sort((a, b) => b.utile - a.utile).slice(0, 5)
      .map(v => `<tr><td>Mese ${v.mese}</td><td class="num">${eur(v.utile)}</td><td class="num">${stelleTesto(v.stelle)}</td><td>${medagliaIcona(v.medaglia)}</td></tr>`).join("");
    return `<div class="carta"><h3>Sfide della settimana</h3>${sfide ? `<table class="tabella">${sfide}</table>` : '<p class="spiega">Nessuna sfida completata.</p>'}</div>
      <div class="carta"><h3>Mesi migliori della carriera</h3>${carr ? `<table class="tabella">${carr}</table>` : '<p class="spiega">Completa un mese per vederlo qui.</p>'}</div>
      <p class="spiega">I record restano su questo dispositivo. La classifica online, facoltativa e anonima, arriverà con il playtest.</p>`;
  }

  function medagliaIcona(id) {
    return { oro: "🥇", argento: "🥈", bronzo: "🥉" }[id] || "";
  }

  function collegaPannello() {
    for (const b of document.querySelectorAll("[data-imp]")) b.onclick = () => {
      imp[b.dataset.imp] = !imp[b.dataset.imp];
      scrivi(CHIAVI.impostazioni, imp);
      PetteaAudio.imposta(imp);
      if (imp.musica && s) PetteaAudio.avviaMusica();
      b.setAttribute("aria-pressed", imp[b.dataset.imp]);
    };
    for (const b of document.querySelectorAll("[data-compra]")) b.onclick = () => {
      const esito = E.compra(s, b.dataset.compra);
      if (!esito.ok) {
        b.classList.add("scuoti");
        setTimeout(() => b.classList.remove("scuoti"), 300);
        avviso({ frigo: "Il frigo è pieno.", dispensa: "La dispensa è piena.", cassa: "Non hai abbastanza soldi in cassa." }[esito.motivo]);
        return;
      }
      suono("compra");
      salva();
      disegnaSchede();
    };
    const slider = $("prezzoSlider");
    if (slider) slider.oninput = () => {
      s.prezzo = Number(slider.value);
      $("prezzoValore").textContent = eur(s.prezzo);
      $("prezzoDettagli").innerHTML = dettagliPrezzo();
    };
    if (slider) slider.onchange = salva;
    for (const b of document.querySelectorAll("[data-aspetto]")) b.onclick = () => {
      const k = { Nome: "nome", Pelo: "pelo", Accessorio: "accessorio", Colore: "coloreAcc" }[b.dataset.aspetto];
      avatar[k] = b.dataset.valore;
      scrivi(CHIAVI.avatar, avatar);
      if ($("finestra").open) apriEditor(); else disegnaSchede();
    };
  }

  // ---------- Finestre e avvisi ----------
  function finestra(html, bottoni = [{ testo: "Chiudi" }]) {
    const f = $("finestra");
    $("finestraCorpo").innerHTML = html + `<div class="azioni-finestra">${bottoni.map((b, i) =>
      `<button type="button" data-i="${i}" class="${b.primario ? "primario" : ""}">${b.testo}</button>`).join("")}</div>`;
    for (const el of $("finestraCorpo").querySelectorAll("[data-i]")) el.onclick = () => {
      f.close();
      bottoni[Number(el.dataset.i)].azione?.();
    };
    if (!f.open) f.showModal();
    collegaPannello();
  }

  let timerAvviso;
  function avviso(testo) {
    const t = $("toast");
    t.textContent = testo;
    t.classList.add("visibile");
    clearTimeout(timerAvviso);
    timerAvviso = setTimeout(() => t.classList.remove("visibile"), 1800);
  }

  function apriEditor() {
    finestra(`<h2>Il mio animaletto</h2>${pannelloAspetto()}`, [{ testo: "Fatto", primario: true, azione: aggiornaTitolo }]);
  }

  function guida() {
    finestra(`<h2>Come si gioca</h2>
      <p><strong>Di giorno</strong> servi i clienti: ogni nuvoletta mostra l'ordine. Tocca gli ingredienti giusti e premi <em>Servi</em>. Veloce e preciso vuol dire mance e stelle.</p>
      <p><strong>La sera</strong> compri le scorte al mercato (i freschi scadono!), scegli il prezzo e guardi i conti con la Dottoressa Gufa.</p>
      <p><strong>Ogni 10 giornate</strong> chiudi il mese: il conto economico ti dice quanto hai guadagnato davvero, e una medaglia premia i mesi migliori.</p>
      <p><strong>Sfida della settimana:</strong> lo stesso mese per tutti, con gli stessi clienti. Puoi rigiocarla quante volte vuoi.</p>
      <p class="spiega">Tastiera: 1–9 ingredienti, Invio serve, Backspace butta, P mette in pausa. La partita si salva su questo dispositivo alla fine di ogni giornata.</p>
      <p class="spiega">Immagini generate con ChatGPT (OpenAI) per Sala Zero. Musica ed effetti originali, generati dal gioco.</p>`);
  }

  // ---------- Servizio ----------
  let inizioGiornata = null, pausaManuale = false, prossimoPassante = 0, ultimoAggiunto = null;

  function apriChiosco() {
    inizioGiornata = JSON.stringify(s);
    sv = E.creaServizio(s);
    ciotola = [];
    ultimoAggiunto = null;
    prossimoPassante = 0;
    visti.clear();
    mostra("schermoServizio");
    $("hudGiorno").textContent = `Giorno ${s.giorno}`;
    $("hudSettimana").textContent = nomeGiorno(s.giorno) + (E.weekend(s.giorno) ? " · fine sett." : "");
    $("lavagnaPrezzo").textContent = eur(s.prezzo);
    $("chef").innerHTML = avatarSvg();
    $("effetti").innerHTML = "";
    $("strada").querySelectorAll(".passante").forEach(el => el.remove());
    disegnaIngredienti();
    disegnaCiotola();
    disegnaCoda();
    inPausa = false;
    pausaManuale = false;
    PetteaAudio.avviaMusica();
    ultimoT = performance.now();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(ciclo);
  }

  function ciclo(t) {
    const dt = Math.min(0.1, (t - ultimoT) / 1000);
    ultimoT = t;
    if (!inPausa) {
      const eventi = E.tick(sv, dt);
      let ridisegna = false;
      for (const e of eventi) {
        if (e.tipo === "arrivo") { ridisegna = true; suono("arrivo"); }
        if (e.tipo === "persoCoda") avviso("Coda piena: un cliente passa oltre");
        if (e.tipo === "impaziente") { esci(e.c.n, "arrabbiato"); avviso("Un cliente si è stufato! ★"); suono("arrabbiato"); ridisegna = true; }
        if (e.tipo === "esaurito") { esci(e.c.n, "stufo", "Finito?"); avviso("Manca un ingrediente: il cliente se ne va"); suono("errore"); ridisegna = true; disegnaIngredienti(); }
      }
      const passanti = sv.piano.passanti || [];
      while (prossimoPassante < passanti.length && passanti[prossimoPassante].passa <= sv.t) passante(passanti[prossimoPassante++]);
      if (ridisegna) disegnaCoda();
      aggiornaHud();
      if (sv.fine) return fineGiornata();
    }
    raf = requestAnimationFrame(ciclo);
  }

  function umoreDi(f) {
    return f > 0.6 ? "felice" : f > 0.3 ? "neutro" : "stufo";
  }

  function aggiornaHud() {
    const resto = Math.max(0, 1 - sv.t / D.durataServizio);
    $("hudTempo").style.width = `${resto * 100}%`;
    $("hudCassa").textContent = eur(s.cassa);
    $("hudStelle").textContent = stelleTesto(E.valutazione(s));
    for (const c of sv.coda) {
      const el = document.querySelector(`#coda [data-cliente="${c.n}"]`);
      if (!el) continue;
      const f = Math.max(0, c.restante / D.pazienza);
      const barra = el.querySelector(".pazienza");
      barra.firstElementChild.style.width = `${f * 100}%`;
      barra.classList.toggle("bassa", f < 0.5);
      const umore = umoreDi(f);
      if (el.dataset.umore !== umore) {
        el.dataset.umore = umore;
        const tipo = E.TIPI[c.tipo];
        el.querySelector(".faccia").innerHTML = A.cliente(tipo.animale, umore, tipo.id);
        el.classList.toggle("stufo", umore === "stufo");
      }
    }
  }

  const visti = new Set();
  function disegnaCoda() {
    const html = [];
    for (let i = 0; i < D.codaMax; i++) {
      const c = sv.coda[i];
      if (!c) { html.push("<div></div>"); continue; }
      const tipo = E.TIPI[c.tipo];
      const entra = visti.has(c.n) ? "" : " entra";
      visti.add(c.n);
      const voci = c.ordine.map(id => {
        const ok = i === 0 && ciotola.includes(id) ? " ok" : "";
        return `<span class="voce${ok}">${A.ingrediente(id)}</span>`;
      }).join("");
      const umore = umoreDi(c.restante / D.pazienza);
      html.push(`<div class="cliente${i === 0 ? " primo" : ""}${entra}${umore === "stufo" ? " stufo" : ""}" data-cliente="${c.n}" data-umore="${umore}">
        <div class="nuvoletta" aria-label="Ordine: ${c.ordine.map(id => E.ING[id].nome).join(", ")}">${voci}</div>
        <div class="faccia">${A.cliente(tipo.animale, umore, tipo.id)}</div>
        <div class="pazienza"><span></span></div>
        <div class="tipo-cliente">${tipo.singolare}</div></div>`);
    }
    $("coda").innerHTML = html.join("");
    aggiornaHud();
  }

  // Un cliente lascia la coda: la sua figura esce dalla scena con un'animazione
  function esci(n, umore, frase = "") {
    const el = document.querySelector(`#coda [data-cliente="${n}"]`);
    if (!el) return null;
    const scena = $("scena").getBoundingClientRect(), r = el.getBoundingClientRect();
    const tipo = E.TIPI[sv.piano.compratori.find(c => c.n === n)?.tipo] || E.TIPI.studente;
    const g = document.createElement("div");
    g.className = `fantasma ${umore}`;
    g.style.left = `${r.left - scena.left}px`;
    g.style.top = `${el.querySelector(".faccia").getBoundingClientRect().top - scena.top}px`;
    g.style.width = `${r.width}px`;
    const nuvola = umore === "arrabbiato" ? `<div class="rabbia">${A.nuvolaRabbia()}</div>` : frase ? `<div class="pensiero">${frase}</div>` : "";
    g.innerHTML = `${nuvola}<div class="faccia">${A.cliente(tipo.animale, umore === "felice" ? "felice" : umore, tipo.id)}</div>`;
    $("effetti").append(g);
    const dx = umore === "felice" ? -scena.width : scena.width;
    const passi = umore === "arrabbiato"
      ? [{ transform: "translate(0,0)" }, { transform: "translate(-4px,0) rotate(-6deg)", offset: 0.15 }, { transform: "translate(4px,0) rotate(6deg)", offset: 0.3 },
        { transform: "translate(0,0)", offset: 0.45 }, { transform: `translate(${dx}px, 6px)`, opacity: 0.2 }]
      : [{ transform: "translate(0,0)" }, { transform: "translate(0,-14px)", offset: 0.2 }, { transform: "translate(0,0)", offset: 0.35 },
        { transform: `translate(${dx * 0.5}px,-10px)`, offset: 0.65 }, { transform: `translate(${dx}px,0)`, opacity: 0.2 }];
    g.animate(passi, { duration: umore === "arrabbiato" ? 1600 : 1200, easing: "ease-in" }).onfinish = () => g.remove();
    return r;
  }

  const FRASI_PASSANTI = {
    studente: ["Troppo caro per me!", "Mmh… costa troppo"], sportivo: ["Un'altra volta!", "Troppo caro"],
    famiglia: ["In quattro costa troppo!", "Mmh… no"], turista: ["Carino… ma no", "Più tardi!"]
  };

  // Un passante guarda il menù, rinuncia e se ne va
  function passante(p) {
    const tipo = E.TIPI[p.tipo];
    const strada = $("strada"), w = strada.clientWidth;
    const el = document.createElement("div");
    el.className = "passante";
    const frase = FRASI_PASSANTI[p.tipo][Math.floor(p.jitter * 2)];
    el.innerHTML = `<div class="pensiero" hidden>${frase}</div><div class="faccia">${A.cliente(tipo.animale, "felice", tipo.id)}</div>`;
    strada.append(el);
    const sosta = w * 0.62;
    el.animate([
      { transform: "translateX(-70px)" }, { transform: `translateX(${sosta}px)`, offset: 0.4 },
      { transform: `translateX(${sosta}px)`, offset: 0.7 }, { transform: `translateX(${w + 20}px)` }
    ], { duration: 5200, easing: "linear" }).onfinish = () => el.remove();
    setTimeout(() => {
      if (!el.isConnected) return;
      el.querySelector(".pensiero").hidden = false;
      el.querySelector(".faccia").innerHTML = A.cliente(tipo.animale, "neutro", tipo.id);
      el.classList.add("no");
    }, 2100);
    setTimeout(() => { if (el.isConnected) el.querySelector(".pensiero").hidden = true; }, 3700);
  }

  // Le monetine della mancia saltano fuori e volano da sole in cassa
  function monete(r, mancia, incasso) {
    if (!r) return;
    const cassa = $("hudCassa").getBoundingClientRect();
    const testo = document.createElement("div");
    testo.className = "galleggia";
    testo.textContent = `+${eur(incasso)}`;
    testo.style.left = `${r.left + r.width / 2}px`;
    testo.style.top = `${r.top + 40}px`;
    document.body.append(testo);
    testo.animate([{ transform: "translate(-50%,0)", opacity: 1 }, { transform: "translate(-50%,-50px)", opacity: 0 }], { duration: 1100 }).onfinish = () => testo.remove();
    const n = Math.min(5, Math.ceil(mancia / 50));
    for (let i = 0; i < n; i++) {
      const m = document.createElement("div");
      m.className = "moneta";
      m.innerHTML = A.moneta();
      const x0 = r.left + r.width / 2 - 14 + (i - (n - 1) / 2) * 22, y0 = r.top + r.height * 0.55;
      m.style.left = `${x0}px`;
      m.style.top = `${y0}px`;
      document.body.append(m);
      const tx = cassa.left + cassa.width / 2 - x0 - 14, ty = cassa.top - y0;
      m.animate([
        { transform: "translate(0,0) scale(.3)", opacity: 0 },
        { transform: `translate(${(i - (n - 1) / 2) * 6}px,-36px) scale(1)`, opacity: 1, offset: 0.25 },
        { transform: "translate(0,-20px) scale(1)", offset: 0.5 },
        { transform: `translate(${tx}px,${ty}px) scale(.5)`, opacity: 0.9 }
      ], { duration: 1300 + i * 120, easing: "ease-in-out" }).onfinish = () => {
        m.remove();
        suono("moneta");
        $("hudCassa").animate([{ transform: "scale(1)" }, { transform: "scale(1.15)" }, { transform: "scale(1)" }], { duration: 250 });
      };
    }
  }

  function disegnaIngredienti() {
    $("ingredienti").innerHTML = D.ingredienti.map((i, k) => {
      const q = E.disponibile(s, i.id);
      return `<button type="button" class="ingrediente${ciotola.includes(i.id) ? " scelto" : ""}${i.id === ultimoAggiunto ? " nuovo" : ""}${q < 3 ? " poco" : ""}" data-ing="${i.id}" ${q === 0 ? "disabled" : ""} aria-label="${i.nome}, ${q} porzioni">
        <span class="tasto">${k + 1}</span><span class="qta">${q}</span>
        <span class="icona">${A.ingrediente(i.id)}</span><span class="nome">${i.breve}</span></button>`;
    }).join("");
    for (const b of document.querySelectorAll("[data-ing]")) b.onclick = () => scegli(b.dataset.ing);
  }

  let timerPosa;
  function posaChef(posa, durata = 0) {
    clearTimeout(timerPosa);
    $("chef").innerHTML = avatarSvg(posa);
    if (durata) timerPosa = setTimeout(() => { if (sv) $("chef").innerHTML = avatarSvg(ciotola.length ? "concentrato" : "felice"); }, durata);
  }

  function disegnaCiotola() {
    $("ciotola").innerHTML = A.ciotola(ciotola, ultimoAggiunto, id => E.ING[id].cat);
    $("ciotola").setAttribute("aria-label", ciotola.length ? `Ciotola: ${ciotola.map(id => E.ING[id].nome).join(", ")}` : "Ciotola vuota");
    $("btnServi").disabled = ciotola.length === 0 || sv.coda.length === 0;
    $("btnButta").disabled = ciotola.length === 0;
  }

  function scegli(id) {
    if (!sv || sv.fine || inPausa) return;
    const ing = E.ING[id];
    if (ciotola.includes(id)) {
      ciotola = ciotola.filter(x => x !== id);
      ultimoAggiunto = null;
      suono("tocca");
    } else {
      if (E.disponibile(s, id) === 0) return;
      if (ing.cat === "topping") {
        if (ciotola.filter(x => E.ING[x].cat === "topping").length >= 3) { avviso("Al massimo 3 topping"); return; }
      } else {
        ciotola = ciotola.filter(x => E.ING[x].cat !== ing.cat);
      }
      ciotola.push(id);
      const ordineCat = D.categorie.map(c => c.id);
      ciotola.sort((a, b) => ordineCat.indexOf(E.ING[a].cat) - ordineCat.indexOf(E.ING[b].cat));
      ultimoAggiunto = id;
      PetteaAudio.ingrediente(ciotola.length - 1);
      if (ciotola.length === 1) posaChef("concentrato");
    }
    disegnaCiotola();
    disegnaIngredienti();
    disegnaCoda();
  }

  function servi() {
    if (!sv || inPausa || !ciotola.length || !sv.coda.length) return;
    const n = sv.coda[0].n;
    const r = E.servi(sv, ciotola);
    if (!r.ok) { avviso("Mancano degli ingredienti"); return; }
    $("ciotola").firstElementChild?.animate([{ transform: "translateY(0)", opacity: 1 }, { transform: "translateY(-60px) scale(.6)", opacity: 0 }], { duration: 300 });
    ciotola = [];
    ultimoAggiunto = null;
    const rect = esci(n, r.giusto ? "felice" : "stufo", r.giusto ? "" : "Non è giusta!");
    if (r.giusto) {
      suono("servi");
      posaChef("festeggia", 900);
      monete(rect, r.mancia, r.incasso);
      avviso(`${"★".repeat(r.stelle)}${r.mancia ? ` · mancia ${eur(r.mancia)}` : ""}`);
    } else {
      suono("errore");
      posaChef("sorpreso", 900);
      monete(rect, 0, r.incasso);
      avviso(`Ciotola sbagliata: paga metà (${eur(r.incasso)}) · ★★`);
    }
    setTimeout(() => { if (sv) { disegnaCiotola(); } }, 300);
    disegnaIngredienti();
    disegnaCoda();
  }

  function butta() {
    if (!sv || inPausa || !ciotola.length) return;
    const costo = E.butta(sv, ciotola);
    ciotola = [];
    ultimoAggiunto = null;
    suono("butta");
    posaChef("sorpreso", 700);
    avviso(`Buttato: ${eur(costo)} di ingredienti`);
    disegnaCiotola();
    disegnaIngredienti();
    disegnaCoda();
  }

  // ---------- Pausa ----------
  function pausa() {
    if (!sv || pausaManuale) return;
    pausaManuale = true;
    inPausa = true;
    document.getAnimations().forEach(a => a.pause());
    PetteaAudio.fermaMusica();
    finestra(`<h2>Pausa</h2><p>Il tempo è fermo. I clienti aspettano.</p>${impostazioniHtml()}`, [
      { testo: "Riprendi", primario: true },
      { testo: "Esci al menu (la giornata riparte dalla sera)", azione: esciDallaGiornata }
    ]);
  }

  function riprendi() {
    if (!pausaManuale) return;
    pausaManuale = false;
    if (!sv) return;
    inPausa = false;
    ultimoT = performance.now();
    document.getAnimations().forEach(a => a.play());
    PetteaAudio.avviaMusica();
  }

  function esciDallaGiornata() {
    cancelAnimationFrame(raf);
    if (inizioGiornata) s = JSON.parse(inizioGiornata);
    sv = null;
    tornaMenu();
  }

  function fineGiornata() {
    cancelAnimationFrame(raf);
    inizioGiornata = null;
    const { fineMese } = E.chiudiGiornata(s, sv);
    sv = null;
    scheda = "giornata";
    salva();
    apriSera();
    if (fineMese) mostraFineMese(fineMese);
  }

  function mostraFineMese(m) {
    const rec = leggi(CHIAVI.record, { carriera: [], sfide: {} });
    rec.carriera ??= [];
    rec.sfide ??= {};
    let nuovoRecord = false;
    if (s.modo === "sfida") {
      const prima = rec.sfide[s.seme];
      if (!prima || m.utile > prima.utile) { rec.sfide[s.seme] = { utile: m.utile, stelle: m.stelle, medaglia: m.medaglia }; nuovoRecord = true; }
    } else {
      rec.carriera.push({ mese: m.numero, utile: m.utile, stelle: m.stelle, medaglia: m.medaglia });
      rec.carriera = rec.carriera.slice(-50);
    }
    scrivi(CHIAVI.record, rec);
    const mm = { ...m, giorni: [] };
    const medaglia = m.medaglia ? `<div class="gufa-grande">${A.gufa("applaude")}</div><div class="medaglia">${medagliaIcona(m.medaglia)}</div><p style="text-align:center"><strong>Medaglia ${D.medaglie.find(x => x.id === m.medaglia).nome.toLowerCase()}</strong></p>`
      : `<div class="gufa-grande">${A.gufa("preoccupata")}</div><p>Nessuna medaglia questo mese: il bronzo arriva con ${eur(D.medaglie[2].utile)} di utile.</p>`;
    const diffCassa = m.cassaFine - m.cassaInizio;
    const corpo = `<h2>Fine del mese ${m.numero}</h2>${medaglia}
      ${tabellaConto(mm)}
      <p class="spiega">La cassa è ${diffCassa >= 0 ? "cresciuta" : "scesa"} di ${eur(Math.abs(diffCassa))}, l'utile è ${eur(m.utile)}. La differenza dipende dalle scorte: a inizio mese valevano ${eur(Math.round(m.scorteInizio))}, ora ${eur(Math.round(m.scorteFine))}.</p>
      <p class="spiega">Clienti serviti: ${m.clienti} · persi: ${m.persi} · valutazione ${stelleTesto(m.stelle)}${nuovoRecord ? " · <strong>nuovo record della settimana!</strong>" : ""}</p>`;
    if (s.modo === "sfida") {
      cancella(CHIAVI.sfida);
      finestra(corpo, [
        { testo: "Riprova la sfida", primario: true, azione: () => avvia("sfida", true) },
        { testo: "Torna al menu", azione: tornaMenu }
      ]);
    } else {
      finestra(corpo, [{ testo: "Continua la carriera", primario: true }]);
    }
  }

  function tornaMenu() {
    cancelAnimationFrame(raf);
    sv = null;
    PetteaAudio.fermaMusica();
    aggiornaTitolo();
    mostra("schermoTitolo");
  }

  // ---------- Comandi ----------
  $("btnCarriera").onclick = () => avvia("carriera");
  $("btnNuova").onclick = () => finestra("<h2>Nuova carriera</h2><p>La carriera salvata verrà cancellata. I record restano.</p>", [
    { testo: "Ricomincia da capo", primario: true, azione: () => { cancella(CHIAVI.carriera); avvia("carriera", true); } },
    { testo: "Annulla" }
  ]);
  $("btnSfida").onclick = () => avvia("sfida");
  $("btnAspetto").onclick = apriEditor;
  $("btnGuida").onclick = guida;
  $("btnApri").onclick = apriChiosco;
  $("btnMenu").onclick = tornaMenu;
  $("btnServi").onclick = servi;
  $("btnButta").onclick = butta;
  $("btnPausa").onclick = pausa;
  $("btnImpostazioni").onclick = () => finestra(`<h2>Impostazioni</h2>${impostazioniHtml()}<p class="spiega">La musica e i suoni sono originali, generati dal gioco.</p>`);
  $("finestra").addEventListener("close", riprendi);
  for (const b of document.querySelectorAll(".schede button")) b.onclick = () => { scheda = b.dataset.scheda; disegnaSchede(); };

  document.addEventListener("keydown", e => {
    if ($("schermoServizio").hidden || $("finestra").open || !sv) return;
    if (e.key === "p" || e.key === "P" || e.key === "Escape") { pausa(); e.preventDefault(); return; }
    const n = Number(e.key);
    if (n >= 1 && n <= D.ingredienti.length) { scegli(D.ingredienti[n - 1].id); e.preventDefault(); }
    else if (e.key === "Enter") { servi(); e.preventDefault(); }
    else if (e.key === "Backspace" || e.key === "Delete") { butta(); e.preventDefault(); }
  });

  document.addEventListener("visibilitychange", () => {
    if (sv && document.hidden) pausa();
  });

  aggiornaTitolo();
})();
