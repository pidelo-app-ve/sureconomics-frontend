import { useRef, useState } from "react";
import { useUserAuth } from "../../context/UserAuthContext";
import { useIdioma } from "../../i18n/ProveedorIdioma";
import { subirMiFoto } from "../../services/userMeService";
import { RecorteDeAvatar } from "../admin/RecorteDeAvatar";
import { AvatarDelLector } from "./AvatarDelLector";

/**
 * El retrato del lector: subirlo, verlo y cambiarlo.
 *
 * ## Por qué esto no es un adorno del perfil
 *
 * Es lo que aparece **firmando el artículo** cuando la redacción acepta un envío. Hasta
 * ahora no existía en ningún sitio: la foto de firma sólo la tenía el personal de la
 * casa, así que un colaborador externo mandaba su texto, se lo publicaban, y salía sin
 * cara. Eso se dice aquí, junto al botón, porque es la razón de subirla — y porque una
 * consecuencia explicada donde se decide es la diferencia entre un campo que se rellena
 * y uno que se salta.
 *
 * ## Lo que se comprueba antes de mandar nada
 *
 * El tipo y el tamaño, en el navegador. No sustituye a la comprobación del servidor
 * —que mira el contenido real del archivo y no su extensión— pero evita subir doce
 * megas para que los rechacen al final, que en una conexión lenta es un minuto perdido
 * y un error que parece del sitio.
 */

const TIPOS = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const TOPE = 5 * 1024 * 1024;

export const RetratoDelLector = () => {
  const { t } = useIdioma();
  const { profile, loadProfile } = useUserAuth();
  const entrada = useRef(null);
  const [estado, setEstado] = useState({ subiendo: false, error: "" });
  // El archivo elegido, esperando a que se encuadre. Nulo = no hay recorte abierto.
  const [recortando, setRecortando] = useState(null);

  const elegir = async (e) => {
    const file = e.target.files?.[0];
    // El input se limpia siempre: sin esto, elegir el mismo archivo dos veces seguidas
    // no dispara `change` y parece que el botón dejó de funcionar.
    e.target.value = "";
    if (!file) return;

    if (!TIPOS.includes(file.type)) {
      setEstado({ subiendo: false, error: t("cuenta.retrato.tipoNoValido") });
      return;
    }
    if (file.size > TOPE) {
      setEstado({
        subiendo: false,
        error: t("cuenta.retrato.pesaDemasiado", { mb: Math.round(file.size / 1048576) }),
      });
      return;
    }

    // No se sube el original: se abre el encuadre. Es el mismo recorte que usa la
    // redacción para las fotos del equipo, y por el mismo motivo -- la gente manda
    // fotos de cuerpo entero, y un recorte cuadrado automático se queda con el torso
    // y deja la cara en diez píxeles dentro de un círculo. Además lo que acaba
    // viajando es un cuadrado de 512 px, no el archivo de doce megas.
    setEstado({ subiendo: false, error: "" });
    setRecortando(file);
  };

  const subirRecorte = async (recortada) => {
    setRecortando(null);
    setEstado({ subiendo: true, error: "" });
    try {
      await subirMiFoto(recortada);
      // El servidor ya la dejó adjunta; se recarga el perfil para verla.
      await loadProfile().catch(() => {});
      setEstado({ subiendo: false, error: "" });
    } catch (err) {
      setEstado({
        subiendo: false,
        error:
          err?.status === 429
            ? t("cuenta.retrato.demasiadosCambios")
            : err?.message || t("cuenta.retrato.fallo"),
      });
    }
  };

  return (
    <section className="se-retrato" aria-label={t("cuenta.retrato.suFoto")}>
      <AvatarDelLector perfil={profile} tamano="lg" />

      <div className="se-retrato__copy">
        <h2 className="se-retrato__titulo">
          {profile?.photoUrl ? t("cuenta.retrato.suFoto") : t("cuenta.retrato.subaSuFoto")}
        </h2>
        <p className="se-retrato__texto">
          {t("cuenta.retrato.texto")}
        </p>

        <div className="se-retrato__acciones">
          <button
            type="button"
            className="se-btn se-btn--secondary"
            onClick={() => entrada.current?.click()}
            disabled={estado.subiendo}
          >
            {estado.subiendo
              ? t("cuenta.retrato.subiendo")
              : profile?.photoUrl
                ? t("cuenta.retrato.cambiar")
                : t("cuenta.retrato.elegir")}
          </button>
          <input
            ref={entrada}
            type="file"
            accept={TIPOS.join(",")}
            onChange={elegir}
            className="se-retrato__entrada"
            aria-label={t("cuenta.retrato.elegirImagen")}
          />
        </div>

        {estado.error ? (
          <p className="se-retrato__error" role="alert">
            {estado.error}
          </p>
        ) : (
          <p className="se-retrato__pista">{t("cuenta.retrato.pista")}</p>
        )}
      </div>

      {recortando ? (
        <RecorteDeAvatar
          archivo={recortando}
          nombre={profile?.firstName || t("cuenta.retrato.suFotoMinuscula")}
          onCancelar={() => setRecortando(null)}
          onListo={subirRecorte}
        />
      ) : null}
    </section>
  );
};

export default RetratoDelLector;
