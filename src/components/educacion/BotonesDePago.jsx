import PropTypes from "prop-types";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useUserAuth } from "../../context/UserAuthContext";
import { abrirPago, precioLegible } from "../../services/educacionService";

/**
 * Los botones de compra de un modulo, uno por pasarela configurada.
 *
 * El cliente cobra por Stripe y por Mercado Pago a la vez, y **elige el comprador**: no
 * se adivina por el pais. Adivinarlo obligaria a acertar con la IP o a pedir el pais
 * antes de cobrar, y equivocarse deja a alguien sin poder pagar con lo que tiene a mano.
 * Dos botones no le cuestan nada a quien ya sabe cual quiere.
 *
 * Antes de los botones van los dos estados que no son "comprar": sin sesion y sin
 * verificar. Es el mismo reparto que ya usa la descarga de informes, y por el mismo
 * motivo -- cada uno necesita una frase distinta, no un "no puedes" generico.
 */

const NOMBRE = {
  stripe: "Tarjeta",
  mercadopago: "Mercado Pago",
};

export const BotonesDePago = ({ modulo, pasarelas, onComprado }) => {
  const { isAuthenticated, isEmailVerified } = useUserAuth();
  const [ocupado, setOcupado] = useState("");
  const [error, setError] = useState("");

  const precio = precioLegible(modulo.precio_centavos, modulo.moneda);

  if (!isAuthenticated) {
    return (
      <div className="se-edu__pago">
        <p className="se-edu__pago-texto">
          La compra queda atada a su cuenta. Entre antes de pagar.
        </p>
        <div className="se-edu__pago-acciones">
          <Link to="/cuenta/entrar" className="se-btn">
            Iniciar sesión
          </Link>
          <Link to="/cuenta/registro" className="se-btn se-btn--secondary">
            Crear una cuenta
          </Link>
        </div>
      </div>
    );
  }

  if (!isEmailVerified) {
    return (
      <div className="se-edu__pago">
        <p className="se-edu__pago-texto">
          El correo tiene que estar confirmado antes de pagar: la compra queda atada a
          esta cuenta.
        </p>
        <div className="se-edu__pago-acciones">
          <Link to="/cuenta/verificar-email" className="se-btn">
            Verificar mi correo
          </Link>
        </div>
      </div>
    );
  }

  const comprar = async (proveedor) => {
    setOcupado(proveedor);
    setError("");
    try {
      const datos = await abrirPago(modulo.slug, proveedor);
      if (datos?.ya_comprado) {
        // Ya lo tenia: no hay nada que cobrar, se refresca y se abre.
        onComprado?.();
        return;
      }
      if (datos?.url) {
        window.location.assign(datos.url);
        return;
      }
      setError("La pasarela no devolvió una dirección de pago.");
    } catch (err) {
      setError(
        err?.status === 503
          ? "El cobro todavía no está disponible. Inténtelo más tarde."
          : err?.message || "No se pudo abrir el pago.",
      );
    } finally {
      setOcupado("");
    }
  };

  if (!pasarelas.length) {
    // Sin credenciales configuradas. Se dice, en vez de dibujar un botón que no lleva
    // a ningún sitio.
    return (
      <div className="se-edu__pago">
        <p className="se-edu__pago-titulo">Módulo completo por {precio}</p>
        <p className="se-edu__pago-texto">
          El cobro en línea se activa en los próximos días. Escríbanos si quiere el
          acceso ahora.
        </p>
      </div>
    );
  }

  return (
    <div className="se-edu__pago">
      <div className="se-edu__pago-acciones">
        {pasarelas.map((proveedor) => (
          <button
            key={proveedor}
            type="button"
            className="se-btn"
            onClick={() => comprar(proveedor)}
            disabled={Boolean(ocupado)}
          >
            {ocupado === proveedor
              ? "Abriendo…"
              : `Pagar con ${NOMBRE[proveedor] ?? proveedor}`}
          </button>
        ))}
      </div>
      {error ? (
        <p className="se-edu__pago-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
};

BotonesDePago.propTypes = {
  modulo: PropTypes.object.isRequired,
  /** Las pasarelas configuradas hoy, tal como las reporta el catálogo. */
  pasarelas: PropTypes.arrayOf(PropTypes.string),
  /** Se llama cuando resulta que ya estaba comprado, para repintar sin recargar. */
  onComprado: PropTypes.func,
};

BotonesDePago.defaultProps = { pasarelas: [] };
