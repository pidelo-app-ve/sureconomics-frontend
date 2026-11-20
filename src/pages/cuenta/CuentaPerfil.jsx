import { useEffect, useMemo, useRef, useState } from "react";
import { useUserAuth } from "../../context/UserAuthContext";
import { CampoDeTexto } from "../../components/cuenta/CampoDeTexto";
import { RetratoDelLector } from "../../components/cuenta/RetratoDelLector";
import { useNavegar } from "../../components/Enlace";
import { BRAND } from "../../data/surEconomicsMock";
import { useIdioma } from "../../i18n/ProveedorIdioma";
import { useMetaPagina } from "../../i18n/useMetaPagina";
import { cerrarTodasLasSesiones, mensajeDeFallo } from "../../lib/cerrarTodasLasSesiones";
import { actualizarMiPerfil, cerrarTodasLasSesionesRemoto } from "../../services/userAuthService";
import { BotonGuia, RecorridoVista } from "../../components/recorrido/RecorridoVista";
import { recorridoPerfil } from "../../lib/guias/guiaPerfil";
import "../../styles/cuenta.css";

const { ancla } = recorridoPerfil;

/**
 * Mi perfil: editable, con retrato.
 *
 * ## Lo que era
 *
 * Seis recuadros grises con «—» dentro y ni un solo campo. Lo verifiqué en el código:
 * cero `input`, cero formulario, cero botones. Es decir, los datos se pedían en el
 * registro y, si alguien tecleaba mal su ciudad, la tenía mal para siempre. El servidor
 * tampoco ayudaba: su `PATCH` sólo aceptaba nombre y apellido.
 *
 * ## Por qué el retrato está arriba del todo
 *
 * Porque no es un adorno de la ficha: es lo que aparece **firmando el artículo** si la
 * redacción acepta un envío. Sin foto, un colaborador externo sale publicado sin cara.
 * Esa consecuencia se dice donde se decide, no en una ayuda escondida.
 *
 * ## Los seis datos opcionales
 *
 * Salieron del registro y viven aquí, marcados como opcionales de verdad — con la
 * palabra escrita en la etiqueta, no deducible por ausencia de un asterisco. Se piden
 * aquí porque aquí ya hay un motivo: quien va a firmar algo entiende para qué sirven.
 */

const sexos = (t) => [
  { valor: "", etiqueta: t("cuenta.perfil.prefieroNoDecirlo") },
  { valor: "female", etiqueta: t("cuenta.perfil.femenino") },
  { valor: "male", etiqueta: t("cuenta.perfil.masculino") },
  { valor: "other", etiqueta: t("cuenta.perfil.otro") },
];

const vacio = {
  firstName: "",
  lastName: "",
  age: "",
  sex: "",
  country: "",
  city: "",
  occupation: "",
  phoneNumber: "",
};

/**
 * «Cerrar sesión en todos los aparatos». La cuenta no tiene el diálogo del panel (vive en
 * su CSS), así que la confirmación va en el sitio: el botón se cambia por la pregunta y
 * sus dos respuestas. Si falla, la sesión de aquí sigue y se dice por qué.
 */
const SesionesAbiertas = () => {
  const { t } = useIdioma();
  const { logout } = useUserAuth();
  const navigate = useNavegar();
  const [paso, setPaso] = useState("inicio"); // inicio · preguntar · cerrando
  const [error, setError] = useState("");
  const cancelar = useRef(null);

  // Al preguntar, el foco va a «Cancelar»: lo seguro, y quien usa teclado oye la pregunta.
  useEffect(() => {
    if (paso === "preguntar") cancelar.current?.focus();
  }, [paso]);

  const cerrar = async () => {
    setPaso("cerrando");
    setError("");
    try {
      await cerrarTodasLasSesiones({
        pedir: cerrarTodasLasSesionesRemoto,
        cerrarLocal: () => logout({ soloAqui: true }),
        irAEntrar: () => navigate("/cuenta/entrar", { replace: true }),
      });
    } catch (err) {
      setError(
        mensajeDeFallo(err, {
          red: t("cuenta.perfil.sesiones.falloRed"),
          demasiadas: t("cuenta.perfil.sesiones.demasiadas"),
          otro: t("cuenta.perfil.sesiones.fallo"),
        }),
      );
      setPaso("inicio");
    }
  };

  return (
    <section className="se-cuenta__form se-cuenta__sesiones" aria-labelledby="p-sesiones" {...ancla("sesiones")}>
      <h2 className="se-cuenta__h2" id="p-sesiones">
        {t("cuenta.perfil.sesiones.titulo")}
      </h2>
      <p className="se-cuenta__lead">{t("cuenta.perfil.sesiones.texto")}</p>
      {error ? (
        <p className="se-cuenta__error" role="alert">
          {error}
        </p>
      ) : null}
      {paso === "inicio" ? (
        <div className="se-cuenta__acciones">
          <button type="button" className="se-btn se-btn--secondary" onClick={() => setPaso("preguntar")}>
            {t("cuenta.perfil.sesiones.boton")}
          </button>
        </div>
      ) : (
        <div className="se-cuenta__acciones" role="group" aria-labelledby="p-sesiones-pregunta">
          <p className="se-cuenta__lead" id="p-sesiones-pregunta">
            <strong>{t("cuenta.perfil.sesiones.pregunta")}</strong>
          </p>
          <button type="button" className="se-btn" onClick={cerrar} disabled={paso === "cerrando"}>
            {paso === "cerrando" ? t("cuenta.perfil.sesiones.cerrando") : t("cuenta.perfil.sesiones.confirmar")}
          </button>
          <button
            type="button"
            ref={cancelar}
            className="se-btn se-btn--secondary"
            onClick={() => setPaso("inicio")}
            disabled={paso === "cerrando"}
          >
            {t("cuenta.perfil.sesiones.cancelar")}
          </button>
        </div>
      )}
    </section>
  );
};

export const CuentaPerfil = () => {
  const { t } = useIdioma();
  const { profile, loadProfile } = useUserAuth();
  const [campos, setCampos] = useState(vacio);
  const [tocados, setTocados] = useState({});
  const [estado, setEstado] = useState({ guardando: false, error: "", guardado: false });

  useMetaPagina({
    title: t("cuenta.perfil.meta.titulo", { marca: BRAND.name }),
    description: t("cuenta.perfil.meta.descripcion"),
    noindex: true,
  });

  // Cuando llega el perfil del servidor, el formulario se rellena con él. Sin esto el
  // formulario nace vacío y guardar borraría lo que ya había.
  useEffect(() => {
    if (!profile) return;
    setCampos({
      firstName: profile.firstName ?? "",
      lastName: profile.lastName ?? "",
      age: profile.age ?? "",
      sex: profile.sex ?? "",
      country: profile.country ?? "",
      city: profile.city ?? "",
      occupation: profile.occupation ?? "",
      phoneNumber: profile.phoneNumber ?? "",
    });
  }, [profile]);

  const edad = Number(campos.age);
  const errores = {
    firstName: campos.firstName.trim() ? "" : t("cuenta.perfil.nombreVacio"),
    lastName: campos.lastName.trim() ? "" : t("cuenta.perfil.apellidoVacio"),
    age:
      !String(campos.age).trim() || (13 <= edad && edad <= 120)
        ? ""
        : t("cuenta.perfil.edadRango"),
  };
  const valido = Object.values(errores).every((e) => !e);

  // Qué falta por rellenar, para poder decirlo sin que parezca una regañina.
  const faltan = useMemo(
    () =>
      ["age", "sex", "country", "city", "occupation", "phoneNumber"].filter(
        (c) => !String(campos[c] ?? "").trim(),
      ).length,
    [campos],
  );

  const cambiar = (campo) => (valor) => {
    setCampos((c) => ({ ...c, [campo]: valor }));
    setEstado((e) => (e.guardado ? { ...e, guardado: false } : e));
  };
  const marcar = (campo) => () => setTocados((t) => ({ ...t, [campo]: true }));

  const guardar = async (e) => {
    e.preventDefault();
    setTocados({ firstName: true, lastName: true, age: true });
    if (!valido) return;

    setEstado({ guardando: true, error: "", guardado: false });
    try {
      await actualizarMiPerfil({
        firstName: campos.firstName.trim(),
        lastName: campos.lastName.trim(),
        // Vacío viaja como `null` y no como cadena: borrar un dato tiene que ser
        // posible, y `""` guardado es un dato falso que luego hay que distinguir de
        // «no lo dijo».
        age: String(campos.age).trim() ? Number(campos.age) : null,
        sex: campos.sex || null,
        country: campos.country.trim() || null,
        city: campos.city.trim() || null,
        occupation: campos.occupation.trim() || null,
        phoneNumber: campos.phoneNumber.trim() || null,
      });
      await loadProfile().catch(() => {});
      setEstado({ guardando: false, error: "", guardado: true });
    } catch (err) {
      setEstado({
        guardando: false,
        guardado: false,
        error: err?.message || t("cuenta.perfil.fallo"),
      });
    }
  };

  return (
    <div className="se-cuenta__pagina">
      <header className="se-cuenta__cabecera se-cuenta__cabecera--con-guia">
        <div>
          <h1 className="se-cuenta__titulo">{t("cuenta.perfil.titulo")}</h1>
          <p className="se-cuenta__lead">
            {t("cuenta.perfil.lead")}
          </p>
        </div>
        <BotonGuia recorrido={recorridoPerfil} className="se-btn se-btn--secondary se-boton-guia" />
      </header>

      <div {...ancla("retrato")}>
        <RetratoDelLector />
      </div>

      <form className="se-cuenta__form" onSubmit={guardar} noValidate>
        <h2 className="se-cuenta__h2">
          {t("cuenta.perfil.susDatos")}
          {faltan ? (
            <span className="se-cuenta__pendiente">
              {t("cuenta.perfil.sinRellenar", { n: faltan })}
            </span>
          ) : null}
        </h2>

        <div className="se-cuenta__fila" {...ancla("nombre")}>
          <CampoDeTexto
            id="p-nombre"
            etiqueta={t("cuenta.comun.nombre")}
            valor={campos.firstName}
            onCambio={cambiar("firstName")}
            onSalir={marcar("firstName")}
            error={tocados.firstName ? errores.firstName : ""}
            autoComplete="given-name"
          />
          <CampoDeTexto
            id="p-apellido"
            etiqueta={t("cuenta.comun.apellido")}
            valor={campos.lastName}
            onCambio={cambiar("lastName")}
            onSalir={marcar("lastName")}
            error={tocados.lastName ? errores.lastName : ""}
            autoComplete="family-name"
          />
        </div>

        <CampoDeTexto
          id="p-correo"
          etiqueta={t("cuenta.comun.correo")}
          valor={profile?.email ?? ""}
          onCambio={() => {}}
          deshabilitado
          ayuda={t("cuenta.perfil.ayudaCorreo")}
        />

        <div className="se-cuenta__fila" {...ancla("datos")}>
          <CampoDeTexto
            id="p-edad"
            etiqueta={t("cuenta.perfil.edad")}
            valor={String(campos.age ?? "")}
            onCambio={cambiar("age")}
            onSalir={marcar("age")}
            error={tocados.age ? errores.age : ""}
            inputMode="numeric"
            opcional
          />

          <div className="se-campo">
            <label className="se-campo__etiqueta" htmlFor="p-sexo">
              {t("cuenta.perfil.sexo")}
              <span className="se-campo__opcional">{t("cuenta.comun.opcional")}</span>
            </label>
            <div className="se-campo__caja">
              {/* Sin nada preseleccionado: el registro traía «Femenino» puesto, y eso
                  no es un valor por defecto sino una suposición guardada como si fuera
                  un dato declarado. */}
              <select
                id="p-sexo"
                className="se-campo__input"
                value={campos.sex}
                onChange={(e) => cambiar("sex")(e.target.value)}
              >
                {sexos(t).map((s) => (
                  <option key={s.valor} value={s.valor}>
                    {s.etiqueta}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="se-cuenta__fila">
          <CampoDeTexto
            id="p-pais"
            etiqueta={t("cuenta.perfil.pais")}
            valor={campos.country}
            onCambio={cambiar("country")}
            autoComplete="country-name"
            opcional
          />
          <CampoDeTexto
            id="p-ciudad"
            etiqueta={t("cuenta.perfil.ciudad")}
            valor={campos.city}
            onCambio={cambiar("city")}
            autoComplete="address-level2"
            opcional
          />
        </div>

        <div className="se-cuenta__fila">
          <CampoDeTexto
            id="p-ocupacion"
            etiqueta={t("cuenta.perfil.ocupacion")}
            valor={campos.occupation}
            onCambio={cambiar("occupation")}
            opcional
            ayuda={t("cuenta.perfil.ayudaOcupacion")}
          />
          <CampoDeTexto
            id="p-telefono"
            etiqueta={t("cuenta.perfil.telefono")}
            valor={campos.phoneNumber}
            onCambio={cambiar("phoneNumber")}
            autoComplete="tel"
            inputMode="tel"
            opcional
            ayuda={t("cuenta.perfil.ayudaTelefono")}
          />
        </div>

        {estado.error ? (
          <p className="se-cuenta__error" role="alert">
            {estado.error}
          </p>
        ) : null}

        <div className="se-cuenta__acciones" {...ancla("guardar")}>
          <button type="submit" className="se-btn" disabled={estado.guardando}>
            {estado.guardando ? t("cuenta.comun.guardando") : t("cuenta.comun.guardarCambios")}
          </button>
          {estado.guardado ? (
            <span className="se-guardado" role="status">
              {t("cuenta.perfil.guardado")}
            </span>
          ) : null}
        </div>
      </form>
      <SesionesAbiertas />
      <RecorridoVista recorrido={recorridoPerfil} />
    </div>
  );
};

export default CuentaPerfil;
