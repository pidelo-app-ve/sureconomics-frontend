# Sur Economics — Blog — Guía de integración

## Estructura actual (fase demo)

- **Datos mock:** `src/data/blogMock.js`  
  Contiene categorías de navegación, hero, destacados, feed, sugeridos, texto del footer y helpers (`formatDate`, `getPostBySlug`). Pensado para sustituir por llamadas a API o CMS.

- **Estilos:** `src/styles/blog.css`  
  Design system editorial (variables CSS, componentes). Prefijo de clases: `se-`.

- **Componentes de blog:** `src/components/blog/`  
  - `Hero.jsx` — Título, claim y artículo destacado.
  - `PostCard.jsx` — Tarjeta reutilizable (imagen placeholder, categoría, título, extracto, meta, “Leer más”).
  - `FeaturedPosts.jsx` — Grid de destacados.
  - `BlogFeed.jsx` — Listado de últimas publicaciones.
  - `SuggestedReading.jsx` — “También te puede interesar”.
  - `NewsletterBlock.jsx` — Bloque de suscripción (solo UI).
  - `PlaceholderImage.jsx` — Placeholder de imagen por variante.

- **Páginas:**  
  - `Home.jsx` — Landing del blog (hero + destacados + feed + sugeridos + newsletter).  
  - `Article.jsx` — Artículo individual por `slug` (usa `getPostBySlug`; cuerpo mock).  
  - `Category.jsx` — Listado por categoría (`/categoria/:slug`).  
  - `Subscribe.jsx` — Placeholder “Suscribirse”.

- **Rutas:**  
  - `/` — Home (blog).  
  - `/articulo/:slug` — Artículo.  
  - `/categoria/:slug` — Categoría.  
  - `/suscribirse` — Suscripción.

## Siguiente fase: datos reales

1. **Sustituir mock por API/CMS**  
   Crear un módulo de servicios (ej. `src/services/blog.js`) que exponga:
   - `getFeatured()`, `getFeed()`, `getPostBySlug(slug)`, `getPostsByCategory(slug)`, etc.
   - Los componentes de blog pueden recibir datos por props o usar un hook (ej. `useBlogPost(slug)`).

2. **Formato de datos**  
   Mantener la forma actual de los objetos (slug, category, categorySlug, title, excerpt, date, readTime, imagePlaceholder o `imageUrl`). Si el CMS devuelve otro formato, mapear en el servicio.

3. **Imágenes**  
   Cuando haya URLs reales, en `PostCard` y `Article` usar `<img src={imageUrl} alt="..." />` en lugar de `PlaceholderImage` cuando exista `imageUrl`.

4. **Newsletter**  
   Conectar el formulario en `NewsletterBlock.jsx` a un endpoint o servicio de email (ej. backend propio o proveedor externo).

5. **SEO / meta**  
   En una app con SSR (ej. migrar a Next.js) o con helmet, rellenar título y descripción por ruta (especialmente `/articulo/:slug`).

## Convenciones

- Naming: componentes en PascalCase, archivos en PascalCase para componentes y camelCase para utilidades.
- Estilos: solo clases `se-*` en `blog.css`; no mezclar con Bootstrap en el blog.
- Accesibilidad: enlaces y botones con `:focus-visible`; labels en formularios; estructura de headings coherente.
