import { useEffect, useMemo, useState } from "react";

import { ESPACIOS, enlaceDeClic } from "../../services/publicidadService";
import { useCiclo } from "./ProveedorDePublicidad";
import { useRotacion } from "./useRotacion";

/**
 * H — la barra fija inferior.
 *
 * Tiene componente propio y no una rama más en `EspacioPublicitario` porque no ocupa un
 * hueco del maquetado: se posiciona sobre la página entera, sobrevive al scroll y se
 * puede cerrar. Tres decisiones que la hacen tolerable, y sin las cuales yo no la
 * habría construido:
 *
 * **Nace apagada.** El interruptor está en el panel y por omisión está en «no». Es el
 * formato que más molesta, y en móvil se come la franja donde está el pulgar; que se
 * encienda tiene que ser una decisión consciente y no lo que pasa por no tocar nada.
 *
 * **Cerrada es cerrada durante toda la visita.** Se guarda en `sessionStorage`, no en
 * `localStorage`: recordar la decisión para siempre sería quedarse sin el formato desde
 * el primer día, y no recordarla nada convertiría cada cambio de página en una barra
 * nueva -- que es exactamente lo que hace que alguien instale un bloqueador.
 *
 * **Altura acotada y botón de cierre visible siempre.** Nunca tapa el contenido ni se
 * interpone al navegar.
 */

const CLAVE = "sureconomics-barra-publicitaria-cerrada";

const yaCerrada = () => {
  // `sessionStorage` puede lanzar en una ventana privada o con el almacenamiento
  // bloqueado. Si no se puede leer, se enseña: perder la memoria del cierre es un mal
  // menor frente a romper el pie de todas las páginas.
  try {
    return window.sessionStorage.getItem(CLAVE) === "1";
  } catch {
    return false;
  }
};

export const BarraPublicitaria = () => {
  // Por `useRotacion` aunque **no rote**: con un solo turno el reloj ni arranca, y lo
  // que se aprovecha es el contador. La impresion la reporta el navegador al verse
  // desde que el servidor dejo de contarla al entregar; sin pasar por aqui, este
  // formato facturaria cero y nadie se enteraria hasta mirar una factura.
  //
  // Y no rota a proposito: es lo unico de la pantalla que esta siempre encima del
  // texto. Cambiarlo cada siete segundos delante de quien lee es exactamente el
  // comportamiento que hace que la gente instale bloqueadores.
  const todos = useCiclo(ESPACIOS.BARRA_INFERIOR);
  // Memorizado: `slice` devuelve un array nuevo en cada render, y `useRotacion` usa la
  // identidad del ciclo para saber cuando empieza uno nuevo. Sin esto reiniciaria el
  // registro de "ya contadas" en cada repintado y la misma impresion se reportaria una
  // y otra vez -- un contador que se dispara solo, del lado que factura.
  const ciclo = useMemo(() => todos.slice(0, 1), [todos]);
  const { contenedor, pieza: hueco } = useRotacion(ciclo.slice(0, 1));
  const [cerrada, setCerrada] = useState(true);

  // En un efecto y no en el valor inicial del estado: leer el almacenamiento durante el
  // render lo convierte en un render con efecto secundario, y en la primera pintura del
  // servidor no existe `window`.
  useEffect(() => {
    setCerrada(yaCerrada());
  }, []);

  if (!hueco || cerrada) return null;

  const cerrar = () => {
    setCerrada(true);
    try {
      window.sessionStorage.setItem(CLAVE, "1");
    } catch {
      /* Sin memoria, pero cerrada en esta página. Es lo que se puede hacer. */
    }
  };

  const destino = enlaceDeClic(hueco.enlace);

  return (
    <aside ref={contenedor} className="se-ad-barra" aria-label="Publicidad">
      {hueco.imagen ? (
        <span className="se-ad-barra__chip">
          <img src={hueco.imagen} alt={hueco.alt || hueco.anunciante || ""} loading="lazy" />
        </span>
      ) : null}

      <p className="se-ad-barra__texto">
        <span className="se-ad-barra__etiqueta">
          {hueco.es_casa ? "Espacio disponible" : "Publicidad"}
        </span>
        <b className="se-ad-barra__marca">{hueco.anunciante}</b>
        <span className="se-ad-barra__titular">
          {hueco.titular_corto || hueco.titular}
        </span>
      </p>

      {destino ? (
        <a
          className="se-ad-barra__cta"
          href={destino}
          target="_blank"
          rel="sponsored noopener noreferrer"
        >
          Conocer más
        </a>
      ) : null}

      <button
        type="button"
        className="se-ad-barra__cerrar"
        onClick={cerrar}
        aria-label="Cerrar la publicidad"
      >
        ✕
      </button>
    </aside>
  );
};
