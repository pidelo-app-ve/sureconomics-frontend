import PropTypes from "prop-types";
import { useRef, useState } from "react";
import { ModalDelPanel } from "../ModalDelPanel";
import { SelectorDeBiblioteca } from "../SelectorDeBiblioteca";
import { useAdminToast } from "../../../context/AdminToastContext";
import { anadirPagina, ordenarPaginas, quitarPagina } from "../../../services/adminBoletinService";
import { ACCEPTED_IMAGE_MIME, uploadAdminMediaImage } from "../../../services/adminMediaService";

// ------------------------------------------------------------------ las páginas
export const Paginas = ({ numero, bloqueado, correr, onCambio }) => {
  const { toastSuccess } = useAdminToast();
  const [biblioteca, setBiblioteca] = useState(false);
  const [subiendo, setSubiendo] = useState(null);
  const entrada = useRef(null);
  const paginas = numero.pages ?? [];

  const subir = async (archivos) => {
    const lista = Array.from(archivos ?? []);
    if (!lista.length) return;
    // De una en una y en el orden en que se eligieron: el orden del selector de
    // archivos es el orden de las páginas, que es lo que se espera al elegir
    // "pagina-1, pagina-2, pagina-3" de una vez.
    let ultimo = null;
    for (let i = 0; i < lista.length; i += 1) {
      setSubiendo({ hecho: i, total: lista.length });
      const r = await correr(async () => {
        const medio = await uploadAdminMediaImage(lista[i]);
        return anadirPagina(numero.id, medio.id);
      }, null);
      if (!r) break;
      ultimo = r;
    }
    setSubiendo(null);
    if (entrada.current) entrada.current.value = "";
    if (ultimo) {
      onCambio(ultimo);
      toastSuccess(lista.length === 1 ? "Página añadida" : "Páginas añadidas");
    }
  };

  const mover = (desde, hacia) => {
    const orden = paginas.map((p) => p.id);
    const [id] = orden.splice(desde, 1);
    orden.splice(hacia, 0, id);
    correr(() => ordenarPaginas(numero.id, orden), "Orden guardado").then((r) =>
      r ? onCambio(r) : null,
    );
  };

  return (
    <section className="se-bol__bloque">
      <div className="se-bol__bloque-cabeza">
        <h2 className="se-bol__bloque-titulo">Páginas</h2>
        <p className="se-admin-meta-hint">
          Las que diseñaron en Canva, en el orden en que se leen. Van todas en el correo,
          una debajo de otra, a lo ancho del mensaje. Lo ideal: exportadas en PNG o JPG
          a unos 1080 px de ancho.
        </p>
      </div>

      {paginas.length ? (
        <ol className="se-bol__paginas">
          {paginas.map((p, i) => (
            <li key={p.id} className="se-bol__pagina">
              <span className="se-bol__pagina-n">{i + 1}</span>
              {p.url ? (
                <img
                  src={p.url}
                  alt={p.nombre || `Página ${i + 1}`}
                  className="se-bol__pagina-img"
                  loading="lazy"
                />
              ) : (
                <span className="se-bol__pagina-rota">Archivo no disponible</span>
              )}
              <span className="se-bol__pagina-nombre" title={p.nombre || ""}>
                {p.nombre || `Página ${i + 1}`}
              </span>
              {!bloqueado ? (
                <span className="se-bol__pagina-acciones">
                  <button
                    type="button"
                    className="se-btn se-btn--secondary se-btn--small"
                    disabled={i === 0}
                    onClick={() => mover(i, i - 1)}
                    aria-label={`Subir la página ${i + 1}`}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="se-btn se-btn--secondary se-btn--small"
                    disabled={i === paginas.length - 1}
                    onClick={() => mover(i, i + 1)}
                    aria-label={`Bajar la página ${i + 1}`}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="se-btn se-btn--secondary se-btn--small"
                    onClick={() =>
                      correr(() => quitarPagina(numero.id, p.id), "Página quitada").then((r) =>
                        r ? onCambio(r) : null,
                      )
                    }
                  >
                    Quitar
                  </button>
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      ) : (
        <p className="se-bol__sin-paginas">Aún no hay páginas. Suba la primera.</p>
      )}

      {!bloqueado ? (
        <div className="se-bol__anadir">
          <input
            ref={entrada}
            type="file"
            accept={ACCEPTED_IMAGE_MIME}
            multiple
            hidden
            onChange={(e) => subir(e.target.files)}
          />
          <button
            type="button"
            className="se-btn se-btn--primary"
            disabled={Boolean(subiendo)}
            onClick={() => entrada.current?.click()}
          >
            {subiendo
              ? `Subiendo ${subiendo.hecho + 1} de ${subiendo.total}…`
              : "Subir páginas"}
          </button>
          <button
            type="button"
            className="se-btn se-btn--secondary"
            disabled={Boolean(subiendo)}
            onClick={() => setBiblioteca(true)}
          >
            Elegir una ya subida
          </button>
          <span className="se-admin-meta-hint">Puede elegir varias a la vez.</span>
        </div>
      ) : null}

      <ModalDelPanel
        abierto={biblioteca}
        onCerrar={() => setBiblioteca(false)}
        ancho="ancho"
        titulo="Elegir una página ya subida"
        subtitulo="Se añade al final. Luego se mueve con las flechas."
      >
        <SelectorDeBiblioteca
          id={`bol-${numero.id}-biblio`}
          kind="image"
          onElegir={(medio) => {
            setBiblioteca(false);
            correr(() => anadirPagina(numero.id, medio.id), "Página añadida").then((r) =>
              r ? onCambio(r) : null,
            );
          }}
        />
      </ModalDelPanel>
    </section>
  );
};

Paginas.propTypes = {
  numero: PropTypes.object.isRequired,
  bloqueado: PropTypes.bool,
  correr: PropTypes.func.isRequired,
  onCambio: PropTypes.func.isRequired,
};
