"use strict";

// Segnaposti in SVG disegnati via codice, finché non arriva la grafica definitiva da ChatGPT.
// Stessa struttura delle immagini future: personaggi a strati, umori, oggetti del tipo di cliente.
const PetteaAvatar = (() => {
  const LINEA = "#5a3d3d";
  const GUANCE = "#ff9fb0";

  function scurisci(hex, f = 0.82) {
    const n = parseInt(hex.slice(1), 16);
    const c = [n >> 16, n >> 8 & 255, n & 255].map(v => Math.round(v * f));
    return `rgb(${c.join(",")})`;
  }

  function occhi(chiaro, y = 55) {
    const iride = chiaro ? LINEA : "#2b2230";
    const bianco = chiaro ? "" : `<ellipse cx="40" cy="${y}" rx="9.5" ry="11" fill="#fff"/><ellipse cx="80" cy="${y}" rx="9.5" ry="11" fill="#fff"/>`;
    return `${bianco}<ellipse cx="40" cy="${y}" rx="6.5" ry="8" fill="${iride}"/><ellipse cx="80" cy="${y}" rx="6.5" ry="8" fill="${iride}"/>
      <circle cx="42.5" cy="${y - 3.5}" r="2.6" fill="#fff"/><circle cx="82.5" cy="${y - 3.5}" r="2.6" fill="#fff"/>
      <ellipse cx="30" cy="${y + 13}" rx="7" ry="4" fill="${GUANCE}" opacity=".75"/><ellipse cx="90" cy="${y + 13}" rx="7" ry="4" fill="${GUANCE}" opacity=".75"/>`;
  }

  // ---------- Il gattino del giocatore ----------

  function accessorio(tipo, colore) {
    if (tipo === "fiocco") return `<g transform="translate(78 14) rotate(18)" stroke="${LINEA}" stroke-width="2.5" fill="${colore}">
      <path d="M0 0 L-16 -10 L-16 10 Z" stroke-linejoin="round"/><path d="M0 0 L16 -10 L16 10 Z" stroke-linejoin="round"/><circle r="4.5"/></g>`;
    if (tipo === "bandana") return `<path d="M24 92 Q60 108 96 92 L88 104 Q60 118 32 104 Z" fill="${colore}" stroke="${LINEA}" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M52 108 L60 122 L68 108" fill="${colore}" stroke="${LINEA}" stroke-width="2.5" stroke-linejoin="round"/>`;
    if (tipo === "cappello") return `<g stroke="${LINEA}" stroke-width="2.5" stroke-linejoin="round">
      <rect x="38" y="6" width="44" height="16" rx="4" fill="#fff"/>
      <path d="M36 10 C26 -6 46 -14 54 -4 C58 -16 76 -14 74 -2 C86 -10 96 6 84 10 Z" fill="#fff"/>
      <rect x="38" y="16" width="44" height="6" fill="${colore}"/></g>`;
    return "";
  }

  function gattino({ pelo = "#f6e3c6", accessorio: acc = "nessuno", coloreAcc = "#ff8f8f" } = {}) {
    const scuro = scurisci(pelo);
    const chiaro = parseInt(pelo.slice(1), 16) > 0x999999;
    return `<svg viewBox="-4 -18 128 146" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g stroke="${LINEA}" stroke-width="3" stroke-linejoin="round">
        <path d="M22 44 L26 6 L52 28 Z" fill="${pelo}"/><path d="M98 44 L94 6 L68 28 Z" fill="${pelo}"/>
        <path d="M30 34 L30 16 L44 28 Z" fill="${GUANCE}" stroke="none"/><path d="M90 34 L90 16 L76 28 Z" fill="${GUANCE}" stroke="none"/>
        <path d="M30 118 Q30 88 60 88 Q90 88 90 118 Q60 126 30 118 Z" fill="${scuro}"/>
        <path d="M96 110 Q118 104 110 82" fill="none" stroke-width="7" stroke-linecap="round"/><path d="M96 110 Q118 104 110 82" fill="none" stroke="${scuro}" stroke-width="3" stroke-linecap="round"/>
        <ellipse cx="60" cy="58" rx="46" ry="40" fill="${pelo}"/>
      </g>
      ${occhi(chiaro)}
      <path d="M53 70 Q56.5 74 60 70 Q63.5 74 67 70" fill="none" stroke="${chiaro ? LINEA : "#fff"}" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M58 64 L62 64 L60 67 Z" fill="${GUANCE}"/>
      ${accessorio(acc, coloreAcc)}
    </svg>`;
  }

  // ---------- Clienti a figura intera ----------

  const CLIENTI = {
    criceto: { pelo: "#f2c98f", muso: "#fff3dc", orecchie: "tonde" },
    cagnolino: { pelo: "#d9a77a", muso: "#fff3dc", orecchie: "pendenti" },
    ochetta: { pelo: "#ffffff", muso: "#ffffff", orecchie: "becco" },
    orsetto: { pelo: "#b9825a", muso: "#f3dcc0", orecchie: "orso" }
  };

  // umore: felice, neutro, stufo, arrabbiato
  function faccia(c, umore) {
    let occ = occhi(true);
    if (umore === "stufo") {
      occ = `<ellipse cx="40" cy="57" rx="6.5" ry="5" fill="${LINEA}"/><ellipse cx="80" cy="57" rx="6.5" ry="5" fill="${LINEA}"/>
        <path d="M31 53 L49 55 M71 55 L89 53" stroke="${LINEA}" stroke-width="3" stroke-linecap="round"/>
        <path d="M100 30 Q106 40 100 44 Q94 40 100 30 Z" fill="#8fd3ff" stroke="${LINEA}" stroke-width="2"/>`;
    } else if (umore === "arrabbiato") {
      occ = `<ellipse cx="40" cy="57" rx="5" ry="6" fill="${LINEA}"/><ellipse cx="80" cy="57" rx="5" ry="6" fill="${LINEA}"/>
        <path d="M28 44 L50 51 M92 44 L70 51" stroke="${LINEA}" stroke-width="4" stroke-linecap="round"/>
        <ellipse cx="30" cy="69" rx="8" ry="5" fill="#ff6b6b" opacity=".8"/><ellipse cx="90" cy="69" rx="8" ry="5" fill="#ff6b6b" opacity=".8"/>`;
    }
    const bocca = {
      felice: "M53 76 Q60 83 67 76",
      neutro: "M54 78 L66 78",
      stufo: "M53 80 Q60 75 67 80",
      arrabbiato: "M52 81 Q60 73 68 81"
    }[umore];
    let muso;
    if (c.orecchie === "becco") {
      muso = `<path d="M48 70 Q60 62 72 70 Q60 ${umore === "felice" ? 84 : 78} 48 70 Z" fill="#ffb347" stroke="${LINEA}" stroke-width="2.5" stroke-linejoin="round"/>`;
    } else {
      muso = `<ellipse cx="60" cy="74" rx="15" ry="11" fill="${c.muso}"/><path d="M56 68 L64 68 L60 72 Z" fill="${LINEA}"/>
        <path d="${bocca}" fill="none" stroke="${LINEA}" stroke-width="2.5" stroke-linecap="round"/>`;
    }
    return occ + muso;
  }

  function oggetto(tipo) {
    if (tipo === "studente") return `<g stroke="${LINEA}" stroke-width="2.5" stroke-linejoin="round">
      <rect x="38" y="118" width="44" height="9" rx="2" fill="#b9a2ee"/><rect x="41" y="109" width="40" height="9" rx="2" fill="#9fe3c8"/>
      <rect x="36" y="100" width="46" height="9" rx="2" fill="#ff8f8f"/></g>`;
    if (tipo === "sportivo") return `<path d="M20 40 Q60 26 100 40 L99 49 Q60 36 21 49 Z" fill="#7fd6b3" stroke="${LINEA}" stroke-width="2.5" stroke-linejoin="round"/>
      <g stroke="${LINEA}" stroke-width="2.5"><rect x="88" y="104" width="14" height="28" rx="5" fill="#8fd3ff"/><rect x="90" y="98" width="10" height="7" rx="2" fill="#fff"/></g>`;
    if (tipo === "famiglia") return `<g stroke="${LINEA}" stroke-width="2.5" stroke-linejoin="round">
      <circle cx="18" cy="132" r="13" fill="#ffe08a"/><path d="M28 132 L36 135 L28 138 Z" fill="#ffb347"/></g>
      <circle cx="15" cy="129" r="2.3" fill="${LINEA}"/><circle cx="16" cy="128" r=".8" fill="#fff"/>`;
    if (tipo === "turista") return `<g stroke="${LINEA}" stroke-width="2.5" stroke-linejoin="round">
      <ellipse cx="60" cy="20" rx="44" ry="9" fill="#ffe08a"/><path d="M34 20 Q36 0 60 0 Q84 0 86 20 Z" fill="#ffe08a"/><path d="M35 15 L85 15" stroke="#ff8f8f" stroke-width="5"/>
      <path d="M40 96 L52 112 M80 96 L68 112" fill="none"/>
      <rect x="44" y="108" width="32" height="20" rx="4" fill="#5a5164"/><circle cx="60" cy="118" r="6" fill="#c9b6f2"/></g>`;
    return "";
  }

  function cliente(animale, umore = "felice", tipo = "") {
    const c = CLIENTI[animale];
    let orecchie = "";
    if (c.orecchie === "tonde") orecchie = `<circle cx="28" cy="22" r="13" fill="${c.pelo}"/><circle cx="92" cy="22" r="13" fill="${c.pelo}"/>`;
    if (c.orecchie === "orso") orecchie = `<circle cx="24" cy="24" r="14" fill="${c.pelo}"/><circle cx="96" cy="24" r="14" fill="${c.pelo}"/><circle cx="24" cy="24" r="6" fill="${c.muso}" stroke="none"/><circle cx="96" cy="24" r="6" fill="${c.muso}" stroke="none"/>`;
    if (c.orecchie === "pendenti") orecchie = `<ellipse cx="18" cy="48" rx="12" ry="24" fill="${scurisci(c.pelo, 0.75)}" transform="rotate(18 18 48)"/><ellipse cx="102" cy="48" rx="12" ry="24" fill="${scurisci(c.pelo, 0.75)}" transform="rotate(-18 102 48)"/>`;
    const corpo = `<path d="M30 140 Q28 96 60 96 Q92 96 90 140 Q60 148 30 140 Z" fill="${c.orecchie === "becco" ? "#ffffff" : scurisci(c.pelo, 0.9)}"/>
      <ellipse cx="42" cy="142" rx="10" ry="6" fill="${c.orecchie === "becco" ? "#ffb347" : scurisci(c.pelo, 0.75)}"/><ellipse cx="78" cy="142" rx="10" ry="6" fill="${c.orecchie === "becco" ? "#ffb347" : scurisci(c.pelo, 0.75)}"/>`;
    return `<svg viewBox="0 -4 120 154" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g stroke="${LINEA}" stroke-width="3" stroke-linejoin="round">${corpo}${orecchie}
        <ellipse cx="60" cy="58" rx="46" ry="42" fill="${c.pelo}"/></g>
      ${faccia(c, umore)}${oggetto(tipo)}
    </svg>`;
  }

  // Nuvoletta della rabbia quando un cliente se ne va stufo
  function nuvolaRabbia() {
    return `<svg viewBox="0 0 80 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M14 46 Q2 46 4 34 Q2 20 16 20 Q18 6 34 8 Q44 0 54 10 Q72 8 72 24 Q80 34 70 44 Q66 54 52 50 Q40 58 28 50 Q20 54 14 46 Z" fill="#6b5b6b" stroke="${LINEA}" stroke-width="2.5"/>
      <g stroke="#ff5a5a" stroke-width="4" stroke-linecap="round" fill="none">
        <path d="M30 22 Q36 28 30 34"/><path d="M50 22 Q44 28 50 34"/><path d="M33 20 Q40 26 47 20"/><path d="M33 36 Q40 30 47 36"/></g>
    </svg>`;
  }

  function moneta() {
    return `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="20" cy="20" r="16" fill="#ffd34d" stroke="${LINEA}" stroke-width="3"/><circle cx="20" cy="20" r="10" fill="none" stroke="#e6a900" stroke-width="2"/>
      <path d="M20 13 L22 18 L27 18 L23 21 L24.5 26 L20 23 L15.5 26 L17 21 L13 18 L18 18 Z" fill="#fff6c7"/>
    </svg>`;
  }

  // ---------- Ingredienti kawaii ----------

  function facciaIngrediente(x = 32, y = 38, chiaro = true) {
    const c = chiaro ? LINEA : "#fff";
    return `<circle cx="${x - 7}" cy="${y}" r="2.6" fill="${c}"/><circle cx="${x + 7}" cy="${y}" r="2.6" fill="${c}"/>
      <circle cx="${x - 6.2}" cy="${y - 1}" r=".9" fill="${chiaro ? "#fff" : LINEA}"/><circle cx="${x + 7.8}" cy="${y - 1}" r=".9" fill="${chiaro ? "#fff" : LINEA}"/>
      <path d="M${x - 3} ${y + 3} Q${x} ${y + 6} ${x + 3} ${y + 3}" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round"/>
      <ellipse cx="${x - 12}" cy="${y + 4}" rx="3.5" ry="2" fill="${GUANCE}" opacity=".8"/><ellipse cx="${x + 12}" cy="${y + 4}" rx="3.5" ry="2" fill="${GUANCE}" opacity=".8"/>`;
  }

  const FORME = {
    riso: () => `<path d="M8 52 Q8 18 32 14 Q56 18 56 52 Z" fill="#fbf6ea"/><path d="M20 26 l3 2 M40 24 l3 -2 M30 20 l2 3" stroke-width="1.5"/>`,
    venere: () => `<path d="M8 52 Q8 18 32 14 Q56 18 56 52 Z" fill="#6b5a7b"/><path d="M20 26 l3 2 M40 24 l3 -2 M30 20 l2 3" stroke="#9d8aae" stroke-width="1.5"/>`,
    salmone: () => `<rect x="8" y="16" width="48" height="36" rx="10" fill="#ff9f80"/><path d="M14 26 Q32 20 50 26 M12 38 Q32 32 52 38" stroke="#fff3dc" stroke-width="3" fill="none"/>`,
    tofu: () => `<path d="M14 22 L26 12 L56 12 L44 22 Z" fill="#fff0c4"/><path d="M44 22 L56 12 L56 44 L44 54 Z" fill="#e7cf94"/><rect x="10" y="22" width="34" height="32" rx="3" fill="#f3d9a0"/>`,
    avocado: () => `<path d="M32 6 Q52 12 54 36 Q54 58 32 58 Q10 58 10 36 Q12 12 32 6 Z" fill="#4f8a3a"/><path d="M32 12 Q48 18 48 36 Q48 52 32 52 Q16 52 16 36 Q16 18 32 12 Z" fill="#c8e68c" stroke="none"/><circle cx="32" cy="44" r="7" fill="#9b6a3c"/>`,
    edamame: () => `<path d="M8 40 Q6 22 20 22 Q26 14 34 22 Q42 14 48 22 Q60 24 56 40 Q52 52 32 50 Q12 52 8 40 Z" fill="#7cc576"/><path d="M14 30 Q20 26 22 30" stroke-width="1.5" fill="none"/>`,
    mango: () => `<rect x="10" y="16" width="44" height="38" rx="14" fill="#ffc94d"/><path d="M32 16 Q34 6 44 6 Q40 14 32 16 Z" fill="#7cc576"/>`,
    soia: () => `<rect x="18" y="20" width="28" height="36" rx="8" fill="#7a4a32"/><rect x="24" y="8" width="16" height="14" rx="3" fill="#ff8f8f"/><rect x="22" y="30" width="20" height="14" rx="3" fill="#fff3dc" stroke-width="1.5"/>`,
    piccante: () => `<path d="M32 6 Q50 30 50 40 Q50 58 32 58 Q14 58 14 40 Q14 30 32 6 Z" fill="#ff7a7a"/><path d="M24 26 Q22 34 24 40" stroke="#fff" stroke-width="3" fill="none" opacity=".7"/>`
  };
  const FACCE = { riso: [32, 38, true], venere: [32, 38, false], salmone: [32, 36, true], tofu: [27, 38, true], avocado: [32, 26, true],
    edamame: [32, 38, true], mango: [32, 36, true], soia: [32, 38, true], piccante: [32, 42, true] };

  function ingrediente(id) {
    const [x, y, chiaro] = FACCE[id];
    const faccina = facciaIngrediente(x, y, chiaro);
    return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g stroke="${LINEA}" stroke-width="2.5" stroke-linejoin="round">${FORME[id]()}</g>${faccina}</svg>`;
  }

  // ---------- Ciotola che si compone ----------

  const POSTI_TOPPING = [[128, 40], [100, 30], [72, 42]];

  function strato(id, k, nuovo) {
    const pop = nuovo ? ' class="pop"' : "";
    switch (id) {
      case "riso": case "venere": {
        const col = id === "riso" ? "#fbf6ea" : "#6b5a7b", grano = id === "riso" ? "#e8dcc4" : "#9d8aae";
        return `<g${pop}><ellipse cx="100" cy="44" rx="78" ry="20" fill="${col}"/>${[[60, 42], [80, 36], [118, 38], [140, 46], [96, 50]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="3" ry="1.5" fill="${grano}"/>`).join("")}</g>`;
      }
      case "salmone": case "tofu": {
        const col = id === "salmone" ? "#ff9f80" : "#f3d9a0";
        return `<g${pop} stroke="${LINEA}" stroke-width="2">${[[44, 38], [56, 46], [40, 50], [62, 34]].map(([x, y]) => `<rect x="${x - 7}" y="${y - 6}" width="14" height="12" rx="3" fill="${col}"/>${id === "salmone" ? `<path d="M${x - 5} ${y - 1} L${x + 5} ${y - 3}" stroke="#fff3dc" stroke-width="2"/>` : ""}`).join("")}</g>`;
      }
      case "avocado": case "edamame": case "mango": {
        const [x, y] = POSTI_TOPPING[k % 3];
        if (id === "avocado") return `<g${pop} stroke="${LINEA}" stroke-width="2">${[-24, -8, 8, 24].map(a => `<ellipse cx="${x}" cy="${y}" rx="5" ry="13" fill="#c8e68c" transform="rotate(${a} ${x} ${y + 8})"/>`).join("")}</g>`;
        if (id === "edamame") return `<g${pop} stroke="${LINEA}" stroke-width="1.8">${[[-10, -4], [0, 2], [10, -4], [-4, 8], [8, 8]].map(([dx, dy]) => `<ellipse cx="${x + dx}" cy="${y + dy}" rx="5" ry="4" fill="#7cc576"/>`).join("")}</g>`;
        return `<g${pop} stroke="${LINEA}" stroke-width="2">${[[-9, -4], [5, -6], [-3, 6], [10, 5]].map(([dx, dy]) => `<rect x="${x + dx - 6}" y="${y + dy - 5}" width="12" height="11" rx="3" fill="#ffc94d"/>`).join("")}</g>`;
      }
      case "soia": case "piccante":
        return `<path${pop} d="M40 40 Q52 30 64 42 T88 40 T112 40 T136 42 T160 40" fill="none" stroke="${id === "soia" ? "#7a4a32" : "#ff7a7a"}" stroke-width="5" stroke-linecap="round" opacity=".9"/>`;
      default: return "";
    }
  }

  function ciotola(ingredienti, ultimo) {
    let k = 0;
    const strati = ingredienti.map(id => {
      const t = ["avocado", "edamame", "mango"].includes(id) ? k++ : 0;
      return strato(id, t, id === ultimo);
    }).join("");
    return `<svg viewBox="0 0 200 110" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse cx="100" cy="44" rx="90" ry="26" fill="#5fae8d" stroke="${LINEA}" stroke-width="3"/>
      <ellipse cx="100" cy="44" rx="82" ry="21" fill="#4f9a7b"/>
      <clipPath id="boccaCiotola"><ellipse cx="100" cy="44" rx="82" ry="22"/></clipPath>
      <g clip-path="url(#boccaCiotola)">${strati}</g>
      <path d="M10 44 Q14 104 100 104 Q186 104 190 44 Q186 70 100 70 Q14 70 10 44 Z" fill="#9fe3c8" stroke="${LINEA}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M40 84 Q100 98 160 84" fill="none" stroke="#fff3dc" stroke-width="4" stroke-linecap="round" opacity=".7"/>
    </svg>`;
  }

  // ---------- Dottoressa Gufa ----------

  function gufa() {
    return `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g stroke="${LINEA}" stroke-width="3" stroke-linejoin="round">
        <path d="M22 30 L30 6 L46 22 Z" fill="#b08968"/><path d="M98 30 L90 6 L74 22 Z" fill="#b08968"/>
        <ellipse cx="60" cy="64" rx="46" ry="46" fill="#b08968"/>
        <ellipse cx="60" cy="88" rx="26" ry="20" fill="#c9b6f2"/>
        <circle cx="40" cy="52" r="16" fill="#fff3dc"/><circle cx="80" cy="52" r="16" fill="#fff3dc"/>
      </g>
      <circle cx="40" cy="52" r="7" fill="${LINEA}"/><circle cx="80" cy="52" r="7" fill="${LINEA}"/>
      <circle cx="42" cy="49" r="2.2" fill="#fff"/><circle cx="82" cy="49" r="2.2" fill="#fff"/>
      <g fill="none" stroke="${LINEA}" stroke-width="2.5"><circle cx="40" cy="52" r="18"/><circle cx="80" cy="52" r="18"/><path d="M58 52 L62 52"/></g>
      <path d="M54 66 L66 66 L60 76 Z" fill="#ffb347" stroke="${LINEA}" stroke-width="2.5" stroke-linejoin="round"/>
    </svg>`;
  }

  return { gattino, cliente, nuvolaRabbia, moneta, ingrediente, ciotola, gufa };
})();
