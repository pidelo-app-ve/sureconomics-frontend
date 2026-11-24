/**
 * Un servidor de mentira para las pruebas: cambia `fetch` por uno que contesta con
 * respuestas grabadas, sin salir a la red. Lo pone `dom.mjs`; vale también sin él.
 *
 *     const servidor = servidorDePrueba();
 *     servidor.contestar("GET", "/admin/boletin/numeros", grabada("boletin/lista.json"));
 *     servidor.contestar("PATCH", "/admin/boletin/numeros/7", (p) => ({ ...grabada("boletin/numero.json"), … }));
 *     servidor.contestar("GET", "/posts", { estado: 502, cuerpo: { success: false, error: { message: "Bad gateway" } } });
 *     servidor.peticiones   // [{ metodo, ruta, consulta, cuerpo }], en el orden en que llegaron
 *
 * - `ruta` es la de la API, sin el dominio ni la consulta (`?pagina=2` va en `consulta`, un
 *   objeto). Puede ser un texto exacto o una expresión regular.
 * - La respuesta es el cuerpo JSON tal como lo manda el backend (`{ success, data }`), o
 *   `{ estado, cuerpo }` para otro código. También una función de la petición que devuelva
 *   eso, o una promesa: así una prueba decide **cuándo** llega (una respuesta lenta).
 * - Si hay varias para la misma petición, vale la última que se puso.
 * - Una petición sin respuesta **falla**: `fetch` rechaza con un error que la nombra y
 *   queda en `servidor.sinRespuesta`. Mejor eso que una pantalla de «no se pudo cargar»
 *   que la prueba no mira.
 *
 * `grabada("zona/archivo.json")` lee una respuesta de `src/pruebas/respuestas/` (copias
 * de lo que devuelve el backend; cada archivo dice en `_origen` de dónde sale) y devuelve
 * su `respuesta`, nueva cada vez: una prueba puede cambiarla sin tocar las demás.
 */
import { readFileSync } from "node:fs";

const RESPUESTAS = new URL("../../src/pruebas/respuestas/", import.meta.url);

export const grabada = (archivo) => {
  const { respuesta } = JSON.parse(readFileSync(new URL(archivo, RESPUESTAS), "utf8"));
  if (respuesta === undefined) throw new Error(`${archivo}: le falta "respuesta"`);
  return respuesta;
};

const leerCuerpo = (cuerpo) => {
  if (typeof cuerpo !== "string") return cuerpo ?? null;
  try {
    return JSON.parse(cuerpo);
  } catch {
    return cuerpo;
  }
};

export const servidorDePrueba = () => {
  let reglas = [];
  const servidor = {
    peticiones: [],
    sinRespuesta: [],
    contestar(metodo, ruta, respuesta) {
      reglas.push({ metodo: metodo.toUpperCase(), ruta, respuesta });
      return servidor;
    },
    /** Las peticiones a una ruta (y método, si se da). */
    a(ruta, metodo) {
      return servidor.peticiones.filter((p) => p.ruta === ruta && (!metodo || p.metodo === metodo.toUpperCase()));
    },
    reiniciar() {
      reglas = [];
      servidor.peticiones.length = 0;
      servidor.sinRespuesta.length = 0;
    },
  };

  globalThis.fetch = async (direccion, opciones = {}) => {
    const url = new URL(String(direccion), "https://api.prueba.invalid");
    const peticion = {
      metodo: (opciones.method ?? "GET").toUpperCase(),
      ruta: url.pathname,
      consulta: Object.fromEntries(url.searchParams),
      cuerpo: leerCuerpo(opciones.body),
    };
    servidor.peticiones.push(peticion);
    const regla = reglas.findLast(
      (r) => r.metodo === peticion.metodo && (r.ruta instanceof RegExp ? r.ruta.test(peticion.ruta) : r.ruta === peticion.ruta),
    );
    if (!regla) {
      const texto = `${peticion.metodo} ${peticion.ruta}`;
      servidor.sinRespuesta.push(texto);
      throw new TypeError(`servidor de prueba: sin respuesta grabada para ${texto}`);
    }
    const dada = await (typeof regla.respuesta === "function" ? regla.respuesta(peticion) : regla.respuesta);
    const { estado, cuerpo } = dada && "estado" in dada ? dada : { estado: 200, cuerpo: dada };
    return new Response(JSON.stringify(cuerpo), {
      status: estado,
      headers: { "Content-Type": "application/json" },
    });
  };
  if (globalThis.navigator) globalThis.navigator.sendBeacon = () => true;
  return servidor;
};
