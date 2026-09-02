/* ==========================================================================
   AE PROPERTY MANAGEMENT & CONSULT
   Archivo: js/showroom-3d.js

   Galería 3D de la home (Servicios / Nuestra historia / Contacto),
   construida con Three.js + GSAP: tres marcos físicos suspendidos en
   un espacio arquitectónico oscuro, con iluminación de exposición,
   reflejos de entorno, sombras de contacto y una entrada cinematográfica.

   Si WebGL no está disponible, si las librerías no han cargado, o si
   cualquier parte de la inicialización falla, se revela el `<nav>` de
   enlaces reales (#showroom3dFallback) y no se rompe el resto de la
   página. Los enlaces reales están siempre en el HTML para buscadores
   y lectores de pantalla, y se muestran solos al recibir el foco de
   teclado aunque la escena 3D funcione. En dispositivos táctiles la
   escena ni se intenta: css/styles.css muestra en su lugar las
   tarjetas con foto de .showroom-mobile-cards.
   ========================================================================== */

"use strict";

document.addEventListener("DOMContentLoaded", () => {
  initShowroom3D();
});

function initShowroom3D() {
  const stage = document.getElementById("showroom3dStage");
  const fallback = document.getElementById("showroom3dFallback");

  if (!stage || !fallback) {
    return;
  }

  if (!window.matchMedia("(hover: hover)").matches) {
    return;
  }

  function revealFallback() {
    stage.hidden = true;
    fallback.classList.add("is-forced-visible");
  }

  if (typeof THREE === "undefined" || typeof gsap === "undefined") {
    revealFallback();
    return;
  }

  if (!window.WebGLRenderingContext) {
    revealFallback();
    return;
  }

  /* Inicialización perezosa: la escena no arranca hasta que la sección
     esté a punto de entrar en el viewport. */
  const section = stage.closest("section") || stage;
  let started = false;

  const startObserver = new IntersectionObserver(
    (entries) => {
      if (started) {
        return;
      }
      const isNear = entries.some((entry) => entry.isIntersecting);
      if (!isNear) {
        return;
      }
      started = true;
      startObserver.disconnect();
      try {
        runShowroomScene(stage, fallback, section);
      } catch (error) {
        console.error("Showroom 3D: fallo al iniciar la escena.", error);
        revealFallback();
      }
    },
    { rootMargin: "250px 0px" }
  );
  startObserver.observe(section);
}

function runShowroomScene(stage, fallback, section) {
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  function fallbackTitle(href, defaultTitle) {
    const link = fallback.querySelector('a[href="' + href + '"]');
    return link ? link.textContent.trim() : defaultTitle;
  }

  const OLIVE = 0x6e7a4e;

  const PANEL_DATA = [
    {
      key: "left",
      title: fallbackTitle("servicios.html", "Servicios"),
      subtitle: "Supervisión, mantenimiento y gestión de incidencias.",
      href: "servicios.html",
      src: "../assets/images/services/services-hero.webp",
      slotX: -1.85,
      restY: 0.2,
      restZ: -0.16,
      restAngle: THREE.MathUtils.degToRad(23)
    },
    {
      key: "center",
      title: fallbackTitle("nosotros.html", "Nuestra historia"),
      subtitle: "Conoce nuestra trayectoria y valores.",
      href: "nosotros.html",
      src: "../assets/images/about/about-hero.webp",
      slotX: 0,
      restY: 0,
      restZ: 0.1,
      restAngle: THREE.MathUtils.degToRad(-9)
    },
    {
      key: "right",
      title: fallbackTitle("contacto.html", "Contacto"),
      subtitle: "Estamos aquí para ayudarte.",
      href: "contacto.html",
      src: "../assets/images/home/mallorca.webp",
      slotX: 1.85,
      restY: -0.16,
      restZ: -0.2,
      restAngle: THREE.MathUtils.degToRad(-27)
    }
  ];

  /* ------------------------------------------------------------------------
     Recorte tipo "object-fit: cover" al dibujar la foto en el canvas
     ------------------------------------------------------------------------ */

  function drawCover(ctx, img, w, h) {
    const imgRatio = img.width / img.height;
    const canvasRatio = w / h;
    let sx, sy, sw, sh;

    if (imgRatio > canvasRatio) {
      sh = img.height;
      sw = sh * canvasRatio;
      sx = (img.width - sw) / 2;
      sy = 0;
    } else {
      sw = img.width;
      sh = sw / canvasRatio;
      sx = 0;
      sy = (img.height - sh) / 2;
    }

    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
  }

  /* ------------------------------------------------------------------------
     Geometría con esquinas redondeadas (Three.js r149 no la trae de
     serie) y, opcionalmente, bisel real en el borde del marco.
     ------------------------------------------------------------------------ */

  function makeRoundedRectShape(w, h, radius) {
    const shape = new THREE.Shape();
    const x = -w / 2;
    const y = -h / 2;

    shape.moveTo(x, y + radius);
    shape.lineTo(x, y + h - radius);
    shape.quadraticCurveTo(x, y + h, x + radius, y + h);
    shape.lineTo(x + w - radius, y + h);
    shape.quadraticCurveTo(x + w, y + h, x + w, y + h - radius);
    shape.lineTo(x + w, y + radius);
    shape.quadraticCurveTo(x + w, y, x + w - radius, y);
    shape.lineTo(x + radius, y);
    shape.quadraticCurveTo(x, y, x, y + radius);

    return shape;
  }

  function makeFrameGeometry(w, h, depth, radius) {
    const geometry = new THREE.ExtrudeGeometry(makeRoundedRectShape(w, h, radius), {
      depth,
      bevelEnabled: true,
      bevelThickness: 0.016,
      bevelSize: 0.014,
      bevelSegments: 4,
      curveSegments: 10
    });
    geometry.translate(0, 0, -depth / 2);
    return geometry;
  }

  function makeRoundedPlaneGeometry(w, h, radius) {
    return new THREE.ShapeGeometry(makeRoundedRectShape(w, h, radius), 10);
  }

  /* ------------------------------------------------------------------------
     Mapa de entorno procedural: seis degradados suaves (sin depender
     de una textura HDRI externa) para que los materiales con
     clearcoat/roughness bajo tengan algo creíble que reflejar.
     ------------------------------------------------------------------------ */

  function makeEnvironmentTexture() {
    const size = 128;
    const specs = [
      ["#121311", "#060706"],
      ["#121311", "#060706"],
      ["#17180f", "#0a0b08"],
      ["#050605", "#020302"],
      ["#161810", "#070806"],
      ["#101110", "#050605"]
    ];

    const faces = specs.map(([top, bottom]) => {
      const c = document.createElement("canvas");
      c.width = size;
      c.height = size;
      const ctx = c.getContext("2d");
      const g = ctx.createLinearGradient(0, 0, 0, size);
      g.addColorStop(0, top);
      g.addColorStop(1, bottom);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
      return c;
    });

    const cubeTexture = new THREE.CubeTexture(faces);
    cubeTexture.encoding = THREE.sRGBEncoding;
    cubeTexture.needsUpdate = true;
    return cubeTexture;
  }

  /* ------------------------------------------------------------------------
     Mancha de sombra de contacto en el suelo (truco clásico: un
     degradado radial en un plano semitransparente, más barato y
     fiable que un SSAO real, y perfectamente dentro del presupuesto
     de rendimiento).
     ------------------------------------------------------------------------ */

  function makeContactShadowTexture() {
    const size = 256;
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    const ctx = c.getContext("2d");
    const g = ctx.createRadialGradient(
      size / 2, size / 2, 0,
      size / 2, size / 2, size / 2
    );
    g.addColorStop(0, "rgba(0,0,0,0.55)");
    g.addColorStop(0.6, "rgba(0,0,0,0.28)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(c);
    texture.encoding = THREE.sRGBEncoding;
    return texture;
  }

  /* Halo de neón: degradado radial verde muy saturado en el centro,
     para usar con blending aditivo y simular el resplandor de un
     tubo de neón sin necesidad de post-processing. */
  function makeNeonHaloTexture() {
    const size = 256;
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    const ctx = c.getContext("2d");
    const g = ctx.createRadialGradient(
      size / 2, size / 2, 0,
      size / 2, size / 2, size / 2
    );
    g.addColorStop(0, "rgba(190,240,150,0.95)");
    g.addColorStop(0.35, "rgba(140,210,110,0.55)");
    g.addColorStop(1, "rgba(110,180,90,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(c);
    texture.encoding = THREE.sRGBEncoding;
    return texture;
  }

  /* ------------------------------------------------------------------------
     Textura del cartel: color de fondo al momento, foto real + título
     en cuanto termina de cargar
     ------------------------------------------------------------------------ */

  /* Paleta de texto tomada de variables.css: cream para el título
     (--color-text-primary), gris cálido para el subtítulo
     (--color-text-secondary). Nada de dorado ni tipografías ajenas a
     la web — el acento en verde oliva se reserva para el hover, en
     un paso posterior. */
  const TEXT_PRIMARY = "#f5f2ec";
  const TEXT_SECONDARY = "rgba(185, 182, 175, 0.9)";
  const SANS_STACK = "'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
  const SERIF_STACK = "Georgia, 'Times New Roman', serif";

  function makePosterTexture(item) {
    const c = document.createElement("canvas");
    c.width = 640;
    c.height = 880;
    const ctx = c.getContext("2d");

    ctx.fillStyle = "#1c1d1b";
    ctx.fillRect(0, 0, c.width, c.height);

    const texture = new THREE.CanvasTexture(c);
    texture.encoding = THREE.sRGBEncoding;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;

    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      drawCover(ctx, img, c.width, c.height);

      /* Oscurecido general, más marcado que antes: en la referencia la
         foto queda en segundo plano, discreta, para que el icono y el
         texto dorado sean el protagonista sobre el cristal. */
      ctx.fillStyle = "rgba(8,9,7,0.5)";
      ctx.fillRect(0, 0, c.width, c.height);

      const vignette = ctx.createRadialGradient(
        c.width / 2, c.height * 0.5, c.height * 0.15,
        c.width / 2, c.height * 0.5, c.height * 0.72
      );
      vignette.addColorStop(0, "rgba(6,7,6,0)");
      vignette.addColorStop(1, "rgba(6,7,6,0.55)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, c.width, c.height);

      const cx = c.width / 2;

      ctx.textAlign = "center";
      ctx.fillStyle = TEXT_PRIMARY;
      ctx.font = "500 54px " + SERIF_STACK;
      ctx.fillText(item.title, cx, c.height * 0.56);

      ctx.fillStyle = TEXT_SECONDARY;
      ctx.font = "600 14px " + SANS_STACK;
      wrapCenteredText(ctx, item.subtitle.toUpperCase(), cx, c.height * 0.605, 460, 22);

      ctx.fillStyle = TEXT_PRIMARY;
      ctx.font = "300 30px " + SERIF_STACK;
      ctx.fillText("↗", cx, c.height * 0.7);

      ctx.textAlign = "left";
      texture.needsUpdate = true;
    };
    img.src = item.src;

    return texture;
  }

  function wrapCenteredText(ctx, text, cx, startY, maxWidth, lineHeight) {
    const words = text.split(" ");
    let line = "";
    let y = startY;
    words.forEach((word, index) => {
      const test = line ? line + " " + word : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line, cx, y);
        line = word;
        y += lineHeight;
      } else {
        line = test;
      }
      if (index === words.length - 1) {
        ctx.fillText(line, cx, y);
      }
    });
  }

  /* ------------------------------------------------------------------------
     Escena
     ------------------------------------------------------------------------ */

  /* ------------------------------------------------------------------------
     Fondo del escenario (el espacio detrás de los paneles, NO las fotos
     de dentro de cada panel — esas se quedan como están).

     Por ahora es un color sólido. En cuanto haya una foto real para dar
     ambiente de galería, basta con poner su ruta aquí: se probará a
     cargar y, si existe, sustituye al color liso sin tocar nada más.
     Si el archivo no existe o falla, se queda el color de siempre — no
     rompe nada mientras tanto.
     ------------------------------------------------------------------------ */

  const SCENE_BACKDROP_SRC = ""; // p.ej. "../assets/images/showroom/backdrop.webp"
  const SCENE_BG_COLOR = 0x0c0d0c;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(SCENE_BG_COLOR);
  scene.fog = new THREE.FogExp2(SCENE_BG_COLOR, 0.05);
  scene.environment = makeEnvironmentTexture();

  if (SCENE_BACKDROP_SRC) {
    new THREE.TextureLoader().load(
      SCENE_BACKDROP_SRC,
      (backdropTexture) => {
        backdropTexture.encoding = THREE.sRGBEncoding;
        scene.background = backdropTexture;
      },
      undefined,
      () => {
        console.warn("Showroom 3D: no se pudo cargar el fondo del escenario, se mantiene el color sólido.");
      }
    );
  }

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  stage.appendChild(renderer.domElement);

  /* --- Iluminación de galería, por capas -------------------------------- */

  const ambient = new THREE.AmbientLight(0xeee6d8, 0.14);
  scene.add(ambient);

  const hemi = new THREE.HemisphereLight(0x30322c, 0x050505, 0.22);
  scene.add(hemi);

  const fill = new THREE.DirectionalLight(0x8fa0ff, 0.05);
  fill.position.set(-3, 4, 2);
  scene.add(fill);

  /* Acento de marca (verde oliva), extremadamente sutil, como luz
     indirecta que roza el borde derecho de la escena. */
  const accentLight = new THREE.PointLight(OLIVE, 0.35, 9, 2);
  accentLight.position.set(3.4, 1.6, 1.4);
  scene.add(accentLight);

  /* Suelo, prácticamente negro, con muy poca reflectividad */
  const floorGeo = new THREE.PlaneGeometry(16, 10);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a0b,
    roughness: 0.16,
    metalness: 0.35,
    envMapIntensity: 0.9
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.02;
  floor.receiveShadow = true;
  scene.add(floor);

  const contactShadowTexture = makeContactShadowTexture();
  const neonHaloTexture = makeNeonHaloTexture();

  /* --- Paneles ------------------------------------------------------------ */

  const PANEL_W = 1.55;
  const PANEL_H = 2.2;
  const HOVER_ANGLE_CENTER = 0;

  const CASE_DEPTH = 0.13;
  const CASE_RADIUS = 0.05;
  const CASE_FRONT_Z = -0.06;
  const POSTER_Z = -0.02;
  const GLASS_Z = 0.035;

  const panels = [];
  const raycastTargets = [];
  const raycastMap = new Map();

  PANEL_DATA.forEach((item) => {
    const posterTexture = makePosterTexture(item);

    /* Marco: cuerpo con volumen y bisel real, material oscuro
       premium con un leve barniz (clearcoat) que responde al mapa
       de entorno, no plástico brillante. */
    const caseMat = new THREE.MeshPhysicalMaterial({
      color: 0x1a1c18,
      transparent: true,
      opacity: 0.12,
      roughness: 0.15,
      metalness: 0.05,
      clearcoat: 0.7,
      clearcoatRoughness: 0.15,
      side: THREE.DoubleSide,
      depthWrite: false,
      envMapIntensity: 0.7
    });
    const caseGeo = makeFrameGeometry(PANEL_W, PANEL_H, CASE_DEPTH, CASE_RADIUS);
    const caseMesh = new THREE.Mesh(caseGeo, caseMat);
    caseMesh.position.z = CASE_FRONT_Z - CASE_DEPTH / 2;
    caseMesh.castShadow = false;
    caseMesh.receiveShadow = false;

    /* Cartel: la foto + el título, montado dentro del marco */
    const posterMat = new THREE.MeshStandardMaterial({
      map: posterTexture,
      roughness: 0.62,
      metalness: 0.02,
      transparent: true,
      opacity: 1,
      envMapIntensity: 0.2
    });
    const posterGeo = new THREE.PlaneGeometry(PANEL_W * 0.94, PANEL_H * 0.94);
    const posterMesh = new THREE.Mesh(posterGeo, posterMat);
    posterMesh.position.z = POSTER_Z;
    posterMesh.castShadow = true;
    posterMesh.receiveShadow = false;

    /* Cristal: lámina frontal muy sutil, cierra la vitrina */
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xeef2ea,
      transparent: true,
      opacity: 0.05,
      roughness: 0.04,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      transmission: 0.35,
      side: THREE.DoubleSide,
      depthWrite: false,
      envMapIntensity: 1.1
    });
    const glassGeo = makeRoundedPlaneGeometry(PANEL_W, PANEL_H, CASE_RADIUS);
    const glassMesh = new THREE.Mesh(glassGeo, glassMat);
    glassMesh.position.z = GLASS_Z;

    const group = new THREE.Group();
    group.position.set(item.slotX, PANEL_H / 2 + item.restY * 0.12, item.restZ);
    group.rotation.y = item.restAngle;
    group.add(caseMesh, posterMesh, glassMesh);
    scene.add(group);

    /* Foco principal: luz de galería siempre encendida a baja
       intensidad (nunca completamente apagada), que se intensifica
       al recibir el foco del visitante. */
    const spot = new THREE.SpotLight(0xffeccb, 0.3, 10, Math.PI / 6.2, 0.5, 1.6);
    spot.position.set(item.slotX, PANEL_H + 1.7, 2.7);
    spot.target.position.set(item.slotX, PANEL_H / 2, item.restZ);
    spot.castShadow = true;
    spot.shadow.mapSize.set(1024, 1024);
    spot.shadow.bias = -0.003;
    scene.add(spot, spot.target);

    /* Rim light: perfila el canto trasero del marco */
    const rim = new THREE.PointLight(0xd9e2ff, 0.5, 3.6, 2.2);
    rim.position.set(item.slotX * -0.3, PANEL_H * 0.75, item.restZ - 0.8);
    scene.add(rim);

    /* Brillo cálido de base: sube desde el borde inferior del cristal,
       como si el propio panel estuviera iluminado por dentro. Siempre
       encendido, a baja intensidad. */
    const baseGlow = new THREE.PointLight(0xffb877, 0.55, 2.6, 2);
    baseGlow.position.set(item.slotX, 0.15, item.restZ + 0.5);
    scene.add(baseGlow);

    /* Brillo verde oliva de marca: apagado en reposo, se enciende por
       debajo del panel al pasar el ratón por encima. */
    const oliveGlow = new THREE.PointLight(0x9caf72, 0, 4, 1.4);
    oliveGlow.position.set(item.slotX, 0.05, item.restZ + 0.55);
    scene.add(oliveGlow);

    /* Neón: barra propia autoiluminada + halo con blending aditivo,
       ancladas al borde inferior del panel (hijas del grupo, así se
       mueven con él en hover). Apagadas en reposo. */
    const neonHalo = new THREE.Mesh(
      new THREE.PlaneGeometry(PANEL_W * 1.6, PANEL_H * 0.32),
      new THREE.MeshBasicMaterial({
        map: neonHaloTexture,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false
      })
    );
    neonHalo.position.set(0, -PANEL_H / 2 + 0.02, GLASS_Z + 0.01);
    group.add(neonHalo);

    const neonBar = new THREE.Mesh(
      new THREE.PlaneGeometry(PANEL_W * 0.92, 0.03),
      new THREE.MeshBasicMaterial({
        color: 0xc8f5a0,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        fog: false
      })
    );
    neonBar.position.set(0, -PANEL_H / 2 + 0.015, GLASS_Z + 0.04);
    group.add(neonBar);

    /* Sombra de contacto en el suelo, bajo cada marco */
    const shadowGeo = new THREE.PlaneGeometry(PANEL_W * 2.1, PANEL_W * 1.1);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: contactShadowTexture,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      fog: false
    });
    const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.set(item.slotX, -0.018, item.restZ + 0.3);
    scene.add(contactShadow);

    const panel = {
      item,
      mesh: posterMesh,
      case: caseMesh,
      group,
      spot,
      rim,
      baseGlow,
      oliveGlow,
      neonBar,
      neonHalo,
      restAngle: item.restAngle,
      restZ: item.restZ,
      restY: group.position.y,
      hoverAngle: item.key === "center" ? HOVER_ANGLE_CENTER : item.restAngle * 0.22,
      isCenter: item.key === "center",
      focusState: 0,
      currentFocus: 0
    };

    panels.push(panel);
    raycastTargets.push(posterMesh, caseMesh);
    raycastMap.set(posterMesh, panel);
    raycastMap.set(caseMesh, panel);
  });

  /* ------------------------------------------------------------------------
     Encuadre de cámara, responsive
     ------------------------------------------------------------------------ */

  const LOOK_AT_Y = 1.0;
  const ZOOM = 0.48;
  const basePosition = new THREE.Vector3();

  function frameCamera() {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    if (!w || !h) {
      return;
    }
    const narrow = w < 720;

    const baseHeightOffset = narrow ? 1.7 : 1.05;
    const baseDistance = narrow ? 8.2 : 8.4;
    const baseFov = narrow ? 58 : 44;

    camera.aspect = w / h;
    camera.fov = baseFov * (0.68 + 0.32 * ZOOM);
    basePosition.set(0, LOOK_AT_Y + baseHeightOffset * ZOOM, baseDistance * ZOOM);
    camera.position.copy(basePosition);
    camera.lookAt(0, LOOK_AT_Y, 0);
    camera.updateProjectionMatrix();

    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, narrow ? 1.5 : 2));

    const shadowsWanted = !narrow;
    renderer.shadowMap.enabled = shadowsWanted;
    panels.forEach((p) => {
      p.spot.castShadow = shadowsWanted;
    });
  }

  window.addEventListener("resize", frameCamera);
  frameCamera();

  /* ------------------------------------------------------------------------
     Parallax de cámara (cursor) + deriva ambiental
     ------------------------------------------------------------------------ */

  const parallax = { targetX: 0, targetY: 0, x: 0, y: 0 };

  if (!reducedMotion) {
    window.addEventListener("pointermove", (event) => {
      const nx = (event.clientX / window.innerWidth) * 2 - 1;
      const ny = (event.clientY / window.innerHeight) * 2 - 1;
      parallax.targetX = nx;
      parallax.targetY = ny;
    });
  }

  /* ------------------------------------------------------------------------
     Progreso de scroll (sin scroll-hijacking): solo lectura de
     posición, la página se desplaza con total normalidad.
     ------------------------------------------------------------------------ */

  const scrollState = { target: 0, current: 0 };
  let scrollTicking = false;

  function measureScrollProgress() {
    const rect = section.getBoundingClientRect();
    const vh = window.innerHeight || 1;
    const raw = (vh - rect.top) / (vh * 1.15);
    scrollState.target = THREE.MathUtils.clamp(raw, 0, 1);
    scrollTicking = false;
  }

  if (!reducedMotion) {
    window.addEventListener(
      "scroll",
      () => {
        if (!scrollTicking) {
          scrollTicking = true;
          requestAnimationFrame(measureScrollProgress);
        }
      },
      { passive: true }
    );
    measureScrollProgress();
  }

  /* ------------------------------------------------------------------------
     Interacción: raycaster + GSAP
     ------------------------------------------------------------------------ */

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let hoveredPanel = null;
  let isTransitioning = false;

  function focusPanel(panel, focus) {
    panel.focusState = focus;
    const dur = reducedMotion ? 0.05 : 0.55;

    gsap.to(panel, {
      currentFocus: focus,
      duration: dur,
      ease: "power3.out"
    });

    gsap.to(panel.group.rotation, {
      y: focus > 0.5 ? panel.hoverAngle : panel.restAngle,
      duration: dur,
      ease: "power3.out"
    });

    gsap.to(panel.group.position, {
      z: panel.restZ + focus * (panel.isCenter ? 0.14 : 0.17),
      duration: dur,
      ease: "power3.out"
    });

    gsap.to(panel.group.scale, {
      x: 1 + focus * 0.045,
      y: 1 + focus * 0.045,
      z: 1 + focus * 0.045,
      duration: dur,
      ease: "power3.out"
    });

    gsap.to(panel.spot, {
      intensity: 0.3 + focus * 1.3,
      duration: dur,
      ease: "power2.out"
    });

    /* En reposo, brillo cálido debajo del panel; en hover cede el
       protagonismo al verde oliva de marca, para que el cambio de
       color se note con claridad en vez de competir entre los dos. */
    gsap.to(panel.baseGlow, {
      intensity: focus > 0.5 ? 0 : 0.55,
      duration: dur,
      ease: "power2.out"
    });

    gsap.to(panel.oliveGlow, {
      intensity: focus * 3,
      duration: dur,
      ease: "power2.out"
    });

    gsap.to(panel.neonBar.material, {
      opacity: focus * 0.95,
      duration: dur,
      ease: "power2.out"
    });

    gsap.to(panel.neonHalo.material, {
      opacity: focus * 0.85,
      duration: dur,
      ease: "power2.out"
    });
  }

  function setHover(panel, isHover) {
    if (isTransitioning) {
      return;
    }
    focusPanel(panel, isHover ? 1 : 0);

    /* Los demás pierden ligeramente protagonismo mientras uno tiene
       el foco, como si la exposición reaccionara al visitante. */
    panels.forEach((other) => {
      if (other === panel) {
        return;
      }
      const dur = reducedMotion ? 0.05 : 0.55;
      gsap.to(other.spot, {
        intensity: isHover ? 0.15 : 0.3,
        duration: dur,
        ease: "power2.out"
      });
      gsap.to(other.mesh.material, {
        opacity: isHover ? 0.72 : 1,
        duration: dur,
        ease: "power2.out"
      });
    });
  }

  function updatePointer(clientX, clientY) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  }

  function checkHover() {
    if (isTransitioning) {
      return;
    }
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(raycastTargets);
    const hitMesh = hits.length ? hits[0].object : null;
    const hitPanel = hitMesh ? raycastMap.get(hitMesh) : null;

    if (hitPanel !== hoveredPanel) {
      if (hoveredPanel) {
        setHover(hoveredPanel, false);
      }
      if (hitPanel) {
        setHover(hitPanel, true);
      }
      hoveredPanel = hitPanel;
      renderer.domElement.style.cursor = hitPanel ? "pointer" : "default";
    }
  }

  renderer.domElement.addEventListener("pointermove", (event) => {
    updatePointer(event.clientX, event.clientY);
    checkHover();
  });

  renderer.domElement.addEventListener("pointerdown", (event) => {
    updatePointer(event.clientX, event.clientY);
    checkHover();
  });

  renderer.domElement.addEventListener("pointerleave", () => {
    if (isTransitioning || !hoveredPanel) {
      return;
    }
    setHover(hoveredPanel, false);
    hoveredPanel = null;
    renderer.domElement.style.cursor = "default";
  });

  renderer.domElement.addEventListener("click", () => {
    if (!hoveredPanel || isTransitioning) {
      return;
    }
    isTransitioning = true;
    const chosen = hoveredPanel;
    const dur = reducedMotion ? 0.05 : 0.32;

    gsap.to(chosen.group.position, {
      z: chosen.restZ + (chosen.isCenter ? 0.2 : 0.26),
      duration: dur,
      ease: "power2.out"
    });
    gsap.to(chosen.spot, { intensity: 2, duration: dur, ease: "power2.out" });

    panels.forEach((other) => {
      if (other === chosen) {
        return;
      }
      gsap.to(other.mesh.material, { opacity: 0.35, duration: dur, ease: "power2.out" });
      gsap.to(other.spot, { intensity: 0.05, duration: dur, ease: "power2.out" });
    });

    gsap.to(
      {},
      {
        duration: dur,
        onComplete: () => {
          window.location.href = chosen.item.href;
        }
      }
    );
  });

  /* ------------------------------------------------------------------------
     Animación de entrada cinematográfica
     ------------------------------------------------------------------------ */

  panels.forEach((panel) => {
    if (reducedMotion) {
      return;
    }
    panel.group.position.z = panel.restZ - 1.1;
    panel.group.rotation.y = panel.restAngle * 1.8;
    panel.spot.intensity = 0;
  });

  if (!reducedMotion) {
    ambient.intensity = 0;
    hemi.intensity = 0;
    accentLight.intensity = 0;
  }

  function playEntrance() {
    if (reducedMotion) {
      return;
    }
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl.to(ambient, { intensity: 0.14, duration: 1.3 }, 0);
    tl.to(hemi, { intensity: 0.22, duration: 1.3 }, 0);
    tl.to(accentLight, { intensity: 0.35, duration: 1.5 }, 0.1);

    panels.forEach((panel) => {
      const order = panel.isCenter ? 0 : panel.item.key === "left" ? 0.18 : 0.3;
      tl.to(
        panel.group.position,
        { z: panel.restZ, duration: 1.1 },
        0.25 + order
      );
      tl.to(
        panel.group.rotation,
        { y: panel.restAngle, duration: 1.1 },
        0.25 + order
      );
      tl.to(
        panel.spot,
        { intensity: 0.3, duration: 1 },
        0.4 + order
      );
    });
  }

  const entranceObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          playEntrance();
          entranceObserver.disconnect();
        }
      });
    },
    { threshold: 0.2 }
  );
  entranceObserver.observe(section);

  /* ------------------------------------------------------------------------
     Pausa de render fuera de viewport (ahorro de batería/CPU)
     ------------------------------------------------------------------------ */

  let isVisible = true;
  const visibilityObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        isVisible = entry.isIntersecting;
      });
    },
    { rootMargin: "150px 0px" }
  );
  visibilityObserver.observe(section);

  /* ------------------------------------------------------------------------
     Bucle de render. Sigue programándose siempre (coste insignificante),
     pero se salta el render caro cuando la sección está lejos del
     viewport — un único bucle, sin riesgo de duplicarlo.
     ------------------------------------------------------------------------ */

  const clock = new THREE.Clock();

  function tick() {
    requestAnimationFrame(tick);

    if (!isVisible) {
      return;
    }

    const t = clock.getElapsedTime();

    if (!reducedMotion) {
      parallax.x += (parallax.targetX - parallax.x) * 0.045;
      parallax.y += (parallax.targetY - parallax.y) * 0.045;
      scrollState.current += (scrollState.target - scrollState.current) * 0.06;

      const idleX = Math.sin(t * 0.18) * 0.02;
      const idleY = Math.cos(t * 0.14) * 0.012;

      camera.position.x = basePosition.x + parallax.x * 0.16 + idleX;
      camera.position.y = basePosition.y - parallax.y * 0.1 + idleY;
      camera.position.z = basePosition.z + scrollState.current * 0.12;
      camera.lookAt(0, LOOK_AT_Y, 0);

      panels.forEach((panel, index) => {
        /* Deriva ambiental casi imperceptible: solo en posición Y,
           para no pelear con las tweens de GSAP que ya controlan
           rotation/position.z/scale en hover y en la entrada. */
        const idleBob = Math.sin(t * 0.35 + index * 2.1) * 0.006;
        panel.group.position.y = panel.restY + idleBob;

        const separationBoost = 1 + scrollState.current * 0.05;
        panel.group.position.x = panel.item.slotX * separationBoost;
      });
    }

    renderer.render(scene, camera);
  }

  requestAnimationFrame(tick);
}
