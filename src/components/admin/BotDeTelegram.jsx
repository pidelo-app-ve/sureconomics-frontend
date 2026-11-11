import PropTypes from "prop-types";
import { useCallback, useEffect, useState } from "react";
import { useAdminToast } from "../../context/AdminToastContext";
import { useAuth } from "../../context/AuthContext";
import { useAdminConfirm } from "../../hooks/useAdminConfirm";
import { adminErrorMessage } from "../../lib/adminErrorMessage";
import { estadoDePersona, lineaDelBot, lineaDeQuienRecibe } from "../../lib/avisos";
import {
  agregarAMarketing,
  conectarBot,
  ponerEnElFlujo,
  quitarDeMarketing,
  traerBot,
} from "../../services/adminAvisosService";
import "./botDeTelegram.css";

const SIN_CONTACTO = { nombre: "", telefono: "" };

/**
 * El bot de Telegram de la redacción, en la página «Avisos de noticias»: si está listo,
 * cómo se llama, quién recibe las noticias y a quién de marketing le llega lo publicado.
 *
 * El bot vive en el backend (`services/bot_redaccion.py`). Para que Telegram le hable,
 * alguien tiene que «conectarlo» una vez (decirle a Telegram adónde llamar): lo hace el
 * admin con el botón de aquí, sin consola. Cada persona se vincula sola desde el chat,
 * compartiendo su número, que tiene que ser el mismo de «Mi perfil».
 *
 * Son dos grupos distintos:
 * - **Quién recibe las noticias**: de los vinculados, a quién le llegan los avisos para
 *   elegir, redactar y publicar desde el chat (el jefe editorial). Lo marca el admin.
 * - **Marketing**: personas que no tienen cuenta en el panel. Solo reciben lo que el jefe
 *   editorial les manda después de publicar, para montarlo en Instagram.
 *
 * Si el estado no carga, el bloque no se pinta: el resto de la página sirve igual.
 */
export const BotDeTelegram = ({ anclaje, anclajeMarketing }) => {
  const { role } = useAuth();
  const { toastSuccess, toastError } = useAdminToast();
  const { confirm, ConfirmDialog } = useAdminConfirm();
  const [bot, setBot] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  const [contacto, setContacto] = useState(SIN_CONTACTO);

  const cargar = useCallback(async () => {
    try {
      setBot(await traerBot());
    } catch {
      setBot(null);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  if (!bot) return null;

  /** Corre un cambio del bot: el servidor devuelve el estado nuevo, que se pinta tal cual. */
  const hacer = async (cambio, hecho, fallo) => {
    setOcupado(true);
    try {
      setBot(await cambio());
      toastSuccess(hecho, "Bot de Telegram");
      return true;
    } catch (err) {
      toastError(adminErrorMessage(err, fallo), "Bot de Telegram");
      return false;
    } finally {
      setOcupado(false);
    }
  };

  const conectar = () => hacer(conectarBot, "Conectado: Telegram ya sabe adónde llamar.", "No se pudo conectar.");

  const alternar = (persona) =>
    hacer(
      () => ponerEnElFlujo(persona.id, !persona.enElFlujo),
      persona.enElFlujo
        ? `${persona.nombre} ya no recibe las noticias.`
        : `${persona.nombre} recibe las noticias desde la próxima pasada.`,
      "No se pudo cambiar.",
    );

  const agregar = async (e) => {
    e.preventDefault();
    const nombre = contacto.nombre.trim();
    const ok = await hacer(
      () => agregarAMarketing({ nombre, telefono: contacto.telefono.trim() }),
      `${nombre} está en la lista. Falta que abra el bot y comparta su número.`,
      "No se pudo agregar.",
    );
    if (ok) setContacto(SIN_CONTACTO);
  };

  const quitar = async (persona) => {
    const ok = await confirm({
      warning: null,
      title: `Quitar a ${persona.nombre}`,
      description:
        "Deja de recibir las noticias para Instagram. Si vuelve a la lista, tendrá que vincularse otra vez desde el bot.",
      confirmLabel: "Quitar",
    });
    if (ok) await hacer(() => quitarDeMarketing(persona.id), `${persona.nombre} ya no está en la lista.`, "No se pudo quitar.");
  };

  const esAdmin = role === "admin";
  return (
    <section className="se-admin-table-wrap se-bot" {...anclaje}>
      <div className="se-bot__cabeza">
        <div>
          <span className="se-form-label">Bot de Telegram</span>
          <p className="se-bot__linea">{lineaDelBot(bot)}</p>
        </div>
        <div className="se-bot__acciones">
          {bot.enlace ? (
            <a className="se-btn se-btn--secondary" href={bot.enlace} target="_blank" rel="noopener noreferrer">
              Abrir en Telegram
            </a>
          ) : null}
          {esAdmin && bot.configurado ? (
            <button type="button" className="se-btn se-btn--secondary" disabled={ocupado} onClick={conectar}>
              {bot.conectado ? "Volver a conectar" : "Conectar el bot"}
            </button>
          ) : null}
        </div>
      </div>
      {bot.conectado ? (
        <>
          <p className="se-admin-meta-hint se-bot__como">
            Para usarlo: abre el bot, escribe /start y pulsa «Compartir mi número». Tiene que ser el mismo celular que
            está en «Mi perfil».
          </p>

          <div className="se-bot__bloque">
            <span className="se-form-label">Quién recibe las noticias</span>
            <p className="se-admin-meta-hint se-bot__como">{lineaDeQuienRecibe(bot)}</p>
            {bot.vinculados.length ? (
              <ul className="se-bot__lista">
                {bot.vinculados.map((p) => (
                  <li key={p.id} className={p.activo ? "" : "is-apagado"}>
                    <span className="se-bot__nombre">
                      {p.nombre}
                      {estadoDePersona(p) ? <small> · {estadoDePersona(p)}</small> : null}
                    </span>
                    {esAdmin && p.activo ? (
                      <button type="button" role="switch" aria-checked={p.enElFlujo}
                        aria-label={`${p.nombre} recibe las noticias`}
                        className={`se-alaire${p.enElFlujo ? " is-on" : ""}`} disabled={ocupado} onClick={() => alternar(p)}>
                        <span className="se-alaire__pista" aria-hidden="true" />
                        <span className="se-alaire__texto">{p.enElFlujo ? "Las recibe" : "No las recibe"}</span>
                      </button>
                    ) : (
                      <span className="se-bot__estado">{p.activo && p.enElFlujo ? "Las recibe" : "No las recibe"}</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="se-bot__bloque" {...anclajeMarketing}>
            <span className="se-form-label">Marketing (Instagram)</span>
            <p className="se-admin-meta-hint se-bot__como">
              A estas personas les llega por Telegram cada noticia que el jefe editorial les manda después de
              publicarla, con el enlace, la foto y su nota. No necesitan cuenta en el panel: abren el bot, escriben
              /start y comparten su número, que tiene que ser el de aquí.
            </p>
            {bot.marketing.length ? (
              <ul className="se-bot__lista">
                {bot.marketing.map((c) => (
                  <li key={c.id} className={c.vinculada ? "" : "is-apagado"}>
                    <span className="se-bot__nombre">
                      {c.nombre}
                      <small> · +{c.telefono} · {c.vinculada ? "vinculada" : "falta que abra el bot"}</small>
                    </span>
                    <button type="button" className="se-btn se-btn--secondary se-bot__quitar" disabled={ocupado}
                      aria-label={`Quitar a ${c.nombre}`} onClick={() => quitar(c)}>
                      Quitar
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            <form className="se-bot__form" onSubmit={agregar}>
              <label className="se-form-field" htmlFor="bot-marketing-nombre">
                <span className="se-form-label">Nombre</span>
                <input id="bot-marketing-nombre" type="text" className="se-form-control" maxLength={120}
                  autoComplete="off" value={contacto.nombre} disabled={ocupado}
                  onChange={(e) => setContacto((c) => ({ ...c, nombre: e.target.value }))} />
              </label>
              <label className="se-form-field" htmlFor="bot-marketing-telefono">
                <span className="se-form-label">Celular</span>
                <input id="bot-marketing-telefono" type="tel" inputMode="tel" className="se-form-control"
                  autoComplete="off" placeholder="+58 412 1234567" value={contacto.telefono} disabled={ocupado}
                  onChange={(e) => setContacto((c) => ({ ...c, telefono: e.target.value }))} />
              </label>
              <button type="submit" className="se-btn se-btn--secondary"
                disabled={ocupado || !contacto.nombre.trim() || !contacto.telefono.trim()}>
                Agregar
              </button>
            </form>
          </div>
        </>
      ) : null}
      <ConfirmDialog />
    </section>
  );
};

BotDeTelegram.propTypes = {
  /** El anclaje de la guía de la página. */
  anclaje: PropTypes.object,
  /** El anclaje del paso de la guía que explica lo de marketing. */
  anclajeMarketing: PropTypes.object,
};
