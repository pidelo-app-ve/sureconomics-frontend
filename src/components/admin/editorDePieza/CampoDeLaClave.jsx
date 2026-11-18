import PropTypes from "prop-types";

/**
 * La Clave al final de la pieza: una palabra que tenga que ver con lo
 * que se acaba de leer. Solo en los formatos con cuerpo largo; en los
 * demás no hay «leíste completo» que premiar.
 */
export const CampoDeLaClave = ({ form, setForm }) => (
    <div className="se-form-field se-acceso se-acceso--clave">
        <span className="se-form-label se-acceso__titulo">La Clave de esta pieza</span>
        <span className="se-admin-meta-hint">
            Opcional. Al final de la pieza aparece el juego de adivinar
            esta palabra: de 4 a 10 letras, una sola, sin espacios (las
            tildes no cuentan). Elija una que salga en el texto o que lo
            resuma. La pista se ofrece al tercer fallo.
        </span>
        <div className="se-admin-filters" style={{ marginTop: "0.5rem" }}>
            <label className="se-admin-filters__field" htmlFor="post-juego-palabra">
                <span className="se-form-label">Palabra</span>
                <input
                    id="post-juego-palabra"
                    className="se-form-control"
                    maxLength={20}
                    value={form.juego_palabra ?? ""}
                    onChange={(e) =>
                        setForm((prev) => ({ ...prev, juego_palabra: e.target.value }))
                    }
                />
            </label>
            <label
                className="se-admin-filters__field se-admin-filters__field--grow"
                htmlFor="post-juego-pista"
            >
                <span className="se-form-label">Pista (opcional)</span>
                <input
                    id="post-juego-pista"
                    className="se-form-control"
                    maxLength={200}
                    value={form.juego_pista ?? ""}
                    onChange={(e) =>
                        setForm((prev) => ({ ...prev, juego_pista: e.target.value }))
                    }
                />
            </label>
        </div>
        {(() => {
            const letras = (form.juego_palabra ?? "")
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^A-Za-z\u00d1\u00f1]/g, "").length;
            const texto = (form.juego_palabra ?? "").trim();
            if (!texto) return null;
            const sucia = /\s/.test(texto);
            const mal = sucia || letras < 4 || letras > 10;
            return (
                <span
                    className="se-admin-meta-hint"
                    style={mal ? { color: "var(--color-accent)" } : undefined}
                >
                    {sucia
                        ? "Una sola palabra, sin espacios."
                        : mal
                          ? `${letras} letras: tienen que ser entre 4 y 10.`
                          : `${letras} letras.`}
                </span>
            );
        })()}
    </div>
);

CampoDeLaClave.propTypes = {
    form: PropTypes.object.isRequired,
    setForm: PropTypes.func.isRequired,
};
