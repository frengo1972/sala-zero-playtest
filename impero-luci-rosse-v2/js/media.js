"use strict";

const ImperoMedia = (() => {
  const images = new Map();
  const path = (folder, file) => `assets/${folder}/${file}.webp`;

  function load(src) {
    if (!images.has(src)) {
      const image = new Image();
      image.decoding = "async";
      image.src = src;
      images.set(src, image);
    }
    return images.get(src);
  }

  function castNumber(talent) {
    const id = Number(talent.id.slice(1)) - 1;
    return (talent.f ? 0 : 8) + (id % 8) + 1;
  }

  function drawCover(context, image, width, height) {
    const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
    const imageWidth = image.naturalWidth * scale;
    const imageHeight = image.naturalHeight * scale;
    context.drawImage(image, (width - imageWidth) / 2, (height - imageHeight) / 2, imageWidth, imageHeight);
  }

  return {
    load,
    portrait: talent => path("cast", castNumber(talent)),
    fullPortrait: talent => path("cast", `figura-${castNumber(talent)}`),
    drawCover,
    setPhoto: id => path("set", id),
    film: id => path("film", id),
    event: id => path("eventi", id),
  };
})();
