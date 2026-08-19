import { Outlet } from "react-router-dom/dist"
import ScrollToTop from "../components/ScrollToTop"
import { Navbar } from "../components/Navbar"
import { Footer } from "../components/Footer"
import { MarketTicker } from "../components/home"

// Base component that maintains the navbar and footer throughout the page and the scroll to top functionality.
export const Layout = () => {
    return (
        <ScrollToTop>
            {/* Above every view, not just the homepage: the closing figures are
                ambient context for the whole site. It renders nothing at all when
                the newsroom has not filled it in. */}
            <MarketTicker />
            <Navbar />
            <main className="se-page" role="main">
                <Outlet />
            </main>
            <Footer />
        </ScrollToTop>
    )
}