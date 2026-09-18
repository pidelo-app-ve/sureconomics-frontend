import { ApiError } from "./apiClient";
import {
  descargarArchivoDeUsuario,
  userOptionalAuthRequest,
  userPublicRequest,
  userRequest,
} from "../lib/userApi";

/**
 * Educacion: el catalogo, el temario y el cobro de un modulo.
 *
 * Dos cosas que este archivo hace y conviene no deshacer:
 *
 * **El temario se pide con `userOptionalAuthRequest`.** El servidor calcula los candados
 * segun quien pregunta, asi que hay que mandarle el token si lo hay -- pero sin exigir
 * sesion, porque un visitante anonimo tiene que poder ver el temario y el precio. Es el
 * mismo caso que los informes de descarga abierta, y por eso usa el mismo ayudante.
 *
 * **El 403 de una leccion cerrada no es un fallo, es la respuesta.** Trae dentro el
 * precio y `has_access: false`, que es justo lo que el muro de pago necesita para
 * dibujarse. Por eso se traduce a un objeto en vez de propagarse como excepcion: quien
 * llama tiene que poder distinguir "no puedes" de "se cayo la red".
 */

/** El catalogo. Publico: no hace falta sesion ni para verlo ni para ver el precio. */
export const getCatalogo = async () => {
  const datos = await userPublicRequest("/education/modules");
  return {
    modulos: Array.isArray(datos?.modulos) ? datos.modulos : [],
    pasarelas: Array.isArray(datos?.pasarelas) ? datos.pasarelas : [],
  };
};

/** El modulo con su temario y los candados ya resueltos para quien pregunta. */
export const getModulo = async (slug) =>
  userOptionalAuthRequest(`/education/modules/${encodeURIComponent(slug)}`);

/**
 * El contenido de una leccion.
 *
 * Devuelve `{ leccion }` cuando se puede leer, y `{ bloqueada, motivo, precio }` cuando
 * no. Un 403 aqui es informacion, no un error: significa "esta es de pago y este es el
 * precio".
 */
export const getLeccion = async (moduloSlug, leccionSlug) => {
  const ruta = `/education/modules/${encodeURIComponent(moduloSlug)}/lessons/${encodeURIComponent(
    leccionSlug,
  )}`;
  try {
    return { leccion: await userOptionalAuthRequest(ruta), bloqueada: false };
  } catch (err) {
    if (err instanceof ApiError && (err.status === 403 || err.status === 401)) {
      const detalles = err.details || {};
      return {
        leccion: null,
        bloqueada: true,
        // Tres motivos distintos, tres mensajes distintos en la pantalla: no es lo
        // mismo "entre a su cuenta" que "verifique el correo" que "compre el modulo".
        motivo:
          err.status === 401
            ? "sin-sesion"
            : err.code === "email_not_verified"
              ? "sin-verificar"
              : "sin-compra",
        precioCentavos: detalles.precio_centavos ?? null,
        moneda: detalles.moneda ?? null,
      };
    }
    throw err;
  }
};

/**
 * Abre el pago y devuelve a donde hay que mandar al comprador.
 *
 * Exige sesion de verdad (`userRequest`): quien no la tenga no llega hasta aqui, porque
 * el boton de comprar no se dibuja sin cuenta.
 */
export const abrirPago = async (moduloSlug, proveedor) =>
  userRequest("/payments/checkout", {
    method: "POST",
    json: { modulo: moduloSlug, proveedor },
  });

/** Como va una compra. La consulta la pagina de retorno mientras espera el aviso. */
export const getEstadoDePago = async (referencia) =>
  userRequest(`/payments/status/${encodeURIComponent(referencia)}`);

/**
 * El archivo de una leccion (PDF o audio), con la sesion puesta.
 *
 * Por aqui y no con un enlace directo: el servidor vuelve a comprobar el acceso en cada
 * peticion, y una direccion suelta se puede reenviar. Es lo mismo que ya se hace con el
 * informe descargable.
 */
export const descargarArchivoDeLeccion = (moduloSlug, leccionSlug, nombreSugerido) =>
  descargarArchivoDeUsuario(
    `/education/modules/${encodeURIComponent(moduloSlug)}/lessons/${encodeURIComponent(
      leccionSlug,
    )}/archivo`,
    { nombreSugerido },
  );

/**
 * El audio de una leccion, ya descargado, para poder reproducirlo.
 *
 * Un `<audio src="...">` no manda la cabecera de sesion, asi que apuntarlo a la ruta
 * protegida devolveria 401 sobre un archivo que la persona si compro. La unica via es
 * traerlo con la sesion puesta y darle al elemento un blob.
 */
export const getAudioDeLeccion = (moduloSlug, leccionSlug) =>
  descargarArchivoDeUsuario(
    `/education/modules/${encodeURIComponent(moduloSlug)}/lessons/${encodeURIComponent(
      leccionSlug,
    )}/archivo`,
    { comoBlob: true },
  );

/** Precio legible: 2000 centavos + "USD" -> "US$ 20". */
export const precioLegible = (centavos, moneda) => {
  const valor = (Number(centavos) || 0) / 100;
  try {
    return new Intl.NumberFormat("es", {
      style: "currency",
      currency: moneda || "USD",
      // Sin decimales cuando el precio es redondo: "US$ 20" se lee mejor que
      // "US$ 20,00" en una tarjeta de catalogo.
      minimumFractionDigits: Number.isInteger(valor) ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(valor);
  } catch {
    // Una moneda que `Intl` no conozca no puede dejar la tarjeta sin precio.
    return `${valor} ${moneda || ""}`.trim();
  }
};

/**
 * Duracion legible: 200 -> "3 h 20 min", 45 -> "45 min", null -> "".
 *
 * Devuelve cadena vacia cuando no hay dato, y no un "por determinar": el servidor manda
 * `null` justamente cuando no se puede afirmar nada, y la interfaz tiene que poder
 * callarse. Un texto de relleno en ese hueco es peor que el hueco.
 */
export const duracionLegible = (minutos) => {
  const total = Number(minutos);
  if (!Number.isFinite(total) || total <= 0) return "";
  const horas = Math.floor(total / 60);
  const resto = total % 60;
  if (!horas) return `${resto} min`;
  return resto ? `${horas} h ${resto} min` : `${horas} h`;
};

/** Como se llama cada nivel en pantalla. El servidor los guarda en minusculas. */
export const NIVELES = {
  inicial: "Inicial",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
};

export const nivelLegible = (nivel) => NIVELES[nivel] ?? "";

/** Como se llama cada tipo de leccion, en singular y en plural. */
const TIPOS = {
  video: ["video", "videos"],
  texto: ["lectura", "lecturas"],
  audio: ["audio", "audios"],
  pdf: ["documento", "documentos"],
};

/**
 * La mezcla de formatos de un modulo: {video: 2, texto: 1} -> "2 videos · 1 lectura".
 *
 * Se ordena de mas a menos, no por el orden del objeto: lo que define el modulo es su
 * formato dominante, y ponerlo primero es lo que hace que la linea se pueda leer de un
 * vistazo sin sumar mentalmente.
 */
export const mezclaLegible = (tipos) => {
  if (!tipos || typeof tipos !== "object") return "";
  return Object.entries(tipos)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([tipo, n]) => {
      const nombres = TIPOS[tipo] ?? [tipo, tipo];
      return `${n} ${n === 1 ? nombres[0] : nombres[1]}`;
    })
    .join(" · ");
};
