(() => {
"use strict";
// ======================================================================= utils
const $ = id => document.getElementById(id);
const rnd = (a = 1, b) => b === undefined ? Math.random() * a : a + Math.random() * (b - a);
const ri = (a, b) => Math.floor(rnd(a, b + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const mk = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };
const eur = n => { const a = Math.abs(n), s = n < 0 ? "−" : ""; if (a >= 1e6) return s + "€ " + (a / 1e6).toFixed(a >= 1e7 ? 1 : 2).replace(".", ",") + " M"; if (a >= 1e5) return s + "€ " + Math.round(a / 1e3) + "k"; return s + "€ " + Math.round(a).toLocaleString("it-IT"); };
const num = n => { const a = Math.abs(n); if (a >= 1e6) return (n / 1e6).toFixed(1).replace(".", ",") + "M"; if (a >= 1e4) return (n / 1e3).toFixed(a >= 1e5 ? 0 : 1).replace(".", ",") + "k"; return Math.round(n).toLocaleString("it-IT"); };
const hsl = (h, s, l, a = 1) => `hsla(${h},${s}%,${l}%,${a})`;
const DAY_MS = 1500;

// ======================================================================= data
const CONCEPTS = [
  { id: "romantico", n: "Romantico", c: "#ff5c8a" }, { id: "glamour", n: "Glamour", c: "#ffcf5a" }, { id: "cosplay", n: "Cosplay", c: "#8f7bff" },
  { id: "coppia", n: "Coppia reale", c: "#ff8a3d" }, { id: "parodia", n: "Parodia", c: "#3dd6c6" }, { id: "lusso", n: "Lusso", c: "#e8c27a" },
  { id: "fitness", n: "Fitness", c: "#5ce08a" }, { id: "vintage", n: "Vintage", c: "#d39a6b" }, { id: "amatoriale", n: "Amatoriale", c: "#9aa7ff" },
];
const CMAP = Object.fromEntries(CONCEPTS.map(c => [c.id, c]));
const CAMS = [
  { n: "Smartphone", q: 10, cost: 0, lvl: 1, d: "Quello che hai in tasca." },
  { n: "Mirrorless 4K", q: 25, cost: 1200, lvl: 1, d: "Ottiche intercambiabili, sfocato vero." },
  { n: "Cinepresa digitale", q: 45, cost: 7000, lvl: 2, d: "Immagine da cinema, monitor esterno." },
  { n: "Kit cinema 8K + gimbal", q: 65, cost: 32000, lvl: 4, d: "Carrello, braccio e stabilizzatore." },
];
const LIGHTS = [
  { n: "Lampada da comodino", q: 4, cost: 0, lvl: 1, d: "Calda, ma piatta." },
  { n: "Ring light", q: 10, cost: 150, lvl: 1, d: "Luce morbida e uniforme sul volto." },
  { n: "Kit softbox", q: 18, cost: 900, lvl: 2, d: "Due sorgenti diffuse, ombre controllate." },
  { n: "Luci cinema + diffusori", q: 26, cost: 9000, lvl: 3, d: "Fresnel, gelatine e fasci volumetrici." },
];
const AUDIO = [
  { n: "Microfono del telefono", q: 0, cost: 0, lvl: 1, d: "Eco e rumore di fondo." },
  { n: "Microfoni lavalier", q: 5, cost: 250, lvl: 1, d: "Voci pulite." },
  { n: "Boom + registratore", q: 10, cost: 1800, lvl: 2, d: "Audio da set professionale." },
];
const LOCS = [
  { id: "camera", n: "Camera da letto", q: 10, rent: 0, dep: 0, lvl: 1, fit: ["amatoriale", "coppia", "romantico"] },
  { id: "appartamento", n: "Appartamento-set", q: 25, rent: 350, dep: 700, lvl: 1, fit: ["romantico", "fitness", "coppia"] },
  { id: "loft", n: "Loft industriale", q: 45, rent: 1100, dep: 2500, lvl: 2, fit: ["vintage", "cosplay", "glamour"] },
  { id: "villa", n: "Villa con piscina", q: 65, rent: 3200, dep: 9000, lvl: 3, fit: ["lusso", "glamour", "romantico"] },
  { id: "teatro", n: "Teatro di posa", q: 85, rent: 7500, dep: 25000, lvl: 4, fit: ["parodia", "cosplay", "vintage", "fitness"] },
];
const STAFF = [
  { id: "operatore", n: "Operatore di camera", sal: 450, lvl: 1, d: "Zona verde del CIAK più larga." },
  { id: "regista", n: "Regista", sal: 700, lvl: 2, d: "+12% qualità di ogni scena." },
  { id: "montatore", n: "Montatore", sal: 450, lvl: 2, d: "+6% qualità e un giorno di produzione in meno." },
  { id: "smm", n: "Social media manager", sal: 500, lvl: 2, d: "Follower in più ogni giorno, meno rischio di shadowban." },
  { id: "compliance", n: "Responsabile compliance", sal: 650, lvl: 2, d: "+25 compliance. Prenota i test sanitari in automatico." },
  { id: "intimacy", n: "Coordinatore d'intimità", sal: 550, lvl: 3, d: "Il benessere dei talenti risale più in fretta; scene più fluide." },
  { id: "legale", n: "Legale antipirateria", sal: 900, lvl: 3, d: "Fa rimuovere le copie pirata ogni giorno." },
  { id: "agente", n: "Agente commerciale", sal: 1000, lvl: 4, d: "Apre le licenze VOD e porta talenti famosi." },
];
const RULES = [
  { id: "registro", n: "Registro età e documenti", cost: 300, pts: 20, lvl: 1, d: "Copia del documento e data di nascita di chiunque compaia, custodite da un responsabile." },
  { id: "consenso", n: "Consenso e limiti per ogni scena", cost: 200, pts: 15, lvl: 1, d: "Prima di girare si mettono per iscritto i limiti concordati, e si filma la conferma." },
  { id: "revisione", n: "Revisione prima della pubblicazione", cost: 900, pts: 15, lvl: 2, d: "Ogni video viene controllato prima di uscire: i circuiti di pagamento lo pretendono." },
  { id: "reclami", n: "Reclami e rimozione in 7 giorni", cost: 600, pts: 15, lvl: 2, d: "Chi compare in un video può chiederne la rimozione e ricevere risposta in una settimana." },
  { id: "agever", n: "Verifica dell'età degli utenti", cost: 4000, pts: 10, lvl: 3, d: "Controllo dell'età di chi entra nel tuo sito, ormai obbligatorio in molti paesi." },
];
const LEVELS = [
  { n: "Creator solitario", at: 0 }, { n: "Micro-studio", at: 6000 }, { n: "Casa di produzione", at: 45000 },
  { n: "Studio indipendente", at: 300000 }, { n: "Network", at: 3000000 }, { n: "Impero", at: 20000000 },
];
const PRICES = [4.99, 9.99, 14.99, 19.99];
const F_NAMES = ["Aurora", "Nina", "Mia", "Zoe", "Lara", "Sofia", "Giada", "Vera", "Ivy", "Luna", "Kira", "Noemi", "Dalia", "Iris", "Gemma", "Alba", "Celeste", "Maya", "Nora", "Elettra", "Selene", "Bianca", "Greta", "Ambra"];
const M_NAMES = ["Nico", "Leo", "Dario", "Enzo", "Max", "Rocco", "Teo", "Ivan", "Bruno", "Elia", "Milo", "Ettore", "Jonas", "Sergio", "Remo", "Alex"];
const SURN = ["Valentini", "Moreau", "Delacroix", "Ferraro", "Santoro", "Kovač", "Lind", "Hale", "Monti", "Neri", "Belmonte", "Castelli", "Rinaldi", "Vidal", "Orsini", "Laurent", "Serra", "Amato", "Novak", "Sorrentino", "Duval", "Ricci"];
const CITIES = ["Milano", "Roma", "Napoli", "Torino", "Venezia", "Parigi", "Ibiza", "Lisbona", "Berlino"];
const TITLES = {
  romantico: ["Notte a {c}", "Lettere da {c}", "Weekend a {c}", "L'ultimo treno", "Pioggia d'estate", "Cena per due"],
  glamour: ["Oro e velluto", "Red carpet {n}", "Flash", "Seta nera", "Diamanti", "Backstage di moda"],
  cosplay: ["Cavalieri del Neon", "Stazione Orbitale {n}", "Cronache Cyber", "La Strega del Nord", "Pianeta Rosso", "Accademia della Magia"],
  coppia: ["Diario di coppia {n}", "Domenica mattina", "Noi due a {c}", "Anniversario", "Vacanza a {c}"],
  parodia: ["Parodia: l'agente segreto", "Parodia: il trono di cartone", "Parodia: i pirati del Po", "Parodia: il commissario", "Parodia: guerre spaziali"],
  lusso: ["Yacht Club", "Suite {n}", "Champagne a mezzanotte", "Riviera", "Jet privato", "Grand Hotel {c}"],
  fitness: ["Allenamento {n}", "Personal trainer", "Yoga al tramonto", "Palestra di notte", "Maratona"],
  vintage: ["Anni '70", "Jukebox", "Polaroid", "Disco {n}", "Bianco e nero", "Cabaret"],
  amatoriale: ["Vlog {n}", "Fatto in casa {n}", "Dietro le quinte", "Prima volta in camera", "Diario di {c}"],
};
const FACTS = [
  "I talenti sono pagati <b>a forfait per scena</b>: niente royalties, anche se il video vende per anni.",
  "Per girare serve un <b>test sanitario negativo</b> fatto da meno di <b>14 giorni</b>: è lo standard di settore.",
  "Le piattaforme per creator trattengono di solito il <b>20%</b> di abbonamenti, contenuti a pagamento e mance.",
  "Dal 2021 i circuiti di carte chiedono <b>verifica di età e identità</b> di chi compare e <b>consenso documentato</b>.",
  "I <b>tube</b> gratuiti hanno fatto crollare DVD e vendite: oggi servono soprattutto come vetrina per i trailer.",
  "Le grandi reti pubblicitarie e gli app store <b>non accettano</b> contenuti per adulti: si cresce con social, affiliati e passaparola.",
  "Le <b>dirette</b> sono una fetta enorme degli incassi: mance in tempo reale, ma la piattaforma ne trattiene una parte grande.",
  "Ormai più della metà degli incassi dei creator arriva da <b>acquisti singoli e mance</b>, non dagli abbonamenti.",
  "La <b>pirateria</b> è la spina nel fianco: si combatte con avvisi di rimozione continui, mai una volta per tutte.",
  "Chi compare in un video deve poter chiederne la <b>rimozione</b>: un buon studio risponde entro una settimana.",
];

// ======================================================================= state
let S = null;
const SAVE = "impero-luci-rosse-v2-playtest";
function newState(name) {
  return {
    v: 1, name: name || "Studio Rosso", day: 1, cash: 1500, followers: 900, subs: 12, fame: 3, piracy: 0.05, lifetime: 0,
    gear: { cam: 0, light: 0, audio: 0 }, loc: "camera", locs: ["camera"], staff: {}, rules: {},
    roster: [], cands: [], videos: [], trends: Object.fromEntries(CONCEPTS.map(c => [c.id, rnd(0.8, 1.25)])),
    ch: { clip: false, site: false, vod: false, tube: false }, price: 9.99, siteFrozen: 0,
    cd: { shoot: 0, post: 0 }, promos: [], aff: false, shadow: 0, trendBoost: null,
    nextEvent: 6, debtDays: 0, level: 1, mission: 0, lastRelease: -99, weekLog: [], wk: blankWeek(), hist: [], nid: 1, won: false, awards: 0,
  };
}
function blankWeek() { return { ppv: 0, clip: 0, tube: 0, subs: 0, vod: 0, live: 0, cost: 0 }; }

// ======================================================================= talents
function genTalent(boost = 0) {
  const f = Math.random() < 0.62, lvl = S.level;
  const top = 18 + lvl * 13 + S.fame * 0.35 + boost;
  const fame = Math.round(clamp(rnd(2, top), 1, 98));
  const skill = Math.round(clamp(rnd(25, 55) + fame * 0.4 + rnd(-10, 10), 15, 99));
  const chem = Math.round(clamp(rnd(30, 95), 10, 99));
  const age = ri(21, 37);
  const accepts = CONCEPTS.map(c => c.id).filter(() => Math.random() < 0.72);
  if (accepts.length < 3) accepts.push(...["romantico", "glamour", "amatoriale"].filter(x => !accepts.includes(x)));
  const share = fame < 18 && Math.random() < 0.55;
  const rate = Math.round((140 + Math.pow(fame, 1.62) * 2.1) / 10) * 10;
  const doc = Math.random();
  return {
    id: "t" + (S.nid++), f, name: (f ? pick(F_NAMES) : pick(M_NAMES)) + " " + pick(SURN), age, fame, skill, chem, accepts, share, rate,
    hue: ri(0, 360), skin: pick(["#f3d2b8", "#e8b894", "#d39a6f", "#b8794f", "#8d5536", "#5f3a24", "#f6dcc7"]),
    hair: pick(f ? ["#1b1210", "#3b2416", "#6b3b1f", "#b5793d", "#e6c27a", "#c2412f", "#2b2b3a", "#e9e4e0", "#ff6fb0"] : ["#16100e", "#2f1f15", "#5b3a22", "#a87a4a", "#d8d2cc", "#1d1d26"]),
    style: f ? pick(["long", "bob", "pony", "curly", "bun", "long"]) : pick(["short", "quiff", "buzz", "curly", "long"]),
    outfit: hsl(ri(0, 360), ri(55, 85), ri(38, 58)), glasses: Math.random() < 0.15, beard: !f && Math.random() < 0.4,
    morale: ri(62, 85), rest: 0, test: S.day - ri(0, 9), testPend: 0, docIssue: doc < 0.12 ? "scaduto" : doc < 0.17 ? "dati" : "", scenes: 0,
  };
}
function testOk(t) { return !t.testPend && S.day - t.test <= 14; }
function testLeft(t) { return 14 - (S.day - t.test); }
function refreshCands(boost = 0) { S.cands = Array.from({ length: 4 }, () => genTalent(boost)); }
function rosterMax() { return 2 + S.level * 2; }

// avatar portraits (clothed head-and-shoulders), cached
const AV = new Map();
function drawnAvatar(t) {
  if (AV.has(t.id)) return AV.get(t.id);
  const c = mk(96, 96), x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, 96, 96); g.addColorStop(0, hsl(t.hue, 65, 32)); g.addColorStop(1, hsl(t.hue + 50, 70, 12));
  x.fillStyle = g; x.fillRect(0, 0, 96, 96);
  const r = x.createRadialGradient(30, 20, 2, 30, 20, 60); r.addColorStop(0, "rgba(255,255,255,.25)"); r.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = r; x.fillRect(0, 0, 96, 96);
  const hairBack = () => {
    x.fillStyle = t.hair;
    if (t.style === "long") { x.beginPath(); x.ellipse(48, 46, 23, 30, 0, Math.PI, 0); x.lineTo(72, 76); x.quadraticCurveTo(48, 82, 24, 76); x.fill(); }
    if (t.style === "curly") { for (let i = 0; i < 12; i++) { const a = Math.PI + i / 11 * Math.PI; x.beginPath(); x.arc(48 + Math.cos(a) * 20, 40 + Math.sin(a) * 22, 9, 0, 7); x.fill(); } for (const k of [-1, 1]) { x.beginPath(); x.arc(48 + k * 21, 52, 8, 0, 7); x.fill(); } }
    if (t.style === "pony") { x.beginPath(); x.ellipse(70, 34, 7, 14, 0.5, 0, 7); x.fill(); }
    if (t.style === "bun") { x.beginPath(); x.arc(48, 14, 9, 0, 7); x.fill(); }
  };
  hairBack();
  x.fillStyle = t.outfit; x.beginPath(); x.moveTo(10, 96); x.quadraticCurveTo(14, 70, 48, 67); x.quadraticCurveTo(82, 70, 86, 96); x.fill();
  x.fillStyle = "rgba(0,0,0,.18)"; x.beginPath(); x.moveTo(30, 96); x.quadraticCurveTo(48, 84, 66, 96); x.fill();
  x.fillStyle = t.skin; x.fillRect(42, 52, 12, 16);
  x.fillStyle = t.outfit; x.beginPath(); x.ellipse(48, 68, 13, 5, 0, 0, Math.PI); x.fill();
  x.fillStyle = "rgba(0,0,0,.12)"; x.fillRect(42, 52, 12, 4);
  x.fillStyle = t.skin; x.beginPath(); x.ellipse(48, 40, 16, 19, 0, 0, 7); x.fill();
  x.beginPath(); x.arc(32, 42, 3.5, 0, 7); x.arc(64, 42, 3.5, 0, 7); x.fill();
  x.fillStyle = t.hair;
  if (t.style === "long" || t.style === "pony" || t.style === "bun") { x.beginPath(); x.ellipse(48, 30, 17.5, 13, 0, Math.PI, 0); x.quadraticCurveTo(58, 26, 40, 30); x.quadraticCurveTo(34, 34, 31, 40); x.fill(); }
  else if (t.style === "bob") { x.beginPath(); x.ellipse(48, 34, 20, 18, 0, Math.PI, 0); x.lineTo(68, 54); x.lineTo(62, 54); x.quadraticCurveTo(60, 34, 44, 30); x.quadraticCurveTo(38, 38, 34, 54); x.lineTo(28, 54); x.fill(); }
  else if (t.style === "curly") { for (let i = 0; i < 7; i++) { x.beginPath(); x.arc(34 + i * 4.7, 24 + Math.sin(i) * 2, 6, 0, 7); x.fill(); } }
  else if (t.style === "short") { x.beginPath(); x.ellipse(48, 29, 17, 11, 0, Math.PI, 0); x.lineTo(65, 34); x.quadraticCurveTo(48, 26, 31, 34); x.fill(); }
  else if (t.style === "quiff") { x.beginPath(); x.ellipse(48, 28, 17, 12, 0, Math.PI, 0); x.quadraticCurveTo(60, 14, 40, 16); x.lineTo(31, 34); x.fill(); x.fillRect(31, 27, 34, 6); }
  else if (t.style === "buzz") { x.globalAlpha = .7; x.beginPath(); x.ellipse(48, 32, 16.5, 13, 0, Math.PI, 0); x.fill(); x.globalAlpha = 1; }
  if (t.beard) { x.fillStyle = t.hair; x.globalAlpha = .55; x.beginPath(); x.ellipse(48, 50, 13, 8, 0, 0, Math.PI); x.fill(); x.globalAlpha = 1; }
  x.fillStyle = "#1a1016"; x.beginPath(); x.ellipse(42, 41, 2.2, 2.6, 0, 0, 7); x.ellipse(54, 41, 2.2, 2.6, 0, 0, 7); x.fill();
  x.fillStyle = "#fff"; x.fillRect(42.5, 39.6, 1, 1); x.fillRect(54.5, 39.6, 1, 1);
  x.strokeStyle = "rgba(40,20,20,.55)"; x.lineWidth = 1.4; x.beginPath(); x.moveTo(38.5, 36); x.lineTo(45, 35.5); x.moveTo(51, 35.5); x.lineTo(57.5, 36); x.stroke();
  x.strokeStyle = t.f ? "#b43a55" : "rgba(90,40,40,.8)"; x.lineWidth = t.f ? 2 : 1.4; x.beginPath(); x.arc(48, 47, 4, 0.2, Math.PI - 0.2); x.stroke();
  if (t.f) { x.fillStyle = "rgba(255,90,120,.18)"; x.beginPath(); x.arc(38, 47, 3.5, 0, 7); x.arc(58, 47, 3.5, 0, 7); x.fill(); }
  if (t.glasses) { x.strokeStyle = "#111"; x.lineWidth = 1.6; x.strokeRect(36.5, 37, 10, 7.5); x.strokeRect(49.5, 37, 10, 7.5); x.beginPath(); x.moveTo(46.5, 40); x.lineTo(49.5, 40); x.stroke(); }
  const url = c.toDataURL(); AV.set(t.id, url); return url;
}

// ======================================================================= derived numbers
function compliance() {
  let c = 15; for (const r of RULES) if (S.rules[r.id]) c += r.pts;
  if (S.staff.compliance) c += 25;
  return clamp(c, 0, 100);
}
function wellbeing() { return S.roster.length ? S.roster.reduce((a, t) => a + t.morale, 0) / S.roster.length : 70; }
function gearQ() { return CAMS[S.gear.cam].q + LIGHTS[S.gear.light].q + AUDIO[S.gear.audio].q; }
function locOf(id = S.loc) { return LOCS.find(l => l.id === id); }
function shootDays() { return Math.max(1, 3 - (S.staff.montatore ? 1 : 0) - (S.level >= 5 ? 1 : 0)); }
function weeklyCost() { let c = locOf().rent; for (const s of STAFF) if (S.staff[s.id]) c += s.sal; return c; }
const FCAP = [20000, 60000, 180000, 500000, 1400000, 4000000];
function fcap() { return FCAP[S.level - 1] * (1 + S.fame / 250); }
function sat() { return clamp(1 - S.followers / fcap(), 0, 1); }
function subPot() { return S.followers * 0.05 * Math.pow(9.99 / S.price, 1.4) * (S.ch.site && !S.siteFrozen ? 1.35 : 1) * (S.aff ? 1.3 : 1) * (1 + S.fame / 200); }
function trendOf(id) { let t = S.trends[id]; if (S.trendBoost && S.trendBoost.id === id && S.day < S.trendBoost.until) t *= 2; return t; }
function eligible(t, concept) {
  if (t.rest > 0) return "a riposo " + t.rest + "g";
  if (t.testPend) return "esito test in arrivo";
  if (!testOk(t)) return "test sanitario scaduto";
  if (concept && !t.accepts.includes(concept)) return "fuori dai suoi limiti";
  if (t.morale < 20) return "esausto/a";
  return "";
}
function estimateQ(cast, concept, mini) {
  const cs = cast.length ? cast.reduce((a, t) => a + t.skill * 0.55 + t.chem * 0.45, 0) / cast.length : 40;
  let q = 0.27 * gearQ() / 101 + 0.2 * locOf().q / 85 + 0.23 * cs / 100 + 0.3 * mini;
  if (S.staff.regista) q += 0.09; if (S.staff.montatore) q += 0.04; if (S.staff.intimacy) q += 0.02;
  if (cast.length === 2) q += 0.03;
  return Math.round(clamp(q * 100, 5, 100));
}

// ======================================================================= economy tick
const flQueue = [];
function addCash(v, kind) {
  S.cash += v; if (v > 0) S.lifetime += v;
  if (kind) S.wk[kind] = (S.wk[kind] || 0) + v;
}
function dayTick() {
  S.day++;
  // trends random walk around 1
  for (const c of CONCEPTS) S.trends[c.id] = clamp(S.trends[c.id] + (1 - S.trends[c.id]) * 0.04 + rnd(-0.06, 0.06), 0.45, 1.9);
  if (S.cd.shoot > 0) S.cd.shoot--; if (S.cd.post > 0) S.cd.post--; if (S.siteFrozen > 0) S.siteFrozen--; if (S.shadow > 0) S.shadow--;
  // talents
  for (const t of S.roster) {
    if (t.rest > 0) t.rest--;
    t.morale = clamp(t.morale + 1.5 + (S.staff.intimacy ? 1.5 : 0) + (t.rest > 0 ? 1 : 0), 0, 100);
    if (t.testPend && S.day >= t.testPend) { t.testPend = 0; t.test = S.day; }
    if (S.staff.compliance && !t.testPend && testLeft(t) <= 1) bookTest(t, true);
  }
  // audience
  const fresh = S.day - S.lastRelease <= 9;
  const sf = sat();
  let dF = fresh ? S.followers * 0.004 * sf : -S.followers * 0.003;
  dF += (S.staff.smm ? 60 + S.followers * 0.002 : 0) * sf;
  for (const p of S.promos) if (p.until >= S.day && p.fol) dF += p.fol * sf;
  if (S.shadow > 0 && dF > 0) dF *= 0.4;
  // revenue from catalogue
  const A = 0.15 * S.followers + 3 * S.subs + 1500, pir = 1 - S.piracy * 0.7;
  let ppv = 0, clip = 0, tube = 0, tubeViews = 0, best = null;
  const tubeBoost = (S.promos.some(p => p.until >= S.day && p.tube) ? 2.2 : 1) * (S.ch.tube ? 2.5 : 1);
  for (const v of S.videos) {
    if (v.removed) { v.today = 0; continue; }
    const age = S.day - v.day, d = Math.exp(-age / 9) + 0.05, h = Math.min(4, v.hype / 60);
    const p = A * 0.0025 * h * d * 8 * 0.8 * pir * v.share;
    const c = S.ch.clip ? (A * 0.0008 + 30 * S.level) * h * d * 10 * 0.65 * pir * v.share : 0;
    const views = (1000 + S.followers * 0.25) * h * d * tubeBoost;
    const tb = views / 1000 * (S.ch.tube ? 4 : 1.5);
    v.today = p + c + tb; v.earned += v.today; ppv += p; clip += c; tube += tb; tubeViews += views;
    if (!best || v.today > best.today) best = v;
  }
  dF += tubeViews * 0.002 * sf;
  S.followers = Math.max(50, S.followers + dF);
  // subscriptions (monthly price paid daily)
  const siteOn = S.ch.site && !S.siteFrozen, share = siteOn ? 0.86 : 0.8;
  let subInc = S.subs * S.price / 30 * share;
  if (S.aff) subInc *= 0.8;
  const churn = fresh ? 0.008 : 0.025;
  S.subs = Math.max(0, S.subs * (1 - churn) + (fresh ? Math.max(0, subPot() - S.subs) * 0.01 : 0));
  addCash(ppv, "ppv"); addCash(clip, "clip"); addCash(tube, "tube"); addCash(subInc, "subs");
  const dayInc = ppv + clip + tube + subInc;
  if (dayInc >= 1 && flQueue.length < 3) flQueue.push({ t: "+" + eur(dayInc), k: "", coin: dayInc > 25 });
  if (best && best.today > 40 && Math.random() < 0.3) flQueue.push({ t: "▲ " + best.title, k: "p" });
  // fame, piracy
  S.fame = clamp(S.fame * 0.995 + (wellbeing() - 60) * 0.002, 0, 100);
  S.piracy = clamp(S.piracy + 0.0015 * Math.min(1, S.videos.length / 8) + (tubeBoost > 1 ? 0.001 : 0) - (S.staff.legale ? 0.006 : 0), 0.02, 0.95);
  // weekly
  if (S.day % 7 === 0) weekly();
  // missions & level
  checkLevel(); checkMission();
  // debt
  if (S.cash < 0) { S.debtDays++; if (S.debtDays === 1) toast("Sei in rosso: hai 21 giorni per rientrare.", "bad"); if (S.debtDays > 21) return gameOver(); }
  else S.debtDays = 0;
  // events
  if (S.day >= S.nextEvent && !modalOpen()) { S.nextEvent = S.day + ri(6, 11); fireEvent(); }
  if (S.day % 5 === 0) save();
}
function weekly() {
  const cost = weeklyCost();
  if (cost > 0) { S.cash -= cost; S.wk.cost += cost; flQueue.push({ t: "−" + eur(cost) + " affitto e stipendi", k: "r" }); }
  S.hist.push({ ...S.wk, day: S.day }); if (S.hist.length > 16) S.hist.shift();
  S.wk = blankWeek();
  refreshCands();
  S.promos = S.promos.filter(p => p.until >= S.day);
  updateBadge();
}
function bookTest(t, auto) {
  const cost = 120;
  S.cash -= cost; S.wk.cost += cost; t.testPend = S.day + 2;
  if (!auto) toast(`Test prenotato per ${t.name.split(" ")[0]}: esito tra 2 giorni (−€ ${cost})`);
}

// ======================================================================= level & missions
function checkLevel() {
  let L = 1; for (let i = 0; i < LEVELS.length; i++) if (S.lifetime >= LEVELS[i].at) L = i + 1;
  if (L > S.level) {
    S.level = L; refreshCands(10); sfx("level"); burst(30);
    const unl = { 2: "Sbloccati: ClipBazar, loft, cinepresa, regista, montatore, affiliati.", 3: "Sbloccati: il tuo sito, la villa, luci cinema, legale e fiere.", 4: "Sbloccati: licenze VOD, teatro di posa, kit 8K, agente.", 5: "Seconda troupe: produzioni più rapide.", 6: "" }[L];
    const choices = [{ l: L === 6 ? "Continua a regnare" : "Avanti!", c: "gold" }];
    if (L === 6) {
      S.won = true;
      S.imperoDay = S.day;
      ImperoLeaderboard.record(S.imperoDay);
      save();
      choices.push({ l: "Apri la classifica", f: () => ImperoLeaderboard.open() });
    }
    showModal({ kick: "good", tag: "NUOVO LIVELLO", title: LEVELS[L - 1].n.toUpperCase(), text: (L === 6 ? "Ce l'hai fatta: dalla camera da letto a un impero dei media. Puoi continuare a giocare e crescere ancora." : unl), choices });
  }
}
const MISSIONS = [
  { t: "Ingaggia il tuo primo talento in TALENTI", ok: () => S.roster.length > 0, r: 200 },
  { t: "Gira e pubblica il primo video", ok: () => S.videos.length > 0, r: 150 },
  { t: "Fai una diretta LIVE", ok: () => S.didLive, r: 100 },
  { t: "Compra la Mirrorless 4K in UPGRADE", ok: () => S.gear.cam >= 1, r: 300 },
  { t: "Metti in regola: Registro età e Consenso", ok: () => S.rules.registro && S.rules.consenso, r: 300 },
  { t: "Raggiungi 100 abbonati", ok: () => S.subs >= 100, r: 500 },
  { t: "Diventa Micro-studio (€ 6.000 incassati)", ok: () => S.level >= 2, r: 0 },
  { t: "Assumi un regista in TEAM", ok: () => S.staff.regista, r: 800 },
  { t: "Apri ClipBazar in CANALI", ok: () => S.ch.clip, r: 500 },
  { t: "Porta la compliance a 60", ok: () => compliance() >= 60, r: 1000 },
  { t: "Diventa Casa di produzione", ok: () => S.level >= 3, r: 0 },
  { t: "Apri il tuo sito in abbonamento", ok: () => S.ch.site, r: 3000 },
  { t: "Gira un video di qualità 80+", ok: () => S.videos.some(v => v.q >= 80), r: 5000 },
  { t: "Diventa Studio indipendente", ok: () => S.level >= 4, r: 0 },
  { t: "Vinci un premio di settore", ok: () => S.awards > 0, r: 15000 },
  { t: "Diventa Network", ok: () => S.level >= 5, r: 0 },
  { t: "Diventa un IMPERO", ok: () => S.level >= 6, r: 0 },
];
function checkMission() {
  const m = MISSIONS[S.mission]; if (!m) return;
  if (m.ok()) {
    if (m.r) { addCash(m.r); flQueue.push({ t: "+" + eur(m.r) + " obiettivo", k: "", coin: true }); }
    toast("✓ " + m.t, "good"); sfx("coin"); S.mission++; checkMission();
  }
  renderMission();
}
function renderMission() {
  const m = MISSIONS[S.mission];
  $("mText").textContent = m ? m.t : "Tutti gli obiettivi completati. Fai crescere l'impero!";
  $("mRew").textContent = m && m.r ? "+" + eur(m.r) : "";
}

// ======================================================================= events
function modalOpen() { return $("modal").classList.contains("on"); }
function showModal(o) {
  const b = $("mbox");
  b.innerHTML = `<span class="kick ${o.kick || ""}">${o.tag || "BREAKING"}</span><h3>${o.title}</h3><p>${o.text}</p><div class="ch"></div>`;
  if (o.photo) {
    const photo = new Image();
    photo.className = o.fullPortrait ? "event-photo event-portrait" : "event-photo";
    photo.src = o.photo;
    photo.alt = o.fullPortrait ? "Ritratto a figura intera di " + o.title : "";
    b.querySelector("p").before(photo);
  }
  const ch = b.querySelector(".ch");
  for (const c of o.choices) {
    const bt = document.createElement("button"); bt.className = "btn " + (c.c || "alt");
    bt.innerHTML = `<span>${c.l}</span>${c.s ? `<small>${c.s}</small>` : ""}`;
    if (c.dis) bt.disabled = true;
    bt.onclick = () => { $("modal").classList.remove("on"); sfx("click"); c.f && c.f(); refresh(); };
    ch.appendChild(bt);
  }
  $("modal").classList.add("on"); sfx(o.kick === "good" ? "level" : "alert");
}
const EVENTS = [
  { w: 3, ok: () => S.videos.length >= 2 && S.videos.some(v => !v.removed), f() {
    const v = pick(S.videos.filter(x => !x.removed));
    showModal({ title: "Il tuo video è sui siti pirata", photo: ImperoMedia.event("pirateria"), text: `«${v.title}» è stato caricato su decine di tube senza permesso. Le vendite del catalogo calano finché non lo fai togliere.`, choices: [
      { l: "Caccia ai link (minigioco)", s: "15 s", c: "", f: () => { S.piracy = clamp(S.piracy + 0.1, 0, 0.95); startDMCA(); } },
      { l: "Lascia perdere", s: "pirateria +15%", f: () => { S.piracy = clamp(S.piracy + 0.15, 0, 0.95); } },
    ] });
  } },
  { w: 2, ok: () => S.ch.site, f() {
    const c = compliance();
    showModal({ title: "Revisione del conto merchant", photo: ImperoMedia.event("contratto"), text: `La banca che incassa i pagamenti del tuo sito controlla verifica dell'età, consenso documentato, revisione dei contenuti e gestione dei reclami. Compliance attuale: <b>${c}</b>.`, choices: [
      { l: c >= 60 ? "Mostra i registri" : "Speriamo bene…", s: c >= 60 ? "superata" : "rischio blocco", c: c >= 60 ? "green" : "", f: () => {
        if (c >= 60) { toast("Revisione superata. Il conto resta attivo.", "good"); S.fame += 1; }
        else { S.siteFrozen = 14; addCash(-2000); toast("Conto congelato per 14 giorni e multa di € 2.000", "bad"); }
      } }] });
  } },
  { w: 2, ok: () => S.roster.some(t => t.scenes >= 2), f() {
    const t = pick(S.roster.filter(x => x.scenes >= 2)), raise = Math.round(t.rate * 0.3 / 10) * 10 || 80;
    showModal({ kick: "info", tag: "TALENTI", title: `${t.name} chiede un aumento`, photo: ImperoMedia.event("contratto"), text: `Dopo ${t.scenes} scene con te, ${t.name.split(" ")[0]} vuole ${t.share ? "passare a un compenso fisso" : "+" + eur(raise) + " a scena"}.`, choices: [
      { l: "Accetta", s: t.share ? "€ " + (t.rate) + "/scena" : "+" + eur(raise), c: "green", f: () => { if (t.share) t.share = false; else t.rate += raise; t.morale = clamp(t.morale + 20, 0, 100); } },
      { l: "Rifiuta", s: "morale −25", f: () => { t.morale -= 25; if (t.morale < 30 && Math.random() < 0.5) { S.roster = S.roster.filter(x => x !== t); toast(`${t.name} ha lasciato lo studio`, "bad"); } } },
    ] });
  } },
  { w: 3, ok: () => true, f() {
    const c = pick(CONCEPTS); S.trendBoost = { id: c.id, until: S.day + 8 };
    showModal({ kick: "good", tag: "TENDENZA", title: `${c.n} è virale!`, photo: ImperoMedia.film(c.id), text: `Per 8 giorni i video ${c.n.toLowerCase()} valgono il doppio. Corri a girarne uno.`, choices: [{ l: "Ricevuto", c: "gold" }] });
  } },
  { w: 2, ok: () => S.followers > 3000, f() {
    showModal({ title: "Shadowban sui social", photo: ImperoMedia.event("telefono"), text: "Il social principale ha nascosto i tuoi post: la crescita dei follower crolla per 10 giorni. Capita spesso a chi lavora nel settore.", choices: [
      { l: "Paga un'agenzia per il ricorso", s: "−€ 800", c: "", dis: S.cash < 800, f: () => { addCash(-800); S.shadow = 3; } },
      { l: "Aspetta", s: "10 giorni", f: () => { S.shadow = S.staff.smm ? 6 : 10; } },
    ] });
  } },
  { w: 2, ok: () => S.level >= 3, f() {
    showModal({ kick: "info", tag: "LEGGE", title: "Nuova legge sulla verifica dell'età", photo: ImperoMedia.event("contratto"), text: "Un paese importante per il tuo pubblico impone la verifica dell'età per chi entra nei siti per adulti.", choices: [
      { l: S.rules.agever ? "Sei già in regola" : "Installa la verifica", s: S.rules.agever ? "ok" : "−€ 4.000", c: "green", dis: !S.rules.agever && S.cash < 4000, f: () => { if (!S.rules.agever) { addCash(-4000); S.rules.agever = true; } } },
      { l: "Blocca quel paese", s: "abbonati −15%", f: () => { S.subs *= 0.85; } },
    ] });
  } },
  { w: 2, ok: () => S.videos.some(v => v.q >= 70 && S.day - v.day < 60) && S.level >= 3, f() {
    const v = S.videos.filter(x => x.q >= 70).sort((a, b) => b.q - a.q)[0];
    const p = clamp((v.q - 55) / 50 + S.fame / 200, 0.1, 0.9);
    showModal({ kick: "good", tag: "PREMI", title: "Candidatura ai premi di settore", photo: ImperoMedia.event("premi"), text: `«${v.title}» è in nomination come miglior produzione. Probabilità di vittoria: ${Math.round(p * 100)}%. Partecipare alla cerimonia costa € 1.500.`, choices: [
      { l: "Vai alla cerimonia", s: "−€ 1.500", c: "gold", dis: S.cash < 1500, f: () => { addCash(-1500); if (Math.random() < p) { S.awards++; S.fame = clamp(S.fame + 12, 0, 100); S.followers += 15000; v.hype *= 1.5; showModal({ kick: "good", tag: "VITTORIA", title: "Hai vinto!", photo: ImperoMedia.event("premi"), text: "Fama +12, 15.000 nuovi follower e il video torna in vetrina.", choices: [{ l: "Grande!", c: "gold" }] }); burst(40); } else toast("Niente premio stavolta, ma fama +2", ""), S.fame += 2; } },
      { l: "Salta", s: "" },
    ] });
  } },
  { w: 2, ok: () => S.videos.length >= 4 && S.videos.some(v => !v.removed), f() {
    const v = pick(S.videos.filter(x => !x.removed));
    showModal({ kick: "info", tag: "RICHIESTA", title: "Richiesta di rimozione", photo: ImperoMedia.event("contratto"), text: `Una persona che compare in «${v.title}» chiede di togliere il video. Le regole dei circuiti di pagamento prevedono che si possa sempre chiedere.`, choices: [
      { l: "Rimuovi il video", s: "etica +, fama +", c: "green", f: () => { v.removed = true; S.fame = clamp(S.fame + 3, 0, 100); for (const t of S.roster) t.morale = clamp(t.morale + 6, 0, 100); } },
      { l: "Rifiuta", s: "rischio grosso", f: () => { S.fame = clamp(S.fame - 10, 0, 100); for (const t of S.roster) t.morale -= 15; if (S.ch.site) { S.siteFrozen = 10; toast("La banca congela il conto del sito per 10 giorni", "bad"); } } },
    ] });
  } },
  { w: 2, ok: () => S.subs > 200, f() {
    const loss = Math.round(S.subs * S.price * 0.06);
    showModal({ title: "Ondata di chargeback", photo: ImperoMedia.event("telefono"), text: `Molti clienti contestano l'addebito sulla carta: ti vengono stornati ${eur(loss)}. Il settore adulti ha più contestazioni della media.`, choices: [
      { l: "Accetta la perdita", s: "−" + eur(loss), f: () => addCash(-loss) },
      { l: "Antifrode e descrizioni chiare", s: "−€ 1.200, niente perdita", c: "green", dis: S.cash < 1200, f: () => addCash(-1200) },
    ] });
  } },
  { w: 2, ok: () => S.level >= 2, f() {
    const t = genTalent(30); t.fame = clamp(t.fame + 25, 0, 99); t.rate = Math.round((140 + Math.pow(t.fame, 1.62) * 2.1) / 10) * 10; t.share = false; t.docIssue = "";
    S.cands.unshift(t);
    showModal({ kick: "good", tag: "AGENZIA", title: "Una star vuole lavorare con te", photo: ImperoMedia.portrait(t), text: `${t.name} (fama ${t.fame}) è libera. La trovi in cima alla lista dei candidati in TALENTI.`, choices: [{ l: "Vado a vedere", c: "gold", f: () => openSheet("cast", "cand") }, { l: "Dopo" }] });
  } },
  { w: 1, ok: () => S.ch.site, f() {
    showModal({ title: "Server in tilt", photo: ImperoMedia.event("server"), text: "Un picco di traffico manda giù il sito. Ogni ora offline sono abbonati arrabbiati.", choices: [
      { l: "Hosting dedicato", s: "−€ 2.500", c: "green", dis: S.cash < 2500, f: () => addCash(-2500) },
      { l: "Riavvia e prega", s: "abbonati −8%", f: () => { S.subs *= 0.92; } },
    ] });
  } },
  { w: 2, ok: () => S.roster.length > 0, f() {
    const t = pick(S.roster), good = wellbeing() >= 60;
    showModal({ kick: good ? "good" : "", tag: "STAMPA", title: "Un giornalista racconta lo studio", photo: ImperoMedia.event("stampa"), text: good ? `Intervista a ${t.name}: parla di un set rispettoso, pause e limiti chiari. Ottima pubblicità.` : `Intervista a ${t.name}: racconta turni pesanti e poco riposo. Non fa bene al marchio.`, choices: [{ l: "Ok", c: good ? "gold" : "", f: () => { S.fame = clamp(S.fame + (good ? 6 : -6), 0, 100); S.followers += good ? 3000 : 0; } }] });
  } },
];
function fireEvent() {
  const pool = EVENTS.filter(e => e.ok()); if (!pool.length) return;
  let tot = pool.reduce((a, e) => a + e.w, 0), r = Math.random() * tot;
  for (const e of pool) { r -= e.w; if (r <= 0) { e.f(); return; } }
}
function gameOver() {
  showModal({ tag: "FALLIMENTO", title: "Lo studio chiude", photo: ImperoMedia.event("chiusura"), text: `Tre settimane in rosso: la banca chiude i conti di ${S.name}. Hai resistito ${S.day} giorni e incassato ${eur(S.lifetime)} in tutto.`, choices: [{ l: "Ricomincia da capo", c: "gold", f: () => { localStorage.removeItem(SAVE); location.reload(); } }] });
  paused = true;
}

// ======================================================================= scene rendering
const scv = $("scene"), sx = scv.getContext("2d");
const SW = 480, SHT = 270;
const CITY = (() => {
  const c = mk(600, 160), x = c.getContext("2d");
  for (let i = 0; i < 46; i++) {
    const w = ri(14, 34), h = ri(30, 140), bx = ri(-10, 600), by = 160 - h;
    x.fillStyle = hsl(265, 30, ri(8, 15)); x.fillRect(bx, by, w, h);
    for (let yy = by + 4; yy < 158; yy += 6) for (let xx = bx + 3; xx < bx + w - 3; xx += 5) if (Math.random() < 0.32) { x.fillStyle = pick(["#ffd27a", "#ffb36b", "#8fd8ff", "#ff7ab8", "#fff1c4"]); x.globalAlpha = rnd(0.4, 0.95); x.fillRect(xx, yy, 2, 3); x.globalAlpha = 1; }
  }
  return c;
})();
const BRICK = (() => {
  const c = mk(64, 32), x = c.getContext("2d"); x.fillStyle = "#3a1a1f"; x.fillRect(0, 0, 64, 32);
  for (let r = 0; r < 4; r++) for (let k = -1; k < 4; k++) { x.fillStyle = hsl(ri(355, 370), 40, ri(20, 28)); x.fillRect(k * 16 + (r % 2) * 8 + 1, r * 8 + 1, 14, 6); }
  return c;
})();
const GRAIN = (() => { const c = mk(128, 128), x = c.getContext("2d"), d = x.createImageData(128, 128); for (let i = 0; i < d.data.length; i += 4) { const v = ri(0, 255); d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 18; } x.putImageData(d, 0, 0); return c; })();
const dust = Array.from({ length: 40 }, () => ({ x: rnd(SW), y: rnd(SHT), v: rnd(0.05, 0.25), a: rnd(6.28) }));

function rr(x, X, Y, W, H, R) { x.beginPath(); x.roundRect ? x.roundRect(X, Y, W, H, R) : x.rect(X, Y, W, H); }
function glow(x, X, Y, R, col, a) { const g = x.createRadialGradient(X, Y, 0, X, Y, R); g.addColorStop(0, col.replace("A", a)); g.addColorStop(1, col.replace("A", 0)); x.fillStyle = g; x.fillRect(X - R, Y - R, R * 2, R * 2); }
function windowCity(x, X, Y, W, H, t) {
  x.save(); x.beginPath(); x.rect(X, Y, W, H); x.clip();
  const g = x.createLinearGradient(0, Y, 0, Y + H); g.addColorStop(0, "#130a2e"); g.addColorStop(0.7, "#3b1450"); g.addColorStop(1, "#7a2654"); x.fillStyle = g; x.fillRect(X, Y, W, H);
  x.fillStyle = "#ffe9c9"; x.beginPath(); x.arc(X + W * 0.78, Y + H * 0.22, 7, 0, 7); x.fill();
  glow(x, X + W * 0.78, Y + H * 0.22, 26, "rgba(255,230,200,A)", 0.25);
  x.drawImage(CITY, (t * 0.004) % 120, 0, W * 1.2, 160, X, Y + H - 110 * (H / 140), W, 110 * (H / 140));
  const cx = X + ((t * 0.05) % (W + 40)) - 20; x.fillStyle = "rgba(255,90,90,.9)"; x.fillRect(cx, Y + H - 4, 6, 1.5);
  x.restore();
}
function drawPerson(x, X, Y, s, t, col, skin, hair, ph) {
  const b = Math.sin(t * 0.003 + ph) * 0.8;
  x.save(); x.translate(X, Y); x.scale(s, s);
  x.fillStyle = "rgba(0,0,0,.35)"; x.beginPath(); x.ellipse(0, 0, 9, 2.5, 0, 0, 7); x.fill();
  x.fillStyle = "#1d1426"; rr(x, -5, -22, 4, 22, 2); x.fill(); rr(x, 1, -22, 4, 22, 2); x.fill();
  x.fillStyle = col; rr(x, -7, -42 + b, 14, 22, 5); x.fill();
  x.fillStyle = "rgba(255,255,255,.12)"; rr(x, -7, -42 + b, 5, 22, 4); x.fill();
  x.fillStyle = skin; x.beginPath(); x.arc(0, -48 + b, 6, 0, 7); x.fill();
  x.fillStyle = hair; x.beginPath(); x.arc(0, -50 + b, 6.3, Math.PI * 1.05, Math.PI * 1.95); x.fill();
  x.restore();
}
function drawRoom(x, t) {
  const L = S.loc;
  if (L === "camera") {
    const g = x.createLinearGradient(0, 0, 0, SHT); g.addColorStop(0, "#2a1440"); g.addColorStop(1, "#160a22"); x.fillStyle = g; x.fillRect(0, 0, SW, SHT);
    windowCity(x, 290, 36, 150, 104, t);
    x.strokeStyle = "#1a0d26"; x.lineWidth = 5; x.strokeRect(290, 36, 150, 104); x.beginPath(); x.moveTo(365, 36); x.lineTo(365, 140); x.stroke();
    x.fillStyle = "#b03a74"; x.fillRect(278, 30, 18, 122); x.fillRect(434, 30, 18, 122); x.fillStyle = "rgba(0,0,0,.25)"; for (let i = 0; i < 4; i++) { x.fillRect(282 + i * 4, 30, 1.5, 122); x.fillRect(438 + i * 4, 30, 1.5, 122); }
    x.fillStyle = "#3b2030"; x.fillRect(0, 205, SW, 65); x.fillStyle = "rgba(255,255,255,.04)"; for (let i = 0; i < 10; i++) x.fillRect(i * 52, 205, 1, 65);
    x.fillStyle = "#4b1f3c"; rr(x, 250, 138, 210, 30, 8); x.fill();
    x.fillStyle = "#e9dff0"; rr(x, 255, 160, 200, 30, 6); x.fill();
    x.fillStyle = "#c2306f"; rr(x, 300, 168, 160, 38, 6); x.fill(); x.fillStyle = "rgba(255,255,255,.12)"; x.fillRect(300, 172, 160, 4);
    x.fillStyle = "#fff"; rr(x, 262, 150, 42, 16, 7); x.fill(); rr(x, 308, 150, 42, 16, 7); x.fill();
    x.fillStyle = "#2a1630"; x.fillRect(205, 168, 34, 40); x.fillStyle = "#ffcf8a"; x.beginPath(); x.moveTo(212, 150); x.lineTo(232, 150); x.lineTo(228, 136); x.lineTo(216, 136); x.fill();
    x.fillStyle = "#8a6a4a"; x.fillRect(221, 150, 2, 18);
    glow(x, 222, 146, 70, "rgba(255,190,110,A)", 0.35);
    x.fillStyle = "#3a1f4f"; rr(x, 30, 112, 40, 52, 3); x.fill(); x.fillStyle = "#ff7ab8"; x.globalAlpha = .5; x.fillRect(35, 117, 30, 42); x.globalAlpha = 1;
  } else if (L === "appartamento") {
    const g = x.createLinearGradient(0, 0, 0, SHT); g.addColorStop(0, "#123040"); g.addColorStop(1, "#0b1a24"); x.fillStyle = g; x.fillRect(0, 0, SW, SHT);
    windowCity(x, 200, 26, 250, 132, t);
    x.strokeStyle = "#0a141b"; x.lineWidth = 4; x.strokeRect(200, 26, 250, 132); for (const k of [283, 366]) { x.beginPath(); x.moveTo(k, 26); x.lineTo(k, 158); x.stroke(); }
    x.fillStyle = "#4a3a2c"; x.fillRect(0, 200, SW, 70); x.fillStyle = "rgba(0,0,0,.15)"; for (let i = 0; i < 14; i++) x.fillRect(i * 36, 200, 1, 70);
    x.fillStyle = "#c9a37a"; x.beginPath(); x.ellipse(330, 222, 120, 14, 0, 0, 7); x.fill();
    x.fillStyle = "#e2725b"; rr(x, 250, 160, 190, 46, 12); x.fill(); x.fillStyle = "#c95b46"; rr(x, 240, 150, 26, 56, 10); x.fill(); rr(x, 424, 150, 26, 56, 10); x.fill();
    x.fillStyle = "#f3c26b"; rr(x, 280, 158, 30, 22, 7); x.fill(); x.fillStyle = "#6bc4c9"; rr(x, 380, 158, 30, 22, 7); x.fill();
    x.fillStyle = "#3a2a1e"; x.fillRect(150, 182, 20, 24); for (let i = 0; i < 9; i++) { x.fillStyle = i % 2 ? "#2f8a4f" : "#46b06a"; x.beginPath(); x.ellipse(160 + Math.cos(i) * 12, 168 - i * 3.5, 10, 4, i * 0.7, 0, 7); x.fill(); }
    x.strokeStyle = "#222"; x.lineWidth = 1; x.beginPath(); x.moveTo(345, 0); x.lineTo(345, 40); x.stroke(); x.fillStyle = "#d8b45a"; x.beginPath(); x.moveTo(333, 52); x.lineTo(357, 52); x.lineTo(351, 40); x.lineTo(339, 40); x.fill();
    glow(x, 345, 56, 60, "rgba(255,210,140,A)", 0.3);
    x.fillStyle = "#1a2a33"; x.fillRect(40, 70, 90, 6); x.fillRect(40, 110, 90, 6); for (let i = 0; i < 6; i++) { x.fillStyle = hsl(i * 50, 50, 50); x.fillRect(46 + i * 13, 54, 9, 16); }
  } else if (L === "loft") {
    x.fillStyle = x.createPattern(BRICK, "repeat"); x.fillRect(0, 0, SW, SHT);
    const v = x.createLinearGradient(0, 0, 0, SHT); v.addColorStop(0, "rgba(10,4,8,.55)"); v.addColorStop(1, "rgba(10,4,8,.2)"); x.fillStyle = v; x.fillRect(0, 0, SW, SHT);
    windowCity(x, 150, 18, 300, 150, t);
    x.strokeStyle = "#111"; x.lineWidth = 5; x.strokeRect(150, 18, 300, 150); x.lineWidth = 2.5; for (let i = 1; i < 6; i++) { x.beginPath(); x.moveTo(150 + i * 50, 18); x.lineTo(150 + i * 50, 168); x.stroke(); } for (let j = 1; j < 3; j++) { x.beginPath(); x.moveTo(150, 18 + j * 50); x.lineTo(450, 18 + j * 50); x.stroke(); }
    x.fillStyle = "#2b1a12"; x.fillRect(0, 200, SW, 70); x.fillStyle = "rgba(255,200,150,.05)"; for (let i = 0; i < 8; i++) x.fillRect(0, 205 + i * 8, SW, 1);
    x.fillStyle = "#6b3420"; rr(x, 250, 158, 180, 46, 10); x.fill(); x.fillStyle = "#4e2414"; rr(x, 240, 148, 200, 20, 8); x.fill();
    x.fillStyle = "rgba(255,255,255,.08)"; x.fillRect(255, 170, 170, 3);
    for (let i = 0; i < 6; i++) { const bx = 170 + i * 50, by = 40 + Math.sin(i * 1.7) * 12 + Math.sin(t * 0.002 + i) * 1.5; x.strokeStyle = "#111"; x.lineWidth = 1; x.beginPath(); x.moveTo(bx, 0); x.lineTo(bx, by); x.stroke(); x.fillStyle = "#ffcf7a"; x.beginPath(); x.ellipse(bx, by + 5, 3.5, 5, 0, 0, 7); x.fill(); glow(x, bx, by + 5, 26, "rgba(255,190,100,A)", 0.4); }
  } else if (L === "villa") {
    const g = x.createLinearGradient(0, 0, 0, 150); g.addColorStop(0, "#0d1846"); g.addColorStop(1, "#4a2a7a"); x.fillStyle = g; x.fillRect(0, 0, SW, SHT);
    x.fillStyle = "#fff3dc"; x.beginPath(); x.arc(380, 40, 14, 0, 7); x.fill(); glow(x, 380, 40, 60, "rgba(255,240,210,A)", 0.3);
    for (const [px, h] of [[70, 110], [120, 90], [440, 120]]) { x.strokeStyle = "#0a0a1a"; x.lineWidth = 4; x.beginPath(); x.moveTo(px, 150); x.quadraticCurveTo(px + 6, 150 - h / 2, px + 2, 150 - h); x.stroke(); x.fillStyle = "#0a0a1a"; for (let k = 0; k < 7; k++) { x.beginPath(); x.ellipse(px + 2 + Math.cos(k) * 14, 150 - h + Math.sin(k) * 4, 18, 4, k * 0.9, 0, 7); x.fill(); } }
    const p = x.createLinearGradient(0, 120, 0, 170); p.addColorStop(0, "#1fb3d6"); p.addColorStop(1, "#0a5a8a"); x.fillStyle = p; x.fillRect(0, 128, SW, 40);
    x.strokeStyle = "rgba(255,255,255,.35)"; x.lineWidth = 1; for (let i = 0; i < 9; i++) { const yy = 132 + i * 4; x.beginPath(); for (let xx = 0; xx <= SW; xx += 12) x.lineTo(xx, yy + Math.sin(xx * 0.05 + t * 0.003 + i) * 1.2); x.stroke(); }
    glow(x, 240, 148, 140, "rgba(80,220,255,A)", 0.18);
    x.strokeStyle = "rgba(255,255,255,.45)"; x.lineWidth = 3; for (let i = 0; i <= 4; i++) { x.beginPath(); x.moveTo(i * 120, 0); x.lineTo(i * 120, 170); x.stroke(); }
    const m = x.createLinearGradient(0, 168, 0, SHT); m.addColorStop(0, "#ece6f2"); m.addColorStop(1, "#b9aec8"); x.fillStyle = m; x.fillRect(0, 168, SW, SHT - 168);
    x.fillStyle = "rgba(90,70,110,.15)"; for (let i = 0; i < 6; i++) x.fillRect(i * 90, 168, 1, 102);
    x.fillStyle = "#fbf7ff"; rr(x, 260, 168, 190, 40, 14); x.fill(); x.fillStyle = "#e8def5"; rr(x, 250, 158, 210, 18, 9); x.fill(); x.fillStyle = "#e8c27a"; rr(x, 300, 172, 28, 18, 6); x.fill();
  } else {
    x.fillStyle = "#07060b"; x.fillRect(0, 0, SW, SHT);
    const c = x.createRadialGradient(300, 200, 10, 300, 170, 260); c.addColorStop(0, "#e9e4f0"); c.addColorStop(0.5, "#8d84a0"); c.addColorStop(1, "#14111c"); x.fillStyle = c;
    x.beginPath(); x.moveTo(120, 40); x.lineTo(480, 40); x.lineTo(480, 230); x.quadraticCurveTo(300, 245, 120, 230); x.fill();
    x.fillStyle = "#1db954"; x.globalAlpha = .9; x.fillRect(20, 50, 80, 160); x.globalAlpha = 1; x.fillStyle = "rgba(0,0,0,.2)"; for (let i = 0; i < 5; i++) x.fillRect(20 + i * 16, 50, 1, 160);
    x.strokeStyle = "#555"; x.lineWidth = 3; x.beginPath(); x.moveTo(0, 22); x.lineTo(SW, 22); x.moveTo(0, 30); x.lineTo(SW, 30); x.stroke(); x.lineWidth = 1; for (let i = 0; i < 48; i++) { x.beginPath(); x.moveTo(i * 10, 22); x.lineTo(i * 10 + 10, 30); x.stroke(); }
    for (let i = 0; i < 6; i++) { const lx = 60 + i * 75; x.fillStyle = "#222"; rr(x, lx - 7, 30, 14, 14, 3); x.fill(); const b = x.createLinearGradient(lx, 44, lx, 230); b.addColorStop(0, `rgba(255,${200 + i * 8},${180 - i * 10},.22)`); b.addColorStop(1, "rgba(255,240,220,0)"); x.fillStyle = b; x.beginPath(); x.moveTo(lx - 5, 44); x.lineTo(lx + 5, 44); x.lineTo(lx + 40, 230); x.lineTo(lx - 40, 230); x.fill(); }
    x.fillStyle = "#24202c"; x.fillRect(0, 230, SW, 40); x.strokeStyle = "#ffcf4a"; x.lineWidth = 2; x.beginPath(); x.moveTo(280, 236); x.lineTo(296, 236); x.moveTo(288, 228); x.lineTo(288, 244); x.stroke();
    x.fillStyle = "#c9c2d8"; rr(x, 300, 178, 130, 32, 6); x.fill();
  }
}
function drawNeon(x, t) {
  const txt = S.name.toUpperCase(), size = 12 + S.level * 2.2;
  x.save(); x.font = `900 ${size}px "Arial Black",Impact,sans-serif`; x.textAlign = "center"; x.textBaseline = "middle";
  const P = { camera: [178, 92, 150], appartamento: [105, 150, 130], loft: [78, 112, 120], villa: [240, 110, 200], teatro: [300, 62, 220] }[S.loc];
  const X = P[0], Y = P[1];
  const wd = x.measureText(txt).width; if (wd > P[2]) { x.translate(X, Y); x.scale(P[2] / wd, P[2] / wd); x.translate(-X, -Y); }
  const fl = Math.random() < 0.012 ? 0.3 : 1;
  x.globalAlpha = fl; x.shadowColor = "#ff2e88"; x.shadowBlur = 18; x.strokeStyle = "#ff6fb0"; x.lineWidth = 3; x.strokeText(txt, X, Y);
  x.shadowBlur = 8; x.fillStyle = "#ffe3f1"; x.fillText(txt, X, Y);
  x.restore();
}
function drawGear(x, t) {
  const L = S.gear.light;
  if (L >= 1) { x.save(); x.globalCompositeOperation = "lighter"; glow(x, 300, 140, 130, "rgba(255,230,240,A)", 0.12 + L * 0.04); x.restore(); }
  if (L === 1) { x.strokeStyle = "#222"; x.lineWidth = 2; x.beginPath(); x.moveTo(170, 230); x.lineTo(170, 120); x.stroke(); x.strokeStyle = "#fff6fb"; x.lineWidth = 5; x.shadowColor = "#fff"; x.shadowBlur = 14; x.beginPath(); x.arc(170, 110, 16, 0, 7); x.stroke(); x.shadowBlur = 0; }
  if (L >= 2) for (const [lx, ang] of [[150, 0.5], [470, -0.5]]) {
    x.strokeStyle = "#1a1a1a"; x.lineWidth = 2; x.beginPath(); x.moveTo(lx, 240); x.lineTo(lx, 95); x.stroke();
    x.save(); x.translate(lx, 90); x.rotate(ang); x.fillStyle = "#121212"; x.beginPath(); x.moveTo(-6, -8); x.lineTo(-6, 8); x.lineTo(16, 20); x.lineTo(16, -20); x.fill();
    x.fillStyle = L >= 3 ? "#fff1c8" : "#f4f0ff"; x.shadowColor = "#fff"; x.shadowBlur = 16; x.fillRect(15, -19, 3, 38); x.shadowBlur = 0; x.restore();
    if (L >= 3) { x.save(); x.globalCompositeOperation = "lighter"; const b = x.createLinearGradient(lx, 90, 320, 200); b.addColorStop(0, "rgba(255,220,160,.28)"); b.addColorStop(1, "rgba(255,220,160,0)"); x.fillStyle = b; x.beginPath(); x.moveTo(lx, 80); x.lineTo(lx, 100); x.lineTo(lx < 300 ? 380 : 220, 240); x.lineTo(lx < 300 ? 260 : 340, 240); x.fill(); x.restore(); }
  }
  if (S.gear.audio >= 2) { x.strokeStyle = "#2a2a2a"; x.lineWidth = 2; x.beginPath(); x.moveTo(430, 250); x.lineTo(430, 60); x.lineTo(340, 80); x.stroke(); x.fillStyle = "#555"; rr(x, 330, 78, 20, 8, 4); x.fill(); x.fillStyle = "#777"; x.fillRect(332, 79, 16, 2); }
  // camera rig foreground
  const C = S.gear.cam, rec = S.cd.shoot > 0 && Math.floor(t / 500) % 2 === 0;
  x.save(); x.translate(80, 0);
  if (C === 3) { x.strokeStyle = "#333"; x.lineWidth = 3; x.beginPath(); x.moveTo(-80, 262); x.lineTo(150, 262); x.moveTo(-80, 268); x.lineTo(150, 268); x.stroke(); x.lineWidth = 4; x.beginPath(); x.moveTo(10, 250); x.lineTo(40, 140); x.lineTo(80, 120); x.stroke(); }
  x.strokeStyle = "#1a1a1a"; x.lineWidth = 3; x.beginPath(); x.moveTo(0, 268); x.lineTo(14, 200); x.lineTo(28, 268); x.moveTo(14, 200); x.lineTo(14, 268); x.stroke();
  x.translate(14, C === 3 ? 120 : 190);
  if (C === 0) { x.fillStyle = "#111"; rr(x, -9, -16, 18, 30, 3); x.fill(); x.fillStyle = "#2b3550"; x.fillRect(-7, -13, 14, 24); }
  else if (C === 1) { x.fillStyle = "#1b1b1f"; rr(x, -16, -14, 30, 20, 3); x.fill(); x.fillStyle = "#2a2a30"; x.beginPath(); x.arc(18, -4, 9, 0, 7); x.fill(); x.fillStyle = "#4a6aff"; x.beginPath(); x.arc(19, -4, 4, 0, 7); x.fill(); }
  else { x.fillStyle = "#18181c"; rr(x, -24, -18, 44, 28, 4); x.fill(); x.fillStyle = "#26262c"; x.fillRect(20, -14, 18, 20); x.fillStyle = "#111"; x.beginPath(); x.moveTo(38, -18); x.lineTo(50, -24); x.lineTo(50, 16); x.lineTo(38, 10); x.fill(); x.fillStyle = "#335"; x.fillRect(-36, -30, 16, 12); x.fillStyle = "#6af"; x.globalAlpha = .7; x.fillRect(-35, -29, 14, 10); x.globalAlpha = 1; }
  x.fillStyle = rec ? "#ff2a3a" : "#4a0a10"; x.beginPath(); x.arc(C === 0 ? 5 : -10, C === 0 ? -12 : -10, 2.6, 0, 7); x.fill(); if (rec) { glow(x, C === 0 ? 5 : -10, -11, 12, "rgba(255,40,60,A)", 0.7); }
  x.restore();
}
function drawPeople(x, t) {
  const list = [];
  const crew = ["operatore", "regista", "montatore", "smm", "compliance", "intimacy", "legale", "agente"].filter(k => S.staff[k]);
  crew.slice(0, 4).forEach((k, i) => list.push({ X: 60 + i * 34 + (k === "regista" ? 10 : 0), Y: 262, s: 1.05, col: ["#2a2f45", "#3b2b45", "#1f3a3a", "#45302a"][i % 4], skin: ["#e8b894", "#b8794f", "#f3d2b8", "#8d5536"][i % 4], hair: "#1b1210", ph: i }));
  S.roster.filter(t => t.rest === 0).slice(0, 3).forEach((p, i) => list.push({ X: 290 + i * 42, Y: 228 + (i % 2) * 6, s: 1.2, col: p.outfit, skin: p.skin, hair: p.hair, ph: i + 5 }));
  list.sort((a, b) => a.Y - b.Y);
  for (const p of list) drawPerson(x, p.X, p.Y, p.s, t, p.col, p.skin, p.hair, p.ph);
}
function renderScene(t) {
  const r = scv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1), w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
  if (scv.width !== w || scv.height !== h) { scv.width = w; scv.height = h; }
  const x = sx; x.setTransform(w / SW, 0, 0, h / SHT, 0, 0);
  const photo = ImperoMedia.load(ImperoMedia.setPhoto(S.loc));
  if (photo.naturalWidth) {
    ImperoMedia.drawCover(x, photo, SW, SHT);
    const shade = x.createLinearGradient(0, 0, 0, SHT);
    shade.addColorStop(0, "rgba(12,5,16,.48)");
    shade.addColorStop(.38, "rgba(12,5,16,0)");
    x.fillStyle = shade; x.fillRect(0, 0, SW, SHT);
    return;
  }
  drawRoom(x, t); drawNeon(x, t); drawGear(x, t); drawPeople(x, t);
  x.save(); x.globalCompositeOperation = "lighter"; x.fillStyle = "rgba(255,220,240,.35)";
  for (const d of dust) { d.y -= d.v; d.x += Math.sin(t * 0.001 + d.a) * 0.15; if (d.y < 0) { d.y = SHT; d.x = rnd(SW); } x.fillRect(d.x, d.y, 1, 1); }
  x.restore();
  const v = x.createRadialGradient(SW / 2, SHT / 2, SHT * 0.3, SW / 2, SHT / 2, SHT * 0.95); v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,.55)"); x.fillStyle = v; x.fillRect(0, 0, SW, SHT);
  x.globalAlpha = 0.6; x.drawImage(GRAIN, ri(-60, 0), ri(-60, 0), 600, 340); x.globalAlpha = 1;
}

// ======================================================================= DOM helpers & HUD
const shown = { cash: 0, subs: 0, fol: 0, fame: 0 };
let lastCash = 0;
function toast(msg, k = "") { const d = document.createElement("div"); d.className = "toast " + k; d.innerHTML = msg; $("toasts").appendChild(d); setTimeout(() => d.remove(), 3200); while ($("toasts").children.length > 3) $("toasts").firstChild.remove(); }
function floater(text, k) {
  const d = document.createElement("div"); d.className = "fl " + (k || ""); d.textContent = text;
  d.style.left = rnd(8, 62) + "%"; d.style.top = rnd(35, 70) + "%"; $("floaters").appendChild(d); setTimeout(() => d.remove(), 1700);
}
function coinFly(n = 3) {
  const from = $("stage").getBoundingClientRect(), to = $("stCash").getBoundingClientRect();
  for (let i = 0; i < n; i++) {
    const c = document.createElement("div"); c.className = "coin"; c.textContent = "€"; document.body.appendChild(c);
    const sx0 = from.left + rnd(from.width * 0.2, from.width * 0.8), sy0 = from.top + rnd(from.height * 0.3, from.height * 0.8);
    c.style.left = sx0 + "px"; c.style.top = sy0 + "px";
    const dx = to.left + 20 - sx0, dy = to.top + 14 - sy0;
    c.animate([{ transform: "translate(0,0) scale(.6)", opacity: 0 }, { transform: `translate(${dx * 0.3}px,${dy * 0.3 - 30}px) scale(1.1)`, opacity: 1, offset: 0.3 }, { transform: `translate(${dx}px,${dy}px) scale(.5)`, opacity: 0.9 }],
      { duration: 700 + i * 90, easing: "cubic-bezier(.5,0,.8,.6)", delay: i * 60 }).onfinish = () => { c.remove(); $("stCash").classList.remove("pulse"); void $("stCash").offsetWidth; $("stCash").classList.add("pulse"); };
  }
}
function burst(n) { for (let i = 0; i < Math.min(n, 30); i++) setTimeout(() => floater(pick(["★", "✦", "€", "♥"]), pick(["", "p", "f"])), i * 40); coinFly(Math.min(8, n / 4)); }
function updateHUD(dt) {
  const k = Math.min(1, dt / 220);
  shown.cash += (S.cash - shown.cash) * k; shown.subs += (S.subs - shown.subs) * k; shown.fol += (S.followers - shown.fol) * k; shown.fame += (S.fame - shown.fame) * k;
  $("vCash").textContent = eur(shown.cash); $("vSubs").textContent = num(shown.subs); $("vFol").textContent = num(shown.fol); $("vFame").textContent = Math.round(shown.fame);
  $("stCash").classList.toggle("neg", S.cash < 0);
}
function refresh() {
  $("brand").textContent = S.name.toUpperCase();
  const L = S.level, cur = LEVELS[L - 1], nx = LEVELS[L];
  $("lvlName").textContent = `LV ${L} · ${cur.n}`;
  $("lvlNext").textContent = nx ? eur(nx.at - S.lifetime) + " al prossimo" : "MAX";
  $("lvlBar").style.width = (nx ? clamp((S.lifetime - cur.at) / (nx.at - cur.at), 0, 1) * 100 : 100) + "%";
  const wk = Math.ceil(S.day / 7);
  $("vDay").textContent = "GIORNO " + S.day; $("vWeek").textContent = `settimana ${wk} · costi ${eur(weeklyCost())}/sett`;
  const tags = [`<span class="chip">📍 ${locOf().n}</span>`];
  if (S.cd.shoot > 0) tags.push(`<span class="chip rec">● REC · post-produzione ${S.cd.shoot}g</span>`);
  if (S.trendBoost && S.day < S.trendBoost.until) tags.push(`<span class="chip" style="color:${CMAP[S.trendBoost.id].c}">🔥 ${CMAP[S.trendBoost.id].n} ×2</span>`);
  if (S.shadow > 0) tags.push(`<span class="chip" style="color:#ff7a8a">shadowban ${S.shadow}g</span>`);
  if (S.siteFrozen > 0) tags.push(`<span class="chip" style="color:#ff7a8a">conto congelato ${S.siteFrozen}g</span>`);
  $("tags").innerHTML = tags.join("");
  $("cdShoot").textContent = S.cd.shoot ? S.cd.shoot + "g" : ""; document.querySelector('[data-open="shoot"]').classList.toggle("cd", S.cd.shoot > 0);
  $("cdPost").textContent = S.cd.post ? S.cd.post + "g" : ""; document.querySelector('[data-open="post"]').classList.toggle("cd", S.cd.post > 0);
  const liveReady = S.roster.some(t => t.rest === 0 && t.morale >= 20);
  $("cdLive").textContent = liveReady ? "" : "—"; document.querySelector('[data-open="live"]').classList.toggle("cd", !liveReady);
  renderCatalog(); renderMission(); updateBadge();
}
function updateBadge() { const b = $("bCast"); if (!S) return; const n = S.roster.filter(t => !testOk(t) && !t.testPend).length; b.hidden = !n; b.textContent = n; }
function renderCatalog() {
  const vids = S.videos.filter(v => !v.removed).slice().reverse();
  const today = S.videos.reduce((a, v) => a + (v.today || 0), 0);
  $("catSum").textContent = vids.length ? `${vids.length} video · ${eur(today)}/giorno` : "";
  const list = $("catList");
  if (!vids.length) { delete list.dataset.sig; list.innerHTML = `<div class="empty">Nessun video ancora. Ingaggia un talento in TALENTI, poi premi GIRA.</div>`; return; }
  const sig = vids.map(v => v.id + ":" + Math.round(v.today)).join("|");
  if (list.dataset.sig === sig) return; list.dataset.sig = sig;
  list.innerHTML = "";
  for (const v of vids.slice(0, 30)) {
    const d = document.createElement("div"); d.className = "vcard";
    d.innerHTML = `<div class="th"><span class="q">Q${v.q}</span></div><div class="b"><div class="ti"></div><div class="m"><span>${CMAP[v.concept].n}</span><b>${eur(v.today || 0)}</b></div><div class="m"><span>totale</span><span>${eur(v.earned)}</span></div></div>`;
    const poster = new Image();
    poster.src = ImperoMedia.film(v.concept);
    poster.alt = "";
    d.querySelector(".th").prepend(poster);
    d.querySelector(".ti").textContent = v.title;
    list.appendChild(d);
  }
}
let tickerX = 0, tickerMsg = "";
function nextTicker() {
  const top = CONCEPTS.slice().sort((a, b) => trendOf(b.id) - trendOf(a.id));
  const tr = top.slice(0, 3).map(c => `<b>${c.n}</b> ${trendOf(c.id) >= 1 ? "▲" : "▼"}${Math.round((trendOf(c.id) - 1) * 100)}%`).join("  ·  ");
  tickerMsg = Math.random() < 0.5 ? `TENDENZE: ${tr}` : "LO SAPEVI? " + pick(FACTS);
  const s = $("tick"); s.innerHTML = tickerMsg; tickerX = $("ticker").clientWidth;
}

// ======================================================================= sheets (panels)
let sheetKind = null, sheetTab = null;
const SH = {};
function openSheet(kind, tab) {
  sheetKind = kind; sheetTab = tab || null; $("sheet").classList.add("on"); renderSheet(); sfx("open");
}
function closeSheet() { $("sheet").classList.remove("on"); sheetKind = null; shoot = null; }
function renderSheet() { if (!sheetKind) return; const keep = $("shBody").scrollTop; SH[sheetKind](); $("shBody").scrollTop = keep; }
function setSheet(title, tabs, body) {
  $("shTitle").textContent = title;
  $("shTabs").innerHTML = tabs ? `<div class="tabs">${tabs.map(([id, n]) => `<button data-tab="${id}" class="${id === sheetTab ? "on" : ""}">${n}</button>`).join("")}</div>` : "";
  $("shBody").innerHTML = body;
}
const lims = t => `<div class="lims">${CONCEPTS.map(c => `<span class="${t.accepts.includes(c.id) ? "" : "no"}" style="color:${c.c}">${c.n}</span>`).join("")}</div>`;
function talentCard(t, mode, sel) {
  const reason = mode === "pick" ? eligible(t, shoot.concept) : "";
  let status = "";
  if (mode !== "cand") status = t.testPend ? `<span class="st y">esito test tra ${t.testPend - S.day}g</span>` : testOk(t) ? `<span class="st g">test valido ${testLeft(t)}g</span>` : `<span class="st r">test scaduto</span>`;
  const price = t.share ? `<span class="price" style="color:var(--cyan)">collab 50%</span>` : `<span class="price">${eur(t.rate)}<small style="font-size:9px;color:var(--dim)">/scena</small></span>`;
  let btns = "";
  if (mode === "cand") btns = `<button class="btn" data-act="hire" data-id="${t.id}">INGAGGIA</button>`;
  if (mode === "roster") btns = `${!testOk(t) && !t.testPend ? `<button class="btn gold" data-act="test" data-id="${t.id}">TEST €120</button>` : ""}<button class="btn alt" data-act="fire" data-id="${t.id}">CONGEDA</button>`;
  return `<div class="tal ${sel ? "sel" : ""} ${reason ? "off" : ""}" ${mode === "pick" && !reason ? `data-act="pickcast" data-id="${t.id}"` : ""}>
    <button type="button" class="tal-photo" data-act="portrait" data-id="${t.id}" aria-label="Ingrandisci la foto di ${t.name}"><img src="${ImperoMedia.fullPortrait(t)}" alt=""></button>
    <div class="tx"><div class="nm">${t.name}</div>
      <div class="sub">${t.age} anni${mode === "cand" ? "" : " · documenti ✓"} · ${t.f ? "lei" : "lui"} · ${t.scenes} scene</div>
      <div class="bars2"><span>FAMA</span><i style="--v:${t.fame}%"></i><span>MESTIERE</span><i style="--v:${t.skill}%"></i><span>CARISMA</span><i style="--v:${t.chem}%"></i>${mode !== "cand" ? `<span>BENESSERE</span><i class="m" style="--v:${t.morale}%"></i>` : ""}</div>
      ${lims(t)}${reason ? `<div class="st r" style="display:inline-block;margin-top:6px">${reason}</div>` : ""}
    </div>
    <div class="side">${price}${status}${btns}</div></div>`;
}
SH.cast = () => {
  const tab = sheetTab || (S.roster.length ? "roster" : "cand"); sheetTab = tab;
  let body = "";
  if (tab === "roster") {
    body = `<div class="note">I talenti si pagano <b>a scena</b>, niente stipendio. Ognuno ha i suoi <b>limiti</b>: i generi barrati non li gira. Per lavorare serve un <b>test sanitario</b> fatto da meno di 14 giorni. Scuderia: ${S.roster.length}/${rosterMax()}.</div>`;
    body += S.roster.length ? S.roster.map(t => talentCard(t, "roster")).join("") : `<div class="empty">Nessuno in scuderia. Guarda i candidati.</div>`;
  } else {
    body = `<div class="note">Candidati di questa settimana (si rinnovano ogni 7 giorni). Prima di firmare si <b>controllano i documenti</b>: età, validità, dati coincidenti.</div>`;
    body += S.cands.map(t => talentCard(t, "cand")).join("");
    body += `<button class="btn alt big" data-act="scout" style="margin-top:6px">CHIEDI ALL'AGENZIA NUOVI NOMI · ${eur(150 + S.level * 100)}</button>`;
  }
  setSheet("Talenti", [["roster", `Scuderia (${S.roster.length})`], ["cand", "Candidati"]], body);
};
SH.shop = () => {
  const tab = sheetTab || "gear"; sheetTab = tab; let body = "";
  const line = (it, owned, cur, act, id, extra = "") => {
    const lock = it.lvl > S.level;
    return `<div class="row ${owned ? "own" : ""} ${lock ? "lock" : ""}"><div class="tx"><b>${it.n}</b><small>${it.d || ""}${extra}</small></div>${owned ? (cur ? `<span class="ok">IN USO</span>` : `<span class="ok">✓</span>`) : lock ? `<span class="st y">LV ${it.lvl}</span>` : `<button class="btn" data-act="${act}" data-id="${id}" ${S.cash < it.cost ? "disabled" : ""}>${eur(it.cost)}</button>`}</div>`;
  };
  if (tab === "gear") {
    body += `<div class="sec">Videocamera</div>` + CAMS.map((c, i) => line(c, i <= S.gear.cam, i === S.gear.cam, "buycam", i, ` · qualità +${c.q}`)).join("");
    body += `<div class="sec">Luci</div>` + LIGHTS.map((c, i) => line(c, i <= S.gear.light, i === S.gear.light, "buylight", i, ` · qualità +${c.q}`)).join("");
    body += `<div class="sec">Audio</div>` + AUDIO.map((c, i) => line(c, i <= S.gear.audio, i === S.gear.audio, "buyaudio", i, ` · qualità +${c.q}`)).join("");
  } else if (tab === "loc") {
    body += `<div class="note">Il set conta per la qualità, e ogni location valorizza certi generi (etichetta <b style="color:var(--cyan)">ADATTO</b> quando giri). L'affitto si paga ogni settimana solo per il set in uso.</div>`;
    for (const l of LOCS) {
      const has = S.locs.includes(l.id), cur = S.loc === l.id, lock = l.lvl > S.level;
      body += `<div class="row ${cur ? "own" : ""} ${lock ? "lock" : ""} location-row"><img src="${ImperoMedia.setPhoto(l.id)}" alt="" loading="lazy"><div class="tx"><b>${l.n}</b><small>Qualità +${l.q} · affitto ${eur(l.rent)}/sett · adatto a ${l.fit.map(f => CMAP[f].n).join(", ")}</small></div>
      ${cur ? `<span class="ok">QUI</span>` : lock ? `<span class="st y">LV ${l.lvl}</span>` : has ? `<button class="btn alt" data-act="move" data-id="${l.id}">TRASFERISCITI</button>` : `<button class="btn" data-act="lease" data-id="${l.id}" ${S.cash < l.dep ? "disabled" : ""}>CAPARRA ${eur(l.dep)}</button>`}</div>`;
    }
  } else {
    body += `<div class="note">Compliance: <b>${compliance()}/100</b>. Dal 2021 i circuiti di pagamento chiedono a chi vende contenuti per adulti verifica dell'età e dell'identità di chi compare, consenso documentato, revisione prima della pubblicazione e un canale per reclami e rimozioni. Sotto 60 non ti aprono il conto per il sito.</div>`;
    body += RULES.map(r => line(r, S.rules[r.id], false, "rule", r.id, ` · compliance +${r.pts}`)).join("");
  }
  setSheet("Upgrade", [["gear", "Attrezzatura"], ["loc", "Location"], ["rules", "Regole"]], body);
};
SH.team = () => {
  let body = `<div class="note">Lo staff costa ogni settimana: assumi quando gli incassi reggono. Totale stipendi: <b>${eur(STAFF.filter(s => S.staff[s.id]).reduce((a, s) => a + s.sal, 0))}</b>/sett.</div>`;
  for (const s of STAFF) {
    const has = S.staff[s.id], lock = s.lvl > S.level;
    body += `<div class="row ${has ? "own" : ""} ${lock ? "lock" : ""}"><div class="tx"><b>${s.n}</b><small>${s.d} · ${eur(s.sal)}/sett</small></div>${has ? `<button class="btn alt" data-act="unstaff" data-id="${s.id}">LICENZIA</button>` : lock ? `<span class="st y">LV ${s.lvl}</span>` : `<button class="btn" data-act="staff" data-id="${s.id}">ASSUMI</button>`}</div>`;
  }
  setSheet("Team", null, body);
};
const PROMOS = [
  { id: "social", n: "Campagna sui social", cost: 300, lvl: 1, d: "+90 follower al giorno per 7 giorni.", f() { S.promos.push({ id: "social", until: S.day + 7, fol: 90 }); } },
  { id: "trailer", n: "Trailer in vetrina sui tube", cost: 700, lvl: 1, d: "Visualizzazioni ×2,2 per 7 giorni: tanti follower, un po' più pirateria.", f() { S.promos.push({ id: "trailer", until: S.day + 7, tube: 1 }); } },
  { id: "mainstream", n: "Annunci su motori di ricerca e social mainstream", cost: 5000, lvl: 1, d: "Le grandi piattaforme pubblicitarie…", f() { addCash(5000); showModal({ kick: "info", tag: "RIFIUTATO", title: "Annuncio respinto", text: "Le grandi reti pubblicitarie non accettano annunci per contenuti per adulti. Soldi restituiti. Nel settore si cresce con social, tube, affiliati, collaborazioni e fiere.", choices: [{ l: "Capito", c: "gold" }] }); } },
  { id: "aff", n: "Programma affiliati", cost: 0, lvl: 2, d: "Siti partner ti portano abbonati in cambio del 20% degli abbonamenti. Si attiva e disattiva.", toggle: true },
  { id: "collab", n: "Collaborazione con creator famoso", cost: 2500, lvl: 2, d: "Video incrociato: follower di colpo e fama +3.", f() { S.followers += 2500 * S.level * Math.max(0.2, sat()); S.fame = clamp(S.fame + 3, 0, 100); burst(12); } },
  { id: "seo", n: "SEO e blog", cost: 1500, lvl: 2, d: "+160 follower al giorno per 28 giorni.", f() { S.promos.push({ id: "seo", until: S.day + 28, fol: 160 }); } },
  { id: "fiera", n: "Stand alla fiera di settore", cost: 6000, lvl: 3, d: "Fama +8, 6.000 follower, candidati famosi.", f() { S.fame = clamp(S.fame + 8, 0, 100); S.followers += 6000 * Math.max(0.2, sat()); refreshCands(35); burst(20); } },
  { id: "stampa", n: "Ufficio stampa", cost: 3500, lvl: 3, d: "Interviste e articoli: funziona se lo studio tratta bene i talenti.", f() { const g = wellbeing() >= 60; S.fame = clamp(S.fame + (g ? 7 : 1), 0, 100); S.followers += g ? 5000 : 500; toast(g ? "Ottima stampa: fama +7" : "Articolo tiepido: i talenti non sembrano felici", g ? "good" : "bad"); } },
];
SH.promo = () => {
  let body = `<div class="note">Follower ${num(S.followers)} · fama ${Math.round(S.fame)}. Più follower = più vendite e più abbonati a ogni uscita.</div>`;
  for (const p of PROMOS) {
    const lock = p.lvl > S.level, active = S.promos.find(q => q.id === p.id && q.until >= S.day);
    let btn;
    if (lock) btn = `<span class="st y">LV ${p.lvl}</span>`;
    else if (p.toggle) btn = `<button class="btn ${S.aff ? "green" : ""}" data-act="aff">${S.aff ? "ATTIVO" : "ATTIVA"}</button>`;
    else if (active) btn = `<span class="ok">ATTIVA ${active.until - S.day}g</span>`;
    else btn = `<button class="btn" data-act="promo" data-id="${p.id}" ${S.cash < p.cost ? "disabled" : ""}>${eur(p.cost)}</button>`;
    body += `<div class="row ${lock ? "lock" : ""} ${active || (p.toggle && S.aff) ? "own" : ""}"><div class="tx"><b>${p.n}</b><small>${p.d}</small></div>${btn}</div>`;
  }
  setSheet("Promozione", null, body);
};
SH.channels = () => {
  const c = compliance();
  const ch = (n, d, state) => `<div class="row ${state === "on" ? "own" : ""}"><div class="tx"><b>${n}</b><small>${d}</small></div>${state}</div>`;
  let body = `<div class="note">Dove guadagnano i tuoi video. Ogni uscita va su tutti i canali aperti.</div>`;
  body += ch("FanVault · piattaforma creator", "Abbonamenti e video a pagamento. Trattiene il 20%.", `<span class="ok">APERTO</span>`);
  body += ch("TubeMax · trailer gratuiti", "Pochi centesimi di pubblicità ogni mille visualizzazioni, ma porta tanti follower.", `<span class="ok">APERTO</span>`);
  body += ch("CamStar · dirette", "Mance in tempo reale col tasto LIVE. La piattaforma trattiene il 50%.", `<span class="ok">APERTO</span>`);
  body += ch("ClipBazar · negozio di clip", "Vendite singole a chi non ti segue ancora. Trattiene il 35%. Attivazione € 500.",
    S.ch.clip ? `<span class="ok">APERTO</span>` : S.level < 2 ? `<span class="st y">LV 2</span>` : `<button class="btn" data-act="opench" data-id="clip" ${S.cash < 500 ? "disabled" : ""}>APRI</button>`);
  body += ch("Il tuo sito in abbonamento", `Tieni l'86% (paghi solo il processore). Sviluppo € 8.000 e compliance ≥ 60 per il conto merchant (ora ${c}).`,
    S.ch.site ? `<span class="ok">APERTO</span>` : S.level < 3 ? `<span class="st y">LV 3</span>` : `<button class="btn" data-act="opench" data-id="site" ${S.cash < 8000 || c < 60 ? "disabled" : ""}>APRI</button>`);
  body += ch("Licenze VOD e distribuzione", "Un distributore compra i diritti dei video di qualità 55+ con un assegno all'uscita. Serve l'agente commerciale.",
    S.ch.vod ? `<span class="ok">APERTO</span>` : S.level < 4 ? `<span class="st y">LV 4</span>` : `<button class="btn" data-act="opench" data-id="vod" ${!S.staff.agente ? "disabled" : ""}>APRI</button>`);
  body += `<div class="sec">Prezzo dell'abbonamento</div><div class="note">Più alto = meno nuovi abbonati ma più incasso a testa. Abbonati ora: <b>${num(S.subs)}</b> · incasso mensile stimato <b>${eur(S.subs * S.price * (S.ch.site ? 0.86 : 0.8))}</b>.</div>`;
  body += `<div class="grid3" style="grid-template-columns:repeat(4,1fr)">${PRICES.map(p => `<button class="ct ${S.price === p ? "sel" : ""}" data-act="price" data-p="${p}"><b>€ ${p.toFixed(2).replace(".", ",")}</b><small style="color:var(--dim)">/mese</small></button>`).join("")}</div>`;
  body += `<div class="sec">Mosse da impero</div>` + ch("Compra TubeMax", "Diventi padrone della vetrina: trailer ×2,5, pubblicità piena, e i link pirata li togli tu. € 1,5 M.",
    S.ch.tube ? `<span class="ok">TUO</span>` : S.level < 5 ? `<span class="st y">LV 5</span>` : `<button class="btn gold" data-act="opench" data-id="tube" ${S.cash < 1.5e6 ? "disabled" : ""}>COMPRA</button>`);
  setSheet("Canali", null, body);
};
SH.books = () => {
  const tab = sheetTab || "conti"; sheetTab = tab;
  let body = "";
  if (tab === "conti") {
    const w = S.wk, inc = w.ppv + w.clip + w.tube + w.subs + w.vod + w.live;
    body += `<div class="sec">Ultime settimane</div><canvas class="chart" id="chart"></canvas><div class="legend">${CHS.map(c => `<span><i style="background:${c[2]}"></i>${c[1]}</span>`).join("")}<span><i style="background:#ff4757"></i>Costi</span></div>`;
    body += `<div class="sec">Settimana in corso</div><div class="kv">${CHS.map(c => `<span>${c[1]}</span><b>${eur(w[c[0]])}</b>`).join("")}<span>Costi</span><b style="color:var(--red)">−${eur(w.cost)}</b><span><b style="color:var(--text)">Utile</b></span><b style="color:var(--gold)">${eur(inc - w.cost)}</b></div>`;
    body += `<div class="sec">Studio</div><div class="kv"><span>Incassato in tutto</span><b>${eur(S.lifetime)}</b><span>Costi fissi</span><b>${eur(weeklyCost())}/sett</b><span>Compliance</span><b>${compliance()}/100</b><span>Benessere talenti</span><b>${Math.round(wellbeing())}/100</b><span>Pirateria</span><b style="color:${S.piracy > 0.3 ? "var(--red)" : "var(--text)"}">${Math.round(S.piracy * 100)}% · vendite −${Math.round(S.piracy * 70)}%</b><span>Premi vinti</span><b>${S.awards}</b></div>`;
    body += `<button class="btn alt big" data-act="dmca" style="margin-top:14px">CACCIA AI LINK PIRATA (minigioco)</button>`;
    body += `<button class="btn alt big" data-act="scores" style="margin-top:10px">CLASSIFICA</button>`;
    body += `<button class="btn alt big" data-act="quit" style="margin-top:10px">SALVA ED ESCI AL MENU</button>`;
  } else body += '<iframe class="guide-frame" src="pagine/guida.html" title="Guida al settore"></iframe>';
  setSheet("Conti", [["conti", "Bilancio"], ["guida", "Guida al settore"]], body);
  if (tab === "conti") requestAnimationFrame(drawChart);
};
const CHS = [["subs", "Abbonamenti", "#ff2e88"], ["ppv", "Video a pagamento", "#ffc94a"], ["clip", "ClipBazar", "#9b6bff"], ["tube", "Tube", "#38e8ff"], ["live", "Dirette", "#41f0a0"], ["vod", "Licenze VOD", "#ff8a3d"]];
function drawChart() {
  const c = $("chart"); if (!c) return;
  const r = c.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1); c.width = r.width * dpr; c.height = r.height * dpr;
  const x = c.getContext("2d"); x.scale(dpr, dpr); const W = r.width, H = r.height;
  const data = [...S.hist, { ...S.wk }].slice(-12);
  const max = Math.max(100, ...data.map(d => Math.max(CHS.reduce((a, k) => a + (d[k[0]] || 0), 0), d.cost || 0)));
  const bw = (W - 30) / Math.max(data.length, 6);
  x.strokeStyle = "rgba(255,255,255,.07)"; for (let i = 1; i < 4; i++) { const y = 10 + (H - 30) * i / 4; x.beginPath(); x.moveTo(24, y); x.lineTo(W, y); x.stroke(); }
  x.fillStyle = "#7d6a8a"; x.font = "9px system-ui"; x.fillText(eur(max), 2, 12);
  data.forEach((d, i) => {
    let y = H - 20; const X = 28 + i * bw;
    for (const k of CHS) { const h = (d[k[0]] || 0) / max * (H - 30); x.fillStyle = k[2]; x.fillRect(X, y - h, bw * 0.55, h); y -= h; }
    const ch = (d.cost || 0) / max * (H - 30); x.fillStyle = "rgba(255,71,87,.75)"; x.fillRect(X + bw * 0.6, H - 20 - ch, bw * 0.22, ch);
    x.fillStyle = "#7d6a8a"; x.fillText(i === data.length - 1 ? "ora" : "s" + (Math.ceil((d.day || S.day) / 7)), X, H - 6);
  });
}
// ---------------- shooting wizard
let shoot = null;
SH.shoot = () => {
  if (!shoot) shoot = { step: 0, concept: null, cast: [] };
  const steps = `<div class="steps">${[0, 1, 2].map(i => `<i class="${i <= shoot.step ? "on" : ""}"></i>`).join("")}</div>`;
  let body = "";
  if (S.cd.shoot > 0) { setSheet("Gira", null, `<div class="note">La troupe è in post-produzione: torna tra <b>${S.cd.shoot} giorni</b>. Intanto fai una LIVE o un POST.</div>`); return; }
  if (!S.roster.length) { setSheet("Gira", null, `<div class="note">Ti serve almeno un talento. Vai in TALENTI e ingaggia qualcuno dai candidati.</div><button class="btn big" data-act="gocast">VAI AI TALENTI</button>`); return; }
  if (shoot.step === 0) {
    body = `<div class="note">Scegli il genere. Le percentuali sono la domanda di oggi; <b style="color:var(--cyan)">ADATTO</b> vuol dire che il tuo set lo valorizza.</div><div class="grid3">`;
    for (const c of CONCEPTS) {
      const tr = trendOf(c.id), fit = locOf().fit.includes(c.id);
      body += `<button class="ct ${shoot.concept === c.id ? "sel" : ""}" data-act="concept" data-id="${c.id}">${fit ? `<span class="fit">ADATTO</span>` : ""}<div class="dot" style="background:${c.c};color:${c.c}"></div><b>${c.n}</b><small class="${tr >= 1 ? "up" : "dn"}">${tr >= 1 ? "▲" : "▼"} ${Math.round((tr - 1) * 100)}%</small></button>`;
    }
    body += `</div><button class="btn big" style="margin-top:14px" data-act="step" data-s="1" ${shoot.concept ? "" : "disabled"}>AVANTI · CAST</button>`;
  } else if (shoot.step === 1) {
    body = `<div class="note">Scegli 1 o 2 talenti per <b>${CMAP[shoot.concept].n}</b>. In due la scena vale di più.</div>`;
    body += S.roster.map(t => talentCard(t, "pick", shoot.cast.includes(t.id))).join("");
    body += `<div style="display:flex;gap:8px;margin-top:8px"><button class="btn alt big" data-act="step" data-s="0">INDIETRO</button><button class="btn big" data-act="step" data-s="2" ${shoot.cast.length ? "" : "disabled"}>AVANTI</button></div>`;
  } else {
    const cast = shoot.cast.map(id => S.roster.find(t => t.id === id));
    const fee = cast.reduce((a, t) => a + (t.share ? 0 : t.rate), 0), prod = 40 + S.level * 60;
    const est = estimateQ(cast, shoot.concept, 0.75);
    body = `<div class="sum"><div><span>Genere</span><b style="color:${CMAP[shoot.concept].c}">${CMAP[shoot.concept].n}</b></div><div><span>Cast</span><b>${cast.map(t => t.name.split(" ")[0]).join(" + ")}</b></div><div><span>Set</span><b>${locOf().n}</b></div>
      <div><span>Compensi</span><b>${eur(fee)}${cast.some(t => t.share) ? " + 50% incassi" : ""}</b></div><div><span>Produzione</span><b>${eur(prod)}</b></div><div><span>Qualità stimata</span><b>~${est}</b></div><div><span>Post-produzione</span><b>${shootDays()} giorni</b></div></div>
      <div class="note">Si firma la scheda dei limiti e si gira. Tre ciak: ferma il cursore nella zona verde. Più sei preciso, più alta la qualità.</div>
      <div style="display:flex;gap:8px"><button class="btn alt big" data-act="step" data-s="1">INDIETRO</button><button class="btn big" data-act="ciak" ${S.cash < fee + prod ? "disabled" : ""}>🎬 CIAK, SI GIRA!</button></div>`;
  }
  setSheet("Gira", null, steps + body);
};
SH.release = () => {
  const r = shoot.result;
  const stars = "★★★★★".slice(0, Math.max(1, Math.round(r.q / 20))) + "☆☆☆☆☆".slice(0, 5 - Math.max(1, Math.round(r.q / 20)));
  const chans = ["FanVault", "TubeMax (trailer)"].concat(S.ch.clip ? ["ClipBazar"] : [], S.ch.site ? ["Il tuo sito"] : [], S.ch.vod && r.q >= 55 ? ["Licenza VOD"] : []);
  const body = `<img class="release-photo" src="${ImperoMedia.film(shoot.concept)}" alt="Foto di scena · ${CMAP[shoot.concept].n}"><div class="qbig">Q ${r.q}</div><div class="stars">${stars}</div><div class="note" style="text-align:center">Ciak: ${r.grades.join(" · ")}</div>
    <div class="sec">Titolo</div><div class="titleIn"><input id="vtitle" maxlength="34" value="${r.title}"><button class="btn alt" data-act="retitle">🎲</button></div>
    <div class="sum"><div><span>Uscita su</span><b>${chans.join(", ")}</b></div><div><span>Richiamo stimato</span><b>${Math.round(r.hype)}</b></div></div>
    <button class="btn green big" data-act="publish" style="margin-top:12px">PUBBLICA</button>`;
  setSheet("Montaggio finito", null, body);
};

// ======================================================================= actions
const ACT = {
  scores() { ImperoLeaderboard.open(); },
  portrait(d) {
    const t = S.roster.find(talent => talent.id === d.id) || S.cands.find(talent => talent.id === d.id);
    if (!t) return;
    showModal({ kick: "info", tag: "CASTING", title: t.name, text: "", photo: ImperoMedia.fullPortrait(t), fullPortrait: true, choices: [{ l: "Chiudi foto" }] });
  },
  hire(d) {
    const t = S.cands.find(c => c.id === d.id); if (!t) return;
    if (S.roster.length >= rosterMax()) return toast(`Scuderia piena (${rosterMax()}). Congeda qualcuno o sali di livello.`, "bad");
    verifyDocs(t);
  },
  fire(d) { const t = S.roster.find(c => c.id === d.id); S.roster = S.roster.filter(c => c.id !== d.id); toast(`${t.name} congedato/a`); },
  test(d) { const t = S.roster.find(c => c.id === d.id); bookTest(t); sfx("click"); },
  scout() { const c = 150 + S.level * 100; if (S.cash < c) return toast("Non hai abbastanza contanti", "bad"); addCash(-c); S.wk.cost += c; refreshCands(8); sfx("coin"); },
  buycam(d) { buy(CAMS[+d.id], () => S.gear.cam = +d.id); }, buylight(d) { buy(LIGHTS[+d.id], () => S.gear.light = +d.id); }, buyaudio(d) { buy(AUDIO[+d.id], () => S.gear.audio = +d.id); },
  rule(d) { const r = RULES.find(x => x.id === d.id); buy(r, () => S.rules[r.id] = true); },
  lease(d) { const l = LOCS.find(x => x.id === d.id); if (S.cash < l.dep) return; addCash(-l.dep); S.wk.cost += l.dep; S.locs.push(l.id); S.loc = l.id; sfx("level"); burst(10); toast(`Benvenuto nel nuovo set: ${l.n}`, "good"); },
  move(d) { S.loc = d.id; sfx("click"); },
  staff(d) { S.staff[d.id] = true; sfx("coin"); toast(STAFF.find(s => s.id === d.id).n + " assunto/a", "good"); checkMission(); },
  unstaff(d) { delete S.staff[d.id]; },
  promo(d) { const p = PROMOS.find(x => x.id === d.id); if (S.cash < p.cost) return; addCash(-p.cost); S.wk.cost += p.cost; p.f(); sfx("coin"); if (p.id !== "mainstream") toast(p.n + " avviata", "good"); },
  aff() { S.aff = !S.aff; toast(S.aff ? "Affiliati attivi: più abbonati, 20% agli affiliati" : "Affiliati disattivati"); },
  opench(d) {
    const cost = { clip: 500, site: 8000, vod: 0, tube: 1.5e6 }[d.id];
    if (d.id === "site" && compliance() < 60) return toast("Il processore di pagamento rifiuta: compliance sotto 60", "bad");
    if (S.cash < cost) return; addCash(-cost); S.wk.cost += cost; S.ch[d.id] = true; sfx("level"); burst(12);
    if (d.id === "tube") S.piracy = clamp(S.piracy - 0.25, 0.02, 0.95);
    toast({ clip: "ClipBazar aperto", site: "Il tuo sito è online!", vod: "Distributore VOD firmato", tube: "TubeMax ora è tuo!" }[d.id], "good"); checkMission();
  },
  price(d) { S.price = +d.p; sfx("click"); },
  concept(d) { shoot.concept = d.id; shoot.cast = shoot.cast.filter(id => !eligible(S.roster.find(t => t.id === id), d.id)); sfx("click"); },
  step(d) { shoot.step = +d.s; sfx("click"); },
  pickcast(d) { const i = shoot.cast.indexOf(d.id); if (i >= 0) shoot.cast.splice(i, 1); else { if (shoot.cast.length >= 2) shoot.cast.shift(); shoot.cast.push(d.id); } sfx("click"); },
  gocast() { openSheet("cast", "cand"); },
  ciak() {
    const cast = shoot.cast.map(id => S.roster.find(t => t.id === id));
    const fee = cast.reduce((a, t) => a + (t.share ? 0 : t.rate), 0), prod = 40 + S.level * 60;
    addCash(-(fee + prod)); S.wk.cost += fee + prod;
    $("sheet").classList.remove("on");
    startCiak(score => afterCiak(cast, score));
  },
  retitle() { $("vtitle").value = genTitle(shoot.concept); sfx("click"); },
  publish() {
    const r = shoot.result, title = ($("vtitle").value || r.title).trim().slice(0, 34);
    const cast = shoot.cast.map(id => S.roster.find(t => t.id === id));
    const v = { id: "v" + (S.nid++), title, concept: shoot.concept, q: r.q, hype: r.hype, day: S.day, cast: shoot.cast.slice(), earned: 0, today: 0, share: cast.some(t => t.share) ? 0.5 : 1 };
    S.videos.push(v); S.lastRelease = S.day; S.cd.shoot = shootDays();
    const h = Math.min(4, r.hype / 60);
    const newSubs = Math.max(0, subPot() - S.subs) * 0.1 * Math.min(h, 3);
    const newFol = r.hype * 8 * (1 + S.level * 0.6) * Math.max(0.15, sat());
    S.subs += newSubs; S.followers += newFol; S.fame = clamp(S.fame + r.q / 60 * (1 - S.fame / 110), 0, 100);
    let vod = 0;
    if (S.ch.vod && r.q >= 55) { vod = Math.round(Math.pow(r.q - 50, 2) * 8 * (1 + S.fame / 100)); addCash(vod, "vod"); }
    closeSheet(); sfx("cash"); coinFly(6);
    floater(`+${num(newSubs)} abbonati`, "p"); setTimeout(() => floater(`+${num(newFol)} follower`, "f"), 250); if (vod) setTimeout(() => floater(`+${eur(vod)} licenza VOD`), 500);
    toast(`«${title}» è online!`, "good"); checkMission(); save();
  },
  dmca() { closeSheet(); startDMCA(); },
  quit() { save(); closeSheet(); showTitle(); },
};
function afterCiak(cast, score) {
      const q = estimateQ(cast, shoot.concept, score.v);
      const fit = locOf().fit.includes(shoot.concept) ? 1.15 : 1;
      const fame = 1 + cast.reduce((a, t) => a + t.fame, 0) / cast.length / 100;
      const hype = q * trendOf(shoot.concept) * fame * fit * (1 + S.fame / 200);
      shoot.result = { q, hype, grades: score.grades, title: genTitle(shoot.concept) };
      for (const t of cast) { t.morale -= S.staff.intimacy ? 7 : 12; t.rest = 2; t.scenes++; if (q >= 60) t.fame = Math.min(99, t.fame + 1); }
      sheetKind = "release"; $("sheet").classList.add("on"); renderSheet();
    }
function buy(it, f) { if (S.cash < it.cost) return toast("Non hai abbastanza contanti", "bad"); addCash(-it.cost); S.wk.cost += it.cost; f(); sfx("level"); burst(8); toast(it.n + " acquistato!", "good"); checkMission(); }
function genTitle(c) { return pick(TITLES[c]).replace("{c}", pick(CITIES)).replace("{n}", ri(2, 9)); }
function verifyDocs(t) {
  const birth = `${String(ri(1, 28)).padStart(2, "0")}/${String(ri(1, 12)).padStart(2, "0")}/${2027 - t.age}`;
  const exp = t.docIssue === "scaduto" ? `${String(ri(1, 28)).padStart(2, "0")}/0${ri(1, 9)}/2026` : `${String(ri(1, 28)).padStart(2, "0")}/0${ri(1, 9)}/${ri(2029, 2034)}`;
  const shownName = t.docIssue === "dati" ? t.name.split(" ")[0] + " " + pick(SURN.filter(s => !t.name.includes(s))) : t.name;
  const b = $("mbox");
  b.innerHTML = `<span class="kick info">CONTROLLO DOCUMENTI</span><h3>${t.name}</h3>
    <div class="idcard"><img src="${ImperoMedia.portrait(t)}"><div class="f"><b>COGNOME E NOME</b>${shownName}<br><b>NATA/O IL</b>${birth} · ${t.age} anni<br><b>SCADENZA</b>${exp}<br><b>N. DOCUMENTO</b>CA${ri(10000, 99999)}${pick(["AB", "KX", "TR"])}</div><div class="stamp" id="stamp"></div></div>
    <div class="checks"><div id="c1">✓ Maggiorenne (${t.age} anni)</div><div id="c2"></div><div id="c3"></div></div><div class="ch" id="vch" style="margin-top:12px"></div>`;
  $("modal").classList.add("on"); sfx("open");
  const steps = [() => $("c1").classList.add("on"),
    () => { $("c2").textContent = t.docIssue === "scaduto" ? "✗ Documento scaduto" : "✓ Documento valido"; $("c2").style.color = t.docIssue === "scaduto" ? "var(--red)" : ""; $("c2").classList.add("on"); sfx(t.docIssue === "scaduto" ? "bad" : "click"); },
    () => { $("c3").textContent = t.docIssue === "dati" ? "✗ Il nome non coincide con il contratto" : "✓ Dati coincidenti con il contratto"; $("c3").style.color = t.docIssue === "dati" ? "var(--red)" : ""; $("c3").classList.add("on"); sfx(t.docIssue === "dati" ? "bad" : "click"); },
    () => {
      const st = $("stamp"), ok = !t.docIssue;
      st.textContent = ok ? "APPROVATO" : "RESPINTO"; st.style.color = st.style.borderColor = ok ? "#13a463" : "#d6213a"; st.classList.add("on"); sfx(ok ? "coin" : "bad");
      const ch = $("vch");
      const close = () => { $("modal").classList.remove("on"); refresh(); renderSheet(); };
      if (ok) {
        const bt = document.createElement("button"); bt.className = "btn green"; bt.innerHTML = "<span>Firma il contratto</span><small>in scuderia</small>";
        bt.onclick = () => { S.cands = S.cands.filter(c => c !== t); S.roster.push(t); toast(`${t.name} entra nello studio!`, "good"); checkMission(); close(); }; ch.appendChild(bt);
      } else if (t.docIssue === "scaduto") {
        const bt = document.createElement("button"); bt.className = "btn gold"; bt.innerHTML = "<span>Chiedi di rinnovarlo</span><small>torna tra 3 giorni</small>";
        bt.onclick = () => { t.docIssue = ""; S.cands = S.cands.filter(c => c !== t); setTimeout(() => { if (S && S.cands.length < 6) S.cands.unshift(t); }, DAY_MS * 3); toast("Documento in rinnovo: lo ritrovi tra i candidati"); close(); }; ch.appendChild(bt);
      } else {
        const bt = document.createElement("button"); bt.className = "btn"; bt.innerHTML = "<span>Non si firma</span><small>candidato scartato</small>";
        bt.onclick = () => { S.cands = S.cands.filter(c => c !== t); close(); }; ch.appendChild(bt);
      }
      const no = document.createElement("button"); no.className = "btn alt"; no.innerHTML = "<span>Chiudi</span>"; no.onclick = close; ch.appendChild(no);
    }];
  steps.forEach((f, i) => setTimeout(f, 350 + i * 420));
}

// ======================================================================= quick actions: POST and LIVE
function doPost() {
  if (S.cd.post > 0) return toast(`Hai già postato: riprova tra ${S.cd.post}g`);
  S.cd.post = 1;
  const g = Math.round((S.followers * 0.01 + 40 + S.fame * 3) * (S.shadow > 0 ? 0.3 : 1) * Math.max(0.1, sat()));
  S.followers += g; floater(`+${num(g)} follower`, "f");
  for (let i = 0; i < 10; i++) setTimeout(() => floater("♥", "p"), i * 60);
  sfx("coin");
  if (!S.staff.smm && Math.random() < 0.06 && S.followers > 2000) { S.shadow = 7; toast("Il post è stato segnalato: shadowban per 7 giorni", "bad"); }
  refresh();
}
function openLive() {
  const ok = S.roster.filter(t => t.rest === 0 && t.morale >= 20);
  if (!S.roster.length) return toast("Serve un talento per fare la diretta: vai in TALENTI", "bad");
  if (!ok.length) return toast("Tutti i talenti sono a riposo o stanchi", "bad");
  const b = $("mbox");
  b.innerHTML = `<span class="kick">● LIVE</span><h3>Chi va in diretta?</h3><p>Raccogli le mance prima che spariscano e non toccare i troll. CamStar trattiene il 50%.</p><div class="ch"></div>`;
  const ch = b.querySelector(".ch");
  for (const t of ok) {
    const bt = document.createElement("button"); bt.className = "btn alt";
    bt.innerHTML = `<span style="display:flex;align-items:center;gap:10px"><img src="${ImperoMedia.portrait(t)}" style="width:34px;height:34px;border-radius:8px">${t.name}</span><small>fama ${t.fame} · benessere ${Math.round(t.morale)}</small>`;
    bt.onclick = () => { $("modal").classList.remove("on"); startLive(t); };
    ch.appendChild(bt);
  }
  const no = document.createElement("button"); no.className = "btn"; no.innerHTML = "<span>Annulla</span>"; no.onclick = () => $("modal").classList.remove("on"); ch.appendChild(no);
  $("modal").classList.add("on"); sfx("open");
}

// ======================================================================= minigames
const mcv = $("mcv"), mx = mcv.getContext("2d");
let mini = null;
function miniStart(m) {
  mini = m; $("mini").classList.add("on");
  const resize = () => { const dpr = Math.min(2, devicePixelRatio || 1); mcv.width = innerWidth * dpr; mcv.height = innerHeight * dpr; mx.setTransform(dpr, 0, 0, dpr, 0, 0); m.W = innerWidth; m.H = innerHeight; };
  resize(); m.resize = resize; addEventListener("resize", resize);
  m.t0 = performance.now(); m.last = m.t0;
  const loop = now => { if (mini !== m) return; const dt = Math.min(50, now - m.last); m.last = now; m.update(dt, now - m.t0); m.draw(now - m.t0); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
}
function miniEnd() { const m = mini; removeEventListener("resize", m.resize); mini = null; $("mini").classList.remove("on"); }
mcv.addEventListener("pointerdown", e => { if (mini && mini.tap) { e.preventDefault(); mini.tap(e.clientX, e.clientY); } });
function bigText(x, txt, X, Y, size, col, glowc) {
  x.save(); x.font = `900 ${size}px "Arial Black",Impact,sans-serif`; x.textAlign = "center"; x.textBaseline = "middle";
  x.shadowColor = glowc || col; x.shadowBlur = 18; x.fillStyle = col; x.fillText(txt, X, Y); x.restore();
}
// --- CIAK: three timing takes
function startCiak(done) {
  const op = S.staff.operatore ? 0.35 : 0, gq = gearQ() / 101 * 0.25;
  const labels = ["INQUADRATURA", "LUCE", "PERFORMANCE"];
  const m = { take: 0, pos: 0, dir: 1, speed: 0.75, zone: 0, zw: 0, state: "intro", st: 0, res: [], grades: [], flash: 0, shake: 0, msg: "" };
  const newTake = () => { m.zw = (0.15 + op * 0.15 + gq * 0.2) * (1 - m.take * 0.12); m.zone = rnd(0.2 + m.zw / 2, 0.8 - m.zw / 2); m.speed = 0.7 + m.take * 0.28 + S.level * 0.03; m.pos = Math.random() < 0.5 ? 0 : 1; m.dir = m.pos ? -1 : 1; m.state = "run"; };
  m.update = (dt, t) => {
    m.st += dt; if (m.flash > 0) m.flash -= dt; if (m.shake > 0) m.shake -= dt;
    if (m.state === "intro" && m.st > 1100) { newTake(); m.st = 0; }
    if (m.state === "run") { m.pos += m.dir * m.speed * dt / 1000; if (m.pos > 1) { m.pos = 1; m.dir = -1; } if (m.pos < 0) { m.pos = 0; m.dir = 1; } }
    if (m.state === "hit" && m.st > 900) { m.take++; if (m.take >= 3) { m.state = "end"; m.st = 0; } else newTake(); }
    if (m.state === "end" && m.st > 1300) { miniEnd(); const v = m.res.reduce((a, b) => a + b, 0) / 3; done({ v, grades: m.grades }); }
  };
  m.tap = () => {
    if (m.state !== "run") return;
    const d = Math.abs(m.pos - m.zone), hw = m.zw / 2;
    let g, s;
    if (d < hw * 0.3) { g = "PERFETTO!"; s = 1; m.flash = 220; sfx("perfect"); }
    else if (d < hw) { g = "BUONA!"; s = 0.75; sfx("coin"); }
    else if (d < hw * 2.2) { g = "PASSABILE"; s = 0.42; sfx("click"); }
    else { g = "DA RIFARE"; s = 0.12; m.shake = 300; sfx("bad"); }
    m.res.push(s); m.grades.push(g.replace("!", "").toLowerCase()); m.msg = g; m.state = "hit"; m.st = 0;
  };
  m.draw = t => {
    const x = mx, W = m.W, H = m.H;
    x.save(); if (m.shake > 0) x.translate(rnd(-6, 6), rnd(-6, 6));
    x.fillStyle = "#06030a"; x.fillRect(-10, -10, W + 20, H + 20);
    // the set seen through the viewfinder
    const vw = Math.min(W - 24, 520, (H - 260) * 16 / 9), vh = vw * 9 / 16, vx = (W - vw) / 2, vy = Math.max(90, (H - vh - 170) / 2);
    x.save(); x.beginPath(); x.rect(vx, vy, vw, vh); x.clip(); x.drawImage(scv, vx, vy, vw, vh);
    const blur = m.state === "run" ? Math.abs(m.pos - m.zone) : 0;
    x.fillStyle = `rgba(10,0,20,${0.15 + blur * 0.5})`; x.fillRect(vx, vy, vw, vh);
    x.restore();
    x.strokeStyle = "rgba(255,255,255,.85)"; x.lineWidth = 2; const L = 22;
    for (const [cx, cy, sx0, sy0] of [[vx + 10, vy + 10, 1, 1], [vx + vw - 10, vy + 10, -1, 1], [vx + 10, vy + vh - 10, 1, -1], [vx + vw - 10, vy + vh - 10, -1, -1]]) { x.beginPath(); x.moveTo(cx, cy + L * sy0); x.lineTo(cx, cy); x.lineTo(cx + L * sx0, cy); x.stroke(); }
    x.strokeStyle = "rgba(255,255,255,.25)"; x.lineWidth = 1; for (let i = 1; i < 3; i++) { x.beginPath(); x.moveTo(vx + vw * i / 3, vy); x.lineTo(vx + vw * i / 3, vy + vh); x.moveTo(vx, vy + vh * i / 3); x.lineTo(vx + vw, vy + vh * i / 3); x.stroke(); }
    if (Math.floor(t / 500) % 2) { x.fillStyle = "#ff2a3a"; x.beginPath(); x.arc(vx + 24, vy + 26, 6, 0, 7); x.fill(); }
    x.fillStyle = "#fff"; x.font = "800 13px ui-monospace,monospace"; x.fillText("REC  00:0" + Math.floor(t / 1000) % 10 + ":" + String(Math.floor(t / 10) % 100).padStart(2, "0"), vx + 36, vy + 31);
    x.fillText("4K  ISO 800  1/50", vx + vw - 150, vy + 31);
    bigText(x, "CIAK " + Math.min(3, m.take + 1) + "/3", W / 2, 36, 22, "#fff", "#ff2e88");
    // timing bar
    const bx = 24, bw = W - 48, by = vy + vh + 46, bh = 34;
    x.fillStyle = "rgba(255,255,255,.08)"; rr(x, bx, by, bw, bh, 17); x.fill();
    if (m.state === "run" || m.state === "hit") {
      const zx = bx + bw * (m.zone - m.zw / 2), zw = bw * m.zw;
      const g = x.createLinearGradient(zx, 0, zx + zw, 0); g.addColorStop(0, "rgba(65,240,160,.25)"); g.addColorStop(0.5, "rgba(65,240,160,.95)"); g.addColorStop(1, "rgba(65,240,160,.25)");
      x.fillStyle = g; rr(x, zx, by, zw, bh, 10); x.fill();
      x.fillStyle = "#fff"; x.fillRect(bx + bw * m.zone - 1.5, by - 6, 3, bh + 12);
      const px = bx + bw * m.pos; x.fillStyle = "#ffc94a"; x.shadowColor = "#ffc94a"; x.shadowBlur = 16; rr(x, px - 5, by - 10, 10, bh + 20, 5); x.fill(); x.shadowBlur = 0;
      bigText(x, labels[m.take] || "", W / 2, by - 24, 15, "#ffd6ea", "#ff2e88");
    }
    if (m.state === "intro") bigText(x, "SI GIRA!", W / 2, by + 17, 36, "#ffc94a");
    if (m.state === "run") { x.fillStyle = "#b49fbf"; x.font = "700 13px system-ui"; x.textAlign = "center"; x.fillText("tocca quando il cursore è nella zona verde", W / 2, by + bh + 30); x.textAlign = "left"; }
    if (m.state === "hit") bigText(x, m.msg, W / 2, by + bh + 46, 30, m.msg === "PERFETTO!" ? "#41f0a0" : m.msg === "DA RIFARE" ? "#ff4757" : "#ffc94a");
    if (m.state === "end") { const v = m.res.reduce((a, b) => a + b, 0) / 3; bigText(x, v > 0.85 ? "BUONA LA PRIMA!" : v > 0.6 ? "È UNA BUONA!" : "LA SISTEMIAMO AL MONTAGGIO", W / 2, by + 17, Math.min(30, W / 14), "#ffc94a"); }
    for (let i = 0; i < m.res.length; i++) { x.fillStyle = m.res[i] >= 1 ? "#41f0a0" : m.res[i] >= .7 ? "#ffc94a" : m.res[i] > .3 ? "#ff9a5a" : "#ff4757"; x.beginPath(); x.arc(W / 2 - 30 + i * 30, 66, 8, 0, 7); x.fill(); }
    for (let i = m.res.length; i < 3; i++) { x.strokeStyle = "rgba(255,255,255,.3)"; x.lineWidth = 2; x.beginPath(); x.arc(W / 2 - 30 + i * 30, 66, 8, 0, 7); x.stroke(); }
    if (m.flash > 0) { x.fillStyle = `rgba(255,255,255,${m.flash / 400})`; x.fillRect(0, 0, W, H); }
    x.restore();
  };
  miniStart(m);
}
// --- LIVE: catch the tips
function startLive(tal) {
  const img = ImperoMedia.load(ImperoMedia.portrait(tal));
  const fallback = ImperoMedia.load(drawnAvatar(tal));
  const m = { items: [], time: 20000, got: 0, combo: 0, best: 0, pops: [], chat: [], spawn: 0, state: "run", st: 0 };
  const val = () => (2 + tal.fame * 0.35) * (1 + S.fame / 70) * (1 + Math.sqrt(S.followers) / 300);
  const CHAT = ["ciao!! 👋", "che bello il set", "saluti da Bari", "sei fantastico/a", "prima volta qui", "buonasera!", "quel neon 🔥", "top", "che musica è?", "💖💖", "come va?", "seguo da mesi"];
  m.update = (dt, t) => {
    if (m.state === "run") {
      m.time -= dt; m.spawn -= dt;
      if (m.spawn <= 0) {
        m.spawn = rnd(260, 520) * (m.time < 7000 ? 0.65 : 1);
        const troll = Math.random() < 0.17, gem = !troll && Math.random() < 0.1;
        m.items.push({ x: rnd(40, m.W - 40), y: m.H + 30, vy: rnd(0.11, 0.2) * (m.time < 7000 ? 1.3 : 1), r: gem ? 24 : 22, troll, gem, wob: rnd(6.28), v: gem ? 5 : 1 });
      }
      if (Math.random() < dt / 900) { m.chat.push({ u: pick(["luca88", "marta_x", "dream99", "ombra", "jo", "fede.r", "nomade", "kappa", "sole"]), t: pick(CHAT), age: 0 }); if (m.chat.length > 6) m.chat.shift(); }
      if (m.time <= 0) { m.state = "end"; m.st = 0; sfx("level"); }
    } else { m.st += dt; if (m.st > 1800) finish(); }
    for (const it of m.items) { it.y -= it.vy * dt; it.wob += dt * 0.004; }
    const esc = m.items.filter(it => it.y < -40 && !it.troll && !it.hit); if (esc.length) m.combo = 0;
    m.items = m.items.filter(it => it.y > -40 && !it.hit);
    for (const p of m.pops) p.life -= dt; m.pops = m.pops.filter(p => p.life > 0);
  };
  m.tap = (X, Y) => {
    if (m.state !== "run") return;
    let hit = null, bd = 1e9;
    for (const it of m.items) { const d = Math.hypot(it.x + Math.sin(it.wob) * 10 - X, it.y - Y); if (d < it.r + 22 && d < bd) { bd = d; hit = it; } }
    if (!hit) return;
    hit.hit = true;
    if (hit.troll) { m.combo = 0; m.got = Math.max(0, m.got - val() * 3); m.pops.push({ x: X, y: Y, t: "TROLL! −", c: "#ff4757", life: 700 }); sfx("bad"); if (navigator.vibrate) navigator.vibrate(40); return; }
    m.combo++; m.best = Math.max(m.best, m.combo);
    const g = val() * hit.v * (1 + Math.min(m.combo, 20) * 0.08); m.got += g;
    m.pops.push({ x: X, y: Y, t: "+€" + Math.round(g), c: hit.gem ? "#38e8ff" : "#ffc94a", life: 700 }); sfx(hit.gem ? "perfect" : "coin");
  };
  const finish = () => {
    miniEnd(); const net = Math.round(m.got * 0.5);
    addCash(net, "live"); S.followers += Math.round(m.got * 1.5); S.didLive = true; tal.morale -= 6; tal.rest = 1;
    coinFly(6); floater("+" + eur(net) + " dalla LIVE"); toast(`Diretta finita: incassati ${eur(m.got)}, a te ${eur(net)} (record combo ${m.best})`, "good");
    checkMission(); refresh(); save();
  };
  m.draw = t => {
    const x = mx, W = m.W, H = m.H;
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#2a0f3c"); g.addColorStop(1, "#0a0412"); x.fillStyle = g; x.fillRect(0, 0, W, H);
    glow(x, W / 2, H * 0.42, Math.min(W, H) * 0.5, "rgba(255,46,136,A)", 0.25);
    const s = Math.min(W * 0.55, H * 0.32); x.save(); x.beginPath(); x.arc(W / 2, H * 0.36, s / 2, 0, 7); x.clip(); const portrait = img.naturalWidth ? img : fallback; if (portrait.naturalWidth) x.drawImage(portrait, W / 2 - s / 2, H * 0.36 - s / 2, s, s); x.restore();
    x.strokeStyle = "#ff2e88"; x.lineWidth = 4; x.shadowColor = "#ff2e88"; x.shadowBlur = 20; x.beginPath(); x.arc(W / 2, H * 0.36, s / 2 + 4, 0, 7); x.stroke(); x.shadowBlur = 0;
    x.fillStyle = "#ff2a3a"; rr(x, 14, 14, 62, 24, 6); x.fill(); x.fillStyle = "#fff"; x.font = "900 13px system-ui"; x.fillText("● LIVE", 22, 31);
    x.fillStyle = "rgba(0,0,0,.4)"; rr(x, 84, 14, 90, 24, 6); x.fill(); x.fillStyle = "#fff"; x.fillText("👁 " + num(200 + tal.fame * 40 + S.followers * 0.02 + Math.sin(t * 0.002) * 30), 92, 31);
    bigText(x, eur(m.got), W / 2, 70, 30, "#ffc94a"); x.fillStyle = "#b49fbf"; x.font = "700 12px system-ui"; x.textAlign = "center"; x.fillText(tal.name + " · " + Math.max(0, Math.ceil(m.time / 1000)) + " s", W / 2, 96);
    if (m.combo >= 3) bigText(x, "COMBO ×" + m.combo, W / 2, 122, 18, "#41f0a0");
    x.textAlign = "left"; x.font = "600 12px system-ui";
    m.chat.forEach((c, i) => { const y = H * 0.6 + i * 20; x.fillStyle = "rgba(0,0,0,.35)"; rr(x, 12, y - 13, Math.min(W * 0.6, 50 + c.t.length * 7 + c.u.length * 7), 18, 9); x.fill(); x.fillStyle = "#ff7ab8"; x.fillText(c.u, 20, y); x.fillStyle = "#fff"; x.fillText(c.t, 26 + c.u.length * 7, y); });
    for (const it of m.items) {
      const X = it.x + Math.sin(it.wob) * 10, Y = it.y;
      if (it.troll) { x.fillStyle = "#3b3b48"; x.beginPath(); x.arc(X, Y, it.r, 0, 7); x.fill(); x.strokeStyle = "#ff4757"; x.lineWidth = 3; x.stroke(); x.fillStyle = "#ff4757"; x.font = "900 20px system-ui"; x.textAlign = "center"; x.fillText("✖", X, Y + 7); }
      else { const gg = x.createRadialGradient(X - 6, Y - 6, 2, X, Y, it.r); gg.addColorStop(0, "#fff"); gg.addColorStop(0.4, it.gem ? "#38e8ff" : "#ffc94a"); gg.addColorStop(1, it.gem ? "#1667ff" : "#c47a00"); x.fillStyle = gg; x.shadowColor = it.gem ? "#38e8ff" : "#ffc94a"; x.shadowBlur = 14; x.beginPath(); if (it.gem) { x.moveTo(X, Y - it.r); x.lineTo(X + it.r, Y); x.lineTo(X, Y + it.r); x.lineTo(X - it.r, Y); } else x.arc(X, Y, it.r, 0, 7); x.fill(); x.shadowBlur = 0; x.fillStyle = "#5a2d00"; x.font = "900 16px system-ui"; x.textAlign = "center"; x.fillText(it.gem ? "" : "€", X, Y + 6); }
    }
    for (const p of m.pops) { x.globalAlpha = p.life / 700; bigText(x, p.t, p.x, p.y - (700 - p.life) * 0.06, 18, p.c); x.globalAlpha = 1; }
    x.textAlign = "left";
    if (m.state === "end") { x.fillStyle = "rgba(0,0,0,.6)"; x.fillRect(0, 0, W, H); bigText(x, "FINE DIRETTA", W / 2, H / 2 - 20, 32, "#fff", "#ff2e88"); bigText(x, "a te " + eur(m.got * 0.5), W / 2, H / 2 + 24, 24, "#ffc94a"); }
  };
  miniStart(m); sfx("open");
}
// --- DMCA whack-a-link
function startDMCA() {
  closeSheet();
  const m = { time: 15000, hits: 0, slots: Array.from({ length: 9 }, () => ({ on: 0, t: 0, hit: 0 })), state: "run", st: 0, spawn: 0 };
  const names = ["tube-xyz", "fr33vids", "leakhub", "mirror24", "pir8zone", "clipz.ru", "dlfast", "streamtv", "warez9"];
  m.update = (dt) => {
    if (m.state === "run") {
      m.time -= dt; m.spawn -= dt;
      if (m.spawn <= 0) { m.spawn = rnd(280, 520); const free = m.slots.filter(s => !s.on && !s.hit); if (free.length) { const s = pick(free); s.on = 1; s.t = rnd(650, 1150); s.n = pick(names); } }
      for (const s of m.slots) { if (s.on) { s.t -= dt; if (s.t <= 0) s.on = 0; } if (s.hit) { s.hit -= dt; if (s.hit < 0) s.hit = 0; } }
      if (m.time <= 0) { m.state = "end"; m.st = 0; }
    } else { m.st += dt; if (m.st > 1600) { miniEnd(); const red = m.hits * 0.012; S.piracy = clamp(S.piracy - red, 0.02, 0.95); toast(`${m.hits} link rimossi: pirateria −${Math.round(red * 100)}%`, "good"); refresh(); } }
  };
  const geom = () => { const W = m.W, H = m.H, gs = Math.min(W - 30, H - 220, 480), cs = gs / 3; return { gx: (W - gs) / 2, gy: 140, cs }; };
  m.tap = (X, Y) => {
    if (m.state !== "run") return; const { gx, gy, cs } = geom();
    const i = Math.floor((X - gx) / cs), j = Math.floor((Y - gy) / cs); if (i < 0 || j < 0 || i > 2 || j > 2) return;
    const s = m.slots[j * 3 + i]; if (s.on) { s.on = 0; s.hit = 450; m.hits++; sfx("perfect"); }
  };
  m.draw = () => {
    const x = mx, W = m.W, H = m.H, { gx, gy, cs } = geom();
    x.fillStyle = "#070a12"; x.fillRect(0, 0, W, H);
    x.fillStyle = "rgba(56,232,255,.06)"; for (let i = 0; i < H; i += 4) x.fillRect(0, i, W, 1);
    bigText(x, "CACCIA AI PIRATI", W / 2, 40, 24, "#38e8ff"); x.fillStyle = "#9fb8c8"; x.font = "700 13px system-ui"; x.textAlign = "center"; x.fillText("tocca i link pirata per inviare l'avviso di rimozione", W / 2, 68);
    bigText(x, Math.max(0, Math.ceil(m.time / 1000)) + " s · " + m.hits + " rimossi", W / 2, 104, 18, "#fff", "#38e8ff");
    m.slots.forEach((s, k) => {
      const X = gx + (k % 3) * cs + 6, Y = gy + Math.floor(k / 3) * cs + 6, w = cs - 12;
      x.fillStyle = "#121a28"; rr(x, X, Y, w, w, 10); x.fill(); x.fillStyle = "#1d2a40"; rr(x, X, Y, w, 18, 10); x.fill();
      for (let d = 0; d < 3; d++) { x.fillStyle = ["#ff5f57", "#febc2e", "#28c840"][d]; x.beginPath(); x.arc(X + 10 + d * 9, Y + 9, 3, 0, 7); x.fill(); }
      if (s.on) { x.fillStyle = "#ff2e88"; x.globalAlpha = .25 + .15 * Math.sin(performance.now() * 0.02); rr(x, X, Y, w, w, 10); x.fill(); x.globalAlpha = 1; x.fillStyle = "#fff"; x.font = "800 12px ui-monospace,monospace"; x.fillText(s.n, X + w / 2, Y + w / 2 - 8); x.fillStyle = "#ffc94a"; x.font = "900 13px system-ui"; x.fillText("▶ TUO VIDEO", X + w / 2, Y + w / 2 + 14); }
      if (s.hit) { x.save(); x.translate(X + w / 2, Y + w / 2); x.rotate(-0.25); x.strokeStyle = "#41f0a0"; x.lineWidth = 3; x.strokeRect(-46, -14, 92, 28); x.fillStyle = "#41f0a0"; x.font = "900 14px system-ui"; x.fillText("RIMOSSO", 0, 5); x.restore(); }
    });
    x.textAlign = "left";
    if (m.state === "end") { x.fillStyle = "rgba(0,0,0,.6)"; x.fillRect(0, 0, W, H); bigText(x, m.hits + " LINK RIMOSSI", W / 2, H / 2, 30, "#41f0a0"); }
  };
  miniStart(m); sfx("alert");
}

// ======================================================================= audio
let AC = null, audioOn = true;
function ac() { if (!AC) { const C = window.AudioContext || window.webkitAudioContext; if (C) AC = new C(); } if (AC && AC.state === "suspended") AC.resume(); return AC; }
function tone(f, d, type = "sine", v = 0.12, f2, delay = 0) {
  const c = ac(); if (!c || !audioOn) return; const t = c.currentTime + delay, o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(g).connect(c.destination); o.start(t); o.stop(t + d + 0.02);
}
function sfx(k) {
  if (!audioOn) return;
  if (k === "click") tone(660, 0.06, "triangle", 0.06);
  else if (k === "open") tone(420, 0.12, "sine", 0.07, 640);
  else if (k === "coin") { tone(988, 0.08, "square", 0.05); tone(1318, 0.14, "square", 0.05, null, 0.07); }
  else if (k === "cash") { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.18, "triangle", 0.08, null, i * 0.07)); }
  else if (k === "perfect") { tone(880, 0.1, "square", 0.06); tone(1760, 0.18, "triangle", 0.07, null, 0.06); }
  else if (k === "bad") tone(180, 0.25, "sawtooth", 0.07, 90);
  else if (k === "alert") { tone(740, 0.12, "square", 0.05); tone(554, 0.16, "square", 0.05, null, 0.13); }
  else if (k === "level") [392, 523, 659, 784, 1046].forEach((f, i) => tone(f, 0.25, "triangle", 0.08, null, i * 0.08));
}

// ======================================================================= main loop / time
let speed = 1, paused = false, acc = 0, lastT = performance.now(), lastTick = 0;
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(100, now - lastT); lastT = now;
  if (!S) return;
  const frozen = paused || speed === 0 || modalOpen() || mini || $("scoreDialog").open || $("sheet").classList.contains("on") || !$("gate").classList.contains("off");
  if (!frozen) { acc += dt * speed; let n = 0; while (acc >= DAY_MS && n < 4) { acc -= DAY_MS; dayTick(); n++; if (n === 1) { refresh(); if (sheetKind) renderSheet(); } } }
  if (flQueue.length && now - lastTick > 260) { lastTick = now; const f = flQueue.shift(); floater(f.t, f.k); if (f.coin) coinFly(2); }
  if (!mini) renderScene(now);
  updateHUD(dt);
  tickerX -= dt * 0.05; const tw = $("tick").offsetWidth; $("tick").style.transform = `translateX(${tickerX}px)`; if (tickerX < -tw - 20) nextTicker();
}
for (const b of $("speed").children) b.onclick = () => { speed = +b.dataset.sp; for (const c of $("speed").children) c.classList.toggle("on", c === b); sfx("click"); };
document.addEventListener("click", e => {
  const o = e.target.closest("[data-open]");
  if (o) { ac(); const k = o.dataset.open; if (k === "post") return doPost(); if (k === "live") return openLive(); if (k === "shoot") shoot = null; openSheet(k); return; }
  if (e.target.closest("[data-close]") || e.target === $("sheet")) { closeSheet(); sfx("click"); return; }
  const tb = e.target.closest("[data-tab]"); if (tb) { sheetTab = tb.dataset.tab; renderSheet(); sfx("click"); return; }
  const a = e.target.closest("[data-act]"); if (a && ACT[a.dataset.act]) { ACT[a.dataset.act](a.dataset); refresh(); if (sheetKind && $("sheet").classList.contains("on")) renderSheet(); }
});
document.addEventListener("visibilitychange", () => { if (document.hidden && S) save(); });

// ======================================================================= save / title
function save() { try { localStorage.setItem(SAVE, JSON.stringify(S)); } catch (e) { } }
function load() { try { const s = JSON.parse(localStorage.getItem(SAVE)); return s && s.v === 1 ? s : null; } catch (e) { return null; } }
function showTitle() {
  $("gate").classList.remove("off"); $("gateA").hidden = true; $("gateB").hidden = false;
  $("contGame").hidden = !load();
}
$("gateYes").onclick = () => { try { localStorage.setItem("impero-18", "1"); } catch (e) { } ac(); sfx("level"); showTitle(); };
$("gateNo").onclick = () => { location.href = "../"; };
$("newGame").onclick = () => { ac(); S = newState(($("studioName").value || "Studio Rosso").trim().slice(0, 18)); refreshCands(); S.cands[0].docIssue = ""; S.cands[0].share = true; S.cands[0].fame = Math.min(S.cands[0].fame, 12); start(); setTimeout(() => toast("Inizia da TALENTI: ingaggia il primo talento, poi premi GIRA"), 600); };
$("contGame").onclick = () => { ac(); S = load(); start(); };
$("guideBtn").onclick = () => { $("gate").classList.add("off"); if (!S) { S = newState("Studio Rosso"); refreshCands(); S._tmp = true; } sheetKind = "books"; sheetTab = "guida"; $("sheet").classList.add("on"); renderSheet(); };
$("scoreMenu").onclick = () => ImperoLeaderboard.open();
function start() { delete S._tmp; ImperoLeaderboard.record(S.imperoDay); $("gate").classList.add("off"); shown.cash = S.cash; shown.subs = S.subs; shown.fol = S.followers; shown.fame = S.fame; refresh(); nextTicker(); save(); }
// back to title after reading the guide without a game
const _close = closeSheet; closeSheet = function () { _close(); if (S && S._tmp) { S = null; showTitle(); } };
try { if (localStorage.getItem("impero-18") === "1") showTitle(); } catch (e) { }

// test bridge for automated checks (not used in play)
globalThis.__IMPERO__ = { get S() { return S; }, dayTick, ACT, compliance, refresh, LEVELS,
  botShoot(concept, ids, v) { shoot = { step: 2, concept, cast: ids.slice() }; const cast = ids.map(id => S.roster.find(t => t.id === id)); const fee = cast.reduce((a, t) => a + (t.share ? 0 : t.rate), 0) + 40 + S.level * 60; addCash(-fee); S.wk.cost += fee; afterCiak(cast, { v, grades: ["test"] }); ACT.publish(); },
  botHire(t) { S.cands = S.cands.filter(c => c !== t); S.roster.push(t); },
  eligible, trendOf, locOf };
requestAnimationFrame(loop);
})();
