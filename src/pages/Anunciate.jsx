import { useEffect } from "react";
import { Link } from "react-router-dom";

import { BRAND } from "../data/surEconomicsMock";
import { applyPageMeta } from "../lib/seo";

/**
 * «Anúnciate aquí»: la página de venta del inventario.
 *
 * ## Por qué no tiene formulario propio
 *
 * Lleva al de contacto con el asunto ya puesto (`/contacto?asunto=…`), que es una
 * capacidad que esa página ya tenía. Un segundo formulario habría significado un
 * segundo buzón, un segundo camino antispam y una segunda historia de idempotencia
 * para el mismo trabajo: que llegue un correo a `info@sureconomics.com`. Y el día que
 * cambie el remitente o el proveedor de correo, se cambia en un sitio.
 *
 * ## Por qué los textos están aquí y no en el panel
 *
 * Es copia comercial, no inventario: cambia cuando cambia la oferta, no cuando cambia
 * una campaña. Meterla en la base obligaría a mantener un editor para algo que se toca
 * dos veces al año, y a que la página se cayera si la base no responde.
 *
 * Las letras son las del documento del cliente -- incluido el salto de la G --, porque
 * son el vocabulario con el que se habla de esto en las reuniones.
 */

const FORMATOS = [
  {
    letra: "A",
    nombre: "Tarjeta nativa",
    estado: "disponible",
    texto:
      "Se integra en los listados y dentro del cuerpo de los artículos, con la misma retícula que una pieza editorial y siempre etiquetada como publicidad.",
  },
  {
    letra: "B",
    nombre: "Banner",
    estado: "disponible",
    texto:
      "Espacio destacado dentro del flujo de la portada, después de dos bloques de contenido. Nunca es lo primero que ve el lector.",
  },
  {
    letra: "C",
    nombre: "Patrocinio de tema o país",
    estado: "disponible",
    texto:
      "Su marca asociada a un tema o a un país concreto, en la cabecera del listado filtrado. Máxima relevancia: el lector ya dijo que le interesa.",
  },
  {
    letra: "D",
    nombre: "Patrocinio del boletín",
    estado: "disponible",
    texto:
      "Presencia fija en «Entorno en Viñetas», que llega a una audiencia que ya mostró interés recurrente.",
  },
  {
    letra: "E",
    nombre: "Mención pre-roll",
    estado: "proximamente",
    texto:
      "Al inicio de una entrevista o un episodio. Se activa cuando publiquemos los primeros contenidos de este formato.",
  },
  {
    letra: "H",
    nombre: "Barra fija inferior",
    estado: "disponible",
    texto:
      "Franja delgada y descartable en la parte baja de la pantalla. Alta visibilidad, sin bloquear la lectura y con botón de cierre siempre visible.",
  },
  {
    letra: "I",
    nombre: "Rail lateral",
    estado: "disponible",
    texto:
      "En páginas de artículo, junto al cuerpo del texto y por debajo de las piezas relacionadas.",
  },
];

const ESPECIFICACIONES = [
  ["A · Tarjeta nativa", "Listados y cuerpo de artículos", "Rotación entre campañas activas", "Impresiones y clics por espacio"],
  ["B · Banner", "Portada, dentro del flujo", "Por peso de campaña", "Impresiones y clics"],
  ["C · Patrocinio de tema o país", "Cabecera del listado filtrado", "Exclusivo por periodo", "Impresiones por sesión"],
  ["D · Patrocinio del boletín", "Entorno en Viñetas", "Exclusivo por edición", "Aperturas y clics del correo"],
  ["H · Barra fija inferior", "Todas las páginas, descartable", "Rotación", "Impresiones, clics y cierres"],
  ["I · Rail lateral", "Páginas de artículo", "Rotación", "Impresiones y clics"],
];

const asuntoDe = (formato) =>
  `/contacto?asunto=${encodeURIComponent(`Publicidad — formato ${formato.letra} (${formato.nombre})`)}`;

export const Anunciate = () => {
  useEffect(() => {
    applyPageMeta({
      title: `Anúnciate aquí — ${BRAND.name}`,
      description:
        "Formatos publicitarios de SurEconomics: claros, medibles y sin interrumpir la lectura. Ocho maneras de llegar a quienes toman decisiones económicas en América Latina.",
    });
  }, []);

  return (
    <main className="se-blog se-anunciate" role="main">
      <section className="se-section se-anunciate__hero">
        <div className="se-container">
          <p className="se-anunciate__kicker">Anúnciate aquí</p>
          <h1 className="se-anunciate__title">
            Llegue a quienes toman decisiones económicas en la región
          </h1>
          <p className="se-anunciate__lead">
            Formatos claros, medibles y sin interrupciones forzadas: pensados para
            acompañar el contenido, no para competir con él. Nada de código de terceros,
            nada de rastreo del lector.
          </p>
          <Link className="se-btn se-btn--primary" to="/contacto?asunto=Publicidad">
            Solicitar información
          </Link>
        </div>
      </section>

      <section className="se-section">
        <div className="se-container">
          <h2 className="se-anunciate__h2">Formatos</h2>
          <p className="se-anunciate__sub">
            Ocho maneras de aparecer en {BRAND.name}, cada una con un lugar y un propósito
            distintos.
          </p>

          <ul className="se-anunciate__grid">
            {FORMATOS.map((f) => (
              <li key={f.letra} className="se-anunciate__tarjeta">
                <span className="se-anunciate__letra">{f.letra}</span>
                <span
                  className={`se-anunciate__estado se-anunciate__estado--${f.estado}`}
                >
                  {f.estado === "disponible" ? "Disponible" : "Próximamente"}
                </span>
                <h3 className="se-anunciate__nombre">{f.nombre}</h3>
                <p className="se-anunciate__texto">{f.texto}</p>
                {f.estado === "disponible" ? (
                  <Link className="se-anunciate__enlace" to={asuntoDe(f)}>
                    Consultar este formato →
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="se-section">
        <div className="se-container">
          <h2 className="se-anunciate__h2">Especificaciones</h2>
          <p className="se-anunciate__sub">Referencia rápida por formato.</p>

          {/* En su propio contenedor con scroll horizontal: una tabla de cuatro
              columnas no cabe en un móvil, y sin esto sería la página entera la que
              se desplazaría de lado. */}
          <div className="se-anunciate__tabla-caja">
            <table className="se-anunciate__tabla">
              <thead>
                <tr>
                  <th scope="col">Formato</th>
                  <th scope="col">Ubicación</th>
                  <th scope="col">Rotación</th>
                  <th scope="col">Medición</th>
                </tr>
              </thead>
              <tbody>
                {ESPECIFICACIONES.map((fila) => (
                  <tr key={fila[0]}>
                    <th scope="row">{fila[0]}</th>
                    <td>{fila[1]}</td>
                    <td>{fila[2]}</td>
                    <td>{fila[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="se-anunciate__nota">
            Las impresiones se cuentan en el servidor al servir el anuncio, y los clics
            con una redirección propia. No hay pixeles de terceros ni etiquetas externas:
            las cifras salen de nuestro sistema y se pueden auditar.
          </p>
        </div>
      </section>

      <section className="se-section se-anunciate__cierre">
        <div className="se-container">
          <h2 className="se-anunciate__h2">Hablemos</h2>
          <p className="se-anunciate__sub">
            Cuéntenos qué formato le interesa. El equipo comercial responde en un día
            hábil.
          </p>
          <Link className="se-btn se-btn--primary" to="/contacto?asunto=Publicidad">
            Escribir al equipo comercial
          </Link>
        </div>
      </section>
    </main>
  );
};
