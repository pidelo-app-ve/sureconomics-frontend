import PropTypes from "prop-types";
import { AssetField } from "../AssetField";
import { ACCEPTED_IMAGE_MIME, uploadAdminMediaImage } from "../../../services/adminMediaService";
import { comoAdjunto } from "./datosDelResumen";

/**
 * La foto que acompaña al mensaje (opcional): sale primero en WhatsApp y en Telegram,
 * antes del texto, y arriba en la web. Se elige sola -- la de la noticia más importante
 * del mensaje que tenga foto -- y el editor la cambia con un clic por la de otra noticia
 * del mensaje, o la sube o la elige de la biblioteca como la portada del boletín, o la
 * quita. Se guarda con el resto («Guardar cambios»). Sur la manda en JPG de 1600 px como
 * mucho, sin recortarla.
 */
export const ImagenDelDia = ({ resumen, imagenId, elegida, bloqueado, onCambio }) => {
  const guardada = imagenId && imagenId === resumen.imagen_id ? resumen.imagen : null;
  // La que se eligió sola (la de la pieza más importante) hasta que el editor la cambie.
  const automatica = Boolean(resumen.imagen_auto && imagenId && imagenId === resumen.imagen_id);
  const url = elegida?.url ?? guardada?.url ?? null;
  const asset = imagenId
    ? { id: imagenId, url, original_filename: elegida?.original_filename || guardada?.alt || "Imagen del día" }
    : null;
  const fotos = resumen.fotos_de_las_piezas ?? [];
  return (
    <div className="se-res-adm-imagen">
      <h2 className="se-form-label">La foto del mensaje</h2>
      {automatica ? (
        <p className="se-admin-meta-hint">Elegida sola: la de la noticia más importante del mensaje. Cámbiala si quieres; la ves al momento en la maqueta de al lado.</p>
      ) : null}
      {bloqueado ? (
        <>
          {url ? <img src={url} alt="" className="se-res-adm-imagen__vista" /> : null}
          <p className="se-admin-meta-hint">{url ? "Foto de la edición." : "Sin foto."}</p>
        </>
      ) : (
        <>
          {fotos.length ? (
            <div className="se-res-adm-fotos" role="group" aria-label="Fotos de las noticias del mensaje">
              <p className="se-admin-meta-hint">Las fotos de las noticias del mensaje: pulsa la que debe acompañarlo.</p>
              <ul className="se-res-adm-fotos__lista">
                {fotos.map((f) => (
                  <li key={f.id}>
                    <button type="button" className={`se-res-adm-fotos__foto${imagenId === f.id ? " is-elegida" : ""}`}
                      aria-pressed={imagenId === f.id} title={f.titulo} onClick={() => onCambio(f.id, comoAdjunto(f))}>
                      <img src={f.url} alt="" loading="lazy" />
                      <span>{f.titulo}</span>
                    </button>
                  </li>
                ))}
                <li>
                  <button type="button" className={`se-res-adm-fotos__foto se-res-adm-fotos__foto--sin${imagenId ? "" : " is-elegida"}`}
                    aria-pressed={!imagenId} onClick={() => onCambio(null, null)}>
                    <span>Sin foto</span>
                  </button>
                </li>
              </ul>
            </div>
          ) : (
            <p className="se-admin-meta-hint">Ninguna noticia del mensaje tiene foto: elige una de la biblioteca, súbela, o sale sin foto.</p>
          )}
          <AssetField
            id={`res-${resumen.id}-imagen`}
            label="Otra foto"
            hint="De la biblioteca o subida ahora. Tiene que ser pública. En WhatsApp sale primero la foto y enseguida el mensaje; en la web va arriba."
            kind="image"
            value={imagenId}
            asset={asset}
            onChange={onCambio}
            onUpload={uploadAdminMediaImage}
            accept={ACCEPTED_IMAGE_MIME}
          />
        </>
      )}
    </div>
  );
};

const FOTO = PropTypes.shape({
  id: PropTypes.number, url: PropTypes.string, alt: PropTypes.string, titulo: PropTypes.string,
  ancho: PropTypes.number, alto: PropTypes.number, credito: PropTypes.string,
});

ImagenDelDia.propTypes = {
  resumen: PropTypes.shape({
    id: PropTypes.number.isRequired,
    imagen_id: PropTypes.number,
    imagen_auto: PropTypes.bool,
    imagen: FOTO,
    fotos_de_las_piezas: PropTypes.arrayOf(FOTO),
  }).isRequired,
  imagenId: PropTypes.number,
  elegida: PropTypes.shape({ url: PropTypes.string, original_filename: PropTypes.string, width: PropTypes.number, height: PropTypes.number }),
  bloqueado: PropTypes.bool.isRequired,
  onCambio: PropTypes.func.isRequired,
};
