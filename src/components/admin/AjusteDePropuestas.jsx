import { useEffect, useState } from "react";
import { useAdminToast } from "../../context/AdminToastContext";
import { adminErrorMessage } from "../../lib/adminErrorMessage";
import {
  getCollaborativeSubmissionsSettings,
  patchCollaborativeSubmissionsSettings,
} from "../../services/adminSettingsService";

const leer = (data) => {
  if (!data || typeof data !== "object") return false;
  if (typeof data.enabled === "boolean") return data.enabled;
  if (typeof data.collaborative_submissions_enabled === "boolean") return data.collaborative_submissions_enabled;
  return data.data && typeof data.data === "object" ? leer(data.data) : false;
};

/**
 * Si el sitio recibe propuestas de lectores: un interruptor en la cabecera de
 * «Propuestas de lectores».
 *
 * Era una página aparte («Ajustes de propuestas») con una sola casilla y su botón de
 * guardar, en otro grupo del menú. Va donde se usa, y se guarda al pulsarlo, como el
 * «Al aire» de Publicidad (mismo estilo). Mientras no se sabe cómo está, no se pinta:
 * un interruptor apagado por defecto diría algo que puede no ser cierto.
 */
export const AjusteDePropuestas = () => {
  const [abierto, setAbierto] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  const { toastSuccess, toastError } = useAdminToast();

  useEffect(() => {
    let vivo = true;
    getCollaborativeSubmissionsSettings()
      .then((data) => vivo && setAbierto(leer(data)))
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, []);

  if (abierto === null) return null;

  const cambiar = async () => {
    const nuevo = !abierto;
    setOcupado(true);
    try {
      await patchCollaborativeSubmissionsSettings({ enabled: nuevo, collaborative_submissions_enabled: nuevo });
      setAbierto(nuevo);
      toastSuccess(
        nuevo ? "Los lectores ya pueden enviar propuestas." : "Ya no se reciben propuestas nuevas.",
        "Propuestas de lectores",
      );
    } catch (err) {
      toastError(adminErrorMessage(err, "No se pudo guardar el cambio."), "Propuestas de lectores");
    } finally {
      setOcupado(false);
    }
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={abierto}
      aria-label="Recibir propuestas de lectores"
      className={`se-alaire${abierto ? " is-on" : ""}`}
      disabled={ocupado}
      onClick={cambiar}
    >
      <span className="se-alaire__pista" aria-hidden="true" />
      <span className="se-alaire__texto">{abierto ? "Recibiendo propuestas" : "Propuestas cerradas"}</span>
    </button>
  );
};
