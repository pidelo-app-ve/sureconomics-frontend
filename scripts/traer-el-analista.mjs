/**
 * Trae El Analista desde su repo a `src/juegos/el-analista/`.
 *
 *   npm run traer-analista                    (la rama main de su repo, por HTTPS)
 *   npm run traer-analista -- --ref otra-rama
 *   npm run traer-analista -- --desde ../../analista/el-analista   (un clon local)
 *
 * El juego lo hace el equipo de Alessandro en `juega-el-analista/el-analista`. Aquí no
 * se edita: se trae su `src/el-analista.jsx` tal cual, con un aviso encima, y se anota
 * de qué commit vino en `origen.json`. Lo que haya que adaptar va en nuestro envoltorio
 * (`src/pages/ElAnalista.jsx`); si se tocara el archivo traído, la próxima vez que se trajera
 * se perdería el cambio o chocaría.
 *
 * Antes de escribir nada comprueba el contrato: que el archivo siga exportando el
 * componente y siga leyendo los tres enganches del registro. Si no, para y lo dice:
 * eso hay que hablarlo con ellos antes de publicarlo.
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = "https://github.com/juega-el-analista/el-analista.git";
const ARCHIVO = "src/el-analista.jsx";
const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DESTINO = join(RAIZ, "src", "juegos", "el-analista");

/** Lo que nuestro envoltorio necesita del juego. Si falta algo, no se trae. */
const CONTRATO = [
  ["el componente", /export default function ElAnalista\s*\(/],
  ["la lista del registro", /window\.__REGISTRO/],
  ["si se puede anotar", /window\.__puedeAnotar/],
  ["anotar una carrera", /window\.__anotarCarrera/],
];

const arg = (nombre) => {
  const i = process.argv.indexOf(`--${nombre}`);
  return i > 0 ? process.argv[i + 1] : undefined;
};

const git = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();

const ref = arg("ref") || "main";
const desde = arg("desde");
let carpeta;
let temporal = null;

try {
  if (desde) {
    carpeta = resolve(desde);
    if (!existsSync(join(carpeta, ARCHIVO))) throw new Error(`No encuentro ${ARCHIVO} en ${carpeta}`);
    if (git(carpeta, "status", "--porcelain", "--", ARCHIVO)) {
      throw new Error(`${ARCHIVO} tiene cambios sin guardar en ${carpeta}: solo se trae lo que está en un commit.`);
    }
  } else {
    temporal = mkdtempSync(join(tmpdir(), "el-analista-"));
    console.log(`Clonando ${REPO} (${ref})…`);
    execFileSync("git", ["clone", "--quiet", "--depth", "1", "--branch", ref, REPO, temporal], {
      stdio: "inherit",
      env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
    });
    carpeta = temporal;
  }

  const commit = git(carpeta, "rev-parse", "HEAD");
  const fecha = git(carpeta, "log", "-1", "--format=%cI");
  const titulo = git(carpeta, "log", "-1", "--format=%s");
  const fuente = readFileSync(join(carpeta, ARCHIVO), "utf8");

  const faltan = CONTRATO.filter(([, patron]) => !patron.test(fuente)).map(([nombre]) => nombre);
  if (faltan.length) {
    throw new Error(
      `El juego de ${commit.slice(0, 7)} ya no trae: ${faltan.join(", ")}. ` +
        "No se trae: nuestro envoltorio depende de eso. Hay que hablarlo con el equipo del juego."
    );
  }

  const aviso = `/* ═══════════════════════════════════════════════════════════════════════
   NO EDITAR AQUÍ.

   Este archivo es El Analista tal cual lo publica su equipo en
   ${REPO.replace(/\.git$/, "")}
   Traído de ${ref} @ ${commit.slice(0, 7)} (${fecha}) con «npm run traer-analista».

   Cualquier cambio aquí se pierde la próxima vez que se traiga. Lo que haya que
   adaptar va en src/pages/ElAnalista.jsx; lo que haya que cambiar del juego se pide
   en su repo.
   ═══════════════════════════════════════════════════════════════════════ */
`;

  mkdirSync(DESTINO, { recursive: true });
  writeFileSync(join(DESTINO, "el-analista.jsx"), aviso + fuente);
  writeFileSync(
    join(DESTINO, "origen.json"),
    JSON.stringify({ repo: REPO, ref, commit, fecha, titulo, traido: new Date().toISOString() }, null, 2) + "\n"
  );

  console.log(`\nEl Analista traído: ${ref} @ ${commit.slice(0, 7)} — «${titulo}»`);
  console.log("Siguiente: npm run build, probar /el-analista en local y hacer commit:");
  console.log(`  git commit -m "El Analista: trae ${commit.slice(0, 7)} de ${ref}"`);
} catch (e) {
  console.error(`\nNo se trajo El Analista: ${e.message}`);
  process.exitCode = 1;
} finally {
  if (temporal) rmSync(temporal, { recursive: true, force: true });
}
