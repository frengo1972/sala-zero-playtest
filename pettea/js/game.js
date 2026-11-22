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
    avatar: `${D.salvataggio}-avatar`, record: `${D.salvataggio}-record`
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
  const avatarSvg = () => A.gattino({
    pelo: D.pelo.find(p => p.id === avatar.pelo).colore,
    accessorio: avatar.accessorio,
    coloreAcc: D.coloriAccessorio.find(c => c.id === avatar.coloreAcc).colore
  });

  // ---------- Suoni ----------
  let ac;
  function suono(tipo) {
    try {
      ac ??= new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === "suspended") ac.resume();
      const note = { tocca: [660, 0.05], cassa: [880, 0.08, 1320], errore: [200, 0.18], via: [330, 0.12, 220] }[tipo];
      const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime;
      o.type = "triangle";
      o.frequency.setValueAtTime(note[0], t);
      if (note[2]) o.frequency.setValueAtTime(note[2], t + note[1]);
      g.gain.setValueAtTime(0.12, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + note[1] * 2.2);
      o.connect(g).connect(ac.destination);
      o.start(t);
      o.stop(t + note[1] * 2.3);
    } catch { /* audio non disponibile */ }
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
      if (!s || s.versione !== D.versione) s = E.nuovoStato({ modo });
    } else {
      const seme = E.semeSfida();
      s = leggi(CHIAVI.sfida);
      if (!s || s.seme !== seme || s.giorno > D.giorniMese || s.versione !== D.versione) s = E.nuovoStato({ modo, seme });
    }
    salva();
    scheda = "giornata";
    apriSera();
    if (s.giorno === 1) benvenuto();
  }

  function benvenuto() {
    finestra(`<div class="gufa carta"><div>${A.gufa()}</div><div>
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

  function boxGufa(righe) {
    return `<div class="carta gufa"><div>${A.gufa()}</div><div>${righe.map(r => `<p>${r}</p>`).join("")}</div></div>`;
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
    return `${boxGufa(E.consigli(r))}
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
        <div><strong><span class="pallino" style="background:${i.colore};display:inline-block"></span> ${i.nome}</strong>
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
      <p class="spiega">Per ora c'è solo il gattino: cagnolini, ochette, coniglietti e altri animaletti arrivano con la grafica definitiva.</p>
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
    for (const b of document.querySelectorAll("[data-compra]")) b.onclick = () => {
      const esito = E.compra(s, b.dataset.compra);
      if (!esito.ok) {
        b.classList.add("scuoti");
        setTimeout(() => b.classList.remove("scuoti"), 300);
        avviso({ frigo: "Il frigo è pieno.", dispensa: "La dispensa è piena.", cassa: "Non hai abbastanza soldi in cassa." }[esito.motivo]);
        return;
      }
      suono("cassa");
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
      <p class="spiega">Tastiera: 1–9 ingredienti, Invio serve, Backspace butta. La partita si salva su questo dispositivo alla fine di ogni giornata.</p>`);
  }

  // ---------- Servizio ----------
  function apriChiosco() {
    sv = E.creaServizio(s);
    ciotola = [];
    mostra("schermoServizio");
    $("hudGiorno").textContent = `Giorno ${s.giorno}`;
    $("hudSettimana").textContent = nomeGiorno(s.giorno) + (E.weekend(s.giorno) ? " · fine settimana" : "");
    $("chef").innerHTML = avatarSvg();
    disegnaIngredienti();
    disegnaCiotola();
    disegnaCoda();
    inPausa = false;
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
        if (e.tipo === "arrivo") ridisegna = true;
        if (e.tipo === "persoCoda") avviso("Coda piena: un cliente passa oltre");
        if (e.tipo === "impaziente") { avviso("Un cliente ha perso la pazienza ★"); suono("via"); ridisegna = true; }
        if (e.tipo === "esaurito") { avviso("Manca un ingrediente: il cliente se ne va"); suono("via"); ridisegna = true; disegnaIngredienti(); }
      }
      if (ridisegna) disegnaCoda();
      aggiornaHud();
      if (sv.fine) return fineGiornata();
    }
    raf = requestAnimationFrame(ciclo);
  }

  function aggiornaHud() {
    const resto = Math.max(0, 1 - sv.t / D.durataServizio);
    $("hudTempo").style.width = `${resto * 100}%`;
    $("hudCassa").textContent = eur(s.cassa);
    $("hudStelle").textContent = stelleTesto(E.valutazione(s));
    for (const c of sv.coda) {
      const el = document.querySelector(`[data-cliente="${c.n}"] .pazienza`);
      if (!el) continue;
      const f = Math.max(0, c.restante / D.pazienza);
      el.firstElementChild.style.width = `${f * 100}%`;
      el.classList.toggle("bassa", f < 0.5);
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
        const ing = E.ING[id];
        const ok = i === 0 && ciotola.includes(id) ? " ok" : "";
        return `<span class="voce${ok}"><span class="pallino" style="background:${ing.colore}"></span>${ing.breve}</span>`;
      }).join("");
      html.push(`<div class="cliente${i === 0 ? " primo" : ""}${entra}" data-cliente="${c.n}">
        <div class="nuvoletta">${voci}</div>
        <div class="faccia">${A.cliente(tipo.animale)}</div>
        <div class="pazienza"><span></span></div>
        <div class="tipo-cliente">${tipo.singolare}</div></div>`);
    }
    $("coda").innerHTML = html.join("");
    aggiornaHud();
  }

  function disegnaIngredienti() {
    $("ingredienti").innerHTML = D.ingredienti.map((i, k) => {
      const q = E.disponibile(s, i.id);
      return `<button type="button" class="ingrediente${ciotola.includes(i.id) ? " scelto" : ""}${q < 3 ? " poco" : ""}" data-ing="${i.id}" ${q === 0 ? "disabled" : ""} aria-label="${i.nome}, ${q} porzioni">
        <span class="tasto">${k + 1}</span><span class="qta">${q}</span>
        <span class="bollo" style="background:${i.colore}"></span><span class="nome">${i.breve}</span></button>`;
    }).join("");
    for (const b of document.querySelectorAll("[data-ing]")) b.onclick = () => scegli(b.dataset.ing);
  }

  function disegnaCiotola() {
    $("ciotola").innerHTML = ciotola.map(id => `<span class="chip"><span class="pallino" style="background:${E.ING[id].colore}"></span>${E.ING[id].breve}</span>`).join("");
    $("btnServi").disabled = ciotola.length === 0 || sv.coda.length === 0;
    $("btnButta").disabled = ciotola.length === 0;
  }

  function scegli(id) {
    if (!sv || sv.fine) return;
    const ing = E.ING[id];
    if (ciotola.includes(id)) {
      ciotola = ciotola.filter(x => x !== id);
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
    }
    suono("tocca");
    disegnaCiotola();
    disegnaIngredienti();
    disegnaCoda();
  }

  function servi() {
    if (!sv || !ciotola.length || !sv.coda.length) return;
    const r = E.servi(sv, ciotola);
    if (!r.ok) { avviso("Mancano degli ingredienti"); return; }
    ciotola = [];
    if (r.giusto) {
      suono("cassa");
      avviso(`+${eur(r.incasso)}${r.mancia ? ` · mancia ${eur(r.mancia)}` : ""} · ${"★".repeat(r.stelle)}`);
    } else {
      suono("errore");
      avviso(`Ciotola sbagliata: paga metà (${eur(r.incasso)}) · ★★`);
    }
    disegnaCiotola();
    disegnaIngredienti();
    disegnaCoda();
  }

  function butta() {
    if (!ciotola.length) return;
    const costo = E.butta(sv, ciotola);
    ciotola = [];
    suono("errore");
    avviso(`Buttato: ${eur(costo)} di ingredienti`);
    disegnaCiotola();
    disegnaIngredienti();
    disegnaCoda();
  }

  function fineGiornata() {
    cancelAnimationFrame(raf);
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
    const medaglia = m.medaglia ? `<div class="medaglia">${medagliaIcona(m.medaglia)}</div><p style="text-align:center"><strong>Medaglia ${D.medaglie.find(x => x.id === m.medaglia).nome.toLowerCase()}</strong></p>`
      : `<p>Nessuna medaglia questo mese: il bronzo arriva con ${eur(D.medaglie[2].utile)} di utile.</p>`;
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
  for (const b of document.querySelectorAll(".schede button")) b.onclick = () => { scheda = b.dataset.scheda; disegnaSchede(); };

  document.addEventListener("keydown", e => {
    if ($("schermoServizio").hidden || $("finestra").open || !sv) return;
    const n = Number(e.key);
    if (n >= 1 && n <= D.ingredienti.length) { scegli(D.ingredienti[n - 1].id); e.preventDefault(); }
    else if (e.key === "Enter") { servi(); e.preventDefault(); }
    else if (e.key === "Backspace" || e.key === "Delete") { butta(); e.preventDefault(); }
  });

  document.addEventListener("visibilitychange", () => {
    if (!sv) return;
    inPausa = document.hidden;
    ultimoT = performance.now();
  });

  aggiornaTitolo();
})();
