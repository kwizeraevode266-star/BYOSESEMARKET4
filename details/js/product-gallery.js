function createSlidesMarkup(images, name) {
  return images.map((image, index) => `
    <figure class="gallery-slide" data-index="${index}">
      <img src="${image}" alt="${name} view ${index + 1}" draggable="false">
    </figure>
  `).join('');
}

function createThumbsMarkup(images, name) {
  return images.map((image, index) => `
    <button type="button" class="gallery-thumb${index === 0 ? ' is-active' : ''}" data-index="${index}" aria-label="Show ${name} image ${index + 1}">
      <img src="${image}" alt="${name} thumbnail ${index + 1}">
    </button>
  `).join('');
}

export function initProductGallery(options) {
  const {
    mainImage,
    gallery,
    name,
    track,
    thumbs,
    prevButton,
    nextButton,
    counter,
    zoomButton,
    lightbox,
    lightboxStage,
    lightboxPrev,
    lightboxNext,
    lightboxClose,
    viewport
  } = options;

  const images = Array.from(new Set([
    mainImage,
    ...(Array.isArray(gallery) ? gallery : [])
  ].filter(Boolean)));

  if (!Array.isArray(images) || !images.length || !track || !thumbs || !viewport) {
    return { getActiveIndex: () => 0 };
  }

  track.innerHTML = createSlidesMarkup(images, name);
  thumbs.innerHTML = createThumbsMarkup(images, name);

  let activeIndex = 0;
  let startX = 0;
  let deltaX = 0;

  const thumbButtons = Array.from(thumbs.querySelectorAll('.gallery-thumb'));

  function renderLightbox() {
    if (!lightboxStage) {
      return;
    }

    lightboxStage.innerHTML = `<img src="${images[activeIndex]}" alt="${name} preview ${activeIndex + 1}">`;
  }

  function updateGallery(nextIndex) {
    activeIndex = (nextIndex + images.length) % images.length;
    track.style.transform = `translateX(-${activeIndex * 100}%)`;
    thumbButtons.forEach((button, index) => {
      button.classList.toggle('is-active', index === activeIndex);
    });

    if (counter) {
      counter.textContent = `${activeIndex + 1} / ${images.length}`;
    }

    renderLightbox();
  }

  function openLightbox() {
    if (!lightbox) {
      return;
    }

    renderLightbox();
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!lightbox) {
      return;
    }

    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  thumbButtons.forEach(button => {
    button.addEventListener('click', () => {
      updateGallery(Number(button.dataset.index || 0));
    });
  });

  prevButton?.addEventListener('click', () => updateGallery(activeIndex - 1));
  nextButton?.addEventListener('click', () => updateGallery(activeIndex + 1));
  zoomButton?.addEventListener('click', openLightbox);
  lightboxPrev?.addEventListener('click', () => updateGallery(activeIndex - 1));
  lightboxNext?.addEventListener('click', () => updateGallery(activeIndex + 1));
  lightboxClose?.addEventListener('click', closeLightbox);
  lightbox?.addEventListener('click', event => {
    if (event.target === lightbox) {
      closeLightbox();
    }
  });

  viewport.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') {
      updateGallery(activeIndex - 1);
    }
    if (event.key === 'ArrowRight') {
      updateGallery(activeIndex + 1);
    }
    if (event.key === 'Enter') {
      openLightbox();
    }
  });

  viewport.addEventListener('pointerdown', event => {
    startX = event.clientX;
    deltaX = 0;
  });

  viewport.addEventListener('pointermove', event => {
    if (!startX) {
      return;
    }
    deltaX = event.clientX - startX;
  });

  viewport.addEventListener('pointerup', () => {
    if (Math.abs(deltaX) > 45) {
      updateGallery(activeIndex + (deltaX < 0 ? 1 : -1));
    }
    startX = 0;
    deltaX = 0;
  });

  viewport.addEventListener('dblclick', openLightbox);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeLightbox();
    }
  });

  updateGallery(0);
  return { getActiveIndex: () => activeIndex };
}
