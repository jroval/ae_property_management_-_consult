# AE Property Management & Consult — Web corporativa

Web corporativa multipágina y multiidioma para una empresa de servicios y
gestión de propiedades en Mallorca. Desarrollada con HTML5, CSS3 y
JavaScript vanilla, sin frameworks ni librerías externas de UI.

## Stack técnico

- HTML5 semántico
- CSS3 (sin preprocesadores, sin Bootstrap/Tailwind)
- JavaScript vanilla (solo donde es funcionalmente necesario: menú móvil,
  carrusel del hero, selector de idioma)
- Sin dependencias de build (no npm, no bundlers) — el proyecto se abre y
  se sirve directamente

## Requisitos para desarrollo local

- Visual Studio Code
- Extensión recomendada: **Live Server** (Ritwick Dey) para previsualizar
  con recarga automática
- Navegador moderno actualizado (Chrome, Firefox, Edge o Safari)

## Cómo ejecutar el proyecto en local

1. Abrir la carpeta raíz `AE Property Management & Consult/` en VS Code.
2. Clic derecho sobre `es/index.html` → **Open with Live Server**.
3. El navegador se abrirá en `http://127.0.0.1:5500/es/index.html`
   (el puerto puede variar).
4. Cualquier cambio guardado en HTML/CSS/JS se refleja automáticamente.

No requiere `npm install` ni ningún paso de compilación previo.

## Estructura de carpetas

AE Property Management & Consult/
├── es/ → Páginas en español (idioma principal)
├── en/ → Páginas en inglés
├── de/ → Páginas en alemán
├── css/
│ ├── reset.css → Normalización de estilos por defecto del navegador
│ ├── variables.css → Design tokens: color, tipografía, espaciado (SIEMPRE se carga primero)
│ ├── components.css → Componentes reutilizables (botones, tarjetas, formularios)
│ ├── styles.css → Estilos generales de layout y secciones
│ └── responsive.css → Media queries (mobile-first)
├── js/
│ └── main.js → Menú móvil, carrusel del hero, selector de idioma, formulario
├── assets/
│ ├── images/ → Imágenes optimizadas del sitio
│ │ └── hero/ → Imágenes del carrusel del hero
│ ├── icons/ → Iconos SVG
│ ├── fonts/ → Fuentes locales (si se decide auto-hospedar en vez de Google Fonts)
│ └── logo/ → Logotipo en distintos formatos/tamaños
├── index.html → Página raíz: detecta idioma del navegador y
│ redirige a /es/, /en/ o /de/; incluye
│ selector visual manual como respaldo
├── favicon.ico
├── robots.txt
├── sitemap.xml → Incluye las URLs de los 3 idiomas con hreflang
└── README.md

## Idiomas

El sitio es multiidioma mediante subdirectorios (`/es/`, `/en/`, `/de/`),
la opción recomendada para SEO internacional frente a subdominios o
dominios distintos por país, ya que concentra toda la autoridad SEO en un
único dominio.

- **Idioma por defecto:** español (`es`)
- **`index.html` raíz:** detecta `navigator.language` del navegador y
  redirige a la versión correspondiente; incluye también un selector
  visual manual (ES/EN/DE) como alternativa, y guarda la elección del
  usuario en `localStorage` para futuras visitas
- **CSS, JS y `assets/` son compartidos** entre los 3 idiomas — no se
  duplican. Solo el HTML se traduce.
- Cada página incluye etiquetas `hreflang` apuntando a sus equivalentes
  en los otros idiomas, más un `x-default` hacia `/es/`

**Orden de trabajo:** el contenido se desarrolla primero íntegramente en
español; inglés y alemán se añaden después traduciendo sobre la
plantilla ya validada, sin modificar código.

## Sistema visual

### Paleta de color (monocromática cálida + acento único)

| Variable CSS | Valor | Uso |
|---|---|---|
| `--color-bg` | `#FAF8F5` | Fondo principal |
| `--color-bg-alt` | `#EFEBE4` | Fondos secundarios, tarjetas |
| `--color-border` | `#D8D2C7` | Bordes, líneas divisorias |
| `--color-text-secondary` | `#8C8579` | Texto secundario |
| `--color-text` | `#4A4640` | Texto de cuerpo |
| `--color-text-strong` | `#211F1B` | Titulares, texto enfatizado |
| `--color-dark-bg` | `#211F1B` | Fondos oscuros (footer, CTA final) |
| `--color-accent` | `#B8875B` | Único acento — CTAs, WhatsApp, hover, focus |

Todas las variables completas están documentadas en `css/variables.css`.

### Tipografía

- **Fraunces** (serif) — titulares, H1-H3
- **Inter** (sans-serif) — cuerpo de texto, navegación, botones
- Ambas cargadas vía Google Fonts (licencia comercial abierta y gratuita)

## Convenciones de código

- **Nomenclatura de clases CSS:** kebab-case descriptivo por componente
  (ej. `.hero-carousel`, `.service-card`, `.btn-primary`). No se usan
  abreviaturas ambiguas.
- **Metodología:** clases reutilizables y de bajo acoplamiento, evitando
  selectores anidados profundos. Mobile-first en todas las media queries.
- **Nombres de archivo:** siempre en minúsculas, sin espacios, con
  guiones (`politica-privacidad.html`, no `PoliticaPrivacidad.html`).
- **Rutas relativas:** cada página dentro de `es/`, `en/` o `de/`
  referencia los recursos compartidos con `../` (ej. `../css/styles.css`,
  `../assets/logo/logo.svg`).
- **JavaScript:** un único archivo `main.js`, organizado por funciones
  independientes (menú móvil, carrusel, selector de idioma, validación
  de formulario), sin dependencias externas.

## SEO y accesibilidad

- HTML semántico (`<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`)
- Metadescripciones y Open Graph únicos por página e idioma
- `sitemap.xml` con anotaciones `hreflang`
- Atributos `alt` descriptivos en todas las imágenes
- Contraste de color validado (mínimo WCAG AA)
- Estados `:hover` y `:focus` visibles en todos los elementos interactivos
- Carrusel del hero con controles pausables (cumple WCAG 2.2.2)

## Estado del proyecto

- [x] Mapa del sitio y arquitectura multiidioma definidos
- [x] Sistema visual (color y tipografía) definido
- [x] Estructura de carpetas creada
- [x] `css/variables.css` creado
- [ ] `css/reset.css`
- [ ] `css/components.css`
- [ ] `css/styles.css`
- [ ] `css/responsive.css`
- [ ] `js/main.js`
- [ ] Header y navegación responsive
- [ ] Footer
- [ ] Páginas en español (`es/`)
- [ ] Páginas legales
- [ ] Traducción a inglés (`en/`)
- [ ] Traducción a alemán (`de/`)
- [ ] Revisión de responsive, accesibilidad, SEO y rendimiento
- [ ] Despliegue

## Despliegue

Pendiente de decidir en la fase final del proyecto (paso 13 del plan de
desarrollo).