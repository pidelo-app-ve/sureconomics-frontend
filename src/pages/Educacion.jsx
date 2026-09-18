import { useEffect, useState } from "react";
import { getCatalogo } from "../services/educacionService";
import { TarjetaDeModulo } from "../components/educacion/TarjetaDeModulo";
import { IconEscudo, IconLlave, IconVisto } from "../components/icons/educacion";

/**
 * Educacion: el catalogo de modulos.
 *
 * Esta pagina era antes una rejilla de piezas editoriales marcadas como educativas. El
 * cliente pidio (09/2026) que "Educacion" pase a ser el catalogo de modulos de pago, y
 * eso es lo que hay aqui. Las piezas de antes no se perdieron: siguen en su seccion de
 * siempre -- un articulo educativo sigue estando en Articulos --, solo dejaron de tener
 * una vista que las agrupara.
 *
 * ## Por que esta pagina tiene mas de una rejilla
 *
 * Porque es una pagina de venta y antes no lo era. Llevaba el hero institucional de
 * "Quienes somos" -- pensado para una declaracion de principios, con casi 250 px de
 * aire antes del contenido -- y debajo, directamente, las tarjetas. Quien llegaba veia
 * un titulo enorme, un vacio, y tres precios sin una sola razon para pagarlos.
 *
 * El orden de ahora sigue el patron de una pagina de precios: que es esto y por que
 * confiar, el producto, como funciona, y las dudas que frenan la compra. Lo que **no**
 * se copia de los sitios de cursos: contadores de urgencia, plazas que se agotan,
 * precios tachados y estrellas sin resenas detras. Eso convierte a corto plazo y quema
 * justo el activo que vende estos modulos, que es la credibilidad de la casa.
 *
 * ## El gancho va en la tarjeta, no en la letra pequena
 *
 * Cada tarjeta dice cuantas lecciones tiene y cuantas se abren sin pagar. Ese numero lo
 * calcula el servidor con la misma regla que luego aplica al servir la leccion, asi que
 * no puede prometer una clase gratis que despues conteste 403 -- que es exactamente lo
 * que pasaria si el texto estuviera escrito a mano en el panel.
 */

/** Las tres promesas de la cabecera. Son verdad comprobable, no adjetivos. */
const PROMESAS = [
  {
    Icono: IconLlave,
    titulo: "La primera clase, abierta",
    texto:
      "Se lee entera antes de pagar nada. Basta con una cuenta y el correo verificado.",
  },
  {
    Icono: IconEscudo,
    titulo: "Un pago y ya",
    texto: "No hay suscripción ni renovación automática. El módulo se compra y se queda.",
  },
  {
    Icono: IconVisto,
    titulo: "Sin caducidad",
    texto: "Una vez comprado, el acceso no vence. Las clases nuevas del módulo entran solas.",
  },
];

/** Las dudas que frenan una compra, contestadas antes de que haya que preguntarlas. */
const DUDAS = [
  {
    p: "¿Necesito saber de economía para empezar?",
    r: "No. Cada módulo indica su nivel, y los de nivel inicial parten de cero: se explica el término antes de usarlo.",
  },
  {
    p: "¿Puedo ver algo antes de pagar?",
    r: "Sí. La primera clase de cada módulo está abierta y es una clase completa, no un adelanto ni un índice.",
  },
  {
    p: "¿Cómo se paga?",
    r: "Con tarjeta a través de Stripe, o por Mercado Pago donde esté disponible. El cobro es único: no queda nada domiciliado.",
  },
  {
    p: "¿Dónde quedan los módulos que compre?",
    r: "En su cuenta. Entrando con el mismo correo los tiene disponibles desde cualquier dispositivo, sin límite de tiempo.",
  },
];

export const Educacion = () => {
  const [estado, setEstado] = useState({ cargando: true, error: "", modulos: [] });

  useEffect(() => {
    let vivo = true;
    getCatalogo()
      .then((datos) => {
        if (vivo) setEstado({ cargando: false, error: "", modulos: datos.modulos });
      })
      .catch(() => {
        if (vivo)
          setEstado({
            cargando: false,
            error: "No se pudo cargar el catalogo. Inténtelo de nuevo.",
            modulos: [],
          });
      });
    return () => {
      vivo = false;
    };
  }, []);

  const hayModulos = estado.modulos.length > 0;

  return (
    <main className="se-blog se-edu" role="main">
      {/* La cabecera: dice a quién va dirigido y qué se obtiene, y entrega las tarjetas
          dentro de la primera pantalla. El hero institucional que había antes empujaba
          el catálogo entero por debajo del pliegue. */}
      <section className="se-edu__portada">
        <div className="se-container">
          <p className="se-edu__portada-kicker">Educación</p>
          <h1 className="se-edu__portada-titulo">
            Entienda la economía que ya está leyendo
          </h1>
          <p className="se-edu__portada-claim">
            Módulos cortos, escritos por la misma redacción que firma los informes. Cada
            uno arranca con una clase abierta para que sepa qué está comprando antes de
            comprarlo.
          </p>

          <ul className="se-edu__promesas">
            {PROMESAS.map(({ Icono, titulo, texto }) => (
              <li key={titulo} className="se-edu__promesa">
                <Icono className="se-edu__promesa-icono" />
                <span>
                  <strong>{titulo}</strong>
                  {texto}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="se-section">
        <div className="se-container">
          {estado.cargando ? <p className="se-edu__aviso">Cargando…</p> : null}

          {estado.error ? (
            <p className="se-edu__aviso" role="alert">
              {estado.error}
            </p>
          ) : null}

          {!estado.cargando && !estado.error && !hayModulos ? (
            <p className="se-edu__aviso">
              Todavía no hay módulos publicados. Están en camino.
            </p>
          ) : null}

          {hayModulos ? (
            <>
              <h2 className="se-edu__h2">
                {estado.modulos.length === 1
                  ? "Un módulo disponible"
                  : `${estado.modulos.length} módulos disponibles`}
              </h2>
              <ul className="se-edu__grid">
                {estado.modulos.map((modulo) => (
                  <li key={modulo.slug}>
                    <TarjetaDeModulo modulo={modulo} />
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
      </section>

      {/* Cómo funciona y las dudas van **después** de las tarjetas, no antes: quien
          llega al catálogo viene a ver los módulos, y hacerle leer una explicación
          primero es cobrarle peaje. Quien siga bajando es porque le interesó alguno y
          ahora sí tiene preguntas. */}
      {hayModulos ? (
        <section className="se-section se-edu__banda">
          <div className="se-container">
            <h2 className="se-edu__h2">Cómo funciona</h2>
            <ol className="se-edu__pasos">
              <li className="se-edu__paso">
                <span className="se-edu__paso-num">1</span>
                <span className="se-edu__paso-copy">
                  <strong>Abra la primera clase</strong>
                  Es gratuita y completa. Solo pide una cuenta con el correo verificado.
                </span>
              </li>
              <li className="se-edu__paso">
                <span className="se-edu__paso-num">2</span>
                <span className="se-edu__paso-copy">
                  <strong>Compre el módulo si le sirve</strong>
                  Un solo pago con tarjeta o Mercado Pago. Se desbloquea entero al instante.
                </span>
              </li>
              <li className="se-edu__paso">
                <span className="se-edu__paso-num">3</span>
                <span className="se-edu__paso-copy">
                  <strong>Vaya a su ritmo</strong>
                  El acceso no caduca y queda guardado en su cuenta.
                </span>
              </li>
            </ol>

            <h2 className="se-edu__h2 se-edu__h2--separado">Antes de comprar</h2>
            <dl className="se-edu__dudas">
              {DUDAS.map(({ p, r }) => (
                <div key={p} className="se-edu__duda">
                  <dt>{p}</dt>
                  <dd>{r}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      ) : null}
    </main>
  );
};

export default Educacion;
