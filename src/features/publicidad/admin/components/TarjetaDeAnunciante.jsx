import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { AssetField } from "../../../../components/admin/AssetField";
import { ACCEPTED_IMAGE_MIME, uploadAdminMediaImage } from "../../../../services/adminMediaService";
import {
  actualizarAnunciante,
  borrarAnunciante,
  listar,
} from "../api";
import { TarjetaDeCampana } from "./TarjetaDeCampana";

export const TarjetaDeAnunciante = ({
  anunciante,
  ajustes,
  cifras,
  ocupado,
  correr,
  preguntar,
  onCambio,
  destacada,
  onNuevaCampana,
}) => {
  const [abierta, setAbierta] = useState(false);
  const [ficha, setFicha] = useState({
    nombre: anunciante.nombre,
    sitio_web: anunciante.sitio_web ?? "",
    contacto_email: anunciante.contacto_email ?? "",
    notas: anunciante.notas ?? "",
    activo: anunciante.activo,
    logo_id: anunciante.logo_id ?? null,
  });
  const [logo, setLogo] = useState(anunciante.logo ?? null);

  useEffect(() => {
    setFicha({
      nombre: anunciante.nombre,
      sitio_web: anunciante.sitio_web ?? "",
      contacto_email: anunciante.contacto_email ?? "",
      notas: anunciante.notas ?? "",
      activo: anunciante.activo,
      logo_id: anunciante.logo_id ?? null,
    });
    setLogo(anunciante.logo ?? null);
  }, [
    anunciante.nombre,
    anunciante.sitio_web,
    anunciante.contacto_email,
    anunciante.notas,
    anunciante.activo,
    anunciante.logo_id,
    anunciante.logo,
  ]);

  // El mural de arriba pide abrir una ficha concreta. Se obedece abriendo, nunca
  // cerrando: quien tenia otras dos desplegadas comparando campanas no quiere que
  // pulsar un logotipo se las cierre.
  useEffect(() => {
    if (destacada) setAbierta(true);
  }, [destacada]);

  // Sin aviso: releer la lista después de un cambio no es un suceso propio, y avisarlo
  // tapaba el mensaje del cambio que acababa de producirlo.
  const recargar = () => correr(() => listar(), null).then((d) => onCambio(d));

  return (
    <section className="se-admin-pub__anunciante" id={`anunciante-${anunciante.id}`}>
      <div className="se-admin-pub__anunciante-cabeza">
        <button
          type="button"
          className="se-admin-pub__anunciante-titulo"
          onClick={() => setAbierta((v) => !v)}
          aria-expanded={abierta}
        >
          <span>{anunciante.nombre}</span>
          <span className="se-admin-pub__meta">
            /{anunciante.slug} · {anunciante.campanas?.length ?? 0} campañas
            {anunciante.contacto_email ? ` · ${anunciante.contacto_email}` : ""}
          </span>
        </button>
        {anunciante.es_casa ? (
          <span className="se-admin-pub__sello se-admin-pub__sello--casa">Relleno</span>
        ) : null}
        {!anunciante.activo ? <span className="se-admin-pub__sello">Inactivo</span> : null}
      </div>

      {abierta ? (
        <div className="se-admin-pub__anunciante-cuerpo">
          {anunciante.es_casa ? (
            <p className="se-admin-meta-hint">
              Este es el anunciante de relleno: ocupa cualquier espacio que no haya
              comprado nadie. No entra en el sorteo y no compite con las campañas pagadas.
            </p>
          ) : null}

          {/* La ficha de la marca. Antes un anunciante era solo un nombre: no había
              dónde poner su logotipo ni su página, y el panel tenía que deducir quién
              era a partir del arte de alguna de sus campañas -- que cambia cada mes. */}
          <AssetField
            id={`a-${anunciante.id}-logo`}
            label="Logotipo de la marca"
            hint="Sale en el mosaico de arriba y sirve para reconocer al anunciante aunque su campaña de este mes lleve otro arte."
            kind="image"
            value={ficha.logo_id}
            asset={logo}
            onChange={(id, objeto) => {
              setFicha((f) => ({ ...f, logo_id: id ?? null }));
              setLogo(objeto ?? null);
            }}
            onUpload={uploadAdminMediaImage}
            accept={ACCEPTED_IMAGE_MIME}
          />

          <div className="se-admin-pub__doble">
            <div>
              <label className="se-form-label" htmlFor={`a-${anunciante.id}-nombre`}>
                Nombre
              </label>
              <input
                id={`a-${anunciante.id}-nombre`}
                className="se-form-control"
                value={ficha.nombre}
                onChange={(e) => setFicha({ ...ficha, nombre: e.target.value })}
              />
            </div>
            <div>
              <label className="se-form-label" htmlFor={`a-${anunciante.id}-web`}>
                Página de la marca
              </label>
              <input
                id={`a-${anunciante.id}-web`}
                className="se-form-control"
                type="url"
                placeholder="https://…"
                value={ficha.sitio_web}
                onChange={(e) => setFicha({ ...ficha, sitio_web: e.target.value })}
              />
              {/* No es el destino de los anuncios: ese va en cada pieza, porque una
                  campaña puede apuntar a una promoción concreta y no a la portada. */}
              <p className="se-admin-meta-hint">
                La dirección de la empresa. El destino de cada anuncio se pone en su
                pieza.
              </p>
            </div>
          </div>

          <div className="se-admin-pub__doble">
            <div>
              <label className="se-form-label" htmlFor={`a-${anunciante.id}-correo`}>
                Contacto
              </label>
              <input
                id={`a-${anunciante.id}-correo`}
                className="se-form-control"
                type="email"
                placeholder="comercial@…"
                value={ficha.contacto_email}
                onChange={(e) => setFicha({ ...ficha, contacto_email: e.target.value })}
              />
            </div>
            <label className="se-admin-pub__casilla">
              <input
                type="checkbox"
                checked={ficha.activo}
                disabled={ocupado}
                onChange={(e) => setFicha({ ...ficha, activo: e.target.checked })}
              />
              Activo
            </label>
          </div>

          <label className="se-form-label" htmlFor={`a-${anunciante.id}-notas`}>
            Notas
          </label>
          <textarea
            id={`a-${anunciante.id}-notas`}
            className="se-form-control"
            rows={2}
            placeholder="Condiciones acordadas, quién es el contacto, lo que convenga recordar."
            value={ficha.notas}
            onChange={(e) => setFicha({ ...ficha, notas: e.target.value })}
          />

          <div className="se-admin-pub__acciones">
            <button
              type="button"
              className="se-btn"
              disabled={ocupado || !ficha.nombre.trim()}
              onClick={() =>
                correr(
                  async () => {
                    await actualizarAnunciante(anunciante.id, {
                      nombre: ficha.nombre.trim(),
                      sitio_web: ficha.sitio_web.trim(),
                      contacto_email: ficha.contacto_email.trim(),
                      notas: ficha.notas,
                      activo: ficha.activo,
                      logo_id: ficha.logo_id,
                    });
                    return listar();
                  },
                  `Ficha de «${ficha.nombre.trim()}» guardada`,
                ).then(onCambio)
              }
            >
              Guardar el anunciante
            </button>
          </div>

          <h4 className="se-admin-pub__sub">Campañas</h4>
          <ul className="se-admin-pub__campanas">
            {(anunciante.campanas ?? []).map((campana) => (
              <TarjetaDeCampana
                key={campana.id}
                campana={campana}
                anunciante={anunciante}
                ajustes={ajustes}
                cifras={cifras}
                ocupado={ocupado}
                correr={correr}
                preguntar={preguntar}
                onCambio={recargar}
              />
            ))}
          </ul>

          {/* Una campaña nueva se hace con el asistente, con este anunciante ya
              elegido: así nace con fechas, pieza y al aire, y no en un borrador vacío
              que luego había que ir a activar dentro de su ficha. */}
          <div className="se-admin-pub__nueva">
            <button
              type="button"
              className="se-btn se-btn--secondary"
              disabled={ocupado}
              onClick={() => onNuevaCampana(anunciante.id)}
            >
              Nueva campaña para {anunciante.nombre}
            </button>
          </div>

          <div className="se-admin-pub__acciones">
            <button
              type="button"
              className="se-btn se-btn--secondary"
              disabled={ocupado}
              onClick={() =>
                correr(
                  async () => {
                    await actualizarAnunciante(anunciante.id, {
                      activo: !anunciante.activo,
                    });
                    return listar();
                  },
                  anunciante.activo
                    ? `«${anunciante.nombre}» desactivado — sus campañas dejan de salir`
                    : `«${anunciante.nombre}» activado`,
                ).then(onCambio)
              }
            >
              {anunciante.activo ? "Desactivar" : "Activar"}
            </button>
            <button
              type="button"
              className="se-btn se-btn--secondary"
              disabled={ocupado}
              onClick={async () => {
                const n = anunciante.campanas?.length ?? 0;
                const vale = await preguntar({
                  title: `¿Borrar «${anunciante.nombre}»?`,
                  description: `Se van con él sus ${n} ${n === 1 ? "campaña" : "campañas"} y todas sus piezas. Si sólo quiere que deje de salir, use «Desactivar».`,
                  confirmLabel: "Borrar el anunciante",
                  busyLabel: "Borrando…",
                  warning: "No se puede deshacer.",
                });
                if (!vale) return;
                correr(
                  async () => {
                    await borrarAnunciante(anunciante.id);
                    return listar();
                  },
                  `«${anunciante.nombre}» borrado con sus campañas`,
                ).then(onCambio);
              }}
            >
              Borrar
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
};

TarjetaDeAnunciante.propTypes = {
  /** Contador que sube cada vez que el mural pide abrir esta ficha. */
  destacada: PropTypes.number,
  anunciante: PropTypes.object.isRequired,
  ajustes: PropTypes.object,
  cifras: PropTypes.object,
  ocupado: PropTypes.bool,
  correr: PropTypes.func.isRequired,
  /** Abre el dialogo del panel y resuelve a `true` si se confirmo. */
  preguntar: PropTypes.func.isRequired,
  onCambio: PropTypes.func.isRequired,
  /** «Nueva campaña»: abre el asistente con este anunciante elegido. */
  onNuevaCampana: PropTypes.func.isRequired,
};
