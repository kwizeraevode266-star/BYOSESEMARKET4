/* ========================================
   HERO SECTION - IMAGE SLIDER/CAROUSEL
   ======================================== */

document.addEventListener('DOMContentLoaded', function() {
  initHeroSlider();
});

/**
 * HERO SLIDER IMAGES ARRAY
 * Add your hero banner images here
 */
const heroImages = [
  'img/hiro1 inketo.jpg',
  'img/hiro 2 ibikapu.jpg',
  'img/hiro 3 imyenda.jpg',
  'img/hiro  4 electronics.jpg',
  'img/hiro 5b amasaha.jpg'
];

// Slider state
let currentSlideIndex = 0;
let autoplayTimer = null;

/**
 * INITIALIZE HERO SLIDER
 */
function initHeroSlider() {
  const heroSection = document.getElementById('heroSection');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  if (!heroSection || heroImages.length === 0) {
    console.warn('Hero section or images not found');
    return;
  }

  // Set initial background image
  updateHeroBackground(0);

  // Navigation button listeners
  if (prevBtn) {
    prevBtn.addEventListener('click', goToPreviousSlide);
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', goToNextSlide);
  }

  // Start auto-rotation
  startAutoplay();

  // Pause autoplay on hover
  heroSection.addEventListener('mouseenter', stopAutoplay);
  heroSection.addEventListener('mouseleave', startAutoplay);

  // Touch support for mobile
  let touchStartX = 0;
  heroSection.addEventListener('touchstart', (e) => {
    stopAutoplay();
    touchStartX = e.touches[0].clientX;
  });

  heroSection.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    if (touchStartX - touchEndX > 50) {
      goToNextSlide(); // Swipe left
    } else if (touchEndX - touchStartX > 50) {
      goToPreviousSlide(); // Swipe right
    }
    startAutoplay();
  });
}

/**
 * UPDATE HERO BACKGROUND IMAGE
 */
function updateHeroBackground(index) {
  const heroSection = document.getElementById('heroSection');
  if (!heroSection || !heroImages[index]) return;

  const imageUrl = heroImages[index];
  heroSection.style.backgroundImage = `url('${imageUrl}')`;
  currentSlideIndex = index;
}

/**
 * GO TO NEXT SLIDE
 */
function goToNextSlide() {
  stopAutoplay();
  const nextIndex = (currentSlideIndex + 1) % heroImages.length;
  updateHeroBackground(nextIndex);
  startAutoplay();
}

/**
 * GO TO PREVIOUS SLIDE
 */
function goToPreviousSlide() {
  stopAutoplay();
  const prevIndex = (currentSlideIndex - 1 + heroImages.length) % heroImages.length;
  updateHeroBackground(prevIndex);
  startAutoplay();
}

/**
 * START AUTOPLAY - CHANGE IMAGE EVERY 3 SECONDS
 */
function startAutoplay() {
  // Clear existing timer
  if (autoplayTimer) {
    clearInterval(autoplayTimer);
  }

  // Set new timer - change image every 3 seconds
  autoplayTimer = setInterval(() => {
    goToNextSlide();
  }, 3000);
}

/**
 * STOP AUTOPLAY
 */
function stopAutoplay() {
  if (autoplayTimer) {
    clearInterval(autoplayTimer);
    autoplayTimer = null;
  }
}
