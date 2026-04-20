import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { PHONE_COUNTRY_PREFIXES } from "../data/phoneCountryPrefixes";

const normalizeSearch = (s) =>
  String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");

export const PhonePrefixSelect = ({
  id: idProp,
  value,
  onChange,
  disabled = false,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
}) => {
  const reactId = useId();
  const baseId = idProp ?? `phone-prefix-${reactId}`;
  const panelId = `${baseId}-panel`;
  const searchId = `${baseId}-search`;

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const rootRef = useRef(null);
  const searchRef = useRef(null);
  const triggerRef = useRef(null);

  const selected = useMemo(() => {
    const found = PHONE_COUNTRY_PREFIXES.find((p) => p.iso2 === String(value).toUpperCase());
    return found ?? PHONE_COUNTRY_PREFIXES[0];
  }, [value]);

  const filtered = useMemo(() => {
    const q = normalizeSearch(search).trim();
    if (!q) return PHONE_COUNTRY_PREFIXES;
    return PHONE_COUNTRY_PREFIXES.filter((p) => {
      const hay = `${normalizeSearch(p.nameEs)} ${normalizeSearch(p.dial)} ${normalizeSearch(p.iso2)}`;
      return hay.includes(q);
    });
  }, [search]);

  const handleClose = useCallback(() => {
    setOpen(false);
    setSearch("");
  }, []);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => searchRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e) => {
      const el = rootRef.current;
      if (!el || el.contains(e.target)) return;
      handleClose();
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open, handleClose]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, handleClose]);

  const handleSelectIso2 = (iso2) => {
    onChange(iso2);
    handleClose();
    triggerRef.current?.focus();
  };

  const isoLc = selected.iso2.toLowerCase();

  return (
    <div className="se-phone-prefix" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        id={baseId}
        className="se-phone-prefix__trigger se-form-control"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        onClick={() => {
          if (disabled) return;
          setOpen((o) => !o);
        }}
      >
        <span
          className={`fi fi-${isoLc} fis se-phone-prefix__flag`}
          aria-hidden="true"
          title={selected.nameEs}
        />
        <span className="se-phone-prefix__trigger-main">
          <span className="se-phone-prefix__dial">{selected.dial}</span>
          <span className="se-phone-prefix__name">{selected.nameEs}</span>
        </span>
        <span className="se-phone-prefix__caret" aria-hidden="true">
          {open ? "▴" : "▾"}
        </span>
      </button>

      {open ? (
        <div className="se-phone-prefix__popover" id={panelId}>
          <input
            ref={searchRef}
            id={searchId}
            type="search"
            className="se-form-control se-phone-prefix__search"
            placeholder="Buscar país, +prefijo o ISO…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
          />
          <ul className="se-phone-prefix__list" aria-label="Países y prefijos telefónicos">
            {filtered.length === 0 ? (
              <li className="se-phone-prefix__empty">Sin resultados.</li>
            ) : (
              filtered.map((opt) => {
                const active = opt.iso2 === String(value).toUpperCase();
                const lc = opt.iso2.toLowerCase();
                return (
                  <li key={opt.iso2}>
                    <button
                      type="button"
                      className={`se-phone-prefix__option${active ? " se-phone-prefix__option--active" : ""}`}
                      onClick={() => handleSelectIso2(opt.iso2)}
                    >
                      <span
                        className={`fi fi-${lc} fis se-phone-prefix__flag`}
                        aria-hidden="true"
                      />
                      <span className="se-phone-prefix__option-dial">{opt.dial}</span>
                      <span className="se-phone-prefix__option-name">{opt.nameEs}</span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
};

PhonePrefixSelect.propTypes = {
  id: PropTypes.string,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  "aria-labelledby": PropTypes.string,
  "aria-describedby": PropTypes.string,
};
