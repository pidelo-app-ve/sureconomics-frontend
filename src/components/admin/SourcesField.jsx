import PropTypes from "prop-types";

/**
 * The sources behind a piece: as many as it has, in the order they matter.
 *
 * Replaces the single name/link pair. The newsroom reported the ceiling from both
 * ends at once — Editorial had no field at all, and a wire story built from three
 * agencies could only credit one — and both were the same pair of columns.
 *
 * Order is editorial, not cosmetic: the first source is the one the piece leans
 * on, so the rows are numbered and movable rather than sorted for the editor.
 *
 * An empty row at the end is deliberate. Asking for "add source" before there is
 * anywhere to type is a click that exists only to satisfy the data model.
 */
export const SourcesField = ({ value, onChange, max = 10 }) => {
  const rows = value ?? [];
  // Always one blank row to type into, unless the ceiling is already reached.
  const shown = rows.length < max ? [...rows, { name: "", url: "" }] : rows;

  const write = (index, field, next) => {
    const copia = shown.map((row) => ({ ...row }));
    copia[index] = { ...copia[index], [field]: next };
    // Trailing blanks are the affordance, not data: they never leave this component.
    onChange(copia.filter((row) => (row.name ?? "").trim() || (row.url ?? "").trim()));
  };

  const remove = (index) => onChange(rows.filter((_, i) => i !== index));

  const move = (index, delta) => {
    const destino = index + delta;
    if (destino < 0 || destino >= rows.length) return;
    const copia = [...rows];
    [copia[index], copia[destino]] = [copia[destino], copia[index]];
    onChange(copia);
  };

  return (
    <div className="se-form-field">
      <span className="se-form-label">Fuentes</span>
      <p className="se-admin-meta-hint" style={{ marginTop: 0 }}>
        Puede añadir varias. La primera es la que se lee como principal. El enlace es
        opcional: una fuente puede ser una persona o una rueda de prensa.
      </p>

      <ol className="se-admin-sources">
        {shown.map((row, index) => {
          const guardada = index < rows.length;
          return (
            <li key={index} className="se-admin-sources__row">
              <span className="se-admin-sources__n" aria-hidden="true">
                {index + 1}
              </span>
              <input
                className="se-form-control"
                value={row.name ?? ""}
                onChange={(e) => write(index, "name", e.target.value)}
                placeholder="Reuters, Banco Central, …"
                aria-label={`Nombre de la fuente ${index + 1}`}
              />
              <input
                className="se-form-control"
                value={row.url ?? ""}
                onChange={(e) => write(index, "url", e.target.value)}
                placeholder="https://… (opcional)"
                aria-label={`Enlace de la fuente ${index + 1}`}
              />
              <span className="se-admin-sources__acts">
                {guardada && rows.length > 1 ? (
                  <>
                    <button
                      type="button"
                      className="se-link se-header__nav-link--button"
                      onClick={() => move(index, -1)}
                      disabled={index === 0}
                      aria-label={`Subir la fuente ${index + 1}`}
                      title="Subir"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="se-link se-header__nav-link--button"
                      onClick={() => move(index, 1)}
                      disabled={index === rows.length - 1}
                      aria-label={`Bajar la fuente ${index + 1}`}
                      title="Bajar"
                    >
                      ↓
                    </button>
                  </>
                ) : null}
                {guardada ? (
                  <button
                    type="button"
                    className="se-link se-header__nav-link--button"
                    onClick={() => remove(index)}
                    aria-label={`Quitar la fuente ${index + 1}`}
                    title="Quitar"
                  >
                    ✕
                  </button>
                ) : null}
              </span>
            </li>
          );
        })}
      </ol>

      {rows.length >= max ? (
        <p className="se-admin-meta-hint">
          Son {max}, el máximo. Una lista más larga que eso es una bibliografía y va
          mejor dentro del texto.
        </p>
      ) : null}
    </div>
  );
};

SourcesField.propTypes = {
  value: PropTypes.arrayOf(
    PropTypes.shape({ name: PropTypes.string, url: PropTypes.string })
  ),
  onChange: PropTypes.func.isRequired,
  max: PropTypes.number,
};

export default SourcesField;
