import { useCallback, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { ErrorState, LoadingState } from "../../components/content";
import { BotonGuia, RecorridoVista } from "../../components/recorrido/RecorridoVista";
import { useAdminToast } from "../../context/AdminToastContext";
import { useAdminConfirm } from "../../hooks/useAdminConfirm";
import { adminErrorMessage } from "../../lib/adminErrorMessage";
import { recorridoCanal } from "../../lib/guias/guiaCanal";
import { haceCuanto } from "../../lib/haceCuanto";
import { applyPageMeta } from "../../lib/seo";
import {
  fijarCanalYoutube,
  getYoutube,
  ocultarYoutube,
  quitarYoutube,
  sincronizarYoutube,
} from "../../services/adminSettingsService";

/**
 * El canal de YouTube de la casa: cuál es, qué llegó de él y qué no sale.
 *
 * Los shorts alimentan «En la calle» en la portada y el último video largo, la ventana
 * «Nuestro canal». Todo llega solo cada hora (ver `youtube_service.py`); aquí solo se
 * elige el canal y se oculta lo que no deba salir.
 */

const ancla = (clave) => ({ [recorridoCanal.atributo]: clave });
const SIGUE = "Se está actualizando por detrás. Vuelve a abrir esta página en un minuto para verlo.";

const duracion = (s) => (s == null ? null : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`);
const dia = (iso) => (iso ? new Date(iso).toLocaleDateString("es", { day: "numeric", month: "short" }) : "");

const Lista = ({ titulo, tipo, videos, mostrar, ocupado, onOcultar, ...resto }) => {
  let visibles = 0;
  return (
    <section className="se-admin-redes__red" {...resto}>
      <header className="se-admin-redes__red-cabeza">
        <h2 className="se-admin-redes__red-titulo">{titulo}</h2>
      </header>
      {videos.length ? (
        <ul className={`se-admin-redes__auto-lista se-admin-canal__lista--${tipo}`}>
          {videos.map((v) => {
            const sale = !v.oculto && visibles < mostrar;
            if (sale) visibles += 1;
            const dura = duracion(v.duracion);
            return (
              <li key={v.id} className={`se-admin-redes__auto-pub${sale ? "" : " se-admin-redes__auto-pub--fuera"}`}>
                <a href={v.enlace} target="_blank" rel="noreferrer" className={`se-admin-redes__auto-foto se-admin-canal__foto--${tipo}`}>
                  <img src={v.portada} alt="" loading="lazy" />
                  {dura ? <span className="se-admin-redes__auto-tipo">{dura}</span> : null}
                </a>
                <div className="se-admin-redes__auto-texto">
                  <span className="se-admin-meta-hint">
                    {dia(v.publicado)}
                    {v.vistas != null ? ` · ${v.vistas.toLocaleString("es")} vistas` : ""}
                    {" · "}
                    {v.oculto ? "Oculto" : sale ? "Sale en el sitio" : "De reserva"}
                  </span>
                  <p>{v.titulo || "Sin título"}</p>
                </div>
                <button type="button" className="se-btn se-btn--secondary se-btn--small" disabled={ocupado}
                  onClick={() => onOcultar(v.id, !v.oculto)}>
                  {v.oculto ? "Mostrar" : "Ocultar"}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="se-admin-meta-hint">
          {tipo === "short" ? "Este canal todavía no tiene shorts." : "Este canal todavía no tiene videos largos."}
        </p>
      )}
    </section>
  );
};

Lista.propTypes = {
  titulo: PropTypes.string.isRequired,
  tipo: PropTypes.oneOf(["short", "largo"]).isRequired,
  videos: PropTypes.arrayOf(PropTypes.object).isRequired,
  mostrar: PropTypes.number.isRequired,
  ocupado: PropTypes.bool,
  onOcultar: PropTypes.func.isRequired,
};

export const AdminCanal = () => {
  const { toastSuccess, toastError } = useAdminToast();
  const { confirm, ConfirmDialog } = useAdminConfirm();
  const [estado, setEstado] = useState({ status: "loading", datos: null, error: null });
  const [entrada, setEntrada] = useState("");
  const [cambiando, setCambiando] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  const cargar = useCallback(async () => {
    try {
      setEstado({ status: "ok", datos: await getYoutube(), error: null });
    } catch (err) {
      setEstado({ status: "error", datos: null, error: err });
    }
  }, []);

  useEffect(() => {
    applyPageMeta({ title: "Admin — Canal de YouTube", description: "El canal de YouTube de la casa." });
    cargar();
  }, [cargar]);

  const hacer = async (accion, exito, fallo) => {
    setOcupado(true);
    try {
      const d = await accion();
      setEstado({ status: "ok", datos: d, error: null });
      toastSuccess(d.en_marcha ? SIGUE : exito, "Canal");
      return true;
    } catch (err) {
      toastError(adminErrorMessage(err, fallo), "Canal");
      return false;
    } finally {
      setOcupado(false);
    }
  };

  if (estado.status === "loading") return <LoadingState title="Cargando el canal…" />;
  if (estado.status === "error") return <ErrorState title="No se pudo cargar." error={estado.error} onRetry={cargar} />;

  const d = estado.datos;
  const canal = d.canal;
  const pedirCanal = !canal || cambiando;

  const usar = async (e) => {
    e.preventDefault();
    const ok = await hacer(() => fijarCanalYoutube(entrada), "Canal guardado. Ya llegaron sus últimos videos.", "No se pudo usar ese canal.");
    if (ok) {
      setEntrada("");
      setCambiando(false);
    }
  };

  const quitar = async () => {
    const ok = await confirm({
      title: "Quitar el canal",
      description: "La portada deja de enseñar «En la calle» y «Nuestro canal» hasta que elijas otro.",
      confirmLabel: "Quitar",
    });
    if (ok) hacer(quitarYoutube, "Canal quitado.", "No se pudo quitar el canal.");
  };

  const ocultar = (id, ocultarlo) => {
    const actuales = [...d.shorts, ...d.largos].filter((v) => v.oculto).map((v) => v.id);
    const ids = ocultarlo ? [...actuales, id] : actuales.filter((x) => x !== id);
    hacer(() => ocultarYoutube(ids), ocultarlo ? "Oculto: ya no sale en el sitio." : "Vuelve a salir en el sitio.", "No se pudo cambiar.");
  };

  return (
    <main role="main">
      <header className="se-admin-shell__header se-tit-cabecera" style={{ marginBottom: "1rem" }}>
        <div>
          <h1 className="se-heading-section" style={{ margin: 0 }}>Canal de YouTube</h1>
          <p className="se-admin-meta-hint" style={{ marginTop: "0.5rem" }}>
            Los shorts salen en la portada, en la fila «En la calle», y el último video, en la ventana «Nuestro
            canal». Llegan solos cada hora.
          </p>
        </div>
        <BotonGuia recorrido={recorridoCanal} className="se-btn se-btn--secondary se-tit-guia" />
      </header>
      <RecorridoVista recorrido={recorridoCanal} />

      <section className="se-admin-table-wrap se-admin-canal__canal" {...ancla("canal")}>
        {canal ? (
          <div className="se-admin-redes__red-cabeza">
            <p style={{ margin: 0 }}>
              <strong>{canal.nombre}</strong>{" "}
              <a href={canal.url} target="_blank" rel="noreferrer" className="se-admin-meta-hint">
                {canal.handle ? `@${canal.handle}` : "Ver en YouTube"}
              </a>
            </p>
            <span className="se-admin-redes__acciones">
              <button type="button" className="se-btn se-btn--secondary se-btn--small" disabled={ocupado}
                onClick={() => hacer(sincronizarYoutube, "Actualizado.", "No se pudo actualizar.")}>
                {ocupado ? "Actualizando…" : "Actualizar ahora"}
              </button>
              <button type="button" className="se-btn se-btn--secondary se-btn--small" disabled={ocupado}
                onClick={() => setCambiando((x) => !x)}>
                {cambiando ? "No cambiar" : "Cambiar de canal"}
              </button>
              <button type="button" className="se-btn se-btn--secondary se-btn--small" disabled={ocupado} onClick={quitar}>
                Quitar el canal
              </button>
            </span>
          </div>
        ) : null}

        {canal ? (
          <p className="se-admin-meta-hint">
            Se actualiza solo cada hora. Última vez: {haceCuanto(d.sincronizado_en)}. En la portada salen los{" "}
            {d.mostrar.shorts} primeros shorts que no estén ocultos.
            {d.con_duraciones ? "" : " Las tarjetas salen sin duración: falta la clave de Google (YOUTUBE_API_KEY) en el servidor."}
          </p>
        ) : null}
        {d.error ? (
          <p className="se-admin-form-feedback" role="alert">
            La última actualización tuvo un problema: {d.error} Se sigue mostrando lo que llegó antes.
          </p>
        ) : null}

        {pedirCanal ? (
          <form className="se-admin-canal__elegir" onSubmit={usar}>
            <label htmlFor="canal-entrada" className="se-form-label">
              {canal ? "El canal nuevo" : "¿Cuál es el canal?"}
            </label>
            <div className="se-admin-canal__fila">
              <input id="canal-entrada" className="se-form-control" value={entrada} onChange={(e) => setEntrada(e.target.value)}
                placeholder="@nombredelcanal o https://www.youtube.com/@…" autoComplete="off" spellCheck={false} />
              <button type="submit" className="se-btn se-btn--primary" disabled={ocupado || !entrada.trim()}>
                {ocupado ? "Comprobando…" : "Usar este canal"}
              </button>
            </div>
            <p className="se-admin-meta-hint">Su @nombre, el enlace del canal o el de cualquiera de sus páginas.</p>
          </form>
        ) : null}
      </section>

      {canal ? (
        <>
          <Lista titulo="Shorts · «En la calle»" tipo="short" videos={d.shorts} mostrar={d.mostrar.shorts}
            ocupado={ocupado} onOcultar={ocultar} {...ancla("shorts")} />
          <Lista titulo="Videos largos · «Nuestro canal»" tipo="largo" videos={d.largos} mostrar={d.mostrar.largos}
            ocupado={ocupado} onOcultar={ocultar} {...ancla("largos")} />
        </>
      ) : null}
      <ConfirmDialog />
    </main>
  );
};

export default AdminCanal;
