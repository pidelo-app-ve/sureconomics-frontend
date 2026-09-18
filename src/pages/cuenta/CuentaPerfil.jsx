import { useEffect, useMemo, useState } from "react";
import { useUserAuth } from "../../context/UserAuthContext";
import { CampoDeTexto } from "../../components/cuenta/CampoDeTexto";
import { RetratoDelLector } from "../../components/cuenta/RetratoDelLector";
import { applyPageMeta } from "../../lib/seo";
import { actualizarMiPerfil } from "../../services/userAuthService";

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

const SEXOS = [
  { valor: "", etiqueta: "Prefiero no decirlo" },
  { valor: "female", etiqueta: "Femenino" },
  { valor: "male", etiqueta: "Masculino" },
  { valor: "other", etiqueta: "Otro" },
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

export const CuentaPerfil = () => {
  const { profile, loadProfile } = useUserAuth();
  const [campos, setCampos] = useState(vacio);
  const [tocados, setTocados] = useState({});
  const [estado, setEstado] = useState({ guardando: false, error: "", guardado: false });

  useEffect(() => {
    applyPageMeta({
      title: "Mi perfil — SurEconomics",
      description: "Sus datos de lector.",
      noindex: true,
    });
  }, []);

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

  const errores = {
    firstName: campos.firstName.trim() ? "" : "El nombre no puede quedar vacío.",
    lastName: campos.lastName.trim() ? "" : "El apellido no puede quedar vacío.",
    age:
      !String(campos.age).trim() ||
      (Number(campos.age) >= 13 && Number(campos.age) <= 120)
        ? ""
        : "Una edad entre 13 y 120.",
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
        error: err?.message || "No se pudieron guardar los cambios.",
      });
    }
  };

  return (
    <div className="se-cuenta__pagina">
      <header className="se-cuenta__cabecera">
        <h1 className="se-cuenta__titulo">Mi perfil</h1>
        <p className="se-cuenta__lead">
          Su nombre firma los comentarios y las piezas que le publiquen. El resto es
          opcional y sólo lo ve la redacción.
        </p>
      </header>

      <RetratoDelLector />

      <form className="se-cuenta__form" onSubmit={guardar} noValidate>
        <h2 className="se-cuenta__h2">
          Sus datos
          {faltan ? (
            <span className="se-cuenta__pendiente">
              {faltan} sin rellenar · opcionales
            </span>
          ) : null}
        </h2>

        <div className="se-cuenta__fila">
          <CampoDeTexto
            id="p-nombre"
            etiqueta="Nombre"
            valor={campos.firstName}
            onCambio={cambiar("firstName")}
            onSalir={marcar("firstName")}
            error={tocados.firstName ? errores.firstName : ""}
            autoComplete="given-name"
          />
          <CampoDeTexto
            id="p-apellido"
            etiqueta="Apellido"
            valor={campos.lastName}
            onCambio={cambiar("lastName")}
            onSalir={marcar("lastName")}
            error={tocados.lastName ? errores.lastName : ""}
            autoComplete="family-name"
          />
        </div>

        <CampoDeTexto
          id="p-correo"
          etiqueta="Correo electrónico"
          valor={profile?.email ?? ""}
          onCambio={() => {}}
          deshabilitado
          ayuda="El correo identifica la cuenta. Para cambiarlo, escríbanos."
        />

        <div className="se-cuenta__fila">
          <CampoDeTexto
            id="p-edad"
            etiqueta="Edad"
            valor={String(campos.age ?? "")}
            onCambio={cambiar("age")}
            onSalir={marcar("age")}
            error={tocados.age ? errores.age : ""}
            inputMode="numeric"
            opcional
          />

          <div className="se-campo">
            <label className="se-campo__etiqueta" htmlFor="p-sexo">
              Sexo
              <span className="se-campo__opcional">opcional</span>
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
                {SEXOS.map((s) => (
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
            etiqueta="País"
            valor={campos.country}
            onCambio={cambiar("country")}
            autoComplete="country-name"
            opcional
          />
          <CampoDeTexto
            id="p-ciudad"
            etiqueta="Ciudad"
            valor={campos.city}
            onCambio={cambiar("city")}
            autoComplete="address-level2"
            opcional
          />
        </div>

        <div className="se-cuenta__fila">
          <CampoDeTexto
            id="p-ocupacion"
            etiqueta="Ocupación"
            valor={campos.occupation}
            onCambio={cambiar("occupation")}
            opcional
            ayuda="Sale bajo su firma si le publican una pieza."
          />
          <CampoDeTexto
            id="p-telefono"
            etiqueta="Teléfono"
            valor={campos.phoneNumber}
            onCambio={cambiar("phoneNumber")}
            autoComplete="tel"
            inputMode="tel"
            opcional
            ayuda="Sólo para que la redacción le localice si acepta su envío."
          />
        </div>

        {estado.error ? (
          <p className="se-cuenta__error" role="alert">
            {estado.error}
          </p>
        ) : null}

        <div className="se-cuenta__acciones">
          <button type="submit" className="se-btn" disabled={estado.guardando}>
            {estado.guardando ? "Guardando…" : "Guardar cambios"}
          </button>
          {estado.guardado ? (
            <span className="se-guardado" role="status">
              Guardado ✓
            </span>
          ) : null}
        </div>
      </form>
    </div>
  );
};

export default CuentaPerfil;
