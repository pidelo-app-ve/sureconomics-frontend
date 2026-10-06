import { Outlet } from "react-router-dom/dist"
import ScrollToTop from "../components/ScrollToTop"
import { Navbar } from "../components/Navbar"
import { Footer } from "../components/Footer"
import { EnRedes } from "../components/EnRedes"
import { MarketTicker } from "../components/home"
import { AvisoDeCookies } from "../components/AvisoDeCookies"
import { InvitacionAlBoletin } from "../components/InvitacionAlBoletin"
import { BarraPublicitaria, ProveedorDePublicidad } from "../components/publicidad"
import { AvisoDeRuta } from "../components/AvisoDeRuta"
import { useIdioma } from "../i18n/ProveedorIdioma"

/** El envoltorio del contenido: destino del enlace de salto y del foco al cambiar de ruta. */
const CONTENIDO_ID = "contenido"

// El salto se resuelve aqui y no con el ancla sola: el ancla dejaria "#contenido"
// escrito en la direccion, y el router lo tomaria por una navegacion. El `href` se
// queda para que el enlace siga siendo un enlace -- y funcione si este codigo no.
const saltarAlContenido = (e) => {
    const destino = document.getElementById(CONTENIDO_ID)
    if (!destino) return
    e.preventDefault()
    destino.focus()
}

// Base component that maintains the navbar and footer throughout the page and the scroll to top functionality.
export const Layout = () => {
    const { t } = useIdioma()
    return (
        <ScrollToTop>
            {/* El proveedor envuelve todo porque hay huecos por encima y por debajo del
                contenido -- el cintillo y la barra fija --, y todos tienen que salir de
                la misma decision: dos espacios de la misma pantalla no pueden llevar al
                mismo anunciante, y eso solo se puede evitar decidiendo de una vez.

                Envolver no pinta nada por su cuenta: cada vista declara los huecos que
                quiere. Una que no declare ninguno -- contacto, cookies -- no lleva
                publicidad, y esa es la manera de decirlo. */}
            <ProveedorDePublicidad>
                {/* Lo primero que se tabula, antes que la cinta y la cabecera: sin el,
                    llegar al articulo con teclado pasa por todo el menu en cada pagina. */}
                <a className="se-saltar" href={`#${CONTENIDO_ID}`} onClick={saltarAlContenido}>
                    {t("nav.saltarAlContenido")}
                </a>
                {/* Above every view, not just the homepage: the closing figures are
                    ambient context for the whole site. It renders nothing at all when
                    the newsroom has not filled it in. */}
                <MarketTicker />
                <Navbar />
                {/* Un `div` y no `main`: cada vista pinta ya su propio `main`, y dos
                    anidados son dos regiones principales para un lector de pantalla.
                    `tabIndex={-1}` lo deja recibir el foco por programa sin meterlo en
                    el orden del tabulador. */}
                <div className="se-page" id={CONTENIDO_ID} tabIndex={-1}>
                    <Outlet />
                </div>
                {/* Lo ultimo en redes, curado desde el panel, encima del pie y por
                    tanto en todas las vistas. Como la cinta, no pinta nada si la
                    redaccion no ha destacado ninguna publicacion. */}
                <EnRedes />
                <Footer />
                {/* La barra fija va aqui abajo por lo mismo que el aviso de cookies: se
                    posiciona sola, asi que en el arbol tiene que ser de lo ultimo que
                    lee un lector de pantalla y no lo primero. Nace apagada. */}
                <BarraPublicitaria />
                {/* Al pie del arbol y no arriba: la barra se posiciona sola y asi es lo
                    ultimo que lee un lector de pantalla, no lo primero. Ademas es quien
                    avisa de los cambios de ruta -- el sitio no recarga al cambiar de
                    pieza, asi que alguien tiene que contarlo. */}
                <AvisoDeCookies />
                {/* Solo en el marco publico: /entorno va fuera de este Layout y el
                    panel y la cuenta tienen el suyo. Nace cerrada y decide sola
                    cuando salir; ver `lib/invitacionBoletin.js`. */}
                <InvitacionAlBoletin />
                <AvisoDeRuta destinoId={CONTENIDO_ID} />
            </ProveedorDePublicidad>
        </ScrollToTop>
    )
}
