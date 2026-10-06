import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { Enlace } from "../../components/Enlace";
import { useUserAuth } from "../../context/UserAuthContext";
import { AvatarDelLector } from "../../components/cuenta/AvatarDelLector";
import { BRAND } from "../../data/surEconomicsMock";
import { useIdioma } from "../../i18n/ProveedorIdioma";
import { useMetaPagina } from "../../i18n/useMetaPagina";
import * as userMeService from "../../services/userMeService";

/**
 * El inicio de la cuenta: qué tiene hecho, qué le falta y qué puede hacer aquí.
 *
 * ## Lo que era
 *
 * Tres tarjetas fijas — perfil, marcadores, envíos — que decían lo mismo el primer día
 * que el año siguiente, más un saludo con tres manchas de color de adorno. Nada de eso
 * contesta la pregunta con la que se entra: «¿y esto para qué me sirve?».
 *
 * ## Lo que es
 *
 * Una lista de estado. Cada punto dice cómo está **esta** cuenta y enlaza a donde se
 * resuelve: sin foto, perfil a medias, ningún módulo, cero marcadores. La guía no es
 * una página aparte que hay que ir a buscar: es el propio panel diciendo qué falta.
 *
 * Y lo resuelto también se enseña. Una lista que sólo muestra pegas se lee como una
 * regañina; con los ✓ delante se lee como el estado de la cuenta, que es lo que es.
 *
 * ## Por qué ya no hay muro de «verifique su correo»
 *
 * Lo había, y se pintaba mientras el perfil aún se estaba cargando — o sea, a alguien
 * con el correo perfectamente verificado se le decía que no lo tenía. El estado de
 * carga y el estado «sin verificar» son cosas distintas y ahora se distinguen.
 */

const Marca = ({ estado }) => {
  if (estado === "bien") {
    return (
      <svg viewBox="0 0 16 16" className="se-guia__icono" aria-hidden="true">
        <path
          d="M3.5 8.5l3 3 6-6.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 16 16" className="se-guia__icono" aria-hidden="true">
      <circle cx="8" cy="8" r="5.6" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8 5.2v3.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="8" cy="11" r="0.85" fill="currentColor" />
    </svg>
  );
};

Marca.propTypes = { estado: PropTypes.oneOf(["bien", "falta"]).isRequired };

/** Lo que se puede hacer con una cuenta. Fijo: es la guía, no un estado. */
const queSePuede = (t) => [
  {
    titulo: t("cuenta.inicio.usos.guardarTitulo"),
    texto: t("cuenta.inicio.usos.guardarTexto"),
    a: "/cuenta/marcadores",
    enlace: t("cuenta.inicio.usos.guardarEnlace"),
  },
  {
    titulo: t("cuenta.inicio.usos.comentarTitulo"),
    texto: t("cuenta.inicio.usos.comentarTexto"),
    a: "/articulos",
    enlace: t("cuenta.inicio.usos.comentarEnlace"),
  },
  {
    titulo: t("cuenta.inicio.usos.proponerTitulo"),
    texto: t("cuenta.inicio.usos.proponerTexto"),
    a: "/cuenta/envios",
    enlace: t("cuenta.inicio.usos.proponerEnlace"),
  },
  {
    titulo: t("cuenta.inicio.usos.comprarTitulo"),
    texto: t("cuenta.inicio.usos.comprarTexto"),
    a: "/educacion",
    enlace: t("cuenta.inicio.usos.comprarEnlace"),
  },
];

export const CuentaDashboardHome = () => {
  const { t } = useIdioma();
  const { profile, profileStatus, isEmailVerified } = useUserAuth();
  const [cifras, setCifras] = useState({
    estado: "cargando",
    marcadores: null,
    envios: null,
    modulos: null,
  });

  useMetaPagina({
    title: t("cuenta.inicio.meta.titulo", { marca: BRAND.name }),
    description: t("cuenta.inicio.meta.descripcion"),
    noindex: true,
  });

  useEffect(() => {
    if (!isEmailVerified) return undefined;
    let vivo = true;
    Promise.all([
      userMeService.getMyBookmarks({ page: 1, limit: 1 }).catch(() => null),
      userMeService.listMySubmissions({ page: 1, limit: 1 }).catch(() => null),
      userMeService.getMisCompras().catch(() => null),
    ]).then(([bm, subs, compras]) => {
      if (!vivo) return;
      const cuenta = (r) =>
        typeof r?.total === "number" ? r.total : (r?.items?.length ?? null);
      setCifras({
        estado: "listo",
        marcadores: cuenta(bm),
        envios: cuenta(subs),
        modulos: compras ? compras.modulos.length : null,
      });
    });
    return () => {
      vivo = false;
    };
  }, [isEmailVerified]);

  // Mientras el perfil se carga no se afirma nada: el muro de «verifique su correo»
  // salía aquí y le decía a gente ya verificada que no lo estaba.
  if (profileStatus === "loading" || profileStatus === "idle") {
    return (
      <div className="se-cuenta__pagina">
        <p className="se-cuenta__aviso">{t("cuenta.inicio.cargando")}</p>
      </div>
    );
  }

  if (!isEmailVerified) {
    return (
      <div className="se-cuenta__pagina">
        <div className="se-cuenta__vacio">
          <h1>{t("cuenta.inicio.confirmeTitulo")}</h1>
          <p>
            {t("cuenta.inicio.confirmeTexto", { correo: <strong>{profile?.email}</strong> })}
          </p>
          <Enlace to="/cuenta/verificar-email" className="se-btn" state={{ email: profile?.email }}>
            {t("cuenta.inicio.escribirCodigo")}
          </Enlace>
        </div>
      </div>
    );
  }

  const nombre =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ").trim() ||
    profile?.email?.split("@")[0] ||
    t("cuenta.inicio.lector");

  const opcionales = ["age", "sex", "country", "city", "occupation", "phoneNumber"];
  const sinRellenar = opcionales.filter((c) => !String(profile?.[c] ?? "").trim()).length;

  const puntos = [
    { estado: "bien", texto: t("cuenta.inicio.correoConfirmado") },
    profile?.photoUrl
      ? { estado: "bien", texto: t("cuenta.inicio.tieneFoto") }
      : {
          estado: "falta",
          texto: t("cuenta.inicio.sinFoto"),
          detalle: t("cuenta.inicio.sinFotoDetalle"),
          a: "/cuenta/perfil",
          enlace: t("cuenta.inicio.subirla"),
        },
    sinRellenar === 0
      ? { estado: "bien", texto: t("cuenta.inicio.perfilCompleto") }
      : {
          estado: "falta",
          texto: t("cuenta.inicio.perfilAMedias", { n: sinRellenar }),
          detalle: t("cuenta.inicio.perfilAMediasDetalle"),
          a: "/cuenta/perfil",
          enlace: t("cuenta.inicio.completar"),
        },
  ];

  return (
    <div className="se-cuenta__pagina">
      {/* La cara al lado del nombre. Cuando no hay foto salen las iniciales, que
          identifican igual y no se leen como una imagen rota. */}
      <header className="se-cuenta__cabecera se-cuenta__cabecera--con-cara">
        <AvatarDelLector perfil={profile} tamano="md" />
        <div>
          <p className="se-cuenta__kicker">{t("cuenta.panel.suEspacio")}</p>
          <h1 className="se-cuenta__titulo">{t("cuenta.inicio.hola", { nombre })}</h1>
        </div>
      </header>

      <section className="se-guia" aria-label={t("cuenta.inicio.estadoDeSuCuenta")}>
        <h2 className="se-cuenta__h2">{t("cuenta.inicio.suCuenta")}</h2>
        <ul className="se-guia__lista">
          {puntos.map((p) => (
            <li key={p.texto} className={`se-guia__punto se-guia__punto--${p.estado}`}>
              <Marca estado={p.estado} />
              <span className="se-guia__copy">
                {p.texto}
                {p.detalle ? <small>{p.detalle}</small> : null}
              </span>
              {p.a ? (
                <Enlace to={p.a} className="se-guia__accion">
                  {p.enlace} →
                </Enlace>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section className="se-resumen" aria-label={t("cuenta.inicio.loQueTiene")}>
        <Enlace to="/cuenta/lo-mio" className="se-resumen__ficha">
          <span className="se-resumen__n">
            {cifras.modulos == null ? "—" : cifras.modulos}
          </span>
          <span className="se-resumen__t">
            {t("cuenta.inicio.modulosComprados", { n: cifras.modulos ?? 0 })}
          </span>
        </Enlace>
        <Enlace to="/cuenta/marcadores" className="se-resumen__ficha">
          <span className="se-resumen__n">
            {cifras.marcadores == null ? "—" : cifras.marcadores}
          </span>
          <span className="se-resumen__t">
            {t("cuenta.inicio.articulosGuardados", { n: cifras.marcadores ?? 0 })}
          </span>
        </Enlace>
        <Enlace to="/cuenta/envios" className="se-resumen__ficha">
          <span className="se-resumen__n">
            {cifras.envios == null ? "—" : cifras.envios}
          </span>
          <span className="se-resumen__t">
            {t("cuenta.inicio.propuestasEnviadas", { n: cifras.envios ?? 0 })}
          </span>
        </Enlace>
      </section>

      <section className="se-guia" aria-label={t("cuenta.inicio.quePuedeHacer")}>
        <h2 className="se-cuenta__h2">{t("cuenta.inicio.quePuedeHacerAqui")}</h2>
        <ul className="se-guia__usos">
          {queSePuede(t).map((u) => (
            <li key={u.titulo} className="se-guia__uso">
              <h3>{u.titulo}</h3>
              <p>{u.texto}</p>
              <Enlace to={u.a}>{u.enlace} →</Enlace>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default CuentaDashboardHome;
