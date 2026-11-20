import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Lo que se escribe en un formulario largo no se pierde: se guarda solo en este equipo
 * mientras se escribe, y se recupera al volver.
 *
 * - Guarda en `localStorage` 0,8 s después del último cambio, y otra vez al salir de la
 *   página o cerrar la pestaña (`pagehide`), así que ni un clic en el menú ni una
 *   llamada a mitad de frase se llevan el texto. No pregunta «¿seguro que quiere
 *   salir?»: no hace falta, porque nada se pierde.
 * - Al abrir, si hay un borrador distinto de lo que trae el formulario, lo pone y
 *   avisa (`recuperadoEn`); `descartar()` vuelve a lo de partida.
 * - Tras enviar con éxito, `borrar()` lo quita y deja de guardar. Si el formulario
 *   sigue abierto (se guardó en el servidor y se sigue editando), `limpiar()` lo quita
 *   pero sigue guardando lo que venga.
 * - Si al volver la respuesta ya había algo escrito que no se mandó, `conservar(valores)`
 *   escribe la copia en ese momento con lo que queda en el formulario: nunca más vieja
 *   que lo que ya está en el servidor.
 * - Si lo escrito vuelve a ser igual a lo guardado (se borró lo que sobraba), la copia
 *   se quita: al reabrir no se recupera una versión vieja encima de la buena.
 *
 * `clave` en `null` lo apaga (p. ej. mientras el formulario aún carga del servidor).
 * `base` es con lo que se abrió el formulario: igual a eso, no hay nada que guardar.
 * `apertura` dice cuándo se abre el formulario: la copia se ofrece al cambiar `clave` o
 * `apertura` (un contador que sube cada vez que se carga del servidor), no cada vez que
 * cambia `base` -- guardar o poner la firma del colaborador cambian la base y no son
 * abrir. Sin `apertura`, como antes: cada `base` nueva cuenta como abrir.
 * `normalizar` deja los valores comparables (p. ej. un editor vacío que dice `<p></p>`).
 */
const PREFIJO = "sureconomics_borrador_";

const leer = (clave) => {
  try {
    const crudo = window.localStorage.getItem(PREFIJO + clave);
    return crudo ? JSON.parse(crudo) : null;
  } catch {
    return null;
  }
};

const escribir = (clave, valor) => {
  try {
    if (valor === null) window.localStorage.removeItem(PREFIJO + clave);
    else window.localStorage.setItem(PREFIJO + clave, JSON.stringify(valor));
    return true;
  } catch {
    // Sin almacenamiento (modo privado, cuota llena) el formulario sigue funcionando;
    // solo no hay red.
    return false;
  }
};


const sinCambio = (v) => v;

export const useBorradorLocal = ({ clave, valores, base, aplicar, normalizar = sinCambio, apertura }) => {
  const comoNorma = useRef(normalizar);
  comoNorma.current = normalizar;
  const igual = useCallback(
    (a, b) => JSON.stringify(comoNorma.current(a)) === JSON.stringify(comoNorma.current(b)),
    [],
  );
  const [guardadoEn, setGuardadoEn] = useState(null);
  const [recuperadoEn, setRecuperadoEn] = useState(null);
  const actuales = useRef(valores);
  const deBase = useRef(base);
  const cerrado = useRef(false);
  // La clave cuyo formulario era distinto de la base en el último pintado: si vuelve a
  // ser igual, la copia sobra. Nula al abrir, para no borrar la copia que se ofrece.
  const cambiosEn = useRef(null);
  actuales.current = valores;
  deBase.current = base;

  // Al abrir: si hay un borrador que no coincide con lo que trae el formulario, se pone.
  const disparo = apertura === undefined ? base : apertura;
  useEffect(() => {
    if (!clave) return;
    cerrado.current = false;
    cambiosEn.current = null;
    const guardado = leer(clave);
    if (guardado?.valores && !igual(guardado.valores, deBase.current)) {
      aplicar(guardado.valores);
      setRecuperadoEn(guardado.guardadoEn ?? null);
      setGuardadoEn(guardado.guardadoEn ?? null);
    }
    // Al cambiar de formulario y en cada apertura: si la pieza se carga dos veces (en
    // desarrollo React lo hace; o se recarga del servidor), la segunda carga pisaba la
    // copia recién recuperada. Solo al abrir: al guardar no se vuelve a poner nada
    // encima de lo que se está escribiendo. `aplicar` es el `setState` del padre.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave, disparo]);

  const guardarAhora = useCallback(() => {
    if (!clave || cerrado.current) return false;
    if (igual(actuales.current, deBase.current)) return false;
    const ahora = Date.now();
    if (!escribir(clave, { valores: actuales.current, guardadoEn: ahora })) return false;
    setGuardadoEn(ahora);
    return true;
  }, [clave, igual]);

  // Mientras se escribe. Depende del contenido y no del objeto: los editores de texto
  // reemiten lo mismo a menudo, y cada copia nueva del objeto reiniciaba la espera, así
  // que la copia no llegaba a guardarse nunca mientras el editor estuviera abierto.
  const firma = JSON.stringify(comoNorma.current(valores));
  const firmaBase = JSON.stringify(comoNorma.current(base));
  useEffect(() => {
    if (!clave) return undefined;
    if (firma === firmaBase) {
      // Vuelve a ser lo guardado: una copia de antes sería más vieja que el servidor.
      if (cambiosEn.current === clave) {
        escribir(clave, null);
        setGuardadoEn(null);
      }
      cambiosEn.current = null;
      return undefined;
    }
    cambiosEn.current = clave;
    const id = window.setTimeout(guardarAhora, 800);
    return () => window.clearTimeout(id);
  }, [clave, firma, firmaBase, guardarAhora]);

  // Al irse: otra página del sitio, cerrar la pestaña o pasar a otra aplicación.
  useEffect(() => {
    if (!clave) return undefined;
    const alSalir = () => {
      guardarAhora();
    };
    window.addEventListener("pagehide", alSalir);
    return () => {
      window.removeEventListener("pagehide", alSalir);
      alSalir();
    };
  }, [clave, guardarAhora]);

  const descartar = useCallback(() => {
    if (clave) escribir(clave, null);
    aplicar(deBase.current);
    setRecuperadoEn(null);
    setGuardadoEn(null);
  }, [clave, aplicar]);

  const limpiar = useCallback(() => {
    if (clave) escribir(clave, null);
    setRecuperadoEn(null);
    setGuardadoEn(null);
  }, [clave]);

  const conservar = useCallback(
    (valoresAhora) => {
      setRecuperadoEn(null);
      if (!clave || cerrado.current) return;
      const ahora = Date.now();
      if (escribir(clave, { valores: valoresAhora, guardadoEn: ahora })) setGuardadoEn(ahora);
    },
    [clave],
  );

  const borrar = useCallback(() => {
    cerrado.current = true;
    if (clave) escribir(clave, null);
  }, [clave]);

  return { guardadoEn, recuperadoEn, guardarAhora, descartar, limpiar, conservar, borrar };
};
