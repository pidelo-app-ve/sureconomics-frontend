import { Outlet } from "react-router-dom/dist"
import ScrollToTop from "../components/ScrollToTop"
import { Navbar } from "../components/Navbar"
import { Footer } from "../components/Footer"
import { EnRedes } from "../components/EnRedes"
import { MarketTicker } from "../components/home"
import { AvisoDeCookies } from "../components/AvisoDeCookies"
import { BarraPublicitaria, ProveedorDePublicidad } from "../components/publicidad"

// Base component that maintains the navbar and footer throughout the page and the scroll to top functionality.
export const Layout = () => {
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
                {/* Above every view, not just the homepage: the closing figures are
                    ambient context for the whole site. It renders nothing at all when
                    the newsroom has not filled it in. */}
                <MarketTicker />
                <Navbar />
                <main className="se-page" role="main">
                    <Outlet />
                </main>
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
            </ProveedorDePublicidad>
        </ScrollToTop>
    )
}
