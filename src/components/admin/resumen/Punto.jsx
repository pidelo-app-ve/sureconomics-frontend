import PropTypes from "prop-types";

export const Punto = ({ punto, info, secciones, clave, primero, ultimo, bloqueado, onCambio, onMover, onQuitar, onSubir, onBajar }) => (
  <li className="se-res-adm-punto">
    <div className="se-res-adm-punto__fila">
      <input className="se-form-control" value={punto.linea} maxLength={140} disabled={bloqueado}
        aria-label="Línea del punto" onChange={(e) => onCambio({ ...punto, linea: e.target.value })} />
      <div className="se-res-adm-punto__botones">
        <button type="button" className="se-btn se-btn--secondary" aria-label="Subir" disabled={bloqueado || primero} onClick={onSubir}>↑</button>
        <button type="button" className="se-btn se-btn--secondary" aria-label="Bajar" disabled={bloqueado || ultimo} onClick={onBajar}>↓</button>
        <label className="se-sr-only" htmlFor={`mover-${punto.id}`}>Mover a otra sección</label>
        <select id={`mover-${punto.id}`} className="se-form-control se-res-adm-punto__mover" value="" disabled={bloqueado}
          onChange={(e) => e.target.value && onMover(e.target.value)}>
          <option value="">Mover a…</option>
          {secciones.filter((s) => s.clave !== clave).map((s) => (
            <option key={s.clave} value={s.clave}>{s.titulo}</option>
          ))}
        </select>
        <button type="button" className="se-btn se-btn--secondary" disabled={bloqueado} onClick={onQuitar}>Quitar</button>
      </div>
    </div>
    <p className="se-admin-meta-hint se-res-adm-punto__meta">
      {info?.tipo === "titular" ? `Última hora${info.fuente ? ` · ${info.fuente}` : ""}` : "Pieza de SurEconomics"} ·{" "}
      <a href={info?.url} target="_blank" rel="noopener noreferrer">ver original</a>
      {info?.titulo && info.titulo !== punto.linea ? ` · título original: «${info.titulo}»` : ""}
    </p>
    <details className="se-res-adm-punto__en">
      <summary className="se-admin-meta-hint">Inglés</summary>
      <input className="se-form-control" value={punto.linea_en ?? ""} maxLength={140} disabled={bloqueado}
        aria-label="Línea en inglés" onChange={(e) => onCambio({ ...punto, linea_en: e.target.value })} />
    </details>
  </li>
);

Punto.propTypes = {
  punto: PropTypes.shape({ id: PropTypes.string.isRequired, linea: PropTypes.string, linea_en: PropTypes.string }).isRequired,
  info: PropTypes.object,
  secciones: PropTypes.array.isRequired,
  clave: PropTypes.string.isRequired,
  primero: PropTypes.bool,
  ultimo: PropTypes.bool,
  bloqueado: PropTypes.bool,
  onCambio: PropTypes.func.isRequired,
  onMover: PropTypes.func.isRequired,
  onQuitar: PropTypes.func.isRequired,
  onSubir: PropTypes.func.isRequired,
  onBajar: PropTypes.func.isRequired,
};
