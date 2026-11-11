import PropTypes from "prop-types";
import { useCallback, useEffect, useState } from "react";
import { useAdminToast } from "../../context/AdminToastContext";
import { useAuth } from "../../context/AuthContext";
import { adminErrorMessage } from "../../lib/adminErrorMessage";
import { lineaDelBot } from "../../lib/avisos";
import { conectarBot, traerBot } from "../../services/adminAvisosService";
import "./botDeTelegram.css";

/**
 * El bot de Telegram de la redacción, en la página «Avisos de noticias»: si está listo,
 * cómo se llama, y quién del equipo está vinculado.
 *
 * El bot vive en el backend (`services/bot_redaccion.py`). Para que Telegram le hable,
 * alguien tiene que «conectarlo» una vez (decirle a Telegram adónde llamar): lo hace el
 * admin con el botón de aquí, sin consola. Cada persona se vincula sola desde el chat,
 * compartiendo su número, que tiene que ser el mismo de «Mi perfil».
 *
 * Si el estado no carga, el bloque no se pinta: el resto de la página sirve igual.
 */
export const BotDeTelegram = ({ anclaje }) => {
  const { role } = useAuth();
  const { toastSuccess, toastError } = useAdminToast();
  const [bot, setBot] = useState(null);
  const [ocupado, setOcupado] = useState(false);

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

  const conectar = async () => {
    setOcupado(true);
    try {
      setBot(await conectarBot());
      toastSuccess("Conectado: Telegram ya sabe adónde llamar.", "Bot de Telegram");
    } catch (err) {
      toastError(adminErrorMessage(err, "No se pudo conectar."), "Bot de Telegram");
    } finally {
      setOcupado(false);
    }
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
          {bot.vinculados.length ? (
            <ul className="se-bot__gente">
              {bot.vinculados.map((p) => (
                <li key={p.id} className={p.activo ? "" : "is-apagado"}>
                  {p.nombre}
                  {!p.activo ? " (sin acceso)" : p.recibeAvisos ? "" : " (avisos en pausa)"}
                </li>
              ))}
            </ul>
          ) : (
            <p className="se-admin-meta-hint se-bot__como">Todavía no se ha vinculado nadie.</p>
          )}
        </>
      ) : null}
    </section>
  );
};

BotDeTelegram.propTypes = {
  /** El anclaje de la guía de la página. */
  anclaje: PropTypes.object,
};
