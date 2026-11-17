/**
 * La espera de lo de debajo del pliegue (`trasLaFoto.js`). `node src/lib/trasLaFoto.test.mjs`.
 * Lo que se vigila: que nada sale antes de la foto, que sale en cuanto llega y que, si la
 * foto no llega nunca, el tope lo suelta igual. En ese orden: el aviso es de la página
 * entera y no se puede deshacer.
 */
import { fotoPrincipalLista, trasLaFoto } from "./trasLaFoto.js";

let fallos = 0;
const check = (nombre, ok) => {
  console.log(`  ${ok ? "ok " : "X  "} ${nombre}`);
  if (!ok) fallos++;
};
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

console.log("sin foto");
{
  let soltada = false;
  trasLaFoto(80).then(() => {
    soltada = true;
  });
  await dormir(30);
  check("antes del tope, espera", !soltada);
  await dormir(90);
  check("pasado el tope, sale aunque la foto no llegue", soltada);
}

console.log("con foto");
{
  let soltada = false;
  const inicio = Date.now();
  trasLaFoto(5000).then(() => {
    soltada = true;
  });
  await dormir(20);
  check("mientras la foto no llega, espera", !soltada);
  fotoPrincipalLista();
  fotoPrincipalLista();
  await dormir(30);
  check("en cuanto llega, sale (sin esperar al tope)", soltada && Date.now() - inicio < 1000);
}

console.log("después de la foto");
{
  let soltada = false;
  trasLaFoto(5000).then(() => {
    soltada = true;
  });
  await dormir(20);
  check("ya no espera", soltada);
}

if (fallos) {
  console.log(`\n${fallos} fallo(s)`);
  process.exit(1);
}
console.log("\ntodo bien");
