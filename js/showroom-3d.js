/* ==========================================================================
   AE PROPERTY MANAGEMENT & CONSULT
   Archivo: js/showroom-3d.js

   Escena 3D del showroom de la home (Servicios / Nuestra historia /
   Contacto), construida con Three.js + GSAP.

   Si WebGL no está disponible, si las librerías no han cargado, o si
   cualquier parte de la inicialización falla, se revela el `<nav>` de
   enlaces reales (#showroom3dFallback) y no se rompe el resto de la
   página. Los enlaces reales están siempre en el HTML para buscadores
   y lectores de pantalla, y se muestran solos al recibir el foco de
   teclado aunque la escena 3D funcione.
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

  function revealFallback() {
    stage.hidden = true;
    fallback.classList.add("is-forced-visible");
  }

  if (typeof THREE === "undefined" || typeof gsap === "undefined") {
    revealFallback();
    return;
  }

  try {
    runShowroomScene(stage, fallback);
  } catch (error) {
    console.error("Showroom 3D: fallo al iniciar la escena.", error);
    revealFallback();
  }
}

function runShowroomScene(stage, fallback) {
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  function fallbackTitle(href, defaultTitle) {
    const link = fallback.querySelector('a[href="' + href + '"]');
    return link ? link.textContent.trim() : defaultTitle;
  }

  const PANEL_DATA = [
    {
      key: "left",
      title: fallbackTitle("servicios.html", "Servicios"),
      href: "servicios.html",
      src: "../assets/images/services/services-hero.webp"
    },
    {
      key: "center",
      title: fallbackTitle("nosotros.html", "Nuestra historia"),
      href: "nosotros.html",
      src: "../assets/images/about/about-hero.webp"
    },
    {
      key: "right",
      title: fallbackTitle("contacto.html", "Contacto"),
      href: "contacto.html",
      src: "../assets/images/home/mallorca.webp"
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
     Caja con esquinas redondeadas (Three.js no la trae de serie; se
     construye extruyendo un rectángulo con las esquinas en curva)
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

  function makeRoundedBoxGeometry(w, h, depth, radius) {
    const geometry = new THREE.ExtrudeGeometry(makeRoundedRectShape(w, h, radius), {
      depth,
      bevelEnabled: false,
      curveSegments: 8
    });
    geometry.translate(0, 0, -depth / 2);
    return geometry;
  }

  function makeRoundedPlaneGeometry(w, h, radius) {
    return new THREE.ShapeGeometry(makeRoundedRectShape(w, h, radius), 8);
  }

  /* ------------------------------------------------------------------------
     Textura del cartel: color de fondo al momento, foto real + título
     en cuanto termina de cargar
     ------------------------------------------------------------------------ */

  function makePosterTexture(item) {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 704;
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

      const scrim = ctx.createLinearGradient(0, c.height * 0.55, 0, c.height);
      scrim.addColorStop(0, "rgba(7,8,7,0)");
      scrim.addColorStop(1, "rgba(7,8,7,0.88)");
      ctx.fillStyle = scrim;
      ctx.fillRect(0, 0, c.width, c.height);

      ctx.fillStyle = "#f5f2ec";
      ctx.font = "500 42px Georgia, 'Times New Roman', serif";
      ctx.fillText(item.title, 32, c.height - 56);

      texture.needsUpdate = true;
    };
    img.src = item.src;

    return texture;
  }

  /* ------------------------------------------------------------------------
     Escena
     ------------------------------------------------------------------------ */

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x101110);
  scene.fog = new THREE.FogExp2(0x101110, 0.035);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  stage.appendChild(renderer.domElement);

  const ambient = new THREE.AmbientLight(0xf5ede0, 0.3);
  scene.add(ambient);

  const fill = new THREE.DirectionalLight(0x8fa0ff, 0.12);
  fill.position.set(-3, 4, 2);
  scene.add(fill);

  /* Suelo de mármol negro pulido */
  const floorGeo = new THREE.PlaneGeometry(14, 8);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x0d0d0f,
    roughness: 0.28,
    metalness: 0.12
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  /* Paneles con bisagra real (grupo = pivote, como transform-origin en CSS) */
  const PANEL_W = 1.55;
  const PANEL_H = 2.2;
  const REST_ANGLE = THREE.MathUtils.degToRad(25);
  const HOVER_ANGLE = 0;
  const SLOT_X = 2.55;

  const panels = [];
  const raycastTargets = [];

  const CASE_DEPTH = 0.12;
  const CASE_RADIUS = 0.05;
  const CASE_FRONT_Z = -0.05; // dónde queda la cara frontal (el "fondo" del hueco)
  const POSTER_Z = -0.02; // el cartel, justo delante de esa cara
  const GLASS_Z = 0.03; // el cristal, delante del cartel, cerrando la vitrina

  PANEL_DATA.forEach((item) => {
    const posterTexture = makePosterTexture(item);

    // La vitrina: una caja de cristal de verdad (transparente, se ve el
    // mármol y el fondo a través de ella), con esquinas redondeadas y
    // volumen real — no una simple lámina plana.
    const caseMat = new THREE.MeshPhysicalMaterial({
      color: 0xf5f2ec,
      transparent: true,
      opacity: 0.09,
      roughness: 0.08,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const caseGeo = makeRoundedBoxGeometry(PANEL_W, PANEL_H, CASE_DEPTH, CASE_RADIUS);
    const caseMesh = new THREE.Mesh(caseGeo, caseMat);
    caseMesh.position.z = CASE_FRONT_Z - CASE_DEPTH / 2;
    caseMesh.castShadow = false;
    caseMesh.receiveShadow = false;

    // El cartel: la foto + el título, montado dentro de la vitrina,
    // delante del fondo de la caja
    const posterMat = new THREE.MeshStandardMaterial({
      map: posterTexture,
      roughness: 0.55,
      metalness: 0.04,
      side: THREE.DoubleSide
    });
    const posterGeo = new THREE.PlaneGeometry(PANEL_W * 0.86, PANEL_H * 0.86);
    const posterMesh = new THREE.Mesh(posterGeo, posterMat);
    posterMesh.position.z = POSTER_Z;
    posterMesh.castShadow = true;
    posterMesh.receiveShadow = false;

    // El cristal: lámina delantera semitransparente, justo por delante
    // de la caja, que dejar ver el cartel de dentro
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.12,
      roughness: 0.1,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const glassGeo = makeRoundedPlaneGeometry(PANEL_W, PANEL_H, CASE_RADIUS);
    const glassMesh = new THREE.Mesh(glassGeo, glassMat);
    glassMesh.position.z = GLASS_Z;

    const group = new THREE.Group();
    let hingeSign = 0;
    let slotX = 0;
    let restAngle = 0;

    if (item.key === "left") {
      hingeSign = 1;
      slotX = -SLOT_X;
      restAngle = REST_ANGLE;
    } else if (item.key === "right") {
      hingeSign = -1;
      slotX = SLOT_X;
      restAngle = -REST_ANGLE;
    }

    const hingeOffset = hingeSign * (PANEL_W / 2);
    caseMesh.position.x = hingeOffset;
    posterMesh.position.x = hingeOffset;
    glassMesh.position.x = hingeOffset;

    group.position.set(slotX, PANEL_H / 2, 0);
    group.rotation.y = restAngle;
    group.add(caseMesh);
    group.add(posterMesh);
    group.add(glassMesh);
    scene.add(group);

    const spot = new THREE.SpotLight(0xffeccb, 0, 9, Math.PI / 7, 0.45, 1.4);
    spot.position.set(slotX, PANEL_H + 1.6, 2.6);
    spot.target.position.set(slotX, PANEL_H / 2, 0);
    spot.castShadow = true;
    spot.shadow.mapSize.set(1024, 1024);
    spot.shadow.bias = -0.003;
    scene.add(spot, spot.target);

    panels.push({
      item,
      mesh: posterMesh,
      group,
      spot,
      restAngle,
      hoverAngle: item.key === "center" ? 0 : HOVER_ANGLE * (item.key === "left" ? 1 : -1)
    });
    raycastTargets.push(posterMesh);
  });

  /* ------------------------------------------------------------------------
     Encuadre de cámara, responsive
     ------------------------------------------------------------------------ */

  const LOOK_AT_Y = 1.0;
  const ZOOM = 0.48;

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
    camera.position.set(
      0,
      LOOK_AT_Y + baseHeightOffset * ZOOM,
      baseDistance * ZOOM
    );
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
     Interacción: raycaster + GSAP
     ------------------------------------------------------------------------ */

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let hoveredPanel = null;

  function setHover(panel, isHover) {
    const dur = reducedMotion ? 0.05 : 0.5;
    gsap.to(panel.group.rotation, {
      y: isHover ? panel.hoverAngle : panel.restAngle,
      duration: dur,
      ease: "power3.out"
    });
    gsap.to(panel.spot, {
      intensity: isHover ? 1.7 : 0,
      duration: dur,
      ease: "power2.out"
    });
    gsap.to(panel.group.scale, {
      x: isHover ? 1.06 : 1,
      y: isHover ? 1.06 : 1,
      z: isHover ? 1.06 : 1,
      duration: dur,
      ease: "power3.out"
    });
  }

  function updatePointer(clientX, clientY) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  }

  function checkHover() {
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(raycastTargets);
    const hitMesh = hits.length ? hits[0].object : null;
    const hitPanel = hitMesh
      ? panels.find((p) => p.mesh === hitMesh)
      : null;

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

  renderer.domElement.addEventListener("click", () => {
    if (hoveredPanel) {
      window.location.href = hoveredPanel.item.href;
    }
  });

  /* ------------------------------------------------------------------------
     Bucle de render
     ------------------------------------------------------------------------ */

  function tick() {
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
