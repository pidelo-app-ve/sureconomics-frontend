import { useCallback, useEffect, useRef, useState } from "react";
import { BotDeTelegram } from "../../components/admin/BotDeTelegram";
import { CabeceraDePagina } from "../../components/admin/CabeceraDePagina";
import { AvisosDelDia } from "../../components/admin/avisos/AvisosDelDia";
import { Candidato } from "../../components/admin/avisos/TarjetasDeAvisos";
import { ErrorState, LoadingState } from "../../components/content";
import { RecorridoVista } from "../../components/recorrido/RecorridoVista";
import { useAdminToast } from "../../context/AdminToastContext";
import { useAdminConfirm } from "../../hooks/useAdminConfirm";
import { adminErrorMessage } from "../../lib/adminErrorMessage";
import { diaCorto, lineaDelDia, nombreDeMotivo, pendientes, vistaInicial } from "../../lib/avisos";
import { recorridoAvisos } from "../../lib/guias/guiaAvisos";
import { hoyEnCaracas } from "../../lib/listasDelPanel";
import { applyPageMeta } from "../../lib/seo";
import {
  descartarAviso,
  encenderAvisos,
  redactarAviso,
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
 * `services/avisos_service.py` en el backend): todo lo importante, sin tope,
 * primero lo de Venezuela. Nacen **apagados**. Esta página sirve para dos cosas:
 *
 * - **Mirar antes de encender**: «Lo que se avisaría ahora» enseña las noticias que el
 *   sistema tiene en la mira, sin crear nada. Es como se afina qué merece un aviso.
 * - **Llevar los de hoy**: cada aviso se redacta, se toma («lo hago yo»), se suelta o se
 *   descarta con un motivo. Es lo mismo que hará el bot de Telegram de la redacción.
 *
 * **«Redactar»** convierte el aviso en una pieza en borrador: el servidor lee el artículo
 * de cada medio y la IA escribe una noticia completa. Después comprueba lo escrito
 * (ninguna cifra ni cita que no esté en las fuentes llega al borrador) y la tarjeta
 * enseña el informe (`Comprobacion`) antes del botón de abrir el borrador: primero se
 * lee qué se comprobó, después se revisa el texto.
 *
 * En «De hoy» se puede mirar otro día y filtrar por estado (`AvisosDelDia`); las tarjetas
 * están en `components/admin/avisos/TarjetasDeAvisos.jsx`.
 *
 * Se vuelve a cargar cada minuto. El botón «Guía» lo explica sobre la propia página.
 */

const { ancla } = recorridoAvisos;

export const AdminAvisos = () => {
  const { toastSuccess, toastError } = useAdminToast();
  const { confirm, ConfirmDialog } = useAdminConfirm();
  const [vista, setVista] = useState("hoy");
  const [state, setState] = useState({ status: "loading", dia: null, ahora: null, error: null, pedida: null, fallo: false });
  // El día de «De hoy» (`null`: hoy). Cada carga lleva su turno, y tras una acción se pide el día de entonces.
  const [fecha, setFecha] = useState(null);
  const turno = useRef(0);
  const [miId, setMiId] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  // El aviso que se está redactando: su tarjeta lo dice mientras dura (unos 15 segundos).
  const [redactandoId, setRedactandoId] = useState(null);
  // La vista de entrada se elige una vez, con la primera carga: después manda quien mira.
  const vistaElegida = useRef(false);

  useEffect(() => {
    applyPageMeta({ title: "Admin — Avisos de noticias", description: "Las noticias que la redacción debería mirar hoy." });
  }, []);

  // Quién mira, para saber cuáles avisos son suyos (si falla, solo no se ofrece «Soltar»).
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
    const mio = ++turno.current;
    try {
      const [dia, ahora] = await Promise.all([
        traerAvisos(fecha),
        // Lo que se avisaría es un extra: si falla, los avisos de hoy tienen que seguir sirviendo.
        traerCandidatos().catch(() => null),
      ]);
      if (mio !== turno.current) return;
      if (!vistaElegida.current) {
        vistaElegida.current = true;
        setVista(vistaInicial(dia));
      }
      setState({ status: "success", dia, ahora, error: null, pedida: fecha, fallo: false });
    } catch (err) {
      if (mio !== turno.current) return;
      setState((s) => (s.dia ? { ...s, fallo: s.pedida !== fecha } : { ...s, status: "error", error: err }));
    }
  }, [fecha]);
  const vigente = useRef(cargar);
  vigente.current = cargar;

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
      await vigente.current();
      return true;
    } catch (err) {
      toastError(adminErrorMessage(err, fallo), "Avisos de noticias");
      // Lo más probable es que alguien llegó antes: que la lista diga cómo quedó.
      await vigente.current();
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

  const redactar = async (aviso, conIa) => {
    if (conIa) setRedactandoId(aviso.id);
    try {
      await hacer(
        () => redactarAviso(aviso.id, { ia: conIa }),
        conIa
          ? "Borrador listo. Mire lo comprobado en la tarjeta y ábralo para revisarlo."
          : "Borrador creado con el título y las fuentes. Ábralo para escribirla.",
        "No se pudo redactar.",
      );
    } finally {
      setRedactandoId(null);
    }
  };

  const alternar = async (dia) => {
    const encender = !dia.activos;
    const ok = await confirm({
      ...(encender
        ? {
            title: "Encender los avisos",
            description: "Desde la próxima pasada (cada 10 minutos) saldrán avisos de todas las noticias importantes, sin tope, nunca de 10 de la noche a 6 de la mañana. Llegan aquí y, por Telegram, a quien esté marcado abajo en «Quién recibe las noticias».",
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
  // Lo que espera, de hoy: con otro día a la vista, la cabecera no lo cuenta.
  const esperando = fecha ? 0 : pendientes(dia.avisos);
  const vistas = [
    { clave: "hoy", texto: fecha ? `Del ${diaCorto(fecha)}` : "De hoy" },
    { clave: "ahora", texto: "Lo que se avisaría ahora" },
  ];

  return (
    <main role="main">
      <CabeceraDePagina
        titulo="Avisos de noticias"
        explica={
          <>
            Las noticias que la redacción debería mirar hoy: las importantes, y primero las de Venezuela. Cada una espera a que
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

      <BotDeTelegram anclaje={ancla("bot")} anclajeMarketing={ancla("marketing")} />

      <div className="se-admin-filters se-avisos__vistas" role="tablist" aria-label="Qué ver" {...ancla("vistas")}>
        {vistas.map((v) => (
          <button key={v.clave} type="button" role="tab" aria-selected={vista === v.clave}
            className={`se-btn ${vista === v.clave ? "se-btn--primary" : "se-btn--secondary"}`}
            onClick={() => setVista(v.clave)}>
            {v.texto} ({cuenta[v.clave]})
          </button>
        ))}
      </div>

      <div>
        {vista === "hoy" ? (
          <AvisosDelDia key={fecha ?? "hoy"} dia={dia} fecha={fecha} hoy={hoyEnCaracas()} cargando={state.pedida !== fecha}
            fallo={state.fallo} onFecha={setFecha} miId={miId} ocupado={ocupado} redactandoId={redactandoId}
            acciones={{ onTomar: tomar, onSoltar: soltar, onDescartar: descartar, onRedactar: redactar }} />
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
