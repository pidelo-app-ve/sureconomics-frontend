import {
    defineConfig, loadEnv
} from 'vite'
import react from '@vitejs/plugin-react'

/**
 * El proxy de `/media` es el gemelo local del rewrite de `vercel.json`.
 *
 * Las imágenes se guardan en un bucket privado y salen por un endpoint del backend, así
 * que el sitio las pide como `/media/<clave>` -- una ruta relativa a su propio origen.
 * En producción, Vercel reescribe eso hacia el backend y cachea la respuesta en su
 * borde. En local no hay nada que lo reescriba, así que sin esto la imagen se pediría a
 * `localhost:3000/media/...`, donde no vive nada, y las tarjetas saldrían sin foto.
 *
 * Es la clase de fallo que se diagnostica mal: parece que la subida a R2 no funcionó
 * cuando el archivo está perfectamente guardado, y sólo falta quien sirva la ruta.
 *
 * El destino sale de `VITE_API_URL`, la misma variable con la que el sitio habla con la
 * API, para que no haya una segunda dirección que mantener al día.
 *
 * `/datos` es el otro gemelo: las lecturas públicas que en producción contesta el borde
 * de Vercel (`src/api/quiosco.js`). Aquí se quita el prefijo y van a la API local.
 */
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '')
    const api = (env.VITE_API_URL || 'http://127.0.0.1:5100').replace(/\/$/, '')

    return {
        plugins: [react()],
        server: {
            port: 3000,
            proxy: {
                '/media': {
                    target: api,
                    changeOrigin: true,
                },
                '/datos': {
                    target: api,
                    changeOrigin: true,
                    rewrite: (ruta) => ruta.replace(/^\/datos/, ''),
                },
            },
        },
        build: {
            outDir: 'dist',
            // Navegadores a los que se apunta. Vite 4 traía por defecto 'modules'
            // (Chrome/Edge 87-88, Firefox 78, Safari 14); Vite 7 lo sube a Chrome/Edge
            // 107, Firefox 104 y Safari 16, y con eso el CSS perdía los prefijos
            // `-webkit-appearance` y el desglose de `inset` que necesitan los iPhone con
            // iOS 14-15: selectores y cajas se verían distintos. Subir el listón es una
            // decisión aparte, no un efecto de actualizar Vite.
            //
            // CSS: exactamente el listón de Vite 4.
            // JS: el mismo, salvo Chrome/Edge 91 en vez de 87-88. Con 87 esbuild
            // reescribe cada `a?.b` a mano (Chrome 80-90 fallan con `f?.(...a, b)`,
            // crbug.com/v8/11558; una regla de eslint.config.js prohíbe ese patrón)
            // y eso solo engorda la entrada +1,2 KB gzip; Chrome
            // entiende `?.` desde la 80 y todo el JS sigue siendo ES2020. Para volver al
            // listón exacto de Vite 4 basta con poner 'edge88' y 'chrome87' aquí.
            target: ['es2020', 'edge91', 'firefox78', 'chrome91', 'safari14'],
            cssTarget: ['edge88', 'firefox78', 'chrome87', 'safari14'],
        }
    }
})
