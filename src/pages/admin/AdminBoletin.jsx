import { useCallback, useEffect, useState } from "react";
import { ModalDelPanel } from "../../components/admin/ModalDelPanel";
import { useAdminToast } from "../../context/AdminToastContext";
import { useAdminConfirm } from "../../hooks/useAdminConfirm";
import { adminErrorMessage } from "../../lib/adminErrorMessage";
import {
  crearNumero,
  listarLunes,
  listarNumeros,
  verNumero,
} from "../../services/adminBoletinService";
import { RecorridoVista } from "../../components/recorrido/RecorridoVista";
import { recorridoBoletin } from "../../lib/guias/guiaBoletin";
import { CabeceraDePagina } from "../../components/admin/CabeceraDePagina";
import { LoadingState } from "../../components/content";
import { lunesLargo } from "../../components/admin/boletin/datosDelBoletin";
import { Listado } from "../../components/admin/boletin/Listado";
import { Editor } from "../../components/admin/boletin/Editor";

const { ancla } = recorridoBoletin;

/**
 * Los números de "Entorno en Viñetas".
 *
 * La redacción diseña las páginas fuera (Canva) y aquí sólo se suben y se ordenan: lo
 * que se ve en esta pantalla, de arriba abajo, es lo que llega al correo, en el mismo
 * orden. Por eso la pantalla está dispuesta como el correo y no como un formulario.
 *
 * Cada número pertenece a un lunes: sale solo ese día a las 9:00 de Caracas si está
 * **activo**, y un borrador no sale nunca (ver `boletin_programado.py` en el backend).
 * Antes, "Enviar prueba" manda una copia a un solo correo para ver cómo queda.
 */

// ------------------------------------------------------------------ la pantalla
export const AdminBoletin = () => {
  const { toastSuccess, toastError } = useAdminToast();
  const { confirm: preguntar, ConfirmDialog } = useAdminConfirm();
  const [numeros, setNumeros] = useState(null);
  const [abierto, setAbierto] = useState(null);
  const [error, setError] = useState("");
  const [nuevo, setNuevo] = useState(false);
  const [asunto, setAsunto] = useState("");
  const [lunes, setLunes] = useState([]);
  const [elegido, setElegido] = useState("");
  const [ocupado, setOcupado] = useState(false);

  const correr = useCallback(
    async (accion, aviso = "Guardado") => {
      setOcupado(true);
      try {
        const r = await accion();
        if (aviso) toastSuccess(aviso);
        return r ?? true;
      } catch (err) {
        toastError(adminErrorMessage(err));
        return undefined;
      } finally {
        setOcupado(false);
      }
    },
    [toastError, toastSuccess],
  );

  const cargar = useCallback(async () => {
    try {
      setNumeros(await listarNumeros());
      setError("");
    } catch (err) {
      setError(adminErrorMessage(err));
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const abrir = async (id) => {
    const r = await correr(() => verNumero(id), null);
    if (r) {
      setAbierto(r);
      window.scrollTo({ top: 0 });
    }
  };

  const abrirNuevo = async () => {
    const r = await correr(() => listarLunes(), null);
    if (!r) return;
    setLunes(r);
    const libre = r.find((l) => !l.numero_id);
    setElegido(libre?.fecha ?? "");
    setAsunto(libre ? `Entorno en Viñetas · ${libre.texto}` : "");
    setNuevo(true);
  };

  const crear = async () => {
    const r = await correr(() => crearNumero(elegido, asunto.trim()), "Número creado");
    if (!r) return;
    setNuevo(false);
    setAsunto("");
    setAbierto(r);
    cargar();
  };

  return (
    <div className="se-admin-shell se-bol">
      <CabeceraDePagina
        titulo="Entorno en Viñetas"
        explica={
          <>
            Un número por lunes. Se suben las páginas, se manda una prueba para ver cómo
            queda y se activa: ese lunes a las 9:00 sale solo a todos los suscriptores.
          </>
        }
        acciones={
          <>
            {!abierto ? (
              <button type="button" className="se-btn se-btn--primary" onClick={abrirNuevo} {...ancla("nuevo")}>
                Nuevo número
              </button>
            ) : null}
          </>
        }
        guia={recorridoBoletin}
      />

      {error ? <p className="se-admin-form-error">{error}</p> : null}

      {abierto ? (
        <Editor
          numero={abierto}
          correr={correr}
          preguntar={preguntar}
          onCambio={(r) => {
            setAbierto(r);
            setNumeros((lista) =>
              lista?.map((n) =>
                n.id === r.id ? { ...n, ...r, paginas: r.pages?.length ?? n.paginas } : n,
              ),
            );
          }}
          onVolver={() => {
            setAbierto(null);
            cargar();
          }}
          onBorrado={() => {
            setAbierto(null);
            cargar();
          }}
        />
      ) : numeros === null ? (
        !error ? <LoadingState /> : null
      ) : (
        <Listado numeros={numeros} onAbrir={abrir} onNuevo={abrirNuevo} />
      )}

      <ModalDelPanel
        abierto={nuevo}
        ocupado={ocupado}
        onCerrar={() => setNuevo(false)}
        titulo="Nuevo número"
        subtitulo="Nace en borrador: no sale nada hasta que lo active."
        pie={
          <>
            <button type="button" className="se-btn se-btn--secondary" onClick={() => setNuevo(false)}>
              Cancelar
            </button>
            <button
              type="button"
              className="se-btn se-btn--primary"
              disabled={!elegido || ocupado}
              onClick={crear}
            >
              {ocupado ? "Creando…" : "Crear y seguir"}
            </button>
          </>
        }
      >
        <form
          className="se-asis__cuerpo"
          onSubmit={(e) => {
            e.preventDefault();
            if (elegido) crear();
          }}
        >
          <label className="se-form-label" htmlFor="bol-nuevo-lunes">
            Lunes en que sale
          </label>
          <select
            id="bol-nuevo-lunes"
            className="se-form-control"
            value={elegido}
            onChange={(e) => {
              const l = lunes.find((x) => x.fecha === e.target.value);
              setElegido(e.target.value);
              // El asunto sigue a la fecha mientras nadie lo haya escrito a mano.
              setAsunto((a) =>
                !a || lunes.some((x) => a === `Entorno en Viñetas · ${x.texto}`)
                  ? `Entorno en Viñetas · ${l?.texto ?? ""}`
                  : a,
              );
            }}
          >
            {lunes.map((l) => (
              <option key={l.fecha} value={l.fecha} disabled={Boolean(l.numero_id)}>
                {lunesLargo(l.fecha)}
                {l.numero_id ? " — ya tiene número" : ""}
              </option>
            ))}
          </select>
          <p className="se-admin-meta-hint">
            Sale a las 9:00 de Caracas, pero sólo si lo activa. Un borrador no sale nunca.
          </p>
          <label className="se-form-label" htmlFor="bol-nuevo-asunto">
            Asunto del correo
          </label>
          <input
            id="bol-nuevo-asunto"
            className="se-form-control"
            value={asunto}
            maxLength={300}
            placeholder="Entorno en Viñetas · 28 de septiembre de 2026"
            onChange={(e) => setAsunto(e.target.value)}
          />
          <p className="se-admin-meta-hint">Sale de la fecha. Se puede cambiar después.</p>
        </form>
      </ModalDelPanel>

      <ConfirmDialog />
      <RecorridoVista recorrido={recorridoBoletin} />
    </div>
  );
};

export default AdminBoletin;
