import PropTypes from "prop-types";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

const normalizeTaxonomyItems = (items) => {
  const cleaned = (items ?? [])
    .map((item) => {
      const slug = String(item?.slug ?? "").trim();
      const name = String(item?.name ?? "").trim();
      const id = String(item?.id ?? "").trim();
      const value = slug || name;
      if (!value) return null;

      const label = name || slug;
      return { id, slug, name, value, label };
    })
    .filter(Boolean);

  const seen = new Set();
  const deduped = [];
  for (const item of cleaned) {
    if (seen.has(item.value)) continue;
    seen.add(item.value);
    deduped.push(item);
  }

  deduped.sort((a, b) => a.label.localeCompare(b.label, "es", { sensitivity: "base" }));
  return deduped;
};

const FilterSelect = ({ id, ariaLabel, value, onChange, options, placeholderLabel, emptyLabel }) => {
  const listboxId = useId();
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  const flatOptions = useMemo(() => {
    const base = [{ value: "", label: emptyLabel }, ...options];
    const selected = String(value ?? "").trim();
    if (!selected) return base;
    if (base.some((o) => o.value === selected)) return base;
    return [{ value: selected, label: selected }, ...base];
  }, [emptyLabel, options, value]);

  const selectedLabel = useMemo(() => {
    const selected = String(value ?? "").trim();
    if (!selected) return placeholderLabel;
    const found = flatOptions.find((o) => o.value === selected);
    return found?.label ?? placeholderLabel;
  }, [flatOptions, placeholderLabel, value]);

  const isPlaceholder = String(value ?? "").trim() === "";

  const close = useCallback(() => {
    setOpen(false);
    requestAnimationFrame(() => {
      buttonRef.current?.focus?.();
    });
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const idx = Math.max(
      0,
      flatOptions.findIndex((o) => o.value === String(value ?? "").trim())
    );
    setActiveIdx(Number.isFinite(idx) && idx >= 0 ? idx : 0);

    const onPointerDown = (e) => {
      const el = rootRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) close();
    };

    const onKeyDown = (e) => {
      if (e.key === "Escape") close();
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown, true);

    requestAnimationFrame(() => {
      menuRef.current?.focus?.();
    });

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [close, flatOptions, open, value]);

  useEffect(() => {
    if (!open) return undefined;
    const menu = menuRef.current;
    if (!menu) return undefined;
    const active = menu.querySelector(".se-filter-select__option--active");
    if (active && typeof active.scrollIntoView === "function") {
      active.scrollIntoView({ block: "nearest" });
    }
    return undefined;
  }, [activeIdx, open]);

  const commit = (nextValue) => {
    onChange(nextValue);
    close();
  };

  const handleButtonKeyDown = (e) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
    }
  };

  const handleListKeyDown = (e) => {
    if (!open) return;
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(flatOptions.length - 1, i + 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
      return;
    }
    if (e.key === "Home") {
      e.preventDefault();
      setActiveIdx(0);
      return;
    }
    if (e.key === "End") {
      e.preventDefault();
      setActiveIdx(flatOptions.length - 1);
      return;
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const opt = flatOptions[activeIdx];
      if (opt) commit(opt.value);
    }
  };

  return (
    <div className="se-filter-select" ref={rootRef}>
      <button
        type="button"
        id={id}
        ref={buttonRef}
        className={`se-filter-select__button se-filters__control${isPlaceholder ? " se-filter-select__button--placeholder" : ""}`}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={handleButtonKeyDown}
      >
        <span className="se-filter-select__value">{selectedLabel}</span>
        <span className="se-filter-select__chevron" aria-hidden="true">
          ▾
        </span>
      </button>

      {open ? (
        <div
          id={listboxId}
          ref={menuRef}
          className="se-filter-select__menu"
          role="listbox"
          tabIndex={-1}
          onKeyDown={handleListKeyDown}
        >
          {flatOptions.map((opt, idx) => {
            const isActive = idx === activeIdx;
            const isSelected = String(value ?? "").trim() === opt.value;
            return (
              <div
                key={opt.value || `empty-${idx}`}
                role="option"
                aria-selected={isSelected}
                className={`se-filter-select__option${isActive ? " se-filter-select__option--active" : ""}${
                  isSelected ? " se-filter-select__option--selected" : ""
                }`}
                onMouseEnter={() => setActiveIdx(idx)}
                onMouseDown={(e) => {
                  // keep focus behavior predictable; avoid blur-before-click issues
                  e.preventDefault();
                }}
                onClick={() => commit(opt.value)}
              >
                {opt.label}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

FilterSelect.propTypes = {
  id: PropTypes.string.isRequired,
  ariaLabel: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  placeholderLabel: PropTypes.string.isRequired,
  emptyLabel: PropTypes.string.isRequired,
};

export const ArticlesFiltersLite = ({
  query,
  onQueryChange,
  category,
  onCategoryChange,
  tag,
  onTagChange,
  categories,
  tags,
  onReset,
}) => {
  const categoryOptions = useMemo(() => normalizeTaxonomyItems(categories), [categories]);
  const tagOptions = useMemo(() => normalizeTaxonomyItems(tags), [tags]);

  return (
    <aside className="se-filters" aria-label="Filtros de artículos">
      <div className="se-filters__panel" role="region">
        <div className="se-filters__header">
          <h2 className="se-heading-section se-heading-section--small">Filtros</h2>
          <button type="button" className="se-link se-filters__reset" onClick={onReset}>
            Limpiar
          </button>
        </div>

        <div className="se-filters__group">
          <label className="se-filters__label" htmlFor="article-search">
            Buscar
          </label>
          <input
            id="article-search"
            className="se-filters__control"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Buscar por título o resumen…"
          />
        </div>

        <div className="se-filters__group">
          <label className="se-filters__label" htmlFor="filter-category">
            Categoría
          </label>
          <FilterSelect
            id="filter-category"
            ariaLabel="Categoría"
            value={category}
            onChange={onCategoryChange}
            options={categoryOptions.map((c) => ({ value: c.value, label: c.label }))}
            placeholderLabel="Seleccionar categoría"
            emptyLabel="Todas"
          />
        </div>

        <div className="se-filters__group">
          <label className="se-filters__label" htmlFor="filter-tag">
            Etiqueta
          </label>
          <FilterSelect
            id="filter-tag"
            ariaLabel="Etiqueta"
            value={tag}
            onChange={onTagChange}
            options={tagOptions.map((t) => ({ value: t.value, label: t.label }))}
            placeholderLabel="Seleccionar etiqueta"
            emptyLabel="Todos"
          />
        </div>
      </div>
    </aside>
  );
};

ArticlesFiltersLite.propTypes = {
  query: PropTypes.string.isRequired,
  onQueryChange: PropTypes.func.isRequired,
  category: PropTypes.string.isRequired,
  onCategoryChange: PropTypes.func.isRequired,
  tag: PropTypes.string.isRequired,
  onTagChange: PropTypes.func.isRequired,
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
      slug: PropTypes.string,
    })
  ).isRequired,
  tags: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
      slug: PropTypes.string,
    })
  ).isRequired,
  onReset: PropTypes.func.isRequired,
};

