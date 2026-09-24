#!/usr/bin/env bash
# Pide una página como la pide X (Twitterbot) y dice si su tarjeta va a salir bien.
#
#   bash scripts/probar-tarjeta-x.sh https://www.sureconomics.com/noticias/alguna-nota
#
# Qué mira, y por qué:
#   - el HTML trae twitter:card y twitter:image (X no ejecuta JavaScript: si no vienen
#     en el HTML, no existen);
#   - cuánto tarda la página y la imagen, y si salieron de la caché de Vercel (HIT) o
#     hicieron el viaje entero (MISS). X da poco tiempo; una imagen lenta es una tarjeta
#     sin imagen, y X la guarda así durante días;
#   - que la imagen pese menos de 5 MB y sea JPEG/PNG/WebP/GIF, que es lo que X acepta.
#
# Si X ya guardó una tarjeta mala: X no tiene botón ni API para borrar su caché. Se
# comparte la misma dirección con un parámetro cualquiera -- `?v=2`, `?v=3`... -- y para
# X es una dirección nueva que vuelve a leer. El sitio ignora ese parámetro.
set -u
URL="${1:?Uso: bash scripts/probar-tarjeta-x.sh <url de la página>}"
UA="Twitterbot/1.0"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "== Página: $URL"
curl -s -A "$UA" -o "$TMP/p.html" -D "$TMP/p.h" \
  -w "   tiempo total %{time_total}s · primera respuesta %{time_starttransfer}s · HTTP %{http_code}\n" "$URL"
grep -iE "^x-vercel-cache|^x-pieza-meta" "$TMP/p.h" | sed 's/^/   /'
grep -oE '<meta (name|property)="(twitter:card|twitter:title|twitter:image|og:image)"[^>]*>' "$TMP/p.html" | sed 's/^/   /'

IMG="$(grep -oE 'name="twitter:image" content="[^"]+"' "$TMP/p.html" | head -1 | sed 's/.*content="//;s/"$//')"
if [ -z "$IMG" ]; then
  echo "!! La página no trae twitter:image: la tarjeta saldrá sin imagen."
  exit 1
fi

echo "== Imagen: $IMG"
for vez in 1 2; do
  curl -s -L -A "$UA" -o "$TMP/i.bin" -D "$TMP/i.h" \
    -w "   intento $vez: %{time_total}s · %{size_download} bytes · HTTP %{http_code}\n" "$IMG"
  grep -iE "^content-type|^x-vercel-cache" "$TMP/i.h" | tail -2 | sed 's/^/     /'
done

PESO=$(wc -c < "$TMP/i.bin")
if [ "$PESO" -gt 5000000 ]; then
  echo "!! La imagen pesa más de 5 MB: X no la va a usar."
fi
echo "Si el segundo intento dice HIT y tarda décimas, X la recibe al instante."
