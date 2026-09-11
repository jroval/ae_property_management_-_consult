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
  initializeScrollReveals();
  initializeReviewToggles();
  initializeCustomSelects();
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

    const currentCounter = this.carousel.querySelector(
      "[data-carousel-current]"
    );

    if (currentCounter) {
      currentCounter.textContent = String(
        normalizedIndex + 1
      ).padStart(2, "0");
    }

    const progress =
      ((normalizedIndex + 1) / this.slides.length) * 100;

    this.carousel.style.setProperty(
      "--carousel-progress",
      `${progress}%`
    );

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
   APARICIONES AL HACER SCROLL
   ========================================================================== */

function initializeScrollReveals() {
  const revealElements = document.querySelectorAll(
    "[data-reveal], [data-reveal-mask]"
  );

  if (revealElements.length === 0) {
    return;
  }

  if (!("IntersectionObserver" in window)) {
    revealElements.forEach((element) => {
      element.classList.add("is-revealed");
    });

    return;
  }

  const observer = new IntersectionObserver(
    (entries, currentObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-revealed");
        currentObserver.unobserve(entry.target);
      });
    },
    {
      threshold: 0.12,
      rootMargin: "0px 0px -8% 0px"
    }
  );

  revealElements.forEach((element) => {
    observer.observe(element);
  });

  // Red de seguridad: revela cualquier elemento ya visible que se haya
  // quedado sin observador funcional (p. ej. fallos silenciosos del IO).
  window.setTimeout(() => {
    revealElements.forEach((element) => {
      const alreadyRevealed = element.classList.contains("is-revealed");
      const isAboveTheFold =
        element.getBoundingClientRect().top < window.innerHeight;

      if (!alreadyRevealed && isAboveTheFold) {
        element.classList.add("is-revealed");
      }
    });
  }, 6000);
}


/* ==========================================================================
   RESEÑAS — EXPANDIR / CONTRAER
   Todas las tarjetas mantienen el mismo tamaño; si el texto de una
   reseña no cabe en la altura fijada por CSS, se muestra un botón para
   desplegarla. El cálculo se hace midiendo la altura real del texto,
   nunca contando caracteres, para que funcione con cualquier idioma o
   longitud de reseña.
   ========================================================================== */

function initializeReviewToggles() {
  const quoteWraps = document.querySelectorAll("[data-review-quote]");

  if (quoteWraps.length === 0) {
    return;
  }

  const pairs = [];

  quoteWraps.forEach((wrap) => {
    const toggle = wrap.nextElementSibling;

    if (!toggle || !toggle.hasAttribute("data-review-toggle")) {
      return;
    }

    pairs.push({ wrap, toggle });

    toggle.addEventListener("click", () => {
      const isExpanded = wrap.classList.toggle("is-expanded");

      toggle.setAttribute("aria-expanded", String(isExpanded));
      toggle.textContent = isExpanded
        ? toggle.dataset.labelLess
        : toggle.dataset.labelMore;
    });
  });

  function refreshToggleVisibility() {
    pairs.forEach(({ wrap, toggle }) => {
      const isExpanded = wrap.classList.contains("is-expanded");
      const overflows = wrap.scrollHeight > wrap.clientHeight + 2;

      wrap.classList.toggle("has-overflow", overflows);
      toggle.hidden = !overflows && !isExpanded;
    });
  }

  refreshToggleVisibility();

  let resizeTimer;

  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(refreshToggleVisibility, 200);
  });
}


/* ==========================================================================
   SELECT PERSONALIZADO
   Sustituye el <select> nativo (cuya lista de opciones no admite los
   colores de la web en todos los navegadores) por un botón + listado
   propios. El <select> original permanece oculto en el DOM y es el que
   realmente viaja con el formulario.
   ========================================================================== */

function initializeCustomSelects() {
  const wrappers = document.querySelectorAll("[data-custom-select]");

  if (wrappers.length === 0) {
    return;
  }

  wrappers.forEach((wrapper) => {
    const trigger = wrapper.querySelector(".custom-select__trigger");
    const valueLabel = wrapper.querySelector("[data-custom-select-value]");
    const list = wrapper.querySelector(".custom-select__list");
    const nativeSelect = wrapper.querySelector(".custom-select__native");
    const options = Array.from(
      list.querySelectorAll(".custom-select__option")
    );

    let activeIndex = 0;

    function updateActive(index) {
      activeIndex = index;

      options.forEach((option, i) => {
        option.classList.toggle("is-active", i === index);
      });

      trigger.setAttribute("aria-activedescendant", options[index].id);
      options[index].scrollIntoView({ block: "nearest" });
    }

    function openList() {
      list.hidden = false;
      wrapper.classList.add("is-open");
      trigger.setAttribute("aria-expanded", "true");

      const selectedIndex = options.findIndex((option) =>
        option.classList.contains("is-selected")
      );

      updateActive(selectedIndex === -1 ? 0 : selectedIndex);
    }

    function closeList() {
      list.hidden = true;
      wrapper.classList.remove("is-open");
      trigger.setAttribute("aria-expanded", "false");
      trigger.removeAttribute("aria-activedescendant");
    }

    function selectOption(option, { silent } = { silent: false }) {
      options.forEach((item) => {
        item.classList.remove("is-selected");
        item.setAttribute("aria-selected", "false");
      });

      option.classList.add("is-selected");
      option.setAttribute("aria-selected", "true");

      valueLabel.textContent = option.textContent.trim();
      trigger.dataset.placeholder =
        option.dataset.value === "" ? "true" : "false";

      if (!silent) {
        nativeSelect.value = option.dataset.value;
        nativeSelect.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }

    function syncFromNative() {
      const match =
        options.find((option) => option.dataset.value === nativeSelect.value) ||
        options[0];

      selectOption(match, { silent: true });
    }

    trigger.addEventListener("click", (event) => {
      // event.detail is 0 when the click was synthesised by the browser
      // from an Enter/Space keypress on the button (already handled by
      // the keydown listener below) rather than a real pointer click.
      if (event.detail === 0) {
        return;
      }

      if (list.hidden) {
        openList();
      } else {
        closeList();
      }
    });

    trigger.addEventListener("keydown", (event) => {
      if (list.hidden) {
        if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
          event.preventDefault();
          openList();
        }

        return;
      }

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          updateActive(Math.min(activeIndex + 1, options.length - 1));
          break;

        case "ArrowUp":
          event.preventDefault();
          updateActive(Math.max(activeIndex - 1, 0));
          break;

        case "Enter":
        case " ":
          event.preventDefault();
          selectOption(options[activeIndex]);
          closeList();
          break;

        case "Escape":
          event.preventDefault();
          closeList();
          break;

        case "Tab":
          closeList();
          break;
      }
    });

    options.forEach((option, index) => {
      option.addEventListener("click", () => {
        selectOption(option);
        closeList();
        trigger.focus();
      });

      option.addEventListener("mouseenter", () => {
        updateActive(index);
      });
    });

    document.addEventListener("click", (event) => {
      if (!list.hidden && !wrapper.contains(event.target)) {
        closeList();
      }
    });

    const form = wrapper.closest("form");

    if (form) {
      form.addEventListener("reset", () => {
        window.setTimeout(syncFromNative, 0);
      });
    }

    syncFromNative();
  });
}


/* ==========================================================================
   FORMULARIO DE CONTACTO
   Envío real vía Web3Forms (api.web3forms.com). El endpoint y el
   mensaje de éxito/error se leen de data-submit-endpoint /
   data-success-message / data-error-message en el <form>. El campo
   "website" es un honeypot anti-spam invisible: si llega relleno, se
   descarta el envío en silencio (sin avisar al bot).
   ========================================================================== */

function initializeContactForms() {
  const contactForms = document.querySelectorAll(
    "[data-contact-form]"
  );

  contactForms.forEach((form) => {
    const statusMessage = form.querySelector(
      "[data-form-status]"
    );
    const submitButton = form.querySelector(
      'button[type="submit"]'
    );
    const honeypot = form.querySelector(
      '[name="website"]'
    );

    function showStatus(message, isError) {
      if (!statusMessage || !message) {
        return;
      }

      statusMessage.hidden = false;

      statusMessage.classList.toggle(
        "form-status--error",
        Boolean(isError)
      );

      statusMessage.classList.toggle(
        "form-status--success",
        !isError
      );

      statusMessage.textContent = message;
      statusMessage.focus();
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const successMessage = form.dataset.successMessage;
      const errorMessage = form.dataset.errorMessage;
      const endpoint = form.dataset.submitEndpoint;

      // Honeypot: los bots suelen rellenar este campo oculto. Se
      // finge un envío correcto para no darles pistas, pero no se
      // manda nada de verdad.
      if (honeypot && honeypot.value.trim() !== "") {
        showStatus(successMessage, false);
        form.reset();
        return;
      }

      if (!endpoint) {
        showStatus(
          successMessage ||
            "El formulario se ha validado correctamente. Falta conectar el sistema de envío definitivo.",
          false
        );
        form.reset();
        return;
      }

      if (submitButton) {
        submitButton.disabled = true;
      }

      fetch(endpoint, {
        method: "POST",
        headers: {
          Accept: "application/json"
        },
        body: new FormData(form)
      })
        .then((response) =>
          response
            .json()
            .catch(() => ({}))
            .then((data) => ({ ok: response.ok, data }))
        )
        .then(({ ok, data }) => {
          if (ok && data.success) {
            showStatus(successMessage, false);
            form.reset();
          } else {
            showStatus(errorMessage, true);
          }
        })
        .catch(() => {
          showStatus(errorMessage, true);
        })
        .finally(() => {
          if (submitButton) {
            submitButton.disabled = false;
          }
        });
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