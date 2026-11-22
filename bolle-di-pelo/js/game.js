// Bolle di Pelo — interfaccia, salvataggi, comandi.
(function () {
  const D = window.BDP_DATI, E = window.BDP_ECO, A = window.BDP_ANIMALI;
  const playtest = /sala-zero-playtest/.test(location.pathname) || /[?&]playtest\b/.test(location.search);
  const CHIAVE = D.salvataggio + (playtest ? "-playtest" : "");
  const $ = id => document.getElementById(id);
  const eur = n => (n < 0 ? "−" : "") + Math.abs(Math.round(n)).toLocaleString("it-IT") + " €";
  const razza = id => D.razze.find(z => z.id === id);
  const stelline = n => "★".repeat(Math.round(n)) + "☆".repeat(5 - Math.round(n));

  let S = null; // stato della partita
  let ultimoReport = null;
  let timerGiornata = null;

  function salva() { try { localStorage.setItem(CHIAVE, JSON.stringify(S)); } catch (e) { /* niente salvataggio */ } }
  function carica() {
    try {
      const t = localStorage.getItem(CHIAVE);
      if (!t) return null;
      const s = JSON.parse(t);
      return s && s.versione === D.versione ? s : null;
    } catch (e) { return null; }
  }

  function mostra(id) {
    for (const s of document.querySelectorAll(".schermo")) s.hidden = s.id !== id;
    window.scrollTo(0, 0);
  }

  function finestra(html) {
    $("finestraCorpo").innerHTML = html;
    const f = $("finestra");
    if (f.showModal) f.showModal(); else f.setAttribute("open", "");
  }

  function muso(id, umore, classe) {
    const z = razza(id);
    return `<span class="muso ${classe || ""}">${A.svgAnimale(z, umore)}</span>`;
  }

  // ---------- titolo ----------
  function titolo() {
    const ids = ["pomerania", "persiano", "testadileone", "corgi", "siamese"];
    $("parataTitolo").innerHTML = ids.map(i => muso(i, "felice")).join("");
    const c = carica();
    $("btnContinua").hidden = !c || c.finita;
    $("btnNuova").classList.toggle("primario", $("btnContinua").hidden);
    mostra("schermoTitolo");
  }

  function guida() {
    finestra(`<h2>Come si gioca</h2>
      <p>Hai aperto un negozio di toelettatura per cani, gatti e coniglietti. Hai <strong>${D.mesi} mesi</strong> (${E.giorniTotali()} giornate) per farlo crescere. Non serve essere veloci: ogni mattina prendi le decisioni e poi guardi com'è andata.</p>
      <ul>
        <li><strong>Prezzi:</strong> più alti guadagni di più per ogni animale, ma più clienti rinunciano. Gli animali grandi pagano di più ma richiedono molto più tempo.</li>
        <li><strong>Tempo:</strong> ogni persona lavora 8 ore su una postazione. Se arrivano troppi clienti, qualcuno va rimandato e rimane deluso.</li>
        <li><strong>Aiutanti e postazioni:</strong> un aiutante costa ${D.stipendio} € al giorno e gli serve una postazione (${D.postazione.costo} €).</li>
        <li><strong>Pubblicità:</strong> porta più persone, ma si paga ogni giorno.</li>
        <li><strong>Prodotti:</strong> migliori costano di più e rendono i clienti più contenti. I clienti contenti alzano le <strong>stelle</strong> e diventano <strong>fedeli</strong>: tornano e badano meno al prezzo.</li>
        <li><strong>Affitto:</strong> si paga alla fine di ogni mese (ogni ${D.giorniPerMese} giorni). Un locale più bello ha più passanti ma costa di più.</li>
        <li>Se la cassa va sotto zero, la banca ti presta ${D.prestito.importo} € da restituire con gli interessi (${D.prestito.restituzione} €).</li>
      </ul>
      <p>Alla fine conta il <strong>patrimonio</strong>: soldi in cassa, più il valore delle postazioni, meno i debiti. Medaglie: 🥉 ${eur(D.medaglie[2].min)} · 🥈 ${eur(D.medaglie[1].min)} · 🥇 ${eur(D.medaglie[0].min)}.</p>
      <p class="spiega">Ai conigli non si fa il bagno: l'acqua li spaventa e può farli ammalare. Per loro solo spazzola, unghie e taglio. Il tempo del gioco è compresso: un mese dura ${D.giorniPerMese} giornate.</p>
      <p class="spiega">Comandi: tocca i pulsanti, oppure da tastiera Invio per aprire il negozio e andare avanti.</p>`);
  }

  function album() {
    const gruppi = [["cane", "Cani"], ["gatto", "Gatti"], ["coniglio", "Coniglietti"]];
    let h = `<h2>Album dei clienti</h2><p class="spiega">Taglia e pelo cambiano il tempo di lavoro. Il pelo lungo allunga tosatura e spa; i gatti vanno trattati con più calma.</p>`;
    for (const [sp, nome] of gruppi) {
      h += `<h3 style="margin:10px 0 6px">${nome}</h3><div class="album">`;
      for (const z of D.razze.filter(r => r.specie === sp)) {
        h += `<div>${muso(z.id, "felice")}<strong>${z.nome}</strong><br><small>taglia ${z.taglia} · pelo ${z.pelo}</small></div>`;
      }
      h += `</div>`;
    }
    finestra(h);
  }

  // ---------- gestione ----------
  function hud() {
    $("hudGiorno").textContent = `Giorno ${S.giorno}/${E.giorniTotali()}`;
    const g = ((S.giorno - 1) % D.giorniPerMese) + 1;
    $("hudMese").textContent = `Mese ${E.mese(S.giorno)} · affitto tra ${D.giorniPerMese - g + 1} g`;
    $("hudCassa").textContent = eur(S.cassa);
    $("hudCassa").classList.toggle("negativo", S.cassa < 0);
    $("hudStelle").textContent = S.stelle.toFixed(1) + " ★";
    $("hudFedeli").textContent = S.fedeli;
  }

  function vetrina() {
    const loc = D.locali[S.locale];
    const op = E.operatori(S);
    let h = `<div class="insegna">🫧 Bolle di Pelo · ${loc.nome}</div><div class="postazioni">`;
    for (let i = 0; i < loc.maxPostazioni; i++) {
      if (i < S.postazioni) h += `<div class="postazione">🛁${i < op ? `<span class="operatore">${i === 0 ? "🧑‍🎨" : "🧑‍🔧"}</span>` : ""}</div>`;
      else h += `<div class="postazione vuota">＋</div>`;
    }
    h += `</div>`;
    for (let i = 0; i < 6; i++) h += `<span class="bolla" style="left:${8 + i * 16}%;bottom:0;width:${8 + (i % 3) * 5}px;height:${8 + (i % 3) * 5}px;animation-delay:${i * 0.9}s"></span>`;
    $("vetrina").innerHTML = h;
  }

  function costiFissiOggi() {
    const loc = D.locali[S.locale];
    return S.aiutanti * D.stipendio + D.pubblicita[S.scelte.pubblicita].costo + loc.affitto / D.giorniPerMese + D.utenze.fisso;
  }

  function margineMedio() {
    const pesi = { bagno: 0.48, tosatura: 0.32, spa: 0.2 };
    const prod = D.prodotti[S.scelte.prodotti].costo;
    let m = 0;
    for (const k of Object.keys(pesi)) m += pesi[k] * (S.scelte.prezzi[k] * 1.3 - D.servizi[k].prodotti * 1.4 * prod);
    return m;
  }

  function pannelli() {
    const P = [];
    // prezzi
    let h = `<section class="pannello"><h2>🏷️ Listino prezzi <button type="button" data-az="guidaPrezzi">?</button></h2>`;
    for (const [k, sv] of Object.entries(D.servizi)) {
      const p = S.scelte.prezzi[k];
      const m = Math.round(p * D.taglie.media.prezzo), g = Math.round(p * D.taglie.grande.prezzo);
      h += `<div class="riga"><span style="font-size:1.5rem">${sv.icona}</span><div class="nome"><strong>${sv.breve}</strong><small>media ${m} € · grande ${g} € · in città ~${sv.riferimento} €</small></div>
        <button type="button" data-az="prezzo" data-k="${k}" data-d="-1" aria-label="Abbassa ${sv.breve}">−</button>
        <span class="valore">${p} €</span>
        <button type="button" data-az="prezzo" data-k="${k}" data-d="1" aria-label="Alza ${sv.breve}">+</button></div>`;
    }
    h += `<p class="spiega">Il prezzo in alto è per la taglia piccola; media e grande pagano di più.</p></section>`;
    P.push(h);

    // squadra
    const op = E.operatori(S), max = D.locali[S.locale].maxPostazioni;
    const min = E.minutiDisponibili(S);
    h = `<section class="pannello"><h2>👩‍🔧 Squadra e postazioni</h2>
      <div class="riga"><div class="nome"><strong>Aiutanti: ${S.aiutanti}</strong><small>più tu · ${D.stipendio} € al giorno ciascuno</small></div>
        <button type="button" data-az="licenzia" aria-label="Un aiutante in meno" ${S.aiutanti ? "" : "disabled"}>−</button>
        <button type="button" data-az="assumi" aria-label="Assumi un aiutante" ${S.aiutanti < D.maxAiutanti ? "" : "disabled"}>+</button></div>
      <div class="riga"><div class="nome"><strong>Postazioni: ${S.postazioni}/${max}</strong><small>nuova ${eur(D.postazione.costo)} · rivendi a ${eur(D.postazione.costo * D.postazione.rivendita)}</small></div>
        <button type="button" data-az="vendi" aria-label="Vendi una postazione" ${S.postazioni > 1 ? "" : "disabled"}>−</button>
        <button type="button" data-az="compra" aria-label="Compra una postazione" ${S.postazioni < max && S.cassa >= D.postazione.costo ? "" : "disabled"}>+</button></div>
      <p>Al lavoro: <strong>${op} ${op === 1 ? "persona" : "persone"}</strong> · ${Math.round(min / 60)} ore di lavoro al giorno</p>
      <p class="spiega">Bastano per circa ${Math.floor(min / 42)} bagni di taglia media, oppure ${Math.floor(min / 150)} spa a un cane grande.</p>
      ${S.aiutanti + 1 > S.postazioni ? `<p class="negativo">⚠️ Qualcuno resta senza postazione ma viene pagato lo stesso.</p>` : ""}
    </section>`;
    P.push(h);

    // pubblicità
    h = `<section class="pannello"><h2>📣 Pubblicità</h2><div class="scelte">`;
    for (const [k, p] of Object.entries(D.pubblicita)) {
      h += `<button type="button" data-az="pub" data-k="${k}" aria-pressed="${S.scelte.pubblicita === k}">${p.icona} ${p.nome}<small>${p.costo ? p.costo + " €/giorno" : "gratis"} · +${Math.round(p.effetto * 100)}%</small></button>`;
    }
    h += `</div><p class="spiega">La percentuale indica quante persone in più passano a chiedere.</p></section>`;
    P.push(h);

    // prodotti
    h = `<section class="pannello"><h2>🧴 Prodotti</h2><div class="scelte">`;
    for (const [k, p] of Object.entries(D.prodotti)) {
      h += `<button type="button" data-az="prod" data-k="${k}" aria-pressed="${S.scelte.prodotti === k}">${p.nome}<small>costo ×${p.costo} · ${Math.round(p.qualita * 100)}% contenti</small></button>`;
    }
    h += `</div><p class="spiega">${D.prodotti[S.scelte.prodotti].desc} Se si lavora di corsa, i clienti contenti calano.</p></section>`;
    P.push(h);

    // locale
    h = `<section class="pannello"><h2>🏠 Il locale</h2><div class="locali">`;
    for (const [k, l] of Object.entries(D.locali)) {
      const qui = k === S.locale;
      h += `<div class="locale ${qui ? "attuale" : ""}"><div><strong>${l.nome}</strong><br>
        <span class="chip">affitto ${eur(l.affitto)}/mese</span><span class="chip">~${l.passanti} passanti</span><span class="chip">${l.maxPostazioni} postazioni</span>
        <br><small>${l.desc}</small></div>
        ${qui ? "<strong>Sei qui</strong>" : `<button type="button" data-az="trasloca" data-k="${k}">Trasloca<br><small>${eur(D.trasloco)}</small></button>`}</div>`;
    }
    h += `</div><p class="spiega">L'affitto matura ogni giorno e si paga a fine mese. Traslocando, le postazioni in più si rivendono.</p></section>`;
    P.push(h);

    // andamento
    if (S.storico.length) {
      const maxU = Math.max(1, ...S.storico.map(x => Math.abs(x.utile)));
      h = `<section class="pannello"><h2>📈 Andamento</h2><p class="spiega">Utile di ogni giorno (verde guadagno, rosa perdita: di solito è il giorno dell'affitto).</p><div class="grafico">`;
      for (const x of S.storico) h += `<span class="${x.utile < 0 ? "neg" : ""}" style="height:${Math.round(100 * Math.abs(x.utile) / maxU)}%" title="Giorno ${x.giorno}: ${eur(x.utile)}"></span>`;
      h += `</div>`;
      if (S.mesi.length) {
        h += `<table class="conto">` + S.mesi.map(m => `<tr><td>Mese ${m.numero}</td><td class="${m.utile < 0 ? "negativo" : ""}">${eur(m.utile)}</td></tr>`).join("") + `</table>`;
      }
      if (S.debito) h += `<p>Debito con la banca: <strong>${eur(S.debito)}</strong> <button type="button" data-az="restituisci" ${S.cassa >= S.debito ? "" : "disabled"}>Restituisci</button></p>`;
      h += `<p>Patrimonio oggi: <strong>${eur(E.patrimonio(S))}</strong></p></section>`;
      P.push(h);
    }
    $("pannelli").innerHTML = P.join("");

    const fissi = costiFissiOggi();
    const marg = margineMedio();
    const n = marg > 0 ? Math.ceil(fissi / marg) : "∞";
    $("pareggio").innerHTML = `Spese fisse di oggi: <strong>${eur(fissi)}</strong> (aiutanti, pubblicità, affitto, luce). Per andare in pari ti servono circa <strong>${n} clienti</strong>.`;
  }

  function gestione() {
    hud(); vetrina(); pannelli();
    const ev = E.eventoDelGiorno(S);
    $("evento").hidden = !ev;
    if (ev) $("evento").textContent = "Previsioni di oggi: " + ev.testo;
    mostra("schermoGestione");
  }

  function aggiorna() { salva(); hud(); vetrina(); pannelli(); }

  function avviso(msg) { if (msg) finestra(`<p>${msg}</p>`); }

  $("pannelli").addEventListener("click", ev => {
    const b = ev.target.closest("button[data-az]");
    if (!b) return;
    const k = b.dataset.k;
    switch (b.dataset.az) {
      case "prezzo": {
        const sv = D.servizi[k];
        S.scelte.prezzi[k] = Math.max(sv.minimo, Math.min(sv.massimo, S.scelte.prezzi[k] + Number(b.dataset.d)));
        break;
      }
      case "pub": S.scelte.pubblicita = k; break;
      case "prod": S.scelte.prodotti = k; break;
      case "assumi": avviso(E.assumi(S)); break;
      case "licenzia": avviso(E.licenzia(S)); break;
      case "compra": avviso(E.compraPostazione(S)); break;
      case "vendi": avviso(E.vendiPostazione(S)); break;
      case "restituisci": avviso(E.restituisci(S)); break;
      case "trasloca": {
        const l = D.locali[k];
        if (!confirm(`Traslocare in "${l.nome}"? Il trasloco costa ${D.trasloco} € e l'affitto diventa ${l.affitto} € al mese.`)) return;
        avviso(E.trasloca(S, k));
        break;
      }
      case "guidaPrezzi":
        finestra(`<h2>Prezzo e domanda</h2><p>Ogni cliente ha in mente un prezzo giusto, vicino a quello medio della città. Se chiedi di più, alcuni rinunciano; se chiedi meno, ne arrivano di più ma guadagni meno su ognuno.</p>
          <p>Le <strong>stelle</strong> cambiano tutto: con 5 stelle i clienti accettano prezzi molto più alti. I clienti <strong>fedeli</strong> badano meno al prezzo.</p>
          <p>Trucco: se sei sempre pieno e rimandi clienti, alza i prezzi. Se hai tanto tempo libero, abbassali o fai pubblicità.</p>`);
        return;
    }
    // mantiene il pulsante sotto il dito dopo il ridisegno
    const sel = `button[data-az="${b.dataset.az}"]${k ? `[data-k="${k}"]` : ""}${b.dataset.d ? `[data-d="${b.dataset.d}"]` : ""}`;
    aggiorna();
    const nb = document.querySelector(sel);
    if (nb && document.activeElement === document.body) nb.focus({ preventScroll: true });
  });

  // ---------- giornata ----------
  const ICONE = { felice: "😊", scontento: "😐", prezzo: "💸", tempo: "⏰" };
  function apri() {
    const { stato, report } = E.giocaGiorno(S);
    S = stato; ultimoReport = report; salva();
    $("gioGiorno").textContent = `Giorno ${report.giorno}`;
    $("gioIncasso").textContent = "0 €";
    $("gioTempo").style.width = "0";
    $("coda").innerHTML = "";
    mostra("schermoGiornata");
    let i = 0, incasso = 0, usati = 0;
    const passo = Math.max(120, Math.min(450, 7000 / Math.max(1, report.clienti.length)));
    clearInterval(timerGiornata);
    timerGiornata = setInterval(() => {
      if (i >= report.clienti.length) { clearInterval(timerGiornata); timerGiornata = null; setTimeout(resoconto, 700); return; }
      const c = report.clienti[i++];
      const z = razza(c.razza);
      const umore = c.esito === "felice" ? "felice" : c.esito === "scontento" || c.esito === "tempo" ? "triste" : "normale";
      const servito = c.esito === "felice" || c.esito === "scontento";
      if (servito) { incasso += c.prezzo; usati += c.minuti; }
      const el = document.createElement("div");
      el.className = "cliente " + c.esito;
      el.innerHTML = `${c.fedele ? '<span class="fedele">⭐</span>' : ""}<span class="esito">${ICONE[c.esito]}</span>${muso(c.razza, umore, z.taglia)}<strong>${z.nome}</strong>${D.servizi[c.servizio].icona} ${servito ? "+" + c.prezzo + " €" : c.prezzo + " €?"}`;
      $("coda").appendChild(el);
      el.scrollIntoView({ block: "nearest" });
      $("gioIncasso").textContent = eur(incasso);
      $("gioTempo").style.width = Math.min(100, 100 * usati / report.minutiTot) + "%";
    }, passo);
  }

  function resoconto() {
    clearInterval(timerGiornata); timerGiornata = null;
    const r = ultimoReport;
    let h = `<section class="pannello"><h2>Resoconto del giorno ${r.giorno}</h2>`;
    if (r.evento) h += `<p>${r.evento}</p>`;
    h += `<div class="numeri">
      <div><small>Passati a chiedere</small><strong>${r.potenziali}</strong></div>
      <div><small>Serviti</small><strong>${r.serviti}</strong></div>
      <div><small>Contenti</small><strong>${r.soddisfatti}</strong></div>
      <div><small>💸 Troppo caro</small><strong>${r.rinunce}</strong></div>
      <div><small>⏰ Senza tempo</small><strong>${r.rimandati}</strong></div>
      <div><small>Tempo usato</small><strong>${Math.round(100 * r.minutiUsati / r.minutiTot)}%</strong></div>
    </div>
    <table class="conto">
      <tr><td>Incassi (${r.perServizio.bagno} 🛁 · ${r.perServizio.tosatura} ✂️ · ${r.perServizio.spa} 🎀)</td><td>${eur(r.incassi)}</td></tr>
      <tr><td>Prodotti</td><td>${eur(-r.costi.prodotti)}</td></tr>
      <tr><td>Stipendi degli aiutanti</td><td>${eur(-r.costi.stipendi)}</td></tr>
      <tr><td>Acqua calda e corrente</td><td>${eur(-r.costi.utenze)}</td></tr>
      <tr><td>Pubblicità</td><td>${eur(-r.costi.pubblicita)}</td></tr>
      ${r.costi.affitto ? `<tr><td><strong>Affitto del mese</strong></td><td>${eur(-r.costi.affitto)}</td></tr>` : ""}
      <tr class="totale"><td>Utile del giorno</td><td class="${r.utile < 0 ? "negativo" : ""}">${eur(r.utile)}</td></tr>
    </table>
    <p>Stelle: ${r.stellePrima.toFixed(1)} → <strong>${r.stelleDopo.toFixed(1)}</strong> ${stelline(r.stelleDopo)} · Fedeli: <strong>${r.fedeli}</strong> (${r.nuoviFedeli ? "+" + r.nuoviFedeli : "0"} nuovi${r.fedeliPersi ? ", " + r.fedeliPersi + " persi" : ""})</p>
    <ul class="consigli">${r.consigli.map(c => `<li>${c}</li>`).join("")}</ul></section>`;

    if (r.contoMese) {
      const m = r.contoMese;
      h += `<section class="pannello"><h2>📒 Conto del mese ${m.numero}</h2>
        <table class="conto">
          <tr><td>Incassi</td><td>${eur(m.incassi)}</td></tr>
          <tr><td>Prodotti</td><td>${eur(-m.prodotti)}</td></tr>
          <tr><td>Stipendi</td><td>${eur(-m.stipendi)}</td></tr>
          <tr><td>Acqua e corrente</td><td>${eur(-m.utenze)}</td></tr>
          <tr><td>Pubblicità</td><td>${eur(-m.pubblicita)}</td></tr>
          <tr><td>Affitto</td><td>${eur(-m.affitto)}</td></tr>
          <tr class="totale"><td>Utile del mese</td><td class="${m.utile < 0 ? "negativo" : ""}">${eur(m.utile)}</td></tr>
        </table>
        <p class="spiega">Le postazioni comprate (${eur(m.investimenti)}) non sono un costo del mese: sono un investimento che resta tuo e conta nel patrimonio.</p>
        <p>Clienti serviti: ${m.serviti} · rinunce per il prezzo: ${m.rinunce} · rimandati: ${m.rimandati}</p></section>`;
    }

    if (r.finale) {
      const f = r.finale;
      h += `<section class="pannello" style="text-align:center"><h2 style="justify-content:center">Fine dei ${D.mesi} mesi!</h2>
        <div class="medaglia">${f.medaglia ? f.medaglia.icona : "🫧"}</div>
        <p>Patrimonio finale: <strong>${eur(f.patrimonio)}</strong><br>
        <small>cassa ${eur(S.cassa)} + postazioni ${eur(E.valorePostazioni(S))}${S.debito ? " − debiti " + eur(S.debito) : ""}</small></p>
        <p>${f.medaglia ? ({ Oro: "Medaglia d'oro!", Argento: "Medaglia d'argento!", Bronzo: "Medaglia di bronzo!" })[f.medaglia.nome] : `Niente medaglia questa volta: il bronzo parte da ${eur(D.medaglie[2].min)}.`} Stelle ${f.stelle.toFixed(1)} · ${f.fedeli} clienti fedeli.</p>
        <p class="spiega">Hai iniziato con ${eur(D.cassaIniziale)}.</p></section>`;
      salvaRecord(f.patrimonio);
      $("btnAvanti").textContent = "Torna al titolo";
    } else $("btnAvanti").textContent = "Prepara il giorno " + S.giorno + " ▶";
    $("resoconto").innerHTML = h;
    mostra("schermoResoconto");
  }

  function salvaRecord(p) {
    try {
      const k = CHIAVE + "-record";
      const vecchio = Number(localStorage.getItem(k) || 0);
      if (p > vecchio) localStorage.setItem(k, String(p));
    } catch (e) { /* niente */ }
  }

  function avanti() { if (S.finita) titolo(); else gestione(); }

  function nuova() {
    const c = carica();
    if (c && !c.finita && !confirm("Ricominciare da capo? La partita in corso andrà persa.")) return;
    S = E.nuovaPartita(Math.floor(Math.random() * 1e9));
    salva();
    gestione();
    finestra(`<h2>Benvenuta, benvenuto!</h2><p>Hai ${eur(D.cassaIniziale)}, una postazione e una piccola bottega nel vicolo. Scegli i prezzi e premi <strong>Apri il negozio</strong>. Dopo ogni giornata la Gufa contabile ti dà un consiglio 🦉.</p><p class="spiega">Tra ${D.giorniPerMese} giorni arriva l'affitto: tieni da parte i soldi!</p>`);
  }

  $("btnNuova").addEventListener("click", nuova);
  $("btnContinua").addEventListener("click", () => { S = carica(); if (S) gestione(); });
  $("btnGuida").addEventListener("click", guida);
  $("btnAlbum").addEventListener("click", album);
  $("btnApri").addEventListener("click", apri);
  $("btnSalta").addEventListener("click", resoconto);
  $("btnAvanti").addEventListener("click", avanti);
  $("btnMenu").addEventListener("click", () => {
    finestra(`<h2>Menù</h2><div class="menu">
      <button type="button" id="mGuida">Come si gioca</button>
      <button type="button" id="mAlbum">Album dei clienti</button>
      <button type="button" id="mTitolo">Torna al titolo</button></div>
      <p class="spiega">La partita si salva da sola su questo dispositivo.</p>`);
    $("mGuida").onclick = guida;
    $("mAlbum").onclick = album;
    $("mTitolo").onclick = () => { $("finestra").close(); titolo(); };
  });

  document.addEventListener("keydown", e => {
    if (e.key !== "Enter" || $("finestra").open) return;
    if (e.target.closest && e.target.closest("button")) return;
    if (!$("schermoGestione").hidden) apri();
    else if (!$("schermoGiornata").hidden) resoconto();
    else if (!$("schermoResoconto").hidden) avanti();
  });

  titolo();
})();
