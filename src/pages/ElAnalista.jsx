import PropTypes from "prop-types";
import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUserAuth } from "../context/UserAuthContext";
import { AvisoDeCookies } from "../components/AvisoDeCookies";
import { nuevaClave } from "../lib/idempotencia";
import { applyPageMeta } from "../lib/seo";
import { conVolver } from "../lib/volver";
import { anotarCarrera, obtenerRegistro } from "../services/analistaService";
import {
  actualizarRegistro,
  borrarPendiente,
  guardarPendiente,
  instalarPuente,
  leerPendiente,
} from "../juegos/el-analista/puente";
import origen from "../juegos/el-analista/origen.json";
import "../juegos/el-analista/el-analista-pagina.css";

/**
 * `/el-analista`: el juego de carrera e inversión, dentro del sitio.
 *
 * El juego lo hace otro equipo y se trae tal cual (`npm run traer-analista`); esta página
 * es lo único nuestro: una barra para volver al sitio, el puente con la cuenta del lector
 * (`puente.js`) y el aviso de que **sumar al ranking exige cuenta con el correo
 * confirmado**. Sin cuenta se juega igual.
 *
 * Va a pantalla completa, fuera del `Layout`: el juego abre pantallas `position: fixed`
 * que taparían la cabecera, y la invitación al boletín no puede saltar en mitad de una
 * decisión. Lo que sí trae del `Layout` es el aviso de cookies: quien llega directo al
 * juego también tiene que poder decidir, y es el mismo componente el que enciende la
 * medición y cuenta la visita.
 */

const ElAnalistaJuego = lazy(() => import("../juegos/el-analista/el-analista.jsx"));

const RUTA = "/el-analista";
const VERSION = origen.commit.slice(0, 7);

const Cargando = () => (
  <div className="se-analista-pagina__cargando" role="status">
    Abriendo El Analista…
  </div>
);

/**
 * El aviso de que hace falta cuenta. Lo pide el juego al anotar sin sesión (o sin el
 * correo confirmado) y espera la respuesta: «Ahora no» le devuelve `sin-sesion`.
 */
const AvisoDeCuenta = ({ tipo, onEntrar, onRegistrar, onConfirmar, onCerrar }) => {
  const primero = useRef(null);
  useEffect(() => {
    primero.current?.focus();
    const alPulsar = (e) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  }, [onCerrar]);

  const sinConfirmar = tipo === "sin-confirmar";
  return (
    <div className="se-analista-aviso" role="dialog" aria-modal="true" aria-labelledby="analista-aviso-titulo">
      <div className="se-analista-aviso__caja">
        <p className="se-analista-aviso__kicker">El ranking de El Analista</p>
        <h2 id="analista-aviso-titulo" className="se-analista-aviso__titulo">
          {sinConfirmar ? "Confirme su correo para sumar al ranking" : "Para sumar al ranking, entre con su cuenta"}
        </h2>
        <p className="se-analista-aviso__texto">
          {sinConfirmar
            ? "Le enviamos un código al registrarse. Su carrera queda guardada y se anota sola en cuanto lo confirme."
            : "Puede seguir jugando sin cuenta, pero al ranking solo suman las carreras de lectores con cuenta. Su carrera queda guardada y se anota sola cuando entre."}
        </p>
        <div className="se-analista-aviso__acciones">
          {sinConfirmar ? (
            <button ref={primero} type="button" className="se-btn" onClick={onConfirmar}>
              Confirmar mi correo
            </button>
          ) : (
            <>
              <button ref={primero} type="button" className="se-btn" onClick={onEntrar}>
                Entrar
              </button>
              <button type="button" className="se-btn se-btn--secondary" onClick={onRegistrar}>
                Crear cuenta
              </button>
            </>
          )}
          <button type="button" className="se-analista-aviso__luego" onClick={onCerrar}>
            Ahora no
          </button>
        </div>
      </div>
    </div>
  );
};

AvisoDeCuenta.propTypes = {
  tipo: PropTypes.oneOf(["sin-sesion", "sin-confirmar"]).isRequired,
  onEntrar: PropTypes.func.isRequired,
  onRegistrar: PropTypes.func.isRequired,
  onConfirmar: PropTypes.func.isRequired,
  onCerrar: PropTypes.func.isRequired,
};

export const ElAnalistaPagina = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isEmailVerified, profile, profileStatus } = useUserAuth();
  const [listo, setListo] = useState(false);
  const [nota, setNota] = useState(null);
  const [aviso, setAviso] = useState(null);
  const respuestaDelAviso = useRef(null);

  // La sesión cambia (p. ej. caduca) mientras se juega: el puente lee siempre la última.
  const sesion = useRef({});
  sesion.current = { isAuthenticated, isEmailVerified, email: profile?.email };
  // Con sesión, hasta que llegue el perfil no se sabe si el correo está confirmado.
  const perfilListo = !isAuthenticated || ["success", "unverified", "error"].includes(profileStatus);

  useEffect(() => {
    applyPageMeta({
      title: "El Analista — SurEconomics",
      description:
        "Un simulador de carrera e inversión: treinta años, un año por turno, decisiones que pesan y una cartera que reparte usted. Con cuenta, su carrera suma al ranking.",
    });
  }, []);

  const pedirCuenta = useCallback(
    (tipo, entrada, clave) => {
      guardarPendiente(entrada, clave);
      setAviso(tipo);
      return new Promise((resolver) => {
        respuestaDelAviso.current = resolver;
      });
    },
    []
  );

  const anotar = useCallback(
    async (entrada) => {
      const clave = nuevaClave();
      const s = sesion.current;
      if (!s.isAuthenticated) return pedirCuenta("sin-sesion", entrada, clave);
      if (!s.isEmailVerified) return pedirCuenta("sin-confirmar", entrada, clave);
      try {
        const r = await anotarCarrera(entrada, clave, VERSION);
        actualizarRegistro(r?.registro);
        setNota("Su carrera quedó anotada en el ranking.");
        return null;
      } catch (err) {
        if (err?.status === 401) return pedirCuenta("sin-sesion", entrada, clave);
        if (err?.code === "email_not_verified") return pedirCuenta("sin-confirmar", entrada, clave);
        return "fallo";
      }
    },
    [pedirCuenta]
  );

  // Antes de montar el juego: anotar la carrera pendiente (si ya hay con qué) y traer el
  // ranking, que el juego lee al pintar. Una sola vez por visita.
  const preparado = useRef(false);
  const quitarPuente = useRef(null);
  useEffect(() => {
    if (!perfilListo || preparado.current) return;
    preparado.current = true;
    let registro = null;
    let disponible = true;

    const preparar = async () => {
      const pendiente = leerPendiente();
      if (pendiente && sesion.current.isAuthenticated && sesion.current.isEmailVerified) {
        try {
          const r = await anotarCarrera(pendiente.entrada, pendiente.clave, VERSION);
          registro = r?.registro ?? null;
          borrarPendiente();
          setNota("Su carrera quedó anotada en el ranking.");
        } catch (err) {
          if (err?.status !== 401 && err?.code !== "email_not_verified") borrarPendiente();
          setNota("No se pudo anotar su carrera. Termine otra y vuelva a intentarlo.");
        }
      } else if (pendiente && sesion.current.isAuthenticated) {
        setNota("Confirme su correo y su carrera se anotará sola.");
      }
      if (!registro) {
        try {
          registro = await obtenerRegistro(20);
        } catch {
          registro = [];
          disponible = false;
        }
      }
      quitarPuente.current = instalarPuente({ registro, disponible, anotar });
      setListo(true);
    };
    preparar();
  }, [perfilListo, anotar]);

  useEffect(() => () => quitarPuente.current?.(), []);

  const cerrarAviso = (resultado) => {
    setAviso(null);
    respuestaDelAviso.current?.(resultado);
    respuestaDelAviso.current = null;
  };

  const irA = (destino, estado) => {
    // La promesa del juego se queda sin respuesta: la página se va.
    respuestaDelAviso.current = null;
    setAviso(null);
    navigate(destino, estado ? { state: estado } : undefined);
  };

  let cuenta;
  if (!isAuthenticated) {
    cuenta = (
      <Link className="se-analista-pagina__cuenta" to={conVolver("/cuenta/entrar", RUTA)}>
        Entre para sumar al ranking
      </Link>
    );
  } else if (perfilListo && !isEmailVerified) {
    cuenta = (
      <Link
        className="se-analista-pagina__cuenta"
        to="/cuenta/verificar-email"
        state={{ email: profile?.email, volver: RUTA }}
      >
        Confirme su correo para sumar
      </Link>
    );
  } else {
    cuenta = <span className="se-analista-pagina__estado">Sus carreras suman al ranking</span>;
  }

  return (
    <div className="se-analista-pagina">
      <header className="se-analista-pagina__barra">
        <Link to="/" className="se-analista-pagina__volver">
          <span aria-hidden="true">←</span> SurEconomics
        </Link>
        <span className="se-analista-pagina__nombre">El Analista</span>
        {cuenta}
      </header>

      {nota ? (
        <div className="se-analista-pagina__nota" role="status">
          <span>{nota}</span>
          <button type="button" onClick={() => setNota(null)} aria-label="Cerrar aviso">
            ×
          </button>
        </div>
      ) : null}

      {listo ? (
        <Suspense fallback={<Cargando />}>
          <ElAnalistaJuego />
        </Suspense>
      ) : (
        <Cargando />
      )}

      {aviso ? (
        <AvisoDeCuenta
          tipo={aviso}
          onEntrar={() => irA(conVolver("/cuenta/entrar", RUTA))}
          onRegistrar={() => irA(conVolver("/cuenta/registro", RUTA))}
          onConfirmar={() => irA("/cuenta/verificar-email", { email: sesion.current.email, volver: RUTA })}
          onCerrar={() => {
            // Se queda guardada por si entra más tarde desde la barra.
            cerrarAviso("sin-sesion");
          }}
        />
      ) : null}

      <AvisoDeCookies />
    </div>
  );
};

export default ElAnalistaPagina;
