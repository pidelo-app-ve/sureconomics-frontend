import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useUserAuth } from "../../context/UserAuthContext";
import { AvatarDelLector } from "../../components/cuenta/AvatarDelLector";
import { applyPageMeta } from "../../lib/seo";
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
const QUE_SE_PUEDE = [
  {
    titulo: "Guardar artículos",
    texto:
      "El marcador de cualquier pieza la guarda aquí para leerla después, desde cualquier dispositivo.",
    a: "/cuenta/marcadores",
    enlace: "Ver mis marcadores",
  },
  {
    titulo: "Comentar",
    texto:
      "Los comentarios se publican con su nombre y pasan por revisión antes de aparecer. Se comenta desde la propia pieza.",
    a: "/articulos",
    enlace: "Ir a los artículos",
  },
  {
    titulo: "Proponer una pieza",
    texto:
      "Puede mandar un artículo o una noticia a la redacción. Si la aceptan, se publica con su nombre y su foto.",
    a: "/cuenta/envios",
    enlace: "Ver mis envíos",
  },
  {
    titulo: "Comprar módulos de Educación",
    texto:
      "Cada módulo se compra una vez y el acceso no caduca. La primera clase de cada uno se lee sin pagar.",
    a: "/educacion",
    enlace: "Ver el catálogo",
  },
];

export const CuentaDashboardHome = () => {
  const { profile, profileStatus, isEmailVerified } = useUserAuth();
  const [cifras, setCifras] = useState({
    estado: "cargando",
    marcadores: null,
    envios: null,
    modulos: null,
  });

  useEffect(() => {
    applyPageMeta({
      title: "Mi espacio — SurEconomics",
      description: "Su cuenta de lector.",
      noindex: true,
    });
  }, []);

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
        <p className="se-cuenta__aviso">Cargando su cuenta…</p>
      </div>
    );
  }

  if (!isEmailVerified) {
    return (
      <div className="se-cuenta__pagina">
        <div className="se-cuenta__vacio">
          <h1>Confirme su correo</h1>
          <p>
            Le enviamos un código a <strong>{profile?.email}</strong>. Hasta
            confirmarlo no se pueden guardar artículos, comentar ni abrir las clases —
            es lo que evita que alguien cree cuentas con correos ajenos.
          </p>
          <Link to="/cuenta/verificar-email" className="se-btn" state={{ email: profile?.email }}>
            Escribir el código
          </Link>
        </div>
      </div>
    );
  }

  const nombre =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ").trim() ||
    profile?.email?.split("@")[0] ||
    "Lector";

  const opcionales = ["age", "sex", "country", "city", "occupation", "phoneNumber"];
  const sinRellenar = opcionales.filter((c) => !String(profile?.[c] ?? "").trim()).length;

  const puntos = [
    { estado: "bien", texto: "Correo confirmado" },
    profile?.photoUrl
      ? { estado: "bien", texto: "Tiene foto de perfil" }
      : {
          estado: "falta",
          texto: "Sin foto de perfil",
          detalle: "Hace falta para firmar lo que le publiquen.",
          a: "/cuenta/perfil",
          enlace: "Subirla",
        },
    sinRellenar === 0
      ? { estado: "bien", texto: "Perfil completo" }
      : {
          estado: "falta",
          texto: `Perfil a medias · ${sinRellenar} de 6 datos sin rellenar`,
          detalle: "Todos son opcionales; la redacción los usa para localizarle.",
          a: "/cuenta/perfil",
          enlace: "Completar",
        },
  ];

  return (
    <div className="se-cuenta__pagina">
      {/* La cara al lado del nombre. Cuando no hay foto salen las iniciales, que
          identifican igual y no se leen como una imagen rota. */}
      <header className="se-cuenta__cabecera se-cuenta__cabecera--con-cara">
        <AvatarDelLector perfil={profile} tamano="md" />
        <div>
          <p className="se-cuenta__kicker">Su espacio</p>
          <h1 className="se-cuenta__titulo">Hola, {nombre}</h1>
        </div>
      </header>

      <section className="se-guia" aria-label="Estado de su cuenta">
        <h2 className="se-cuenta__h2">Su cuenta</h2>
        <ul className="se-guia__lista">
          {puntos.map((p) => (
            <li key={p.texto} className={`se-guia__punto se-guia__punto--${p.estado}`}>
              <Marca estado={p.estado} />
              <span className="se-guia__copy">
                {p.texto}
                {p.detalle ? <small>{p.detalle}</small> : null}
              </span>
              {p.a ? (
                <Link to={p.a} className="se-guia__accion">
                  {p.enlace} →
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section className="se-resumen" aria-label="Lo que tiene">
        <Link to="/cuenta/lo-mio" className="se-resumen__ficha">
          <span className="se-resumen__n">
            {cifras.modulos == null ? "—" : cifras.modulos}
          </span>
          <span className="se-resumen__t">
            {cifras.modulos === 1 ? "módulo comprado" : "módulos comprados"}
          </span>
        </Link>
        <Link to="/cuenta/marcadores" className="se-resumen__ficha">
          <span className="se-resumen__n">
            {cifras.marcadores == null ? "—" : cifras.marcadores}
          </span>
          <span className="se-resumen__t">
            {cifras.marcadores === 1 ? "artículo guardado" : "artículos guardados"}
          </span>
        </Link>
        <Link to="/cuenta/envios" className="se-resumen__ficha">
          <span className="se-resumen__n">
            {cifras.envios == null ? "—" : cifras.envios}
          </span>
          <span className="se-resumen__t">
            {cifras.envios === 1 ? "propuesta enviada" : "propuestas enviadas"}
          </span>
        </Link>
      </section>

      <section className="se-guia" aria-label="Qué puede hacer">
        <h2 className="se-cuenta__h2">Qué puede hacer aquí</h2>
        <ul className="se-guia__usos">
          {QUE_SE_PUEDE.map((u) => (
            <li key={u.titulo} className="se-guia__uso">
              <h3>{u.titulo}</h3>
              <p>{u.texto}</p>
              <Link to={u.a}>{u.enlace} →</Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default CuentaDashboardHome;
