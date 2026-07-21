/* ==========================================================================
   AE PROPERTY MANAGEMENT & CONSULT
   Archivo: js/main.js

   Funcionalidades:
   - Activación general de JavaScript.
   - Header con cambio de estilo al hacer scroll.
   - Menú responsive.
   - Carrusel automático y manual.
   - Navegación mediante teclado.
   - Deslizamiento táctil.
   - Pausa del carrusel al interactuar.
   - Respeto por prefers-reduced-motion.
   - Año automático del footer.
   - Validación provisional del formulario.
   ========================================================================== */

"use strict";


/* ==========================================================================
   INICIALIZACIÓN
   ========================================================================== */

document.documentElement.classList.remove("no-js");
document.documentElement.classList.add("js");

document.addEventListener("DOMContentLoaded", () => {
  initializeHeader();
  initializeMobileNavigation();
  initializeCarousels();
  initializeContactForms();
  updateCurrentYear();
});


/* ==========================================================================
   HEADER AL HACER SCROLL
   ========================================================================== */

function initializeHeader() {
  const header = document.querySelector("[data-site-header]");

  if (!header) {
    return;
  }

  const scrollLimit = 24;

  const updateHeaderState = () => {
    const hasScrolled = window.scrollY > scrollLimit;

    header.classList.toggle("is-scrolled", hasScrolled);
  };

  updateHeaderState();

  window.addEventListener("scroll", updateHeaderState, {
    passive: true
  });
}


/* ==========================================================================
   MENÚ RESPONSIVE
   ========================================================================== */

function initializeMobileNavigation() {
  const navigationToggle = document.querySelector("[data-nav-toggle]");
  const navigation = document.querySelector("[data-site-nav]");

  if (!navigationToggle || !navigation) {
    return;
  }

  const navigationLinks = navigation.querySelectorAll("a");
  const desktopBreakpoint = 1024;

  function openNavigation() {
    navigationToggle.setAttribute("aria-expanded", "true");
    navigation.classList.add("is-open");
    document.body.classList.add("nav-open");
  }

  function closeNavigation({ returnFocus = false } = {}) {
    navigationToggle.setAttribute("aria-expanded", "false");
    navigation.classList.remove("is-open");
    document.body.classList.remove("nav-open");

    if (returnFocus) {
      navigationToggle.focus();
    }
  }

  function toggleNavigation() {
    const isOpen =
      navigationToggle.getAttribute("aria-expanded") === "true";

    if (isOpen) {
      closeNavigation();
    } else {
      openNavigation();
    }
  }

  navigationToggle.addEventListener("click", toggleNavigation);

  navigationLinks.forEach((link) => {
    link.addEventListener("click", () => {
      closeNavigation();
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      return;
    }

    const isOpen =
      navigationToggle.getAttribute("aria-expanded") === "true";

    if (isOpen) {
      closeNavigation({
        returnFocus: true
      });
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth >= desktopBreakpoint) {
      closeNavigation();
    }
  });
}


/* ==========================================================================
   CARRUSEL ACCESIBLE
   ========================================================================== */

class AccessibleCarousel {
  constructor(carouselElement) {
    this.carousel = carouselElement;

    this.slides = Array.from(
      carouselElement.querySelectorAll("[data-carousel-slide]")
    );

    this.previousButton = carouselElement.querySelector(
      "[data-carousel-prev]"
    );

    this.nextButton = carouselElement.querySelector(
      "[data-carousel-next]"
    );

    this.indicators = Array.from(
      carouselElement.querySelectorAll("[data-carousel-indicator]")
    );

    this.currentIndex = 0;

    this.autoplayDelay =
      Number(carouselElement.dataset.autoplayDelay) || 6000;

    this.timer = null;

    this.isPointerInside = false;
    this.isFocusInside = false;

    this.touchStartX = 0;
    this.touchEndX = 0;

    this.minimumSwipeDistance = 45;

    this.reducedMotionMediaQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    this.reducedMotion = this.reducedMotionMediaQuery.matches;

    this.initialize();
  }


  /* ------------------------------------------------------------------------
     Inicialización
     ------------------------------------------------------------------------ */

  initialize() {
    if (this.slides.length === 0) {
      return;
    }

    this.prepareSlides();
    this.bindEvents();
    this.showSlide(0, {
      announce: false,
      restartAutoplay: false
    });

    if (this.slides.length > 1) {
      this.startAutoplay();
    } else {
      this.hideUnnecessaryControls();
    }
  }


  /* ------------------------------------------------------------------------
     Configuración inicial de diapositivas
     ------------------------------------------------------------------------ */

  prepareSlides() {
    this.slides.forEach((slide, index) => {
      const isActive = index === 0;

      slide.classList.toggle("is-active", isActive);
      slide.setAttribute("aria-hidden", String(!isActive));
    });

    this.indicators.forEach((indicator, index) => {
      const isActive = index === 0;

      indicator.classList.toggle("is-active", isActive);
      indicator.setAttribute(
        "aria-current",
        isActive ? "true" : "false"
      );
    });
  }


  /* ------------------------------------------------------------------------
     Eventos
     ------------------------------------------------------------------------ */

  bindEvents() {
    this.previousButton?.addEventListener("click", () => {
      this.showPreviousSlide();
    });

    this.nextButton?.addEventListener("click", () => {
      this.showNextSlide();
    });

    this.indicators.forEach((indicator, index) => {
      indicator.addEventListener("click", () => {
        this.showSlide(index);
      });
    });

    this.carousel.addEventListener("mouseenter", () => {
      this.isPointerInside = true;
      this.stopAutoplay();
    });

    this.carousel.addEventListener("mouseleave", () => {
      this.isPointerInside = false;
      this.startAutoplay();
    });

    this.carousel.addEventListener("focusin", () => {
      this.isFocusInside = true;
      this.stopAutoplay();
    });

    this.carousel.addEventListener("focusout", (event) => {
      const newFocusedElement = event.relatedTarget;

      if (!this.carousel.contains(newFocusedElement)) {
        this.isFocusInside = false;
        this.startAutoplay();
      }
    });

    this.carousel.addEventListener("keydown", (event) => {
      this.handleKeyboardNavigation(event);
    });

    this.carousel.addEventListener(
      "touchstart",
      (event) => {
        this.touchStartX = event.changedTouches[0].screenX;
      },
      {
        passive: true
      }
    );

    this.carousel.addEventListener(
      "touchend",
      (event) => {
        this.touchEndX = event.changedTouches[0].screenX;
        this.handleSwipe();
      },
      {
        passive: true
      }
    );

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.stopAutoplay();
      } else {
        this.startAutoplay();
      }
    });

    this.reducedMotionMediaQuery.addEventListener?.(
      "change",
      (event) => {
        this.reducedMotion = event.matches;

        if (this.reducedMotion) {
          this.stopAutoplay();
        } else {
          this.startAutoplay();
        }
      }
    );
  }


  /* ------------------------------------------------------------------------
     Mostrar una diapositiva
     ------------------------------------------------------------------------ */

  showSlide(
    index,
    {
      announce = true,
      restartAutoplay = true
    } = {}
  ) {
    if (this.slides.length === 0) {
      return;
    }

    const normalizedIndex =
      (index + this.slides.length) % this.slides.length;

    this.slides.forEach((slide, slideIndex) => {
      const isActive = slideIndex === normalizedIndex;

      slide.classList.toggle("is-active", isActive);
      slide.setAttribute("aria-hidden", String(!isActive));
    });

    this.indicators.forEach((indicator, indicatorIndex) => {
      const isActive = indicatorIndex === normalizedIndex;

      indicator.classList.toggle("is-active", isActive);

      indicator.setAttribute(
        "aria-current",
        isActive ? "true" : "false"
      );
    });

    this.currentIndex = normalizedIndex;

    if (announce) {
      this.updateAccessibleLabel();
    }

    if (restartAutoplay) {
      this.restartAutoplay();
    }
  }


  /* ------------------------------------------------------------------------
     Diapositiva siguiente
     ------------------------------------------------------------------------ */

  showNextSlide() {
    this.showSlide(this.currentIndex + 1);
  }


  /* ------------------------------------------------------------------------
     Diapositiva anterior
     ------------------------------------------------------------------------ */

  showPreviousSlide() {
    this.showSlide(this.currentIndex - 1);
  }


  /* ------------------------------------------------------------------------
     Etiqueta accesible
     ------------------------------------------------------------------------ */

  updateAccessibleLabel() {
    const carouselName =
      this.carousel.dataset.label || "Carrusel";

    const currentPosition = this.currentIndex + 1;
    const totalSlides = this.slides.length;

    this.carousel.setAttribute(
      "aria-label",
      `${carouselName}: ${currentPosition} de ${totalSlides}`
    );
  }


  /* ------------------------------------------------------------------------
     Teclado
     ------------------------------------------------------------------------ */

  handleKeyboardNavigation(event) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      this.showPreviousSlide();
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      this.showNextSlide();
    }

    if (event.key === "Home") {
      event.preventDefault();
      this.showSlide(0);
    }

    if (event.key === "End") {
      event.preventDefault();
      this.showSlide(this.slides.length - 1);
    }
  }


  /* ------------------------------------------------------------------------
     Gestos táctiles
     ------------------------------------------------------------------------ */

  handleSwipe() {
    const swipeDistance =
      this.touchStartX - this.touchEndX;

    if (
      Math.abs(swipeDistance) <
      this.minimumSwipeDistance
    ) {
      return;
    }

    if (swipeDistance > 0) {
      this.showNextSlide();
    } else {
      this.showPreviousSlide();
    }
  }


  /* ------------------------------------------------------------------------
     Reproducción automática
     ------------------------------------------------------------------------ */

  startAutoplay() {
    const cannotStart =
      this.slides.length < 2 ||
      this.reducedMotion ||
      this.isPointerInside ||
      this.isFocusInside ||
      document.hidden ||
      this.timer !== null;

    if (cannotStart) {
      return;
    }

    this.timer = window.setInterval(() => {
      this.showSlide(this.currentIndex + 1, {
        announce: false,
        restartAutoplay: false
      });
    }, this.autoplayDelay);
  }


  /* ------------------------------------------------------------------------
     Detener reproducción automática
     ------------------------------------------------------------------------ */

  stopAutoplay() {
    if (this.timer === null) {
      return;
    }

    window.clearInterval(this.timer);
    this.timer = null;
  }


  /* ------------------------------------------------------------------------
     Reiniciar reproducción automática
     ------------------------------------------------------------------------ */

  restartAutoplay() {
    this.stopAutoplay();
    this.startAutoplay();
  }


  /* ------------------------------------------------------------------------
     Ocultar controles si solo hay una imagen
     ------------------------------------------------------------------------ */

  hideUnnecessaryControls() {
    this.previousButton?.setAttribute("hidden", "");
    this.nextButton?.setAttribute("hidden", "");

    this.indicators.forEach((indicator) => {
      indicator.setAttribute("hidden", "");
    });
  }
}


/* ==========================================================================
   INICIALIZACIÓN DE CARRUSELES
   ========================================================================== */

function initializeCarousels() {
  const carousels = document.querySelectorAll("[data-carousel]");

  carousels.forEach((carousel) => {
    new AccessibleCarousel(carousel);
  });
}


/* ==========================================================================
   FORMULARIO DE CONTACTO
   Validación provisional hasta conectar un sistema de envío.
   ========================================================================== */

function initializeContactForms() {
  const contactForms = document.querySelectorAll(
    "[data-contact-form]"
  );

  contactForms.forEach((form) => {
    const statusMessage = form.querySelector(
      "[data-form-status]"
    );

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const successMessage =
        form.dataset.successMessage ||
        "El formulario se ha validado correctamente. Falta conectar el sistema de envío definitivo.";

      if (statusMessage) {
        statusMessage.hidden = false;

        statusMessage.classList.remove(
          "form-status--error"
        );

        statusMessage.classList.add(
          "form-status--success"
        );

        statusMessage.textContent = successMessage;

        statusMessage.focus();
      }

      form.reset();
    });
  });
}


/* ==========================================================================
   AÑO AUTOMÁTICO DEL FOOTER
   ========================================================================== */

function updateCurrentYear() {
  const yearElements = document.querySelectorAll(
    "[data-current-year]"
  );

  const currentYear = new Date().getFullYear();

  yearElements.forEach((element) => {
    element.textContent = currentYear;
  });
}