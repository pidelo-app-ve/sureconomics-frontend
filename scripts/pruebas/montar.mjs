/**
 * Montar un hook con sus efectos corriendo de verdad, sin navegador.
 *
 *     const { montarGancho, act, almacenLocal } = await import("../../scripts/pruebas/montar.mjs");
 *     const g = await montarGancho((props) => useMiGancho(props), { clave: "a" });
 *     g.valor            // lo que devolvió el hook en el último pintado
 *     await g.pintar({ clave: "b" });  // otro pintado con otras props
 *     await act(async () => g.valor.hacerAlgo());
 *     await g.desmontar();
 *
 * Con `{ pintar: (valor) => elemento }` el componente de prueba pinta además ese
 * elemento (p. ej. el `ConfirmDialog` que devuelve un hook). Tiene que acabar en
 * componentes que no pinten etiquetas: un doble que devuelva `null` (`dobles.mjs`).
 *
 * `renderToString` (ver `pintar.mjs`) no corre efectos; esto sí: `createRoot` de
 * React 18 en un contenedor de mentira. El componente de prueba devuelve `null`, así
 * que a React le basta con lo mínimo de `window` y del contenedor. `window` lleva un
 * `localStorage` en memoria (`almacenLocal`, un `Map`) y es un `EventTarget`
 * (`pagehide`…).
 *
 * Se importa con `await import()`: tiene que poner `window` **antes** de que se cargue
 * `react-dom`, que mira al cargarse si hay DOM.
 */
import { createElement } from "react";

export const almacenLocal = new Map();
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.window = Object.assign(new EventTarget(), {
  setTimeout,
  clearTimeout,
  HTMLIFrameElement: class {},
  localStorage: {
    getItem: (k) => (almacenLocal.has(k) ? almacenLocal.get(k) : null),
    setItem: (k, v) => almacenLocal.set(k, String(v)),
    removeItem: (k) => almacenLocal.delete(k),
  },
});

const { createRoot } = await import("react-dom/client");
const { act } = await import("react-dom/test-utils");
export { act };

const sinNada = { addEventListener() {}, removeEventListener() {} };

export const montarGancho = async (usarGancho, propsIniciales = {}, { pintar } = {}) => {
  const g = { props: propsIniciales, valor: undefined };
  const Prueba = (props) => {
    g.valor = usarGancho(props);
    return pintar ? pintar(g.valor) : null;
  };
  const raiz = createRoot({ nodeType: 1, nodeName: "DIV", tagName: "DIV", ownerDocument: sinNada, ...sinNada });
  g.pintar = async (props = {}) => {
    g.props = { ...g.props, ...props };
    await act(async () => raiz.render(createElement(Prueba, g.props)));
  };
  g.desmontar = () => act(() => raiz.unmount());
  await g.pintar();
  return g;
};
