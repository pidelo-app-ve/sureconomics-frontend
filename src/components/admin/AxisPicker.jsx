import PropTypes from "prop-types";

/**
 * Pick up to three tags on one axis, in order.
 *
 * Deliberately not a checkbox list. A piece may carry three topics and three
 * places, and the **first** of each is the principal one — it is the single tag
 * its card shows on the home page and in every listing. Checkboxes have no order,
 * so an editor could not tell which of their three choices was going to be the
 * one readers see. Here selection appends, the chosen tags are shown in the order
 * they will be stored, the first is labelled, and they can be reordered.
 */
export const AxisPicker = ({
  id,
  legend,
  hint,
  options,
  groups,
  value,
  onChange,
  max = 3,
  principalLabel = "principal",
}) => {
  const selected = value ?? [];
  const isSelected = (optionId) => selected.some((x) => String(x) === String(optionId));
  const full = selected.length >= max;

  const byId = new Map();
  (options ?? []).forEach((option) => byId.set(String(option.id), option));
  (groups ?? []).forEach((group) =>
    group.children.forEach((child) => byId.set(String(child.id), child))
  );

  const add = (optionId) => {
    if (isSelected(optionId) || full) return;
    onChange([...selected, optionId]);
  };

  const remove = (optionId) => {
    onChange(selected.filter((x) => String(x) !== String(optionId)));
  };

  const move = (index, delta) => {
    const target = index + delta;
    if (target < 0 || target >= selected.length) return;
    const next = [...selected];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const renderOption = (option) => {
    const chosen = isSelected(option.id);
    return (
      <button
        type="button"
        key={String(option.id)}
        className={`se-axis__option${chosen ? " is-selected" : ""}`}
        onClick={() => (chosen ? remove(option.id) : add(option.id))}
        aria-pressed={chosen}
        disabled={!chosen && full}
      >
        {option.name}
        {typeof option.post_count === "number" ? (
          <span className="se-axis__count">{option.post_count}</span>
        ) : null}
      </button>
    );
  };

  return (
    <fieldset className="se-form-field se-axis" id={id}>
      <legend className="se-form-label">
        {legend} <span className="se-axis__limit">máximo {max}</span>
      </legend>
      {hint ? <p className="se-axis__hint">{hint}</p> : null}

      {selected.length ? (
        <ol className="se-axis__chosen">
          {selected.map((optionId, index) => {
            const option = byId.get(String(optionId));
            return (
              <li key={String(optionId)} className="se-axis__chip">
                <span className="se-axis__chip-name">
                  {option?.name ?? `#${optionId}`}
                  {index === 0 ? (
                    <em className="se-axis__chip-role">{principalLabel}</em>
                  ) : null}
                </span>
                <span className="se-axis__chip-actions">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label={`Subir ${option?.name ?? "etiqueta"}`}
                    title="Subir"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === selected.length - 1}
                    aria-label={`Bajar ${option?.name ?? "etiqueta"}`}
                    title="Bajar"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(optionId)}
                    aria-label={`Quitar ${option?.name ?? "etiqueta"}`}
                    title="Quitar"
                  >
                    ×
                  </button>
                </span>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="se-axis__empty">Sin seleccionar.</p>
      )}

      {full ? (
        <p className="se-axis__full">
          Llegó al máximo. Quite una para elegir otra.
        </p>
      ) : null}

      {groups ? (
        <div className="se-axis__groups">
          {groups.map((group) => (
            <div key={String(group.id)} className="se-axis__group">
              <p className="se-axis__group-name">{group.name}</p>
              <div className="se-axis__options">{group.children.map(renderOption)}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="se-axis__options">{(options ?? []).map(renderOption)}</div>
      )}
    </fieldset>
  );
};

const optionShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  name: PropTypes.string.isRequired,
  post_count: PropTypes.number,
});

AxisPicker.propTypes = {
  id: PropTypes.string,
  legend: PropTypes.string.isRequired,
  hint: PropTypes.string,
  options: PropTypes.arrayOf(optionShape),
  groups: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      name: PropTypes.string.isRequired,
      children: PropTypes.arrayOf(optionShape).isRequired,
    })
  ),
  value: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.number, PropTypes.string])),
  onChange: PropTypes.func.isRequired,
  max: PropTypes.number,
  principalLabel: PropTypes.string,
};
