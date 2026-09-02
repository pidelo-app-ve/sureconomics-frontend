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
            },
        },
        build: {
            outDir: 'dist'
        }
    }
})
