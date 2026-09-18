import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { BotonesDePago } from "./BotonesDePago";
import { useUserAuth } from "../../context/UserAuthContext";
import {
  IconDocumento,
  IconLlave,
  IconReloj,
  IconTexto,
  IconVideo,
  IconVisto,
} from "../icons/educacion";
import {
  duracionLegible,
  nivelLegible,
  precioLegible,
} from "../../services/educacionService";

/**
 * El panel de compra de un módulo: precio, qué incluye y el botón.
 *
 * ## Por qué va anclado
 *
 * Porque la decisión de comprar se toma leyendo el temario, y el temario es la parte
 * larga de la página. Antes el precio y el botón vivían arriba, encima del temario: al
 * tercer desplazamiento ya no estaban en pantalla, y quien se convencía en la lección
 * ocho tenía que volver a subir a buscarlos. `position: sticky` es la respuesta estándar
 * de cualquier sitio que vende cursos, y lo es porque funciona.
 *
 * En pantalla estrecha no se ancla nada: el panel pasa a ir en el flujo, debajo de la
 * descripción y encima del temario. Un panel pegado en un móvil se come media pantalla
 * de lectura, que es justo lo que se vino a hacer.
 *
 * ## Qué incluye, con números y no con adjetivos
 *
 * Cada línea de la lista sale de un dato real: el conteo de lecciones, la suma de
 * duraciones — que se calla si falta medir alguna —, y la cuenta de las que se abren sin
 * pagar. No hay ninguna línea escrita a mano que pueda dejar de ser verdad.
 */
export const PanelDeCompra = ({ modulo, pasarelas, onComprado }) => {
  const { isAuthenticated, isEmailVerified } = useUserAuth();
  const duracion = duracionLegible(modulo.duracion_minutos);
  const nivel = nivelLegible(modulo.nivel);
  const libres = modulo.lecciones_libres || 0;
  const cerradas = Math.max(0, (modulo.lecciones || 0) - libres);
  const tipos = modulo.tipos || {};

  const yaEsSuyo = modulo.comprado || modulo.gratuito;

  return (
    <aside className="se-compra" aria-label="Comprar este módulo">
      <p className="se-compra__precio">
        {modulo.gratuito ? (
          "Gratis"
        ) : modulo.comprado ? (
          <span className="se-compra__suyo">
            <IconVisto className="se-compra__icono" />
            Ya es suyo
          </span>
        ) : (
          precioLegible(modulo.precio_centavos, modulo.moneda)
        )}
      </p>
      {!yaEsSuyo ? (
        <p className="se-compra__nota">Pago único · El acceso no caduca</p>
      ) : null}

      <ul className="se-compra__incluye">
        <li>
          <IconTexto className="se-compra__icono" />
          {modulo.lecciones} {modulo.lecciones === 1 ? "lección" : "lecciones"}
          {nivel ? ` · nivel ${nivel.toLowerCase()}` : ""}
        </li>
        {duracion ? (
          <li>
            <IconReloj className="se-compra__icono" />
            {duracion} de contenido
          </li>
        ) : null}
        {tipos.video ? (
          <li>
            <IconVideo className="se-compra__icono" />
            {tipos.video} {tipos.video === 1 ? "clase en video" : "clases en video"}
          </li>
        ) : null}
        {tipos.pdf ? (
          <li>
            <IconDocumento className="se-compra__icono" />
            {tipos.pdf} {tipos.pdf === 1 ? "documento descargable" : "documentos descargables"}
          </li>
        ) : null}
        {libres > 0 && !modulo.gratuito ? (
          <li className="se-compra__libre">
            <IconLlave className="se-compra__icono" />
            {libres === 1 ? "La primera, abierta" : `${libres} abiertas`} sin pagar
          </li>
        ) : null}
      </ul>

      {modulo.comprado ? (
        <p className="se-compra__texto">
          Tiene las {modulo.lecciones} lecciones disponibles. Empiece cuando quiera.
        </p>
      ) : modulo.gratuito ? (
        // El modulo de cortesia pide cuenta verificada, no dinero. Ofrecerle "crear
        // una cuenta" a quien ya entro y ya verifico es mandarle a hacer algo que ya
        // hizo -- y le deja dudando de si de verdad tiene acceso.
        <div className="se-compra__acciones">
          {isAuthenticated && isEmailVerified ? (
            <p className="se-compra__texto">
              Ya puede empezar: abra la primera clase del temario.
            </p>
          ) : (
            <>
              <p className="se-compra__texto">
                Este módulo es de cortesía. Solo hace falta una cuenta con el correo
                verificado.
              </p>
              {isAuthenticated ? (
                <Link to="/cuenta/verificar-email" className="se-btn">
                  Verificar mi correo
                </Link>
              ) : (
                <Link to="/cuenta/registro" className="se-btn">
                  Crear una cuenta
                </Link>
              )}
            </>
          )}
        </div>
      ) : (
        <>
          <BotonesDePago
            modulo={modulo}
            pasarelas={pasarelas}
            onComprado={onComprado}
          />
          {cerradas > 0 ? (
            <p className="se-compra__pie">
              Desbloquea {cerradas} {cerradas === 1 ? "lección" : "lecciones"} más.
            </p>
          ) : null}
        </>
      )}
    </aside>
  );
};

PanelDeCompra.propTypes = {
  modulo: PropTypes.object.isRequired,
  pasarelas: PropTypes.arrayOf(PropTypes.string),
  onComprado: PropTypes.func,
};

PanelDeCompra.defaultProps = { pasarelas: [] };

export default PanelDeCompra;
