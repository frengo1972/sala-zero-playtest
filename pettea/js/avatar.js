"use strict";

// Grafica di Pettea: immagini generate con ChatGPT (OpenAI) e tagliate con strumenti/taglia_foglio.py.
// I movimenti (arrivi, uscite, tremolii, monete) sono fatti in CSS e JavaScript.
const PetteaAvatar = (() => {
  const img = (src, cls = "") => `<img src="assets/${src}.webp" alt="" draggable="false"${cls ? ` class="${cls}"` : ""}>`;

  // ---------- Il gattino del giocatore ----------
  // posa: felice, concentrato, festeggia, sorpreso. Il pelo grigio si ricolora con un filtro CSS.
  const AGGANCI = {
    cappello: "left:30%;top:5%;width:42%",
    fiocco: "left:64%;top:13%;width:26%",
    bandana: "left:27%;top:57%;width:46%",
    occhiali: "left:23.5%;top:29.5%;width:54%"
  };

  function gattino({ filtro = "none", accessorio = "nessuno", coloreAcc = null, posa = "felice" } = {}) {
    const acc = AGGANCI[accessorio]
      ? `<img src="assets/protagonista/acc-${accessorio}.webp" alt="" draggable="false" class="accessorio" style="${AGGANCI[accessorio]}${coloreAcc ? `;filter:${coloreAcc}` : ""}">`
      : "";
    return `<div class="gattino"><img src="assets/protagonista/gattino-${posa}.webp" alt="" draggable="false" style="filter:${filtro}">${acc}</div>`;
  }

  // ---------- Clienti: animale per tipo, quattro umori ----------
  function cliente(animale, umore = "felice") {
    return img(`clienti/${animale}-${umore}`);
  }

  const nuvolaRabbia = () => img("effetti/rabbia");
  const moneta = () => img("effetti/moneta");
  const effetto = nome => img(`effetti/${nome}`);
  const ingrediente = id => img(`ingredienti/${id}`);

  // ---------- Ciotola che si compone ----------
  // Posizioni in percentuale sopra l'immagine della ciotola (apertura tra 8% e 92%, fondo verso il 50%).
  const POSTI = {
    base: "left:13%;top:28%;width:74%;height:38%",
    proteina: "left:14%;top:19%;width:36%;height:36%",
    topping: ["left:52%;top:20%;width:34%;height:34%", "left:34%;top:11%;width:32%;height:30%", "left:40%;top:35%;width:30%;height:28%"],
    salsa: "left:20%;top:18%;width:60%;height:38%"
  };

  function ciotola(ingredienti, ultimo, categoria) {
    let k = 0;
    const strati = ingredienti.map(id => {
      const cat = categoria(id);
      const posto = cat === "topping" ? POSTI.topping[k++ % 3] : POSTI[cat];
      const file = cat === "salsa" ? "strato-salsa" : `strato-${id}`;
      const tinta = id === "piccante" ? "filter:hue-rotate(-20deg) saturate(2.2) brightness(1.6)" : "";
      return `<img src="assets/ciotola/${file}.webp" alt="" draggable="false" class="strato${id === ultimo ? " pop" : ""}" style="${posto};${tinta}">`;
    }).join("");
    return `<div class="ciotola-arte">${img("ciotola/ciotola", "fondo")}${strati}</div>`;
  }

  // ---------- Dottoressa Gufa ----------
  // umore: spiega, contenta, preoccupata, applaude
  const gufa = (umore = "spiega") => img(`personaggi/gufa-${umore}`);

  return { gattino, cliente, nuvolaRabbia, moneta, effetto, ingrediente, ciotola, gufa };
})();
