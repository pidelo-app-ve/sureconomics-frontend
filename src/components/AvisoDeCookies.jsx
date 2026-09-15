import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { aceptado, arrancar, consentimiento, decidir, registrarVista } from "../lib/analitica";

/**
 * El aviso de cookies y el interruptor de la medicion.
 *
 * Hace dos cosas que van juntas y por eso viven en el mismo sitio: preguntar, y encender
 * o no la medicion segun la respuesta. Separarlas es como se acaba teniendo un banner
 * que dice una cosa y un script que hace otra.
 *
 * ## Lo que lo hace valido, y no solo bonito
 *
 * **No se pone nada antes de contestar.** Ni un identificador, ni una marca de tiempo.
 * El unico efecto de entrar al sitio sin haber contestado es ver esta barra.
 *
 * **"Rechazar" pesa lo mismo que "Aceptar".** Mismo tamano, mismo contraste, misma
 * distancia del dedo. Un rechazo escondido en gris claro invalida el consentimiento
 * entero: no es una opinion de diseno, es lo que dicen las guias del Comite Europeo de
 * Proteccion de Datos y lo que sanciona la AEPD.
 *
 * **No hay aspa ni "seguir navegando".** Cerrar sin elegir no puede contar como si;
 * seguir leyendo tampoco. Por eso la barra no se cierra sola ni tiene boton de cerrar:
 * sus dos salidas son las dos respuestas.
 *
 * **No bloquea.** Ni capa oscura ni foco secuestrado: se puede leer el sitio sin
 * contestar. Un muro que obliga a aceptar para pasar tampoco es consentimiento libre.
 *
 * ## Por que tambien vive aqui el aviso de navegacion
 *
 * El sitio es una sola pagina que cambia de ruta sin recargar, asi que nadie se entera
 * de un cambio de articulo salvo que alguien lo cuente. Este componente ya esta montado
 * en todas las vistas y ya sabe si hay permiso: es el sitio natural. Si no hay permiso,
 * `registrarVista` no hace nada.
 */
export const AvisoDeCookies = () => {
  const [decision, setDecision] = useState(() => consentimiento());
  const { pathname } = useLocation();
  const primera = useRef(true);

  // Un si dicho en una visita anterior enciende la medicion sin volver a preguntar.
  useEffect(() => {
    if (aceptado()) arrancar();
  }, []);

  useEffect(() => {
    // La primera ruta ya la cuenta `arrancar`; contarla otra vez la duplicaria.
    if (primera.current) {
      primera.current = false;
      return;
    }
    registrarVista(pathname);
  }, [pathname]);

  const responder = useCallback((respuesta) => {
    setDecision(decidir(respuesta));
  }, []);

  if (decision) return null;

  return (
    <aside
      className="se-cookies"
      // `region` y no `dialog`: un dialogo se lleva el foco y atrapa el teclado, y esto
      // no debe interrumpir la lectura. Se anuncia, y quien quiera llega tabulando.
      role="region"
      aria-label="Aviso de cookies"
    >
      <div className="se-cookies__caja">
        <div className="se-cookies__texto">
          <p className="se-cookies__titulo">Medimos cuánta gente nos lee</p>
          <p className="se-cookies__cuerpo">
            Con su permiso usamos cuatro cookies propias para saber cuántas personas nos
            leen, si vuelven y qué se lee de verdad. No llevan su nombre, no se comparten
            con nadie y no le siguen fuera de este sitio.{" "}
            <Link to="/cookies" className="se-cookies__enlace">
              Qué guarda cada una
            </Link>
            .
          </p>
        </div>

        <div className="se-cookies__acciones">
          {/* El rechazo va primero en el orden del documento: quien navega con teclado
              lo encuentra antes, y quien lee de izquierda a derecha lo ve igual de
              pronto. Ninguno de los dos es el boton "bonito". */}
          <button
            type="button"
            className="se-cookies__btn se-cookies__btn--no"
            onClick={() => responder("no")}
          >
            Rechazar
          </button>
          <button
            type="button"
            className="se-cookies__btn se-cookies__btn--si"
            onClick={() => responder("si")}
          >
            Aceptar
          </button>
        </div>
      </div>
    </aside>
  );
};
