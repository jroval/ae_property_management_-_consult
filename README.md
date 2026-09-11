# AE Property Management & Consult — Web corporativa

Web corporativa multipágina y multiidioma para una empresa de gestión de
propiedades de lujo en Mallorca. Desarrollada con HTML5, CSS3 y
JavaScript vanilla, sin frameworks de UI ni pasos de build — con una
única excepción deliberada: la escena 3D de la home usa Three.js y GSAP
(ver más abajo).

## Stack técnico

- HTML5 semántico
- CSS3 (sin preprocesadores, sin Bootstrap/Tailwind)
- JavaScript vanilla en `js/main.js` (menú móvil, carrusel del hero,
  selector de idioma, validación de formulario, desplegable accesible
  personalizado en Contacto, reseñas expandibles en la home)
- **Excepción:** `js/showroom-3d.js` monta una escena 3D real (Three.js
  r149 + GSAP 3.12.5, cargados por CDN) solo en la sección "showroom" de
  la home. Es la única dependencia externa de todo el proyecto; el resto
  del sitio sigue siendo 100% vanilla. En dispositivos sin hover real
  (táctiles) la escena ni se inicializa: se muestran en su lugar tarjetas
  con foto en CSS puro (`.showroom-mobile-cards`)
- Sin dependencias de build (no npm, no bundlers) — el proyecto se abre y
  se sirve directamente

## Requisitos para desarrollo local

- Visual Studio Code
- Extensión recomendada: **Live Server** (Ritwick Dey) para previsualizar
  con recarga automática — alternativa: `python -m http.server` desde la
  raíz del proyecto
- Navegador moderno actualizado (Chrome, Firefox, Edge o Safari)

## Cómo ejecutar el proyecto en local

1. Abrir la carpeta raíz del proyecto en VS Code.
2. Clic derecho sobre `es/index.html` → **Open with Live Server**.
3. El navegador se abrirá en `http://127.0.0.1:5500/es/index.html`
   (el puerto puede variar).
4. Cualquier cambio guardado en HTML/CSS/JS se refleja automáticamente.

No requiere `npm install` ni ningún paso de compilación previo.

## Estructura de carpetas

```
AE PROPERTY/
├── es/  → Páginas en español (idioma de referencia para el contenido)
├── en/  → Páginas en inglés (idioma por defecto de la web)
├── de/  → Páginas en alemán
│         Cada idioma incluye: index, servicios, nosotros, contacto,
│         404, gracias, aviso-legal, politica-privacidad,
│         politica-cookies (9 páginas × 3 idiomas)
├── css/
│   ├── reset.css        → Normalización de estilos por defecto del navegador
│   ├── variables.css    → Design tokens: color, tipografía, espaciado (SIEMPRE se carga primero)
│   ├── components.css   → Componentes reutilizables (botones, tarjetas, formularios)
│   ├── styles.css       → Estilos generales de layout y secciones
│   └── responsive.css   → Media queries (mobile-first)
├── js/
│   ├── main.js          → Menú móvil, carrusel, idioma, formulario, desplegable de Contacto, reseñas
│   └── showroom-3d.js   → Escena 3D del showroom de la home (Three.js + GSAP)
├── assets/
│   ├── images/          → Imágenes optimizadas del sitio (hero/, services/, about/, home/)
│   ├── icons/           → Favicons PNG (favicon-16x16, favicon-32x32, apple-touch-icon, android-chrome)
│   ├── fonts/           → Reservada para auto-hospedar tipografías (vacía; ver nota en Tipografía)
│   └── logo/            → Logotipo real de marca (logo_ae.png)
├── index.html            → Página raíz: redirige a /en/
├── CNAME                 → Dominio definitivo de GitHub Pages (aeproperties.es)
├── favicon.ico
├── site.webmanifest      → Manifest para icono de pantalla de inicio / PWA básica
├── robots.txt
├── sitemap.xml            → Las 21 páginas indexables, con anotaciones hreflang
├── Cuestionario-informacion-pendiente.docx → Datos que faltan por confirmar con la clienta
└── README.md
```

## Idiomas

El sitio es multiidioma mediante subdirectorios (`/es/`, `/en/`, `/de/`),
la opción recomendada para SEO internacional frente a subdominios o
dominios distintos por país, ya que concentra toda la autoridad SEO en un
único dominio.

- **Idioma por defecto:** inglés (`en`)
- **`index.html` raíz:** redirige automáticamente a `/en/` (vía
  `meta http-equiv="refresh"` + JavaScript de respaldo); marcada como
  `noindex` para que Google no la indexe en lugar de `/en/index.html`
- **CSS, JS y `assets/` son compartidos** entre los 3 idiomas — no se
  duplican. Solo el HTML se traduce.
- Cada página incluye etiquetas `hreflang` apuntando a sus equivalentes
  en los otros idiomas, más un `x-default` hacia la raíz del dominio
  (`https://aeproperties.es/`, que redirige a `/en/`)
- Cada página interna (excepto `404`/`gracias`, marcadas `noindex`)
  incluye datos estructurados `BreadcrumbList` (JSON-LD); `servicios.html`
  incluye además `FAQPage`

**Orden de trabajo:** el contenido se desarrolla primero íntegramente en
español; inglés y alemán se añaden después traduciendo sobre la
plantilla ya validada. Al cerrar una funcionalidad nueva en español
(por ejemplo, el showroom 3D) se replica después en `en/` y `de/`.

## Sistema visual

### Paleta de color (mineral oscuro + acento verde oliva)

| Variable CSS | Valor | Uso |
|---|---|---|
| `--color-background` | `#101110` | Fondo principal (negro mineral, no negro absoluto) |
| `--color-background-soft` | `#161715` | Fondos de sección alternos |
| `--color-background-elevated` | `#1c1d1b` | Tarjetas y elementos elevados |
| `--color-text-primary` | `#f5f2ec` | Titulares, texto principal (blanco cálido) |
| `--color-text-secondary` | `#b9b6af` | Texto secundario |
| `--color-text-muted` | `#8e8c86` | Texto auxiliar, metadatos |
| `--color-accent` | `#6e7a4e` | **Acento definitivo de marca** — verde oliva ahumado. CTAs, enlaces, foco, WhatsApp |
| `--color-accent-hover` | `#8b9768` | Estado hover del acento |

Todas las variables completas están documentadas en `css/variables.css`.

> El acento de marca es verde oliva, no terracota — así lo confirmó la
> clienta como definitivo. El comentario de cabecera de `variables.css`
> todavía menciona "terracota" por error de una iteración anterior; el
> valor real de `--color-accent` es el correcto.

### Tipografía

- **Cormorant Garamond** (serif) — titulares, H1-H3 (`--font-heading`).
  Pesos 400/600/700, normal y cursiva (los títulos usan `<span>` en
  cursiva con frecuencia)
- **Manrope** (sans-serif) — cuerpo de texto, navegación, botones
  (`--font-body`). Pesos 400/600/700
- Cargadas vía Google Fonts (`<link>` en el `<head>` de las 27
  páginas, con `preconnect` a `fonts.googleapis.com` y
  `fonts.gstatic.com`). Si el visitante tiene bloqueado Google Fonts,
  el navegador cae en las alternativas del sistema (Georgia/Times New
  Roman, Segoe UI/Roboto) definidas en `--font-heading`/`--font-body`

## Convenciones de código

- **Nomenclatura de clases CSS:** kebab-case descriptivo por componente
  (ej. `.hero-carousel`, `.showroom-3d`, `.btn--primary`). No se usan
  abreviaturas ambiguas.
- **Metodología:** clases reutilizables y de bajo acoplamiento, evitando
  selectores anidados profundos. Mobile-first en todas las media queries.
- **Nombres de archivo:** siempre en minúsculas, sin espacios, con
  guiones (`politica-privacidad.html`, no `PoliticaPrivacidad.html`).
- **Rutas relativas:** cada página dentro de `es/`, `en/` o `de/`
  referencia los recursos compartidos con `../` (ej. `../css/styles.css`,
  `../assets/logo/logo_ae.png`).
- **Caché:** los CSS/JS compartidos (`styles.css`, `components.css`,
  `responsive.css`, `main.js`, `showroom-3d.js`) llevan un parámetro
  `?v=AAAAMMDD` en su URL para forzar la recarga en el navegador;
  súbelo en cada página que enlace el archivo que toques.
  `main.js` ya está versionado en las 27 páginas del sitio; el resto
  de archivos solo llevan versión en las páginas donde se han editado
  hasta ahora (no es todavía una cobertura 100% uniforme).
- **JavaScript:** `main.js` para todo el comportamiento general del
  sitio; `showroom-3d.js` aislado y con su propio *fallback* accesible
  si WebGL no está disponible o falla la inicialización.

## SEO y accesibilidad

- HTML semántico (`<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`)
- Títulos y metadescripciones únicos por página e idioma (verificado)
- Open Graph con imagen panorámica propia por página
- Datos estructurados `BreadcrumbList` y `FAQPage` (JSON-LD)
- `sitemap.xml` con anotaciones `hreflang` para las 21 páginas
  indexables (los 3 idiomas de index, servicios, nosotros, contacto,
  aviso-legal, política de privacidad y política de cookies; quedan
  fuera `404` y `gracias`, marcadas `noindex`)
- Atributos `alt` descriptivos en todas las imágenes de contenido;
  `alt=""` deliberado en imágenes puramente decorativas (carrusel del
  hero)
- Página `404.html` y `gracias.html` (post-formulario) propias, con
  `noindex`
- Contraste de color y estados `:hover`/`:focus-visible` visibles en
  todos los elementos interactivos
- Carrusel del hero con controles pausables (cumple WCAG 2.2.2)
- CTA fijo en móvil: botón flotante de WhatsApp, siempre visible

## Estado del proyecto

El sitio está construido y funcional en los 3 idiomas. Lo que queda
pendiente depende casi todo de información que debe confirmar la
clienta (ver `Cuestionario-informacion-pendiente.docx`), no de
desarrollo.

- [x] Arquitectura multiidioma, CSS, JS y sistema visual completos
- [x] Todas las páginas (home, servicios, nosotros, contacto, legales,
      404, gracias) en los 3 idiomas
- [x] Showroom 3D de la home (Three.js) con *fallback* de tarjetas en
      móvil
- [x] SEO on-page: títulos, metadescripciones, Open Graph, breadcrumbs,
      FAQ schema, robots.txt
- [x] Logo real, favicon e iconos de dispositivo aplicados
- [x] Identidad legal y datos de contacto reales aplicados (Política de
      Privacidad, Aviso Legal, footers, WhatsApp)
- [x] **Dominio definitivo** (`aeproperties.es`) aplicado en todo el
      sitio (canonical, hreflang, Open Graph, `robots.txt`) y en el
      `CNAME` de GitHub Pages
- [x] **`sitemap.xml`** relleno con las 21 páginas indexables
- [x] Reseñas reales de clientes en la home (Ilka, Fam. Kortüm, Alice
      & Pauline — sustituyeron a las tarjetas de ejemplo)
- [x] Google Fonts cargadas de verdad (Cormorant Garamond + Manrope)
- [ ] **Correo `info@aeproperties.es`** — dirección definitiva ya
      aplicada en toda la web; falta confirmar que el buzón esté
      creado y operativo
- [ ] Vincular el formulario de contacto a un proveedor de envío real
      (Netlify Forms, Formspree o similar) — hoy no envía a ningún sitio
- [ ] Ficha de Google Business Profile + Google Analytics
- [ ] Casos de estudio / ejemplos de trabajo realizado
- [ ] Foto real del equipo (hoy hay fotos de ambiente en Nosotros,
      marcadas como provisionales en el propio código)
- [ ] Datos estructurados `LocalBusiness` (necesita dirección/horario)
- [ ] Decidir si se compromete un tiempo de respuesta público (ej. "en
      menos de 24h")

## Despliegue

El sitio se sirve desde **GitHub Pages** en este mismo repositorio,
con dominio propio ya configurado: **`aeproperties.es`** (archivo
`CNAME` en la raíz). Sigue pendiente crear el buzón de correo real
del dominio (ver Estado del proyecto).
