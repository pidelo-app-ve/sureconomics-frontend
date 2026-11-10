import { useCallback, useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { CabeceraDePagina } from "../../components/admin/CabeceraDePagina";
import { ErrorState, LoadingState } from "../../components/content";
import { RecorridoVista } from "../../components/recorrido/RecorridoVista";
import { useAdminToast } from "../../context/AdminToastContext";
import { useAdminConfirm } from "../../hooks/useAdminConfirm";
import { adminErrorMessage } from "../../lib/adminErrorMessage";
import {
  accionesDe, estadoDeAviso, lineaDelDia, nombreDeMotivo, nombreDePais, pendientes, vistaInicial,
} from "../../lib/avisos";
import { recorridoAvisos } from "../../lib/guias/guiaAvisos";
import { applyPageMeta } from "../../lib/seo";
import {
  descartarAviso,
  encenderAvisos,
  soltarAviso,
  tomarAviso,
  traerAvisos,
  traerCandidatos,
} from "../../services/adminAvisosService";
import { getAdminMe } from "../../services/adminMeService";
import "./adminAvisos.css";

/**
 * «Avisos de noticias» en el panel: lo que la redacción debería mirar hoy.
 *
 * Los avisos se crean solos al final de cada ciclo de titulares (cada 10 minutos, ver
 * `services/avisos_service.py` en el backend): como mucho 2 por pasada y 10 al día,
 * primero lo de Venezuela. Nacen **apagados**. Esta página sirve para dos cosas:
 *
 * - **Mirar antes de encender**: «Lo que se avisaría ahora» enseña las noticias que el
 *   sistema tiene en la mira, sin crear nada. Es como se afina qué merece un aviso.
 * - **Llevar los de hoy**: cada aviso se toma («lo hago yo»), se suelta o se descarta con
 *   un motivo. Son las mismas tres cosas que hará el bot de Telegram de la redacción.
 *
 * Se vuelve a cargar cada minuto. El botón «Guía» lo explica sobre la propia página.
 */

const VISTAS = [
  { clave: "hoy", texto: "De hoy" },
  { clave: "ahora", texto: "Lo que se avisaría ahora" },
];

/** Cuántas fuentes se ven sin pulsar «ver todas». */
const FUENTES_A_LA_VISTA = 3;

const zona = { timeZone: "America/Caracas" };
// Con espacios que no parten: «02:52 p. m.» se quedaba con la «m.» sola en otro renglón.
const hora = (iso) =>
  iso ? new Date(iso).toLocaleTimeString("es-VE", { ...zona, hour: "2-digit", minute: "2-digit" }).replace(/\s/g, "\u00a0") : "—";
const medios = (n) => `${n} medio${n === 1 ? "" : "s"}`;
const ancla = (clave) => ({ [recorridoAvisos.atributo]: clave });

/** Lo que publicó cada medio sobre el hecho: tres a la vista y el resto al pulsar. */
const Fuentes = ({ fuentes }) => {
  const [todas, setTodas] = useState(false);
  if (!fuentes.length) return null;
  const visibles = todas ? fuentes : fuentes.slice(0, FUENTES_A_LA_VISTA);
  return (
    <div className="se-avisos__fuentes">
      <ul>
        {visibles.map((f, k) => (
          <li key={`${f.url || f.medio}-${k}`}>
            <span className="se-avisos__medio">{f.medio}</span>
            {f.url ? (
              <a href={f.url} target="_blank" rel="noopener noreferrer">
                {f.titulo || "Ver la nota"}
              </a>
            ) : (
              <span>{f.titulo}</span>
            )}
          </li>
        ))}
      </ul>
      {fuentes.length > FUENTES_A_LA_VISTA ? (
        <button type="button" className="se-avisos__mas" onClick={() => setTodas((v) => !v)} aria-expanded={todas}>
          {todas ? "Ver menos" : `Ver las ${fuentes.length} fuentes`}
        </button>
      ) : null}
    </div>
  );
};

Fuentes.propTypes = {
  fuentes: PropTypes.arrayOf(PropTypes.shape({ medio: PropTypes.string, titulo: PropTypes.string, url: PropTypes.string }))
    .isRequired,
};

/** Un aviso de hoy: cómo está y lo que puede hacer con él quien lo mira. */
const Aviso = ({ aviso, miId, motivos, ocupado, anclaje, onTomar, onSoltar, onDescartar }) => {
  const [descartando, setDescartando] = useState(false);
  const estado = estadoDeAviso(aviso, miId);
  const acciones = accionesDe(aviso, miId);
  return (
    <li className={`se-admin-table-wrap se-avisos__tarjeta${estado.tono === "apagado" ? " is-apagado" : ""}`} {...anclaje}>
      <p className="se-avisos__marcas">
        <span className={`se-avisos__marca${estado.tono ? ` se-avisos__marca--${estado.tono}` : ""}`}>{estado.texto}</span>
      </p>
      <h2 className="se-heading-card se-avisos__titulo">{aviso.titulo}</h2>
      <p className="se-admin-meta-hint se-avisos__meta">
        {nombreDePais(aviso.pais)} · puntaje {aviso.calor} · {medios(aviso.medios)} · avisado a las {hora(aviso.creado)}
      </p>
      <Fuentes fuentes={aviso.fuentes} />
      {descartando ? (
        <div className="se-avisos__acciones" role="group" aria-label="Por qué se descarta">
          <span className="se-avisos__pregunta">¿Por qué no?</span>
          {motivos.map((m) => (
            <button key={m} type="button" className="se-btn se-btn--secondary" disabled={ocupado}
              onClick={() => onDescartar(aviso, m).then((ok) => ok && setDescartando(false))}>
              {nombreDeMotivo(m)}
            </button>
          ))}
          <button type="button" className="se-avisos__mas" disabled={ocupado} onClick={() => setDescartando(false)}>
            Cancelar
          </button>
        </div>
      ) : acciones.length ? (
        <div className="se-avisos__acciones">
          {acciones.includes("tomar") ? (
            <button type="button" className="se-btn se-btn--primary" disabled={ocupado} onClick={() => onTomar(aviso)}>
              Lo hago yo
            </button>
          ) : null}
          {acciones.includes("soltar") ? (
            <button type="button" className="se-btn se-btn--secondary" disabled={ocupado} onClick={() => onSoltar(aviso)}>
              Soltar
            </button>
          ) : null}
          <button type="button" className="se-btn se-btn--secondary" disabled={ocupado} onClick={() => setDescartando(true)}>
            Descartar
          </button>
        </div>
      ) : null}
    </li>
  );
};

Aviso.propTypes = {
  aviso: PropTypes.object.isRequired,
  miId: PropTypes.number,
  motivos: PropTypes.arrayOf(PropTypes.string).isRequired,
  ocupado: PropTypes.bool,
  /** El anclaje de la guía: lo lleva la primera tarjeta de la lista. */
  anclaje: PropTypes.object,
  onTomar: PropTypes.func.isRequired,
  onSoltar: PropTypes.func.isRequired,
  onDescartar: PropTypes.func.isRequired,
};

/** Una noticia que el sistema tiene en la mira: todavía no es un aviso. */
const Candidato = ({ candidato, anclaje }) => (
  <li className="se-admin-table-wrap se-avisos__tarjeta" {...anclaje}>
    {candidato.enEstaPasada || candidato.venezuela || candidato.enUltimaHora ? (
      <p className="se-avisos__marcas">
        {candidato.enEstaPasada ? <span className="se-avisos__marca se-avisos__marca--mio">Saldría en la próxima pasada</span> : null}
        {candidato.venezuela ? <span className="se-avisos__marca se-avisos__marca--ok">Venezuela</span> : null}
        {candidato.enUltimaHora ? <span className="se-avisos__marca">Ya está en «Última hora»</span> : null}
      </p>
    ) : null}
    <h2 className="se-heading-card se-avisos__titulo">{candidato.titulo}</h2>
    <p className="se-admin-meta-hint se-avisos__meta">
      {nombreDePais(candidato.pais)} · puntaje {candidato.calor} · {medios(candidato.medios)}
      {candidato.medioPrincipal ? ` · la fuente principal es ${candidato.medioPrincipal}` : ""}
    </p>
    <Fuentes fuentes={candidato.fuentes} />
  </li>
);

Candidato.propTypes = { candidato: PropTypes.object.isRequired, anclaje: PropTypes.object };

export const AdminAvisos = () => {
  const { toastSuccess, toastError } = useAdminToast();
  const { confirm, ConfirmDialog } = useAdminConfirm();
  const [vista, setVista] = useState("hoy");
  const [state, setState] = useState({ status: "loading", dia: null, ahora: null, error: null });
  const [miId, setMiId] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  // La vista de entrada se elige una vez, con la primera carga: después manda quien mira.
  const vistaElegida = useRef(false);

  useEffect(() => {
    applyPageMeta({ title: "Admin — Avisos de noticias", description: "Las noticias que la redacción debería mirar hoy." });
  }, []);

  // Quién mira, para saber cuáles avisos son suyos. Si falla, la página sirve igual:
  // solo no ofrece «Soltar».
  useEffect(() => {
    let vivo = true;
    getAdminMe()
      .then((yo) => vivo && setMiId(yo?.id ?? null))
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, []);

  const cargar = useCallback(async () => {
    try {
      const [dia, ahora] = await Promise.all([
        traerAvisos(),
        // Lo que se avisaría es un extra: si falla, los avisos de hoy tienen que seguir sirviendo.
        traerCandidatos().catch(() => null),
      ]);
      if (!vistaElegida.current) {
        vistaElegida.current = true;
        setVista(vistaInicial(dia));
      }
      setState({ status: "success", dia, ahora, error: null });
    } catch (err) {
      setState((s) => (s.dia ? s : { ...s, status: "error", error: err }));
    }
  }, []);

  useEffect(() => {
    cargar();
    const id = setInterval(cargar, 60_000);
    return () => clearInterval(id);
  }, [cargar]);

  /** Una acción de la página: la petición, el aviso y volver a cargar. */
  const hacer = async (peticion, exito, fallo) => {
    setOcupado(true);
    try {
      await peticion();
      toastSuccess(exito, "Avisos de noticias");
      await cargar();
      return true;
    } catch (err) {
      toastError(adminErrorMessage(err, fallo), "Avisos de noticias");
      // Lo más probable es que alguien llegó antes: que la lista diga cómo quedó.
      await cargar();
      return false;
    } finally {
      setOcupado(false);
    }
  };

  const tomar = (aviso) =>
    hacer(() => tomarAviso(aviso.id), "Es suyo. Si en dos horas no avanza, vuelve a quedar libre.", "No se pudo tomar.");

  const soltar = (aviso) => hacer(() => soltarAviso(aviso.id), "Suelto: lo puede tomar otra persona.", "No se pudo soltar.");

  const descartar = (aviso, motivo) =>
    hacer(() => descartarAviso(aviso.id, motivo), `Descartado: ${nombreDeMotivo(motivo).toLowerCase()}.`, "No se pudo descartar.");

  const alternar = async (dia) => {
    const encender = !dia.activos;
    // `warning: null`: sin el «Esta acción es irreversible…» del diálogo, que aquí sería falso.
    const ok = await confirm({
      warning: null,
      ...(encender
        ? {
            title: "Encender los avisos",
            description: `Desde la próxima pasada (cada 10 minutos) saldrán avisos: como mucho 2 por pasada y ${dia.maxAlDia} al día, nunca de 10 de la noche a 6 de la mañana. Por ahora se ven solo en esta página.`,
            confirmLabel: "Encender",
          }
        : {
            title: "Apagar los avisos",
            description: "No saldrá ningún aviso nuevo hasta que los vuelva a encender. Los de hoy siguen como están.",
            confirmLabel: "Apagar",
          }),
    });
    if (!ok) return;
    await hacer(() => encenderAvisos(encender), encender ? "Encendidos." : "Apagados.", "No se pudo cambiar.");
  };

  if (state.status === "loading") return <LoadingState title="Cargando avisos…" />;
  if (state.status === "error") return <ErrorState title="No se pudo cargar." error={state.error} onRetry={cargar} />;

  const { dia, ahora } = state;
  const candidatos = ahora?.candidatos ?? [];
  const cuenta = { hoy: dia.avisos.length, ahora: candidatos.length };
  const esperando = pendientes(dia.avisos);

  return (
    <main role="main">
      <CabeceraDePagina
        titulo="Avisos de noticias"
        explica={
          <>
            Las noticias que la redacción debería mirar hoy: pocas, y primero las de Venezuela. Cada una espera a que
            alguien diga «lo hago yo» o «esto no».
          </>
        }
        guia={recorridoAvisos}
      />
      <RecorridoVista recorrido={recorridoAvisos} />

      <section className="se-admin-table-wrap se-avisos__estado">
        <div className="se-avisos__interruptor" {...ancla("interruptor")}>
          <button type="button" role="switch" aria-checked={dia.activos} aria-label="Avisos de noticias"
            className={`se-alaire${dia.activos ? " is-on" : ""}`} disabled={ocupado} onClick={() => alternar(dia)}>
            <span className="se-alaire__pista" aria-hidden="true" />
            <span className="se-alaire__texto">{dia.activos ? "Encendidos" : "Apagados"}</span>
          </button>
          <p className="se-admin-meta-hint">
            {dia.activos
              ? "Salen solos cada 10 minutos, de 6 de la mañana a 10 de la noche."
              : "No sale ninguno. Abajo puede ver qué se avisaría si estuvieran encendidos."}
          </p>
        </div>
        <div className="se-avisos__cuenta" {...ancla("cuenta")}>
          <span className="se-form-label">Hoy</span>
          <p className="se-avisos__linea">{lineaDelDia(dia)}</p>
          {esperando ? (
            <p className="se-admin-meta-hint">
              {esperando === 1 ? "1 espera a que alguien lo tome." : `${esperando} esperan a que alguien los tome.`}
            </p>
          ) : null}
        </div>
      </section>

      <div className="se-admin-filters se-avisos__vistas" role="tablist" aria-label="Qué ver" {...ancla("vistas")}>
        {VISTAS.map((v) => (
          <button key={v.clave} type="button" role="tab" aria-selected={vista === v.clave}
            className={`se-btn ${vista === v.clave ? "se-btn--primary" : "se-btn--secondary"}`}
            onClick={() => setVista(v.clave)}>
            {v.texto} ({cuenta[v.clave]})
          </button>
        ))}
      </div>

      <div>
        {vista === "hoy" ? (
          dia.avisos.length ? (
            <ul className="se-avisos__lista">
              {dia.avisos.map((a, k) => (
                <Aviso key={a.id} aviso={a} miId={miId} motivos={dia.motivos} ocupado={ocupado}
                  anclaje={k === 0 ? ancla("lista") : undefined}
                  onTomar={tomar} onSoltar={soltar} onDescartar={descartar} />
              ))}
            </ul>
          ) : (
            <p className="se-admin-meta-hint se-avisos__vacio">
              {dia.activos
                ? "Hoy todavía no salió ningún aviso. Cuando el sistema encuentre una noticia que lo merezca, aparece aquí."
                : "Hoy no salió ningún aviso: están apagados. Mire en «Lo que se avisaría ahora» qué saldría."}
            </p>
          )
        ) : (
          <>
            <p className="se-admin-meta-hint se-avisos__nota">
              {ahora === null
                ? "No se pudo consultar ahora mismo. Se intenta de nuevo en un minuto."
                : "Esto es solo para mirar: no crea ningún aviso. Están en el orden en que saldrían, y cambia cada pocos minutos."}
            </p>
            {candidatos.length ? (
              <ul className="se-avisos__lista">
                {candidatos.map((c, k) => (
                  <Candidato key={c.id} candidato={c} anclaje={k === 0 ? ancla("lista") : undefined} />
                ))}
              </ul>
            ) : ahora !== null ? (
              <p className="se-admin-meta-hint se-avisos__vacio">
                Ahora mismo no hay ninguna noticia que merezca un aviso: hace falta que la cuenten al menos dos medios
                (o una fuente oficial o una agencia) en las últimas seis horas, y que no la hayamos dado ya.
              </p>
            ) : null}
          </>
        )}
      </div>

      <ConfirmDialog />
    </main>
  );
};
