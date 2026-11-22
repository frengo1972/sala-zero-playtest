"use strict";

const ImperoLeaderboard = (() => {
  const recordKey = "impero-v2-playtest-score-best";
  const sessionKey = "impero-v2-playtest-score-auth";
  const config = ImperoScoreConfig;
  const dialog = document.getElementById("scoreDialog");
  const recordText = document.getElementById("scoreRecord");
  const boardStatus = document.getElementById("scoreBoardStatus");
  const actionStatus = document.getElementById("scoreActionStatus");
  const rows = document.getElementById("scoreRows");
  const table = document.getElementById("scoreTable");
  const publishButton = document.getElementById("scorePublish");
  const removeButton = document.getElementById("scoreRemove");
  const notice = document.getElementById("scoreNotice");
  let levels;
  let best = storedBest();
  let busy = false;
  let hasGuest = false;
  let clientPromise;
  let boardRequest = 0;

  function readStorage(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  }

  function storedBest() {
    try {
      const saved = JSON.parse(readStorage(recordKey));
      const score = typeof saved === "number" ? { level: 6, day: saved } : saved;
      return validScore(score) ? score : null;
    } catch { return null; }
  }

  function validScore(score) {
    return score && Number.isInteger(score.level) && score.level >= 2 && score.level <= 6
      && Number.isInteger(score.day) && score.day >= 1 && score.day <= 1000000;
  }

  function isBetter(score) {
    return !best || score.level > best.level || (score.level === best.level && score.day < best.day);
  }

  function syncRecord() {
    const saved = storedBest();
    if (saved && isBetter(saved)) best = saved;
  }

  function record(score) {
    if (!validScore(score)) return;
    syncRecord();
    if (!isBetter(score)) return;
    best = score;
    try { localStorage.setItem(recordKey, JSON.stringify(score)); } catch {}
  }

  function describe(level, day) {
    return `${levels[level - 1].n}, giorno ${day.toLocaleString("it-IT")}`;
  }

  function renderControls() {
    recordText.textContent = best === null
      ? "Raggiungi Micro-studio con € 6.000 di incassi cumulativi per pubblicare il primo traguardo."
      : `Record su questo browser: ${describe(best.level, best.day)}.`;
    publishButton.hidden = !config;
    publishButton.disabled = busy || best === null;
    removeButton.hidden = !config || !(hasGuest || readStorage(sessionKey));
    removeButton.disabled = busy;
    notice.hidden = !config;
  }

  async function loadBoard() {
    if (!config) {
      boardStatus.textContent = "La classifica online sarà disponibile dopo l’attivazione del servizio.";
      return;
    }

    const request = ++boardRequest;
    boardStatus.textContent = "Caricamento della classifica…";
    try {
      const response = await fetch(new URL("/rest/v1/rpc/impero_public_progress", config.url), {
        headers: { apikey: config.publishableKey },
        signal: AbortSignal.timeout(10000)
      });
      if (!response.ok) throw new Error("Classifica non disponibile");
      const data = await response.json();
      if (request !== boardRequest) return;
      rows.replaceChildren();
      for (const [index, score] of data.entries()) {
        const row = rows.insertRow();
        row.insertCell().textContent = String(index + 1);
        row.insertCell().textContent = score.alias;
        row.insertCell().textContent = levels[score.best_level - 1].n;
        row.insertCell().textContent = Number(score.best_day).toLocaleString("it-IT");
      }
      table.hidden = data.length === 0;
      boardStatus.textContent = data.length ? "" : "La classifica è ancora vuota.";
    } catch {
      if (request === boardRequest) boardStatus.textContent = "Classifica irraggiungibile. Riprova tra poco.";
    }
  }

  function getClient() {
    clientPromise ??= new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "js/vendor/supabase.js";
      script.onload = () => {
        try {
          resolve(window.supabase.createClient(config.url, config.publishableKey, {
            auth: { storageKey: sessionKey, autoRefreshToken: false, detectSessionInUrl: false }
          }));
        } catch (error) {
          reject(error);
        }
      };
      script.onerror = reject;
      document.head.append(script);
    }).catch(error => {
      clientPromise = undefined;
      throw error;
    });
    return clientPromise;
  }

  async function publish(client) {
    syncRecord();
    const score = best;
    if (!score) return;
    const session = await client.auth.getSession();
    if (session.error) throw session.error;
    if (!session.data.session) {
      const guest = await client.auth.signInAnonymously();
      if (guest.error) throw guest.error;
    }
    hasGuest = true;
    const result = await client.rpc("impero_submit_progress", { p_level: score.level, p_day: score.day });
    if (result.error) throw result.error;
    const published = result.data[0];
    actionStatus.textContent = `Record pubblico di ${published.alias}: ${describe(published.best_level, published.best_day)}.`;
  }

  async function remove(client) {
    const session = await client.auth.getSession();
    if (session.error) throw session.error;
    if (!session.data.session) {
      hasGuest = false;
      actionStatus.textContent = "La sessione ospite è scaduta.";
      return;
    }

    const result = await client.rpc("impero_delete_guest");
    if (result.error) throw result.error;
    const signOut = await client.auth.signOut({ scope: "local" });
    hasGuest = false;
    if (signOut.error) {
      try { localStorage.removeItem(sessionKey); } catch {}
      clientPromise = undefined;
    }
    actionStatus.textContent = "Profilo ospite e record pubblico eliminati. Il record locale è ancora disponibile.";
  }

  async function run(action) {
    if (!config || busy) return;
    busy = true;
    renderControls();
    actionStatus.textContent = "";
    try {
      await action(await getClient());
      await loadBoard();
    } catch {
      actionStatus.textContent = "Operazione non riuscita. Riprova tra poco.";
    } finally {
      busy = false;
      renderControls();
    }
  }

  publishButton.onclick = () => run(publish);
  removeButton.onclick = () => {
    if (window.confirm("Eliminare il profilo ospite e il suo record pubblico?")) run(remove);
  };
  document.getElementById("scoreRetry").onclick = loadBoard;

  return {
    record,
    open(gameLevels) {
      if (dialog.open) return;
      levels = gameLevels;
      syncRecord();
      actionStatus.textContent = "";
      renderControls();
      dialog.showModal();
      loadBoard();
    }
  };
})();
