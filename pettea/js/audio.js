"use strict";

// Audio di Pettea: carillon e musica di sottofondo sintetizzati con WebAudio.
// Tutto originale e generato nel codice: nessun file audio, nessuna licenza esterna.
const PetteaAudio = (() => {
  let ac = null, master, busMusica, busSuoni;
  let musicaAttiva = true, suoniAttivi = true;
  let timer = 0, prossimoTempo = 0, passo = 0, inRiproduzione = false;

  const midi = n => 440 * Math.pow(2, (n - 69) / 12);

  function contesto() {
    if (ac) {
      if (ac.state === "suspended") ac.resume();
      return ac;
    }
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    ac = new C();
    master = ac.createGain();
    master.gain.value = 0.9;
    master.connect(ac.destination);
    busMusica = ac.createGain();
    busMusica.gain.value = musicaAttiva ? 0.32 : 0;
    busMusica.connect(master);
    busSuoni = ac.createGain();
    busSuoni.gain.value = suoniAttivi ? 0.8 : 0;
    busSuoni.connect(master);
    return ac;
  }

  // Una nota di carillon: sinusoide con armonica e decadimento rapido
  function carillon(nota, t, bus, vol = 0.18, durata = 1.1) {
    const f = midi(nota);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + durata);
    g.connect(bus);
    for (const [mult, v] of [[1, 1], [2, 0.35], [4.2, 0.08]]) {
      const o = ac.createOscillator(), og = ac.createGain();
      o.type = "sine";
      o.frequency.value = f * mult;
      og.gain.value = v;
      o.connect(og).connect(g);
      o.start(t);
      o.stop(t + durata + 0.05);
    }
  }

  function morbida(nota, t, bus, vol, durata, tipo = "triangle") {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = tipo;
    o.frequency.value = midi(nota);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + durata);
    o.connect(g).connect(bus);
    o.start(t);
    o.stop(t + durata + 0.05);
  }

  // ---------- Effetti ----------

  // Frase del carillon: ogni ingrediente suona la nota successiva
  const FRASE = [72, 76, 79, 84, 81, 88];
  function ingrediente(indice) {
    if (!suoniAttivi || !contesto()) return;
    carillon(FRASE[Math.min(indice, FRASE.length - 1)], ac.currentTime, busSuoni, 0.2);
  }

  function effetto(nome) {
    if (!suoniAttivi || !contesto()) return;
    const t = ac.currentTime;
    if (nome === "servi") [84, 88, 91, 96].forEach((n, i) => carillon(n, t + i * 0.07, busSuoni, 0.16, 0.8));
    if (nome === "moneta") { carillon(96, t, busSuoni, 0.12, 0.3); carillon(100, t + 0.08, busSuoni, 0.12, 0.5); }
    if (nome === "errore") { morbida(52, t, busSuoni, 0.15, 0.25, "square"); morbida(47, t + 0.15, busSuoni, 0.15, 0.35, "square"); }
    if (nome === "butta") morbida(55, t, busSuoni, 0.12, 0.3, "triangle");
    if (nome === "arrabbiato") { morbida(43, t, busSuoni, 0.14, 0.18, "sawtooth"); morbida(40, t + 0.16, busSuoni, 0.14, 0.3, "sawtooth"); }
    if (nome === "arrivo") carillon(91, t, busSuoni, 0.06, 0.4);
    if (nome === "compra") carillon(88, t, busSuoni, 0.1, 0.4);
    if (nome === "tocca") carillon(79, t, busSuoni, 0.08, 0.3);
  }

  // ---------- Musica di sottofondo ----------
  // Melodia originale in Do maggiore, giro I–vi–IV–V, 96 battiti al minuto, a ottavi.
  const BPM = 96, OTTAVO = 60 / BPM / 2;
  const MELODIA = [
    76, 0, 79, 0, 81, 79, 76, 0,   72, 0, 74, 76, 74, 0, 0, 0,
    81, 0, 79, 0, 76, 0, 72, 74,   76, 0, 0, 0, 0, 0, 0, 0,
    77, 0, 81, 0, 84, 81, 79, 0,   76, 0, 79, 0, 77, 76, 74, 0,
    79, 0, 76, 0, 74, 0, 72, 0,    74, 76, 74, 0, 72, 0, 0, 0
  ];
  const ACCORDI = [[48, 55, 64], [45, 52, 60], [41, 48, 57], [43, 50, 59]];

  function programma() {
    while (prossimoTempo < ac.currentTime + 0.12) {
      const n = MELODIA[passo % MELODIA.length];
      if (n) carillon(n, prossimoTempo, busMusica, 0.11, 0.9);
      if (passo % 8 === 0) {
        const acc = ACCORDI[Math.floor(passo / 16) % ACCORDI.length];
        morbida(acc[0], prossimoTempo, busMusica, 0.09, OTTAVO * 7);
        morbida(acc[1], prossimoTempo + OTTAVO * 2, busMusica, 0.05, OTTAVO * 4);
        morbida(acc[2], prossimoTempo + OTTAVO * 4, busMusica, 0.05, OTTAVO * 3);
      }
      prossimoTempo += OTTAVO;
      passo++;
    }
  }

  function avviaMusica() {
    if (inRiproduzione || !contesto()) return;
    inRiproduzione = true;
    prossimoTempo = ac.currentTime + 0.1;
    timer = setInterval(programma, 25);
  }

  function fermaMusica() {
    inRiproduzione = false;
    clearInterval(timer);
  }

  function imposta({ musica, suoni }) {
    if (musica !== undefined) musicaAttiva = musica;
    if (suoni !== undefined) suoniAttivi = suoni;
    if (ac) {
      busMusica.gain.setTargetAtTime(musicaAttiva ? 0.32 : 0, ac.currentTime, 0.05);
      busSuoni.gain.setTargetAtTime(suoniAttivi ? 0.8 : 0, ac.currentTime, 0.05);
    }
  }

  return { ingrediente, effetto, avviaMusica, fermaMusica, imposta };
})();
