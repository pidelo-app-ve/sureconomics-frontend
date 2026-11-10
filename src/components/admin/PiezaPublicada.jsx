import PropTypes from "prop-types";
import { useState } from "react";
import { Link } from "react-router-dom";
import "./piezaPublicada.css";

/**
 * Lo que se hace justo después de publicar, a mano.
 *
 * Publicar terminaba en un aviso que se iba solo, y lo siguiente —abrir la pieza, mandar
 * el enlace al grupo, empezar otra— había que ir a buscarlo. Aquí queda a la vista hasta
 * que se cierra: el enlace, copiarlo, el texto listo para WhatsApp y «Crear otra».
 */
export const PiezaPublicada = ({ titulo, ruta, onCerrar }) => {
  const [copiado, setCopiado] = useState("");
  const enlace = `${window.location.origin}${ruta}`;

  const copiar = async (que, texto) => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(que);
    } catch {
      // Sin permiso del navegador para el portapapeles: se deja el enlace a la vista.
      setCopiado("no");
    }
  };

  return (
    <section className="se-publicada" role="status" aria-label="Pieza publicada">
      <div className="se-publicada__texto">
        <p className="se-publicada__titulo">Publicada: ya está en el sitio.</p>
        <a className="se-publicada__enlace" href={ruta} target="_blank" rel="noopener noreferrer">
          {enlace}
        </a>
        {copiado === "no" ? (
          <p className="se-admin-meta-hint">No se pudo copiar: seleccione el enlace de arriba.</p>
        ) : null}
      </div>
      <div className="se-publicada__acciones">
        <button type="button" className="se-btn se-btn--secondary" onClick={() => copiar("enlace", enlace)}>
          {copiado === "enlace" ? "Enlace copiado ✓" : "Copiar el enlace"}
        </button>
        <button
          type="button"
          className="se-btn se-btn--secondary"
          onClick={() => copiar("whatsapp", `*${titulo}*\n${enlace}`)}
        >
          {copiado === "whatsapp" ? "Texto copiado ✓" : "Copiar para WhatsApp"}
        </button>
        <Link to="/admin/posts/new" className="se-btn">
          Crear otra
        </Link>
        <button type="button" className="se-publicada__cerrar" onClick={onCerrar} aria-label="Cerrar este aviso">
          ×
        </button>
      </div>
    </section>
  );
};

PiezaPublicada.propTypes = {
  titulo: PropTypes.string.isRequired,
  /** La dirección de la pieza en el sitio, sin dominio (`/noticias/…`). */
  ruta: PropTypes.string.isRequired,
  onCerrar: PropTypes.func.isRequired,
};
