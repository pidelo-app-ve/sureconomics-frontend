import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useAdminToast } from "../../../context/AdminToastContext";
import { adminErrorMessage } from "../../../lib/adminErrorMessage";
import { adminRequest } from "../../../lib/api";
import { ModalDelPanel } from "../ModalDelPanel";

/**
 * Corregir un titular a mano: el español y el inglés uno al lado del otro, con los
 * mismos topes que la redacción automática (90 caracteres el título, 280 el resumen).
 *
 * Avisa si se cambia un idioma y no el otro, porque la web en inglés seguiría diciendo
 * lo anterior. Al guardar, el titular queda «editado a mano» y el sistema ya no lo
 * reescribe aunque lleguen más fuentes (`titulares_moderacion.editar` en el backend).
 */

const CAMPOS = [
  { clave: "titulo", etiqueta: "Título", max: 90, filas: 0 },
  { clave: "resumen", etiqueta: "Resumen", max: 280, filas: 5 },
];

const Campo = ({ id, etiqueta, valor, max, filas, onCambio }) => (
  <label className="se-admin-filters__field se-tit-campo" htmlFor={id}>
    <span className="se-form-label">
      {etiqueta}
      <span className={`se-tit-campo__cuenta${valor.length > max ? " se-tit-campo__cuenta--pasa" : ""}`}>
        {valor.length}/{max}
      </span>
    </span>
    {filas ? (
      <textarea id={id} className="se-form-control" rows={filas} value={valor} onChange={(e) => onCambio(e.target.value)} />
    ) : (
      <input id={id} className="se-form-control" value={valor} onChange={(e) => onCambio(e.target.value)} />
    )}
  </label>
);

Campo.propTypes = {
  id: PropTypes.string.isRequired,
  etiqueta: PropTypes.string.isRequired,
  valor: PropTypes.string.isRequired,
  max: PropTypes.number.isRequired,
  filas: PropTypes.number,
  onCambio: PropTypes.func.isRequired,
};

const inicial = (g) => ({
  titulo: g?.titulo ?? "",
  resumen: g?.resumen ?? "",
  titulo_en: g?.titulo_en ?? "",
  resumen_en: g?.resumen_en ?? "",
});

export const EditarTitular = ({ grupo, onCerrar, onGuardado }) => {
  const { toastSuccess, toastError } = useAdminToast();
  const [texto, setTexto] = useState(() => inicial(grupo));
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => setTexto(inicial(grupo)), [grupo]);

  const original = inicial(grupo);
  const cambiados = Object.keys(texto).filter((k) => texto[k].trim() !== original[k].trim());
  const tocaEs = cambiados.some((k) => !k.endsWith("_en"));
  const tocaEn = cambiados.some((k) => k.endsWith("_en"));
  const pasa = CAMPOS.some((c) => texto[c.clave].length > c.max || texto[`${c.clave}_en`].length > c.max);
  const vacio = Object.values(texto).some((v) => !v.trim());

  const guardar = async () => {
    setOcupado(true);
    try {
      const json = Object.fromEntries(cambiados.map((k) => [k, texto[k]]));
      await adminRequest(`/admin/headlines/${grupo.id}`, { method: "PATCH", json });
      toastSuccess("Guardado. La web lo enseña corregido en menos de dos minutos.", "Titulares");
      onGuardado();
    } catch (err) {
      toastError(adminErrorMessage(err, "No se pudo guardar."), "Titulares");
    } finally {
      setOcupado(false);
    }
  };

  const poner = (clave) => (valor) => setTexto((t) => ({ ...t, [clave]: valor }));

  return (
    <ModalDelPanel
      abierto={Boolean(grupo)}
      ocupado={ocupado}
      onCerrar={onCerrar}
      ancho="ancho"
      titulo="Editar el titular"
      subtitulo="Al guardar, el sistema ya no reescribe este titular aunque lleguen más fuentes."
      pie={
        <>
          <button type="button" className="se-btn se-btn--secondary" onClick={onCerrar} disabled={ocupado}>
            Cancelar
          </button>
          <button type="button" className="se-btn se-btn--primary" onClick={guardar}
            disabled={ocupado || !cambiados.length || pasa || vacio}>
            {ocupado ? "Guardando…" : "Guardar"}
          </button>
        </>
      }
    >
      <div className="se-tit-idiomas">
        <fieldset className="se-tit-idioma">
          <legend className="se-form-label">Español</legend>
          {CAMPOS.map((c) => (
            <Campo key={c.clave} id={`tit-${c.clave}`} etiqueta={c.etiqueta} valor={texto[c.clave]} max={c.max}
              filas={c.filas} onCambio={poner(c.clave)} />
          ))}
        </fieldset>
        <fieldset className="se-tit-idioma">
          <legend className="se-form-label">Inglés</legend>
          {CAMPOS.map((c) => (
            <Campo key={c.clave} id={`tit-${c.clave}-en`} etiqueta={c.etiqueta} valor={texto[`${c.clave}_en`]}
              max={c.max} filas={c.filas} onCambio={poner(`${c.clave}_en`)} />
          ))}
        </fieldset>
      </div>
      {tocaEs !== tocaEn ? (
        <p className="se-tit-aviso" role="status">
          {tocaEs
            ? "Cambió el español pero no el inglés: la web en inglés seguirá diciendo lo anterior."
            : "Cambió el inglés pero no el español: la web en español seguirá diciendo lo anterior."}
        </p>
      ) : null}
      {vacio ? <p className="se-tit-aviso" role="status">Ningún campo puede quedar vacío.</p> : null}
    </ModalDelPanel>
  );
};

EditarTitular.propTypes = {
  grupo: PropTypes.shape({
    id: PropTypes.number.isRequired,
    titulo: PropTypes.string,
    resumen: PropTypes.string,
    titulo_en: PropTypes.string,
    resumen_en: PropTypes.string,
  }),
  onCerrar: PropTypes.func.isRequired,
  onGuardado: PropTypes.func.isRequired,
};
