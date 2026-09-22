import PropTypes from "prop-types";

import {
  GUIA_DE_FORMATO,
  nombreDeFormato,
} from "../../lib/formatosDePublicidad";

/**
 * Quién está al aire: un mosaico con el logotipo de cada anunciante que paga.
 *
 * El panel se navega desplegando anunciante → campaña → pieza, y para ver un logotipo
 * había que abrir tres niveles. Con cinco marcas eso ya es incómodo; el día que sean
 * veinte, saber quién está al aire ahora mismo deja de ser algo que se pueda contestar
 * de un vistazo. Este mosaico lo contesta sin abrir nada.
 *
 * ## De dónde sale el logotipo
 *
 * No hay campo «logo» en el anunciante, y no se añadió uno: el logotipo ya vive en sus
 * piezas (`creatividades[].imagen`), y un segundo sitio donde guardarlo sería un
 * segundo sitio donde puede quedarse viejo. Se toma el de la primera pieza activa de
 * una campaña activa — que es, literalmente, la imagen que el lector está viendo.
 *
 * Si no hay ninguna, se pinta la inicial sobre color. Un hueco gris con un icono de
 * imagen rota se lee como un fallo del panel, y lo que pasa de verdad es que esa marca
 * todavía no tiene arte cargado.
 *
 * ## Qué no entra
 *
 * La casa. «Anúnciate aquí» es relleno, no un cliente: mezclarlo con las marcas que
 * pagan convertiría este mosaico en un recuento que miente sobre cuántos anunciantes
 * hay. Se cuenta aparte, al pie.
 */

/**
 * Los estados posibles de un anunciante, de más a menos urgente de ver.
 *
 * «Al aire» y «activa» no son lo mismo, y la diferencia es la que más confunde en una
 * reunión con un anunciante: una campaña guardada como activa puede estar fuera de
 * fecha o haber gastado su tope, y entonces el servidor no la sirve nunca. Decirle «Al
 * aire» a eso es decirle al comercial que su cliente está saliendo cuando lleva días
 * sin aparecer.
 *
 * Quién lo decide no es esta pantalla: el servidor manda `freno` en cada campaña,
 * calculado con las mismas funciones que reparten los espacios de verdad.
 */
const ESTADOS = {
  activa: { texto: "Al aire", clase: "se-mural__sello--activa" },
  tope: { texto: "Tope alcanzado", clase: "se-mural__sello--tope" },
  fecha: { texto: "Fuera de fecha", clase: "se-mural__sello--tope" },
  pausada: { texto: "En pausa", clase: "se-mural__sello--pausada" },
  borrador: { texto: "Borrador", clase: "se-mural__sello--borrador" },
  terminada: { texto: "Terminada", clase: "se-mural__sello--terminada" },
  ninguna: { texto: "Sin campaña", clase: "se-mural__sello--ninguna" },
};

const ORDEN_DE_ESTADO = [
  "activa",
  "tope",
  "fecha",
  "pausada",
  "borrador",
  "terminada",
  "ninguna",
];

/** El estado que mejor describe al anunciante: el más "encendido" de sus campañas. */
const estadoDe = (anunciante) => {
  const estados = (anunciante.campanas ?? []).map((c) => {
    if (c.estado !== "activa") return c.estado;
    // Activa, pero el servidor puede no estar sirviéndola. `freno` dice por qué.
    return c.freno ?? "activa";
  });
  return ORDEN_DE_ESTADO.find((e) => estados.includes(e)) ?? "ninguna";
};

/**
 * La pieza que representa al anunciante: la que el lector está viendo ahora.
 *
 * Se devuelve la creatividad entera y no solo su imagen porque la ficha enseña las dos
 * cosas: el logotipo y **lo que ese logotipo está diciendo**. Un mosaico de logotipos
 * sin texto contesta «quién paga» y deja sin contestar «qué anuncia», que es la mitad
 * de lo que hace falta saber para revisar si una campaña encaja con la portada del día.
 *
 * El orden de preferencia va de lo más real a lo menos: pieza activa de campaña activa
 * → cualquiera de campaña activa → cualquiera. La primera es la que de verdad se está
 * sirviendo; las otras dos son lo mejor que hay cuando no se sirve nada.
 */
const piezaDeMuestra = (anunciante) => {
  const campanas = anunciante.campanas ?? [];
  const activas = campanas.filter((c) => c.estado === "activa");
  for (const lote of [activas, campanas]) {
    for (const soloActivas of [true, false]) {
      for (const campana of lote) {
        const pieza = (campana.creatividades ?? []).find(
          (cr) =>
            (soloActivas ? cr.activa : true) &&
            // `cinta` incluida: un banner no tiene `imagen`, y sin esto el anunciante
            // que solo compra banners se pintaba como «Sin pieza» teniendo varias.
            (cr.imagen || cr.cinta || cr.titular),
        );
        if (pieza) return pieza;
      }
    }
  }
  return null;
};

/** El dominio de una dirección: «rendivalores.com». La marca, en dos palabras. */
const dominio = (direccion) => {
  try {
    return new URL(direccion).hostname.replace(/^www\./, "");
  } catch {
    // Una dirección mal formada no puede tumbar el panel entero. Se calla y ya.
    return null;
  }
};

/** Adónde manda la pieza. Es lo que promociona. */
const destinoDe = (pieza) => (pieza?.enlace ? dominio(pieza.enlace) : null);

/**
 * Lo que hay que ver antes de que pase: vence pronto, o el tope se va a agotar.
 *
 * Una campaña que termina el viernes se veía igual que una que acaba de empezar, y
 * enterarse el lunes significa un anunciante que estuvo fuera el fin de semana sin que
 * nadie lo llamara para renovar. El umbral de siete días es el que deja tiempo a hacer
 * esa llamada; el del 85 % del tope, a decidir si se amplía antes de que se apague.
 */
const avisoDe = (anunciante) => {
  for (const campana of anunciante.campanas ?? []) {
    if (campana.estado !== "activa" || campana.freno) continue;
    if (campana.dias_restantes != null && campana.dias_restantes <= 7) {
      return campana.dias_restantes <= 0
        ? "Termina hoy"
        : `Vence en ${campana.dias_restantes} ${campana.dias_restantes === 1 ? "día" : "días"}`;
    }
    if (campana.porcentaje_del_tope != null && campana.porcentaje_del_tope >= 85) {
      return `${campana.porcentaje_del_tope} % del tope gastado`;
    }
  }
  return null;
};

const cuentaDePiezas = (anunciante) =>
  (anunciante.campanas ?? []).reduce((n, c) => n + (c.creatividades ?? []).length, 0);

/** Impresiones y clics del anunciante, sumando los de cada una de sus piezas. */
const cifrasDe = (anunciante, cifrasPorPieza) => {
  let impresiones = 0;
  let clics = 0;
  for (const campana of anunciante.campanas ?? []) {
    for (const pieza of campana.creatividades ?? []) {
      const fila = cifrasPorPieza[pieza.id];
      impresiones += fila?.impresiones ?? 0;
      clics += fila?.clics ?? 0;
    }
  }
  return { impresiones, clics };
};

export const MuralDeAnunciantes = ({ anunciantes, cifrasPorPieza, onAbrir }) => {
  const quePagan = anunciantes.filter((a) => !a.es_casa);
  const casa = anunciantes.find((a) => a.es_casa);

  if (!quePagan.length) {
    return (
      <section className="se-mural se-mural--vacio">
        <p>
          Todavía no hay anunciantes. Mientras tanto, los espacios los llena
          {casa ? ` «${casa.nombre}»` : " el relleno de la casa"}, que invita a
          contratarlos.
        </p>
      </section>
    );
  }

  // Al aire primero: es lo que se viene a comprobar. Dentro de cada estado, por
  // impresiones, que es lo que distingue a un anunciante grande de uno testimonial.
  const ordenados = [...quePagan].sort((a, b) => {
    const ea = ORDEN_DE_ESTADO.indexOf(estadoDe(a));
    const eb = ORDEN_DE_ESTADO.indexOf(estadoDe(b));
    if (ea !== eb) return ea - eb;
    return cifrasDe(b, cifrasPorPieza).impresiones - cifrasDe(a, cifrasPorPieza).impresiones;
  });

  const alAire = ordenados.filter((a) => estadoDe(a) === "activa").length;

  return (
    <section className="se-mural" aria-label="Anunciantes">
      <h2 className="se-mural__titulo">
        Quién está al aire
        <span className="se-mural__cuenta">
          {alAire} de {quePagan.length}
          {quePagan.length === 1 ? " anunciante" : " anunciantes"}
        </span>
      </h2>

      <ul className="se-mural__rejilla">
        {ordenados.map((anunciante) => {
          const pieza = piezaDeMuestra(anunciante);
          const destino = destinoDe(pieza);
          const web = anunciante.sitio_web ? dominio(anunciante.sitio_web) : null;
          const aviso = avisoDe(anunciante);
          const estado = ESTADOS[estadoDe(anunciante)];
          const { impresiones, clics } = cifrasDe(anunciante, cifrasPorPieza);
          const piezas = cuentaDePiezas(anunciante);

          return (
            <li key={anunciante.id}>
              <button
                type="button"
                className={`se-mural__ficha${
                  estadoDe(anunciante) === "activa" ? "" : " se-mural__ficha--apagada"
                }`}
                onClick={() => onAbrir?.(anunciante.id)}
              >
                {/* El logotipo de la marca manda sobre el arte de la pieza: la pieza
                    puede ser un cartel de rebajas de este mes, y aquí se viene a
                    reconocer al anunciante, no a su campaña. El arte queda de respaldo
                    para quien todavía no haya cargado su logotipo. */}
                <span className="se-mural__logo">
                  {anunciante.logo?.url || pieza?.imagen || pieza?.cinta ? (
                    <img
                      src={anunciante.logo?.url || pieza.imagen || pieza.cinta}
                      alt=""
                      loading="lazy"
                    />
                  ) : (
                    <span className="se-mural__inicial" aria-hidden="true">
                      {anunciante.nombre.trim().charAt(0).toUpperCase()}
                    </span>
                  )}
                </span>

                <span className="se-mural__cabeza">
                  <span className="se-mural__nombre">{anunciante.nombre}</span>
                  <span className={`se-mural__sello ${estado.clase}`}>{estado.texto}</span>
                </span>

                {aviso ? <span className="se-mural__aviso">{aviso}</span> : null}

                {/* Qué anuncia, en sus propias palabras: el titular de la pieza y su
                    pie. Es el texto que el lector ve debajo del logotipo, copiado tal
                    cual — reescribirlo aquí en un resumen propio dejaría al panel
                    diciendo algo distinto de lo que está publicado. */}
                {pieza?.titular || pieza?.titular_corto ? (
                  <span className="se-mural__titular">
                    «{pieza.titular || pieza.titular_corto}»
                  </span>
                ) : /* Reclamarlo sólo donde se publica. Un banner no imprime titular en
                      ninguna parte, así que a un anunciante de sólo banners esto le
                      pintaba una falta en rojo por no rellenar un campo que la pieza
                      ni siquiera enseña ya. */
                GUIA_DE_FORMATO[pieza?.formato]?.titular ? (
                  <span className="se-mural__titular se-mural__titular--falta">
                    Sin titular todavía
                  </span>
                ) : null}

                {pieza?.pie ? <span className="se-mural__pie">{pieza.pie}</span> : null}

                <span className="se-mural__destino">
                  {pieza ? nombreDeFormato(pieza.formato, null) : "Sin pieza"}
                  {destino ? (
                    <>
                      <span aria-hidden="true"> → </span>
                      {destino}
                    </>
                  ) : null}
                </span>

                {/* La página y el contacto de la marca, cuando los hay. Es lo que se
                    busca cuando hay que escribirle a alguien, y estaba enterrado tres
                    niveles de desplegable más abajo. */}
                {anunciante.sitio_web || anunciante.contacto_email ? (
                  <span className="se-mural__contacto">
                    {web ?? anunciante.contacto_email}
                  </span>
                ) : null}

                {/* Las cifras son de los últimos 30 días, como las de arriba. Un cero
                    se escribe, no se esconde: «0 impresiones» es justo el dato que hay
                    que ver en un anunciante que se cree al aire y no lo está. */}
                <span className="se-mural__cifras">
                  {impresiones.toLocaleString("es")} impr. · {clics.toLocaleString("es")}{" "}
                  {clics === 1 ? "clic" : "clics"}
                  <span className="se-mural__piezas">
                    {piezas} {piezas === 1 ? "pieza" : "piezas"}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {casa ? (
        <p className="se-mural__casa">
          Lo que no se vende lo ocupa «{casa.nombre}», el relleno de la casa. No cuenta
          como anunciante ni factura.
        </p>
      ) : null}
    </section>
  );
};

MuralDeAnunciantes.propTypes = {
  /** Los anunciantes tal como los sirve el panel, con sus campañas y piezas dentro. */
  anunciantes: PropTypes.arrayOf(PropTypes.object),
  /** Las cifras de 30 días, indexadas por id de pieza. */
  cifrasPorPieza: PropTypes.object,
  /** Se llama con el id del anunciante al pulsar su ficha. */
  onAbrir: PropTypes.func,
};

MuralDeAnunciantes.defaultProps = { anunciantes: [], cifrasPorPieza: {} };

export default MuralDeAnunciantes;
