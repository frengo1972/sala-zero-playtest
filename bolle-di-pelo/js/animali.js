// Bolle di Pelo — musetti kawaii segnaposto in SVG, disegnati via codice.
(function (radice) {
  const LINEA = "#5a3d3d";

  function scurisci(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    const c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.max(0, Math.min(255, Math.round(v * f))));
    return "#" + c.map(v => v.toString(16).padStart(2, "0")).join("");
  }

  function orecchie(z) {
    const c = z.colore, d = scurisci(z.colore, 0.82), rosa = "#ffb3c1";
    switch (z.orecchie) {
      case "punta":
        return `<path d="M22 40 L26 8 L46 30 Z" fill="${c}" stroke="${LINEA}" stroke-width="3" stroke-linejoin="round"/>
                <path d="M78 40 L74 8 L54 30 Z" fill="${c}" stroke="${LINEA}" stroke-width="3" stroke-linejoin="round"/>
                <path d="M28 34 L30 16 L41 29 Z" fill="${rosa}"/><path d="M72 34 L70 16 L59 29 Z" fill="${rosa}"/>`;
      case "gatto":
        return `<path d="M20 44 L22 12 L44 30 Z" fill="${c}" stroke="${LINEA}" stroke-width="3" stroke-linejoin="round"/>
                <path d="M80 44 L78 12 L56 30 Z" fill="${c}" stroke="${LINEA}" stroke-width="3" stroke-linejoin="round"/>
                <path d="M26 36 L27 20 L38 30 Z" fill="${z.maschera ? z.macchia : rosa}"/><path d="M74 36 L73 20 L62 30 Z" fill="${z.maschera ? z.macchia : rosa}"/>`;
      case "coniglio-su":
        return `<ellipse cx="36" cy="16" rx="9" ry="22" fill="${c}" stroke="${LINEA}" stroke-width="3"/>
                <ellipse cx="64" cy="16" rx="9" ry="22" fill="${c}" stroke="${LINEA}" stroke-width="3"/>
                <ellipse cx="36" cy="18" rx="4" ry="15" fill="${rosa}"/><ellipse cx="64" cy="18" rx="4" ry="15" fill="${rosa}"/>`;
      case "coniglio-giu":
        return `<ellipse cx="16" cy="58" rx="10" ry="24" fill="${d}" stroke="${LINEA}" stroke-width="3" transform="rotate(14 16 58)"/>
                <ellipse cx="84" cy="58" rx="10" ry="24" fill="${d}" stroke="${LINEA}" stroke-width="3" transform="rotate(-14 84 58)"/>`;
      default: // cadenti
        return `<ellipse cx="18" cy="50" rx="11" ry="22" fill="${d}" stroke="${LINEA}" stroke-width="3" transform="rotate(18 18 50)"/>
                <ellipse cx="82" cy="50" rx="11" ry="22" fill="${d}" stroke="${LINEA}" stroke-width="3" transform="rotate(-18 82 50)"/>`;
    }
  }

  function occhi(umore) {
    if (umore === "felice") {
      return `<path d="M33 54 q5 -7 10 0" fill="none" stroke="${LINEA}" stroke-width="3.5" stroke-linecap="round"/>
              <path d="M57 54 q5 -7 10 0" fill="none" stroke="${LINEA}" stroke-width="3.5" stroke-linecap="round"/>`;
    }
    const p = umore === "triste" ? 4.5 : 6;
    let s = `<ellipse cx="38" cy="54" rx="${p}" ry="${p + 1}" fill="${LINEA}"/><ellipse cx="62" cy="54" rx="${p}" ry="${p + 1}" fill="${LINEA}"/>
             <circle cx="40" cy="51" r="2" fill="#fff"/><circle cx="64" cy="51" r="2" fill="#fff"/>`;
    if (umore === "triste") s += `<path d="M30 45 l10 3 M70 45 l-10 3" stroke="${LINEA}" stroke-width="2.5" stroke-linecap="round"/><path d="M33 62 q-2 5 0 7 q2 -2 0 -7z" fill="#8fd0ff"/>`;
    return s;
  }

  function bocca(umore) {
    if (umore === "triste") return `<path d="M44 74 q6 -5 12 0" fill="none" stroke="${LINEA}" stroke-width="2.5" stroke-linecap="round"/>`;
    return `<path d="M43 69 q3.5 4 7 0 q3.5 4 7 0" fill="none" stroke="${LINEA}" stroke-width="2.5" stroke-linecap="round"/>`;
  }

  function svgAnimale(z, umore) {
    umore = umore || "normale";
    const c = z.colore;
    let s = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${z.nome}">`;
    s += orecchie(z);
    if (z.soffice) {
      for (let i = 0; i < 10; i++) {
        const a = Math.PI * (0.15 + i * 0.077) * 2 - Math.PI / 2;
        s += `<circle cx="${(50 + Math.cos(a) * 33).toFixed(1)}" cy="${(58 + Math.sin(a) * 30).toFixed(1)}" r="9" fill="${c}" stroke="${LINEA}" stroke-width="3"/>`;
      }
    }
    s += `<ellipse cx="50" cy="58" rx="34" ry="31" fill="${c}" stroke="${LINEA}" stroke-width="3"/>`;
    if (z.soffice) s += `<ellipse cx="50" cy="58" rx="34" ry="31" fill="${c}"/>`;
    if (z.maschera) s += `<ellipse cx="50" cy="64" rx="20" ry="17" fill="${z.macchia}" opacity=".75"/>`;
    else if (z.specie === "cane") s += `<ellipse cx="50" cy="68" rx="15" ry="11" fill="${z.macchia}"/>`;
    else if (z.specie === "coniglio") s += `<ellipse cx="50" cy="68" rx="12" ry="9" fill="${z.macchia}"/>`;
    if (z.strisce) s += `<path d="M42 30 l2 8 M50 28 v9 M58 30 l-2 8" stroke="${scurisci(c, 0.6)}" stroke-width="3" stroke-linecap="round"/>`;
    if (z.id === "beagle" || z.id === "husky") s += `<path d="M50 30 q-6 14 -2 24 h4 q4 -10 -2 -24z" fill="${z.macchia}"/>`;
    if (z.id === "barboncino" || z.id === "testadileone") s += `<circle cx="42" cy="26" r="9" fill="${c}" stroke="${LINEA}" stroke-width="3"/><circle cx="58" cy="26" r="9" fill="${c}" stroke="${LINEA}" stroke-width="3"/><circle cx="50" cy="22" r="9" fill="${c}" stroke="${LINEA}" stroke-width="3"/><rect x="36" y="26" width="28" height="8" fill="${c}"/>`;
    s += `<ellipse cx="28" cy="66" rx="6" ry="4" fill="#ff9fb2" opacity=".7"/><ellipse cx="72" cy="66" rx="6" ry="4" fill="#ff9fb2" opacity=".7"/>`;
    s += occhi(umore);
    s += z.specie === "cane" ? `<ellipse cx="50" cy="64" rx="5.5" ry="4" fill="${LINEA}"/>` : `<path d="M46.5 62 h7 l-3.5 4z" fill="#ff7f9a" stroke="${LINEA}" stroke-width="1.5" stroke-linejoin="round"/>`;
    s += bocca(umore);
    if (z.specie === "gatto") s += `<path d="M18 64 h14 M18 70 l14 -3 M82 64 h-14 M82 70 l-14 -3" stroke="${LINEA}" stroke-width="1.5" stroke-linecap="round"/>`;
    if (z.specie === "coniglio") s += `<rect x="47" y="71" width="6" height="5" rx="1" fill="#fff" stroke="${LINEA}" stroke-width="1.5"/>`;
    if (umore === "felice") s += `<path d="M78 22 l2 5 l5 1 l-5 2 l-2 5 l-2 -5 l-5 -2 l5 -1z" fill="#ffd36e"/>`;
    s += `</svg>`;
    return s;
  }

  const API = { svgAnimale };
  radice.BDP_ANIMALI = API;
})(this);
