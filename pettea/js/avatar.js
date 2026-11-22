"use strict";

// Segnaposti in SVG: animaletti disegnati via codice, finché non arriva la grafica definitiva.
const PetteaAvatar = (() => {
  const LINEA = "#5a3d3d";
  const GUANCE = "#ff9fb0";

  function scurisci(hex, f = 0.82) {
    const n = parseInt(hex.slice(1), 16);
    const c = [n >> 16, n >> 8 & 255, n & 255].map(v => Math.round(v * f));
    return `rgb(${c.join(",")})`;
  }

  function occhi(chiaro) {
    const iride = chiaro ? LINEA : "#2b2230";
    const bianco = chiaro ? "" : `<ellipse cx="40" cy="55" rx="9.5" ry="11" fill="#fff"/><ellipse cx="80" cy="55" rx="9.5" ry="11" fill="#fff"/>`;
    return `${bianco}<ellipse cx="40" cy="55" rx="6.5" ry="8" fill="${iride}"/><ellipse cx="80" cy="55" rx="6.5" ry="8" fill="${iride}"/>
      <circle cx="42.5" cy="51.5" r="2.6" fill="#fff"/><circle cx="82.5" cy="51.5" r="2.6" fill="#fff"/>
      <ellipse cx="30" cy="68" rx="7" ry="4" fill="${GUANCE}" opacity=".75"/><ellipse cx="90" cy="68" rx="7" ry="4" fill="${GUANCE}" opacity=".75"/>`;
  }

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

  // Il gattino del giocatore: pelo, accessorio e colore dell'accessorio
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

  // Clienti: un animaletto per tipo
  const CLIENTI = {
    criceto: { pelo: "#f2c98f", pancia: "#fff3dc", orecchie: "tonde" },
    cagnolino: { pelo: "#d9a77a", pancia: "#fff3dc", orecchie: "pendenti" },
    ochetta: { pelo: "#ffffff", pancia: "#ffffff", orecchie: "becco" },
    panda: { pelo: "#e07a4a", pancia: "#fff3dc", orecchie: "panda" }
  };

  function cliente(animale, umore = "felice") {
    const c = CLIENTI[animale];
    let orecchie = "", muso = "";
    if (c.orecchie === "tonde") orecchie = `<circle cx="28" cy="22" r="13" fill="${c.pelo}"/><circle cx="92" cy="22" r="13" fill="${c.pelo}"/>`;
    if (c.orecchie === "pendenti") orecchie = `<ellipse cx="18" cy="48" rx="12" ry="24" fill="${scurisci(c.pelo, 0.75)}" transform="rotate(18 18 48)"/><ellipse cx="102" cy="48" rx="12" ry="24" fill="${scurisci(c.pelo, 0.75)}" transform="rotate(-18 102 48)"/>`;
    if (c.orecchie === "panda") orecchie = `<path d="M18 36 L22 6 L46 22 Z" fill="${c.pelo}"/><path d="M102 36 L98 6 L74 22 Z" fill="${c.pelo}"/>`;
    if (c.orecchie === "becco") muso = `<path d="M48 70 Q60 62 72 70 Q60 82 48 70 Z" fill="#ffb347" stroke="${LINEA}" stroke-width="2.5" stroke-linejoin="round"/>`;
    else muso = `<ellipse cx="60" cy="72" rx="14" ry="10" fill="${c.pancia}"/><path d="M57 67 L63 67 L60 70 Z" fill="${LINEA}"/>
      <path d="M${umore === "triste" ? "54 78 Q60 74 66 78" : "54 75 Q60 80 66 75"}" fill="none" stroke="${LINEA}" stroke-width="2.5" stroke-linecap="round"/>`;
    const panda = animale === "panda" ? `<ellipse cx="38" cy="56" rx="11" ry="13" fill="#fff3dc"/><ellipse cx="82" cy="56" rx="11" ry="13" fill="#fff3dc"/>` : "";
    return `<svg viewBox="0 -4 120 112" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g stroke="${LINEA}" stroke-width="3" stroke-linejoin="round">${orecchie}
        <ellipse cx="60" cy="58" rx="46" ry="42" fill="${c.pelo}"/></g>
      ${panda}${occhi(true)}${muso}
    </svg>`;
  }

  function gufa() {
    return `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g stroke="${LINEA}" stroke-width="3" stroke-linejoin="round">
        <path d="M22 30 L30 6 L46 22 Z" fill="#b08968"/><path d="M98 30 L90 6 L74 22 Z" fill="#b08968"/>
        <ellipse cx="60" cy="64" rx="46" ry="46" fill="#b08968"/>
        <ellipse cx="60" cy="88" rx="26" ry="20" fill="#c9b6f2"/>
        <circle cx="40" cy="52" r="16" fill="#fff3dc"/><circle cx="80" cy="52" r="16" fill="#fff3dc"/>
        <path d="M56 26 L40 22" fill="none"/>
      </g>
      <circle cx="40" cy="52" r="7" fill="${LINEA}"/><circle cx="80" cy="52" r="7" fill="${LINEA}"/>
      <circle cx="42" cy="49" r="2.2" fill="#fff"/><circle cx="82" cy="49" r="2.2" fill="#fff"/>
      <g fill="none" stroke="${LINEA}" stroke-width="2.5"><circle cx="40" cy="52" r="18"/><circle cx="80" cy="52" r="18"/><path d="M58 52 L62 52"/></g>
      <path d="M54 66 L66 66 L60 76 Z" fill="#ffb347" stroke="${LINEA}" stroke-width="2.5" stroke-linejoin="round"/>
    </svg>`;
  }

  return { gattino, cliente, gufa };
})();
