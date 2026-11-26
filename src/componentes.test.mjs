/**
 * El trinquete del tamaño de los componentes (A-9 del plan del 23-nov-2026): corre con
 * `npm test` (o `node --test src/componentes.test.mjs`).
 *
 * Un componente de 600 líneas con 17 estados no se lee de una sentada, y cada arreglo lo
 * hace un poco más largo (`AdminTitulares` pasó de 315 a 421 en una tarde). Esto no obliga
 * a partir nada hoy; impide que siga creciendo mientras se paga:
 *
 * 1. Un componente **nuevo** no pasa de `TOPE_NUEVO` (200) líneas.
 * 2. Los que ya pasaban el 23-nov-2026 están en `TOPES` con sus líneas de ese día, y ese
 *    número **solo puede bajar**:
 *    - si el componente crece, la prueba falla;
 *    - si baja (se partió un trozo), también falla, y pide bajar su número en `TOPES`: si no,
 *      el hueco que dejó se volvería a llenar sin que nadie lo viera;
 *    - si ya no pasa de 200, o ya no existe (se borró o cambió de nombre), pide quitarlo.
 *
 * Se parte cuando se toca, nunca en una tanda propia. Cómo partir cada uno de los grandes:
 * `docs/revisiones/plan-2026-11-23/5-frontend-peso-css-pruebas.md`, §4 (en el repo de la
 * carpeta de arriba).
 *
 * **Qué es un componente:** una función de primer nivel del módulo, con nombre en
 * mayúscula y JSX dentro: `function X()`, `const X = () =>` o `const X = memo(() => …)`
 * (también `forwardRef`), exportada o no. Sus líneas van de la primera a la última de la
 * declaración, sin el comentario de encima. Los ganchos (`useX`) no cuentan.
 *
 * **Fuera:** las pruebas, El Analista (se trae tal cual de su repositorio) y los juegos
 * (`src/juegos`): un juego es un bucle con su estado en un solo componente, y partirlo por
 * líneas no lo hace más claro.
 *
 * El análisis lee el árbol del código con espree, como `arquitectura.test.mjs`. Su trampa,
 * en «el trinquete ve las trampas»: un sitio de mentira con cada caso puesto a propósito.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as espree from "espree";

const RAIZ = fileURLToPath(new URL("../", import.meta.url));

/** Lo más largo que puede nacer un componente. */
const TOPE_NUEVO = 200;

/**
 * Los componentes que pasaban de `TOPE_NUEVO` el 23-nov-2026 (rama `integracion-2026-11d`,
 * a371919): `"ruta#Nombre": líneas`. Solo se baja un número o se quita una línea; nunca
 * se sube ni se añade. La prueba no puede impedir que alguien suba un número en el mismo
 * commit en que el componente crece: eso **no está permitido** y se vigila en la revisión
 * (un cambio en esta tabla que no sea bajar o quitar, se rechaza).
 */
const TOPES = {
  "src/pages/admin/AdminResumen.jsx#AdminResumen": 624,
  "src/pages/admin/AdminSubmissionDetail.jsx#AdminSubmissionDetail": 646,
  "src/pages/admin/AdminPostsList.jsx#AdminPostsList": 596,
  "src/features/publicidad/admin/components/AsistenteDeAnuncio.jsx#AsistenteDeAnuncio": 598,
  "src/pages/admin/AdminPostEditor.jsx#AdminPostEditor": 561,
  "src/features/analitica/admin/AdminAnalitica.jsx#AdminAnalitica": 464,
  "src/pages/admin/AdminJuegoPalabras.jsx#AdminJuegoPalabras": 458,
  "src/features/titulares/admin/AdminTitulares.jsx#AdminTitulares": 418,
  "src/components/Navbar.jsx#Navbar": 426,
  "src/pages/Home.jsx#Home": 385,
  "src/components/admin/AssetField.jsx#AssetField": 382,
  "src/components/home/ContentExplorer.jsx#ContentExplorer": 367,
  "src/pages/admin/AdminEducacion.jsx#TarjetaDeModulo": 359,
  "src/pages/Pieza.jsx#Pieza": 357,
  "src/pages/admin/AdminCommentsList.jsx#AdminCommentsList": 351,
  "src/components/admin/RecorteDeAvatar.jsx#RecorteDeAvatar": 343,
  "src/pages/admin/AdminLvbp.jsx#AdminLvbp": 341,
  "src/features/publicidad/admin/AdminPublicidad.jsx#AdminPublicidad": 336,
  "src/features/publicidad/admin/components/FilaDePieza.jsx#FilaDePieza": 332,
  "src/features/publicidad/admin/components/TarjetaDeCampana.jsx#TarjetaDeCampana": 323,
  "src/pages/admin/AdminMiPerfil.jsx#AdminMiPerfil": 322,
  "src/pages/admin/AdminStaffList.jsx#AdminStaffList": 310,
  "src/features/titulares/admin/components/FuentesDeTitulares.jsx#FuentesDeTitulares": 309,
  "src/pages/admin/AdminEducacion.jsx#FilaDeLeccion": 307,
  "src/pages/admin/AdminUserDetail.jsx#AdminUserDetail": 301,
  "src/pages/admin/AdminRedes.jsx#AdminRedes": 297,
  "src/pages/Audiovisual.jsx#Audiovisual": 292,
  "src/features/monedas/admin/MonedasDelPanel.jsx#MonedasDelPanel": 284,
  "src/pages/admin/AdminPlacesList.jsx#AdminPlacesList": 284,
  "src/pages/admin/AdminMediaLibrary.jsx#AdminMediaLibrary": 275,
  "src/features/cuenta/pages/CuentaEnvioDetail.jsx#CuentaEnvioDetail": 276,
  "src/pages/admin/AdminMarketTicker.jsx#AdminMarketTicker": 264,
  "src/features/boletin/InvitacionAlBoletinAbierta.jsx#InvitacionAlBoletinAbierta": 260,
  "src/features/publicidad/admin/components/TarjetaDeAnunciante.jsx#TarjetaDeAnunciante": 258,
  "src/components/admin/cuerpo/DialogoDeImagen.jsx#DialogoDeImagen": 254,
  "src/features/boletin/admin/components/Editor.jsx#Editor": 253,
  "src/features/cuenta/pages/CuentaRecuperar.jsx#CuentaRecuperar": 251,
  "src/components/Footer.jsx#Footer": 247,
  "src/features/cuenta/pages/CuentaPerfil.jsx#CuentaPerfil": 241,
  "src/pages/admin/AdminEquipo.jsx#AdminEquipo": 235,
  "src/features/analitica/Cookies.jsx#Cookies": 231,
  "src/components/admin/BylinePhotoField.jsx#BylinePhotoField": 230,
  "src/features/boletin/admin/components/Envio.jsx#Envio": 229,
  "src/pages/EducacionModulo.jsx#EducacionModulo": 227,
  "src/components/editor/ImageField.jsx#ImageField": 223,
  "src/pages/Contacto.jsx#Contacto": 223,
  "src/features/cuenta/pages/CuentaRegistro.jsx#CuentaRegistro": 219,
  "src/pages/admin/AdminTopicsList.jsx#AdminTopicsList": 216,
  "src/features/cuenta/pages/CuentaEntrar.jsx#CuentaEntrar": 214,
  "src/pages/admin/AdminAvisos.jsx#AdminAvisos": 213,
  "src/pages/admin/AdminAnalista.jsx#AdminAnalista": 212,
  "src/components/recorrido/RecorridoVista.jsx#RecorridoVista": 211,
  "src/features/monedas/components/GraficaDeMoneda.jsx#GraficaDeMoneda": 211,
  "src/pages/admin/AdminLayout.jsx#AdminShell": 211,
  "src/components/EnRedes.jsx#Fila": 210,
  "src/pages/admin/AdminSubmissionsList.jsx#AdminSubmissionsList": 206,
};

const OPCIONES = { ecmaVersion: "latest", sourceType: "module", ecmaFeatures: { jsx: true }, loc: true };

const esFuncion = (n) =>
  n?.type === "ArrowFunctionExpression" || n?.type === "FunctionExpression" || n?.type === "FunctionDeclaration";

/** `memo(…)`, `forwardRef(…)` o `React.memo(forwardRef(…))` hasta dar con la función; si no, null. */
const desenvolver = (n) => {
  let actual = n;
  while (actual?.type === "CallExpression") {
    const c = actual.callee;
    const nombre = c.type === "Identifier" ? c.name : c.type === "MemberExpression" ? c.property.name : "";
    if (nombre !== "memo" && nombre !== "forwardRef") return null;
    actual = actual.arguments[0];
  }
  return esFuncion(actual) ? actual : null;
};

const tieneJsx = (nodo) => {
  const pendientes = [nodo];
  while (pendientes.length) {
    const n = pendientes.pop();
    if (!n || typeof n.type !== "string") continue;
    if (n.type === "JSXElement" || n.type === "JSXFragment") return true;
    for (const clave of espree.VisitorKeys[n.type] ?? []) {
      const hijo = n[clave];
      pendientes.push(...(Array.isArray(hijo) ? hijo : [hijo]));
    }
  }
  return false;
};

/** Los componentes de un código: `[{ nombre, lineas }]`. */
export const componentesDe = (fuente) => {
  const salida = [];
  for (const arriba of espree.parse(fuente, OPCIONES).body) {
    const decl =
      arriba.type === "ExportNamedDeclaration" || arriba.type === "ExportDefaultDeclaration" ? arriba.declaration : arriba;
    if (!decl) continue;
    const candidatos = [];
    if (decl.type === "FunctionDeclaration" && decl.id) {
      candidatos.push({ nombre: decl.id.name, fn: decl, nodo: decl });
    } else if (decl.type === "VariableDeclaration") {
      for (const d of decl.declarations) {
        const fn = d.id.type === "Identifier" && d.init ? (esFuncion(d.init) ? d.init : desenvolver(d.init)) : null;
        // Con una sola variable cuenta desde `const`; con varias, desde su nombre.
        if (fn) candidatos.push({ nombre: d.id.name, fn, nodo: decl.declarations.length === 1 ? decl : d });
      }
    } else if (arriba.type === "ExportDefaultDeclaration") {
      const fn = esFuncion(decl) ? decl : desenvolver(decl);
      if (fn) candidatos.push({ nombre: fn.id?.name ?? "default", fn, nodo: decl });
    }
    for (const { nombre, fn, nodo } of candidatos) {
      if (/^[A-Z]/.test(nombre) && tieneJsx(fn)) {
        salida.push({ nombre, lineas: nodo.loc.end.line - nodo.loc.start.line + 1 });
      }
    }
  }
  return salida;
};

/** Todos los componentes del sitio que cuelga de `raiz`: `{ "ruta#Nombre": líneas }`. */
export const medir = (raiz = RAIZ) => {
  const src = path.join(raiz, "src");
  const medidas = {};
  if (!existsSync(src)) return medidas;
  for (const nombre of readdirSync(src, { recursive: true })) {
    const rel = `src/${nombre.split(path.sep).join("/")}`;
    if (!/\.(jsx?|mjs)$/.test(rel) || /\.test\./.test(rel) || rel.startsWith("src/juegos/")) continue;
    for (const c of componentesDe(readFileSync(path.join(raiz, rel), "utf8"))) {
      medidas[`${rel}#${c.nombre}`] = c.lineas;
    }
  }
  return medidas;
};

/** Lo que no cuadra entre las medidas y los topes, en palabras (vacío si todo va bien). */
export const faltas = (medidas, topes = TOPES, topeNuevo = TOPE_NUEVO) => {
  const salida = [];
  for (const [clave, lineas] of Object.entries(medidas)) {
    const tope = topes[clave];
    if (tope === undefined) {
      if (lineas > topeNuevo) {
        salida.push(`${clave}: ${lineas} líneas; un componente nuevo no pasa de ${topeNuevo}: pártalo`);
      }
    } else if (lineas > tope) {
      salida.push(`${clave}: ${lineas} líneas, su tope es ${tope}; no puede crecer: saque un trozo a otro componente`);
    } else if (lineas <= topeNuevo) {
      salida.push(`${clave}: ${lineas} líneas, ya no pasa de ${topeNuevo}: quítelo de TOPES`);
    } else if (lineas < tope) {
      salida.push(`${clave}: bajó de ${tope} a ${lineas} líneas: ponga ${lineas} en TOPES (el tope solo baja)`);
    }
  }
  for (const clave of Object.keys(topes)) {
    if (!(clave in medidas)) {
      salida.push(`${clave}: ya no existe (¿se borró o cambió de nombre?): quítelo de TOPES`);
    }
  }
  return salida.sort();
};

test("hay componentes que medir (que lo de abajo no pase en vacío)", () => {
  const medidas = medir();
  assert.ok(Object.keys(medidas).length > 300, `solo ${Object.keys(medidas).length} componentes`);
  assert.ok(medidas["src/pages/Home.jsx#Home"] > 100);
});

test("ningún componente pasa de su tope, y los topes están al día", () => {
  const lista = faltas(medir());
  assert.deepEqual(lista, [], `\n${lista.join("\n")}`);
});

test("el trinquete ve las trampas", () => {
  const raiz = mkdtempSync(path.join(os.tmpdir(), "componentes-"));
  /** Un componente de `n` líneas en total, con su JSX. */
  const de = (n, cabeza = "export const X = () => {") =>
    [cabeza, ...Array.from({ length: n - 3 }, (_, i) => `  // ${i + 1}`), "  return <div />;", "};"].join("\n");
  const sitio = {
    "src/Justo.jsx": de(200), //                               bien: justo en el tope de los nuevos
    "src/Largo.jsx": de(201), //                               ✗ 1: nuevo y de 201
    "src/Funcion.jsx": de(205, "export default function F() {"), // ✗ 1: también como `function`
    "src/Memo.jsx": de(210, "const M = memo(forwardRef((p, ref) => {")
      .replace(/};$/, "}));"), //                              ✗ 1: también dentro de memo/forwardRef
    "src/Gancho.js": de(300, "export const useLargo = () => {"), // bien: un gancho no es un componente
    "src/Minuscula.jsx": de(300, "const ayuda = () => {"), //   bien: no es un componente
    "src/SinJsx.js": "const Datos = () => {\n" + "  // nada\n".repeat(250) + "  return 1;\n};\n", // bien: sin JSX
    "src/Topado.jsx": de(300), //                              bien: en su tope
    "src/Crecio.jsx": de(301), //                              ✗ 2: una línea más que su tope
    "src/Bajo.jsx": de(280), //                                ✗ 2: bajó, hay que bajar el número
    "src/YaCorto.jsx": de(150), //                             ✗ 2: ya no pasa de 200, fuera de TOPES
    "src/Prueba.test.mjs": de(400), //                         bien: las pruebas no cuentan
    "src/juegos/Juego.jsx": de(400), //                        bien: los juegos tampoco
  };
  const topes = {
    "src/Topado.jsx#X": 300,
    "src/Crecio.jsx#X": 300,
    "src/Bajo.jsx#X": 300,
    "src/YaCorto.jsx#X": 300,
    "src/Borrado.jsx#X": 300, //                               ✗ 2: ya no existe
  };
  try {
    for (const [ruta, texto] of Object.entries(sitio)) {
      mkdirSync(path.dirname(path.join(raiz, ruta)), { recursive: true });
      writeFileSync(path.join(raiz, ruta), texto);
    }
    const medidas = medir(raiz);
    assert.equal(medidas["src/Justo.jsx#X"], 200);
    assert.equal(medidas["src/Memo.jsx#M"], 210);
    assert.deepEqual(
      faltas(medidas, topes).map((f) => f.split(":")[0] + " → " + f.split(": ").at(-1)),
      [
        "src/Bajo.jsx#X → ponga 280 en TOPES (el tope solo baja)",
        "src/Borrado.jsx#X → quítelo de TOPES",
        "src/Crecio.jsx#X → saque un trozo a otro componente",
        "src/Funcion.jsx#F → pártalo",
        "src/Largo.jsx#X → pártalo",
        "src/Memo.jsx#M → pártalo",
        "src/YaCorto.jsx#X → quítelo de TOPES",
      ],
    );
  } finally {
    rmSync(raiz, { recursive: true, force: true });
  }
});
