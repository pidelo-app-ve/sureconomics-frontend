import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import PropTypes from "prop-types";

/**
 * Cuenta los cambios de pagina a quien no los ve.
 *
 * El sitio cambia de ruta sin recargar, asi que para un lector de pantalla pulsar un
 * enlace no hace nada: el foco se queda donde estaba -- o cae al `body` si el enlace
 * desaparecio con la pagina vieja -- y nadie dice que hay otra pieza delante. Aqui se
 * hacen las dos cosas que haria una recarga: el foco vuelve al principio del
 * contenido y se anuncia el titulo nuevo.
 *
 * ## Lo que no hace, a proposito
 *
 * **Nada en la primera carga.** Ni siquiera si la primera ruta redirige a otra --
 * `/backoffice` a la de entrar, un enlace viejo a su pieza --: mover el foco antes de
 * que la persona haya tocado nada es robarselo. Por eso espera a un gesto real.
 *
 * **Nada si solo cambia la busqueda o el ancla.** Un filtro que escribe en la
 * direccion no es otra pagina, y saltar al principio en cada tecla seria imposible
 * de usar.
 *
 * **No toca el desplazamiento.** El foco se pone con `preventScroll`: de subir arriba
 * ya se encarga `ScrollToTop`, y dos sitios decidiendo el scroll acaban peleandose.
 */
/** Lo que un lector diria de un encabezado: su texto, o el `alt` si es un logotipo. */
const nombreDe = (el) => {
  if (!el) return "";
  const propio = el.getAttribute("aria-label") || el.textContent.trim();
  if (propio) return propio;
  return Array.from(el.querySelectorAll("img[alt], [aria-label]"))
    .map((n) => n.getAttribute("alt") || n.getAttribute("aria-label"))
    .filter(Boolean)
    .join(" ")
    .trim();
};

export const AvisoDeRuta = ({ destinoId }) => {
  const { pathname } = useLocation();
  const anterior = useRef(pathname);
  const huboGesto = useRef(false);
  // El titulo de la pagina en la que se hizo el ultimo gesto: la que se esta dejando.
  const tituloPrevio = useRef("");
  const [mensaje, setMensaje] = useState("");

  // En captura y para siempre: basta con saber si alguna vez hubo tecla o toque.
  useEffect(() => {
    const marcar = () => {
      huboGesto.current = true;
      tituloPrevio.current = document.title;
    };
    window.addEventListener("pointerdown", marcar, true);
    window.addEventListener("keydown", marcar, true);
    return () => {
      window.removeEventListener("pointerdown", marcar, true);
      window.removeEventListener("keydown", marcar, true);
    };
  }, []);

  useEffect(() => {
    if (anterior.current === pathname) return undefined;
    anterior.current = pathname;
    if (!huboGesto.current) return undefined;

    const destino = document.getElementById(destinoId);
    const activo = document.activeElement;
    // Si la pagina nueva ya puso el foco en algo suyo -- un campo con `autoFocus` --,
    // esa decision es mejor que la nuestra y se respeta.
    const yaDentro =
      destino && activo && activo !== destino && activo !== document.body && destino.contains(activo);
    if (destino && !yaDentro) destino.focus({ preventScroll: true });

    // Se vacia y se vuelve a llenar: dos paginas con el mismo titulo seguidas no se
    // anunciarian, porque la region viva solo habla cuando su texto cambia. La espera
    // es para que la pagina haya puesto ya su titulo; las que lo ponen al llegar sus
    // datos lo tienen casi siempre a tiempo.
    //
    // Si el titulo no cambio -- hay vistas que aun no ponen el suyo y heredan el de la
    // anterior --, se lee el `h1` de la pagina nueva: anunciar el titulo viejo diria que
    // no se ha movido nada.
    const tituloAntes = tituloPrevio.current;
    setMensaje("");
    const t = window.setTimeout(() => {
      const titulo = document.title;
      const h1 = nombreDe(destino?.querySelector("h1"));
      setMensaje(titulo !== tituloAntes || !h1 ? titulo : h1);
    }, 500);
    return () => window.clearTimeout(t);
  }, [pathname, destinoId]);

  return (
    <div className="se-aviso-de-ruta" role="status" aria-live="polite" aria-atomic="true">
      {mensaje}
    </div>
  );
};

AvisoDeRuta.propTypes = {
  /** El envoltorio del contenido, que lleva `tabIndex={-1}` para poder enfocarse. */
  destinoId: PropTypes.string.isRequired,
};

export default AvisoDeRuta;
