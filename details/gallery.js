function uniqueImages(mainImage, gallery) {
  return Array.from(new Set([
    mainImage,
    ...(Array.isArray(gallery) ? gallery : [])
  ].filter(Boolean)));
}

function wrapIndex(index, length) {
  if (!length) {
    return 0;
  }

  return (index + length) % length;
}

function buildMainSlides(images, name) {
  return images.map((image, index) => `
    <div class="gallery-slide" data-index="${index}" aria-hidden="${index === 0 ? 'false' : 'true'}">
      <button type="button" class="gallery-slide__button" data-gallery-open="${index}" aria-label="Open ${name} image ${index + 1} fullscreen">
        <div class="gallery-slide__media">
          <img
            src="${image}"
            alt="${name} image ${index + 1}"
            draggable="false"
            loading="${index === 0 ? 'eager' : 'lazy'}"
            decoding="async"
            ${index === 0 ? 'fetchpriority="high"' : ''}
          >
        </div>
      </button>
    </div>
  `).join('');
}

function buildThumbs(images, name) {
  return images.map((image, index) => `
    <button
      type="button"
      class="gallery-thumb${index === 0 ? ' is-active' : ''}"
      data-index="${index}"
      aria-label="Show ${name} image ${index + 1}"
      aria-pressed="${index === 0 ? 'true' : 'false'}"
    >
      <img src="${image}" alt="${name} thumbnail ${index + 1}" loading="lazy" decoding="async">
    </button>
  `).join('');
}

function buildLightboxSlides(images, name) {
  return `
    <div class="lightbox-viewport" id="lightboxViewport">
      <div class="lightbox-track" id="lightboxTrack">
        ${images.map((image, index) => `
          <div class="lightbox-slide" data-index="${index}" aria-hidden="${index === 0 ? 'false' : 'true'}">
            <button type="button" class="lightbox-slide__button" data-lightbox-zoom="${index}" aria-label="Tap to zoom ${name} image ${index + 1}">
              <div class="lightbox-slide__media">
                <img src="${image}" alt="${name} fullscreen image ${index + 1}" loading="${index === 0 ? 'eager' : 'lazy'}" decoding="async" draggable="false">
              </div>
            </button>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function createSlider({ viewport, track, getCount, getIndex, onCommit, getLocked }) {
  let pointerId = null;
  let startX = 0;
  let deltaX = 0;
  let dragging = false;
  let clickBlocked = false;
  let frameId = 0;

  function getWidth() {
    return viewport?.clientWidth || 1;
  }

  function setTranslate(value, animate) {
    if (!track) {
      return;
    }

    track.style.transition = animate ? 'transform 460ms cubic-bezier(0.22, 1, 0.36, 1)' : 'none';
    track.style.transform = `translate3d(${value}px, 0, 0)`;
  }

  function renderDrag() {
    frameId = 0;
    const width = getWidth();
    const count = getCount();
    const index = getIndex();
    const minTranslate = -(Math.max(count - 1, 0) * width);
    let nextTranslate = -(index * width) + deltaX;

    if (nextTranslate > 0) {
      nextTranslate *= 0.35;
    }

    if (nextTranslate < minTranslate) {
      nextTranslate = minTranslate + (nextTranslate - minTranslate) * 0.35;
    }

    setTranslate(nextTranslate, false);
  }

  function commit(delta) {
    const width = getWidth();
    const threshold = Math.max(48, Math.min(120, width * 0.16));

    if (Math.abs(delta) > threshold) {
      onCommit(delta < 0 ? 1 : -1);
      return;
    }

    onCommit(0);
  }

  function onPointerDown(event) {
    if (!viewport || !track || getCount() < 2 || getLocked() || (event.pointerType === 'mouse' && event.button !== 0)) {
      return;
    }

    pointerId = event.pointerId;
    startX = event.clientX;
    deltaX = 0;
    dragging = true;
    clickBlocked = false;
    viewport.classList.add('is-dragging');
    viewport.setPointerCapture(pointerId);
    setTranslate(-(getIndex() * getWidth()), false);
  }

  function onPointerMove(event) {
    if (!dragging || event.pointerId !== pointerId) {
      return;
    }

    deltaX = event.clientX - startX;
    if (Math.abs(deltaX) > 8) {
      clickBlocked = true;
    }

    if (!frameId) {
      frameId = window.requestAnimationFrame(renderDrag);
    }
  }

  function releasePointer(event) {
    if (!dragging || (event && event.pointerId !== pointerId)) {
      return;
    }

    dragging = false;
    viewport?.classList.remove('is-dragging');
    if (viewport?.hasPointerCapture(pointerId)) {
      viewport.releasePointerCapture(pointerId);
    }
    if (frameId) {
      window.cancelAnimationFrame(frameId);
      frameId = 0;
    }

    commit(deltaX);
    pointerId = null;
    startX = 0;
    deltaX = 0;
    window.setTimeout(() => {
      clickBlocked = false;
    }, 0);
  }

  viewport?.addEventListener('pointerdown', onPointerDown);
  viewport?.addEventListener('pointermove', onPointerMove);
  viewport?.addEventListener('pointerup', releasePointer);
  viewport?.addEventListener('pointercancel', releasePointer);
  viewport?.addEventListener('pointerleave', event => {
    if (event.pointerType !== 'mouse') {
      return;
    }

    releasePointer(event);
  });

  return {
    snap(animate = true) {
      setTranslate(-(getIndex() * getWidth()), animate);
    },
    shouldBlockClick() {
      return clickBlocked;
    },
    destroy() {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
    }
  };
}

export function initProductGallery(options) {
  const {
    mainImage,
    gallery,
    name,
    root,
    track,
    thumbs,
    prevButton,
    nextButton,
    counter,
    zoomButton,
    lightbox,
    lightboxStage,
    lightboxCounter,
    lightboxPrev,
    lightboxNext,
    lightboxClose,
    viewport
  } = options;

  const images = uniqueImages(mainImage, gallery);
  if (!track || !thumbs || !viewport || !lightbox || !lightboxStage || !images.length) {
    return { getActiveIndex: () => 0 };
  }

  track.innerHTML = buildMainSlides(images, name);
  thumbs.innerHTML = buildThumbs(images, name);
  lightboxStage.innerHTML = buildLightboxSlides(images, name);

  const thumbButtons = Array.from(thumbs.querySelectorAll('.gallery-thumb'));
  const mainSlides = Array.from(track.children);
  const lightboxViewport = lightboxStage.querySelector('#lightboxViewport');
  const lightboxTrack = lightboxStage.querySelector('#lightboxTrack');
  const lightboxSlides = Array.from(lightboxTrack?.children || []);

  let activeIndex = 0;
  let isLightboxOpen = false;
  let zoomedIndex = null;

  function syncCounters() {
    const label = `${activeIndex + 1} / ${images.length}`;
    if (counter) {
      counter.textContent = label;
    }
    if (lightboxCounter) {
      lightboxCounter.textContent = label;
    }
  }

  function syncSlides() {
    mainSlides.forEach((slide, index) => {
      slide.setAttribute('aria-hidden', String(index !== activeIndex));
    });
    lightboxSlides.forEach((slide, index) => {
      slide.setAttribute('aria-hidden', String(index !== activeIndex));
      slide.classList.toggle('is-zoomed', index === zoomedIndex);
    });
  }

  function syncThumbs() {
    thumbButtons.forEach((button, index) => {
      const isActive = index === activeIndex;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });
  }

  function resetZoom() {
    zoomedIndex = null;
    lightboxSlides.forEach(slide => {
      slide.classList.remove('is-zoomed');
      const image = slide.querySelector('img');
      if (image) {
        image.style.transform = 'scale(1)';
        image.style.transformOrigin = 'center center';
      }
    });
  }

  function preloadNearby() {
    [activeIndex - 1, activeIndex, activeIndex + 1].forEach(index => {
      const safeIndex = wrapIndex(index, images.length);
      const image = new Image();
      image.src = images[safeIndex];
    });
  }

  function updateNavigationVisibility() {
    const hidden = images.length < 2;
    prevButton?.toggleAttribute('hidden', hidden);
    nextButton?.toggleAttribute('hidden', hidden);
    lightboxPrev?.toggleAttribute('hidden', hidden);
    lightboxNext?.toggleAttribute('hidden', hidden);
  }

  function setActiveIndex(index, options = {}) {
    const nextIndex = wrapIndex(index, images.length);
    const { immediate = false } = options;

    activeIndex = nextIndex;
    if (isLightboxOpen === false) {
      resetZoom();
    }

    mainSlider.snap(!immediate);
    lightboxSlider.snap(!immediate);
    syncCounters();
    syncSlides();
    syncThumbs();
    preloadNearby();
  }

  function openLightbox(index = activeIndex) {
    activeIndex = wrapIndex(index, images.length);
    isLightboxOpen = true;
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    resetZoom();
    setActiveIndex(activeIndex, { immediate: true });
    lightboxClose?.focus();
  }

  function closeLightbox() {
    isLightboxOpen = false;
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    resetZoom();
    viewport.focus();
  }

  function toggleZoom(index, event) {
    if (!isLightboxOpen || index !== activeIndex) {
      return;
    }

    const slide = lightboxSlides[index];
    const image = slide?.querySelector('img');
    if (!slide || !image) {
      return;
    }

    if (zoomedIndex === index) {
      resetZoom();
      syncSlides();
      return;
    }

    const rect = image.getBoundingClientRect();
    const originX = ((event.clientX - rect.left) / rect.width) * 100;
    const originY = ((event.clientY - rect.top) / rect.height) * 100;
    resetZoom();
    zoomedIndex = index;
    slide.classList.add('is-zoomed');
    image.style.transformOrigin = `${originX}% ${originY}%`;
    image.style.transform = 'scale(2.1)';
    syncSlides();
  }

  const mainSlider = createSlider({
    viewport,
    track,
    getCount: () => images.length,
    getIndex: () => activeIndex,
    onCommit: direction => setActiveIndex(activeIndex + direction),
    getLocked: () => false
  });

  const lightboxSlider = createSlider({
    viewport: lightboxViewport,
    track: lightboxTrack,
    getCount: () => images.length,
    getIndex: () => activeIndex,
    onCommit: direction => {
      resetZoom();
      setActiveIndex(activeIndex + direction);
    },
    getLocked: () => zoomedIndex !== null
  });

  thumbs.addEventListener('click', event => {
    const button = event.target.closest('.gallery-thumb');
    if (!button) {
      return;
    }

    setActiveIndex(Number(button.dataset.index || 0));
  });

  track.addEventListener('click', event => {
    const trigger = event.target.closest('[data-gallery-open]');
    if (!trigger || mainSlider.shouldBlockClick()) {
      return;
    }

    openLightbox(Number(trigger.dataset.galleryOpen || activeIndex));
  });

  lightboxStage.addEventListener('click', event => {
    const trigger = event.target.closest('[data-lightbox-zoom]');
    if (!trigger || lightboxSlider.shouldBlockClick()) {
      return;
    }

    toggleZoom(Number(trigger.dataset.lightboxZoom || activeIndex), event);
  });

  prevButton?.addEventListener('click', () => setActiveIndex(activeIndex - 1));
  nextButton?.addEventListener('click', () => setActiveIndex(activeIndex + 1));
  zoomButton?.addEventListener('click', () => openLightbox(activeIndex));
  lightboxPrev?.addEventListener('click', () => {
    resetZoom();
    setActiveIndex(activeIndex - 1);
  });
  lightboxNext?.addEventListener('click', () => {
    resetZoom();
    setActiveIndex(activeIndex + 1);
  });
  lightboxClose?.addEventListener('click', closeLightbox);

  lightbox.addEventListener('click', event => {
    if (event.target === lightbox) {
      closeLightbox();
    }
  });

  viewport.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      setActiveIndex(activeIndex - 1);
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      setActiveIndex(activeIndex + 1);
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openLightbox(activeIndex);
    }
  });

  const onKeyDown = event => {
    if (event.key === 'Escape' && isLightboxOpen) {
      closeLightbox();
      return;
    }

    if (!isLightboxOpen) {
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      resetZoom();
      setActiveIndex(activeIndex - 1);
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      resetZoom();
      setActiveIndex(activeIndex + 1);
    }
  };

  document.addEventListener('keydown', onKeyDown);

  const onResize = () => {
    mainSlider.snap(false);
    lightboxSlider.snap(false);
  };

  window.addEventListener('resize', onResize, { passive: true });

  root?.style.setProperty('--gallery-image-count', String(images.length));
  updateNavigationVisibility();
  setActiveIndex(0, { immediate: true });

  return {
    getActiveIndex: () => activeIndex,
    destroy() {
      window.removeEventListener('resize', onResize);
      document.removeEventListener('keydown', onKeyDown);
      mainSlider.destroy();
      lightboxSlider.destroy();
    }
  };
}