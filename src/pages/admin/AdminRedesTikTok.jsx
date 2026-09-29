import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { adminErrorMessage } from "../../lib/adminErrorMessage";
import { conectarTiktok } from "../../services/adminSettingsService";

/**
 * La vuelta de TikTok. Es la «Redirect URI» registrada en Login Kit, así que TikTok manda
 * aquí a quien acaba de dar (o negar) permiso, con `code` y `state` en la dirección.
 *
 * Aquí sólo se entrega eso al servidor, que es quien cambia el código por el acceso y lo
 * guarda: el navegador nunca ve un token. Si sale bien, de vuelta a «En redes» con los
 * videos ya traídos.
 *
 * **Una sola vez.** El código de TikTok sirve para un único canje. En desarrollo React
 * monta dos veces los efectos, y sin el `useRef` el segundo intento fallaría con «código
 * ya usado» y taparía el éxito del primero.
 */
export const AdminRedesTikTok = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const enviado = useRef(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (enviado.current) return;
    enviado.current = true;

    const negado = params.get("error");
    if (negado) {
      setError(
        negado === "access_denied"
          ? "No se dio permiso en TikTok, así que no se conectó nada. Puede volver a intentarlo cuando quiera."
          : `TikTok no completó la conexión: ${params.get("error_description") || negado}.`
      );
      return;
    }
    conectarTiktok(params.get("code") || "", params.get("state") || "")
      .then(() =>
        navigate("/admin/redes", {
          replace: true,
          state: { aviso: "TikTok conectado. Los últimos videos ya están en «En redes»." },
        })
      )
      .catch((err) => setError(adminErrorMessage(err, "No se pudo conectar TikTok.")));
  }, [navigate, params]);

  return (
    <div className="se-admin-shell">
      <header className="se-admin-shell__header" style={{ marginBottom: "1rem" }}>
        <h1 className="se-heading-section" style={{ margin: 0 }}>Conectar TikTok</h1>
      </header>
      {error ? (
        <>
          <p className="se-admin-form-feedback" role="alert">{error}</p>
          <Link to="/admin/redes" className="se-btn se-btn--secondary">Volver a En redes</Link>
        </>
      ) : (
        <p className="se-admin-meta-hint" role="status">
          Conectando con TikTok y trayendo los últimos videos…
        </p>
      )}
    </div>
  );
};

export default AdminRedesTikTok;
