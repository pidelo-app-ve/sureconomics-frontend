import PropTypes from "prop-types";
import { useState } from "react";
import { useAdminToast } from "../../../context/AdminToastContext";
import {
  actualizarNumero,
  enviarLote,
  enviarPrueba,
  reenviarNumero,
  verNumero,
} from "../../../services/adminBoletinService";
import { leerDestino, guardarDestino, lunesLargo, fecha, hoyIso } from "./datosDelBoletin";

// ------------------------------------------------------------------ el envío
export const Envio = ({
  numero,
  cambiosSinGuardar,
  asunto,
  guardarCambios,
  correr,
  onCambio,
  preguntar,
}) => {
  const [destino, setDestino] = useState(leerDestino);
  const [progreso, setProgreso] = useState(null);
  const [asuntoReenvio, setAsuntoReenvio] = useState(numero.subject ?? "");
  const { toastSuccess, toastError } = useAdminToast();
  const entregas = numero.entregas ?? {};
  const enviados = entregas.sent ?? 0;
  const vacio = !(numero.pages?.length || (numero.body_html ?? "").trim());
  const listo = numero.status === "ready";
  const enCurso = numero.status === "sending";
  const guardaAlEnviar = cambiosSinGuardar && !enCurso;

  const probar = async () => {
    const correo = destino.trim();
    if (!correo.includes("@")) {
      toastError("Escriba el correo al que mandar la prueba.");
      return;
    }
    guardarDestino(correo);
    const r = await correr(() => enviarPrueba(numero.id, correo), null);
    if (r?.enviado) toastSuccess(`Prueba enviada a ${correo}`);
    else if (r) toastError("El servidor de correo no aceptó el envío. Pruebe otra vez en un momento.");
  };

  /**
   * Con cambios sin guardar se guardan primero y después sale: antes el botón se
   * apagaba sin decir por qué, y el de guardar quedaba muy arriba. Con el envío ya en
   * curso no se guarda nada: el servidor no deja tocar un número que está saliendo.
   */
  const mandar = async () => {
    const n = numero.suscriptores ?? 0;
    const guardarAntes = cambiosSinGuardar && !enCurso;
    const titulo = (guardarAntes ? asunto : numero.subject).trim();
    // El lunes ya llegó (o pasó): decir «en vez del lunes a las 9:00» confundía.
    const futuro = numero.send_on && numero.send_on > hoyIso();
    const vale = await preguntar({
      title: `¿Enviar «${titulo}» a ${n} ${n === 1 ? "suscriptor" : "suscriptores"}?`,
      description: `${
        futuro ? `Sale ya, en vez de el ${lunesLargo(numero.send_on)} a las 9:00.` : "Sale ya."
      }${guardarAntes ? " Antes se guardan el asunto y la introducción." : ""} Va a la lista real y no se puede deshacer.`,
      confirmLabel: guardarAntes ? "Guardar y enviar" : "Enviar ahora",
    });
    if (!vale) return;
    if (guardarAntes && !(await guardarCambios())) return;
    await porLotes(enviados, n - enviados, "Número enviado a toda la lista");
  };

  // Por lotes: el servidor manda 25 o durante 12 segundos por llamada, lo que llegue
  // antes, y aquí se vuelve a llamar hasta que no quede nadie. Ver `boletin.py`.
  const porLotes = async (yaEnviados, pendientes, avisoFinal) => {
    setProgreso({ enviados: yaEnviados, pendientes });
    let r;
    do {
      r = await correr(() => enviarLote(numero.id), null);
      if (!r) break;
      setProgreso((p) => ({
        enviados: (p?.enviados ?? 0) + r.enviados_en_este_lote,
        pendientes: r.pendientes,
      }));
    } while (!r.terminado);
    setProgreso(null);
    const fresco = await correr(() => verNumero(numero.id), null);
    if (fresco) onCambio(fresco);
    if (r?.terminado) toastSuccess(avisoFinal);
  };

  /**
   * Mandar otra vez un número que ya salió -- el del 28 de septiembre llegó sin
   * imágenes --. Le llega a quien sigue suscrito, también a quien se sumó después, y
   * no a quien se dio de baja. El asunto se puede cambiar para que el bueno se
   * distinga en la bandeja del roto.
   */
  const reenviar = async () => {
    const n = numero.suscriptores ?? 0;
    const vale = await preguntar({
      title: `¿Reenviar este número a ${n} ${n === 1 ? "suscriptor" : "suscriptores"}?`,
      description: `Llega otra vez a toda la lista con el asunto «${asuntoReenvio.trim() || numero.subject}». Quien se dio de baja no lo recibe. No se puede deshacer: mande antes una prueba.`,
      confirmLabel: "Reenviar ahora",
    });
    if (!vale) return;
    const r = await correr(() => reenviarNumero(numero.id, asuntoReenvio.trim()), null);
    if (!r) return;
    onCambio(r);
    await porLotes(0, n, "Número reenviado a toda la lista");
  };


  return (
    <section className="se-bol__bloque se-bol__envio">
      <div className="se-bol__bloque-cabeza">
        <h2 className="se-bol__bloque-titulo">Probar y enviar</h2>
      </div>

      {numero.status === "sent" ? (
        <p className="se-bol__enviado">
          Enviado el {fecha(numero.sent_at)} a {numero.total_recipients ?? enviados}{" "}
          suscriptores
          {entregas.failed ? ` · ${entregas.failed} no se pudieron entregar` : ""}.
        </p>
      ) : null}

      {/* La prueba también en un número ya enviado: es lo que hay que mirar antes de
          reenviarlo. */}
      <div className="se-bol__prueba">
            <label className="se-form-label" htmlFor={`bol-${numero.id}-prueba`}>
              Mandar una prueba a
            </label>
            <div className="se-bol__prueba-fila">
              <input
                id={`bol-${numero.id}-prueba`}
                type="email"
                className="se-form-control"
                placeholder="nombre@correo.com"
                value={destino}
                onChange={(e) => setDestino(e.target.value)}
              />
              <button
                type="button"
                className="se-btn se-btn--secondary"
                disabled={vacio || Boolean(progreso)}
                onClick={probar}
              >
                Enviar prueba
              </button>
            </div>
            <p className="se-admin-meta-hint">
              Llega marcada como prueba y no toca la lista.
              {cambiosSinGuardar ? " Guarde antes los cambios: la prueba sale con lo guardado." : ""}
            </p>
          </div>

      {numero.status === "sent" ? (
        <div className="se-bol__reenvio">
          <label className="se-form-label" htmlFor={`bol-${numero.id}-reenvio`}>
            Asunto del reenvío
          </label>
          <input
            id={`bol-${numero.id}-reenvio`}
            className="se-form-control"
            value={asuntoReenvio}
            maxLength={300}
            onChange={(e) => setAsuntoReenvio(e.target.value)}
          />
          <p className="se-admin-meta-hint">
            Por ejemplo, añádale «(con imágenes)» para que se distinga del que ya llegó.
          </p>
          <div className="se-bol__mandar">
            <span className="se-admin-meta-hint">
              Vuelve a llegar a quien sigue suscrito. Quien se dio de baja no lo recibe.
            </span>
            <button
              type="button"
              className="se-btn se-btn--primary"
              disabled={Boolean(progreso)}
              onClick={reenviar}
            >
              {progreso
                ? `Reenviando… ${progreso.enviados} enviados, quedan ${progreso.pendientes}`
                : `Reenviar a ${numero.suscriptores ?? 0} suscriptores`}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="se-bol__mandar">
            {!enCurso ? (
              <label className="se-admin-pub__casilla">
                <input
                  type="checkbox"
                  checked={listo}
                  disabled={vacio || Boolean(progreso)}
                  onChange={(e) =>
                    correr(
                      () => actualizarNumero(numero.id, { status: e.target.checked ? "ready" : "draft" }),
                      e.target.checked ? "Marcado como listo" : "Vuelve a borrador",
                    ).then((r) => (r ? onCambio(r) : null))
                  }
                />
                {numero.send_on
                  ? `Activo: sale solo el ${lunesLargo(numero.send_on)} a las 9:00 a ${numero.suscriptores ?? 0} suscriptores`
                  : "Activo"}
              </label>
            ) : null}
            {/* El camino normal es el lunes solo. Esto queda como salida de emergencia,
                por eso en secundario: sólo con el número activo, y pregunta antes. */}
            <button
              type="button"
              className={enCurso || progreso ? "se-btn se-btn--primary" : "se-btn se-btn--secondary"}
              disabled={
                !(listo || enCurso) || Boolean(progreso) || (guardaAlEnviar && !asunto?.trim())
              }
              onClick={mandar}
            >
              {progreso
                ? `Enviando… ${progreso.enviados} enviados, quedan ${progreso.pendientes}`
                : enCurso
                  ? `Seguir enviando (quedan ${entregas.pending ?? 0})`
                  : guardaAlEnviar
                    ? "Guardar y enviar ahora"
                    : "Enviar ahora"}
            </button>
          </div>
          {listo && guardaAlEnviar ? (
            <p className="se-admin-meta-hint">
              Hay cambios sin guardar en el asunto o la introducción. Si sale solo, sale con
              lo guardado: guárdelos arriba o use «Guardar y enviar ahora».
            </p>
          ) : null}
          {vacio ? (
            <p className="se-admin-meta-hint">Suba al menos una página para poder probarlo.</p>
          ) : !listo && !enCurso ? (
            <p className="se-admin-meta-hint">
              Mientras esté en borrador no sale. Cuando lo haya revisado con una prueba,
              actívelo y el lunes sale solo.
            </p>
          ) : null}
        </>
      )}
    </section>
  );
};

Envio.propTypes = {
  numero: PropTypes.object.isRequired,
  cambiosSinGuardar: PropTypes.bool,
  asunto: PropTypes.string,
  guardarCambios: PropTypes.func.isRequired,
  correr: PropTypes.func.isRequired,
  onCambio: PropTypes.func.isRequired,
  preguntar: PropTypes.func.isRequired,
};
