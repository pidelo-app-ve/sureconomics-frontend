# Sureconomics Frontend (Vite + React)

This is the Sur Economics single-page app. The editorial/blog experience is backed by a Flask API (published posts, categories and tags).

## Documentos

- `DESIGN.md` y `PRODUCT.md`: el sistema de diseño y el producto (en la raíz porque las herramientas de diseño los leen ahí).
- `docs/POLITICA-COOKIES-PENDIENTE.md` y `docs/LEGAL-PENDIENTE.md`: lo que falta en `/cookies` y en las páginas legales.
- `docs/EL-ANALISTA.md`: cómo se trae el juego de El Analista desde su repositorio.
- `docs/marca/`: los logos originales del manual de marca (los que sirve el sitio están en `public/brand/`).
- Planes, revisiones y guías que cruzan los dos repositorios: en `docs/` de la carpeta que contiene este repo.

## Local development

### Prerequisites

- Node.js **20+**

### Configure environment

1. Copy env template:

```bash new deploy
cp .env.example .env
```

2. Set the backend base URL:

- **Local Flask**: `VITE_API_URL=http://127.0.0.1:5000`
- **Remote**: `VITE_API_URL=https://your-backend-host`

### Run

```bash
npm install
npm run start
```

## Backend endpoints expected

- `GET /health`
- `GET /categories`
- `GET /tags`
- `GET /posts` (published-only; supports pagination; optional `category` and `tag`)
- `GET /posts/<slug>` (single published post)

## Frontend content architecture

- `src/services/apiClient.js`: small fetch wrapper (base URL via `VITE_API_URL`) + `ApiError`
- `src/services/contentService.js`: content-focused API (posts/categories/tags)
- `src/services/contentMappers.js`: normalizes backend responses to stable frontend shapes

