// Configuración del linter (ESLint 9, formato «plano»). Sustituye a `eslint.cjs` (ESLint 8)
// con las mismas reglas y los mismos archivos: ver el commit que la trajo.
import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'

// Estos no corren en el navegador y por eso usan `process`: la funcion de Vercel que
// inyecta las etiquetas meta, la configuracion de Vite (y la de este linter). Sin esto el
// linter los marca con "'process' is not defined", que es cierto en el navegador y falso
// donde viven. Se declara el entorno en vez de silenciar la regla.
const DE_NODE = ['vite.config.js', 'eslint.config.js', 'api/**/*.js']

export default [
  {
    // El Analista se trae tal cual de su repo y no se edita aquí: ver
    // scripts/traer-el-analista.mjs. Lintearlo solo invitaría a «arreglarlo».
    //
    // `.mjs` y `.cjs`: ESLint 8 se llamaba con `--ext js,jsx` y nunca los leyó (el bloque
    // para `**/*.test.mjs` y `scripts/**/*.mjs` de eslint.cjs no llegaba a aplicarse).
    // ESLint 9 los leería por su cuenta; se dejan fuera para que este cambio sea solo de
    // herramienta. Lintar pruebas y guiones es un paso aparte, con sus propios arreglos.
    ignores: ['dist/', 'src/juegos/el-analista/el-analista.jsx', '**/*.mjs', '**/*.cjs'],
  },
  {
    files: ['**/*.{js,jsx}'],
    ...js.configs.recommended,
  },
  {
    files: ['**/*.{js,jsx}'],
    ...react.configs.flat.recommended,
  },
  {
    files: ['**/*.{js,jsx}'],
    ...react.configs.flat['jsx-runtime'],
  },
  {
    files: ['**/*.{js,jsx}'],
    ...reactHooks.configs['recommended-latest'],
  },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    settings: { react: { version: '18.2' } },
    rules: {
      // ESLint 9 sacó estas tres de las recomendadas; ESLint 8 las tenía y se mantienen.
      // Las dos de formato están en desuso y desaparecen en ESLint 10: se irán cuando
      // el formato lo lleve Prettier (A-10 del plan 2026-11-23).
      // En ESLint 9 deja pasar funciones dentro de un `if` en los módulos
      // (`blockScopedFunctions: 'allow'`); ESLint 8 las marcaba y así se sigue.
      'no-inner-declarations': ['error', 'functions', { blockScopedFunctions: 'disallow' }],
      // Chrome/Edge 80-90 (V8 8.0-9.0) fallan con un `...` que no es el último
      // argumento de una llamada dentro de un encadenado opcional:
      // `f?.(...a, b)` u `o?.m(...a, b)` (crbug.com/v8/11558). El `build.target`
      // de vite.config.js deja `?.` sin reescribir para Chrome 91+: esta regla
      // impide que ese patrón llegue al código.
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ChainExpression CallExpression > SpreadElement:not(:last-child)',
          message:
            'Un `...` que no es el último argumento dentro de `?.` falla en Chrome 80-90 (crbug.com/v8/11558): ponlo el último o saca la llamada del encadenado.',
        },
      ],
      'no-extra-semi': 'error',
      'no-mixed-spaces-and-tabs': 'error',
      // Los espacios duros dentro de plantillas se permiten porque ahi son
      // intencionados: `AdminPlacesList` sangra con dos U+00A0 el nombre de un lugar
      // hijo en el desplegable, y con espacios normales el HTML los colapsa y la
      // jerarquia desaparece. Fuera de una plantilla siguen marcandose, que es donde
      // de verdad indican un caracter colado por error al copiar y pegar.
      'no-irregular-whitespace': ['error', { skipTemplates: true }],
      // Más estrictas que las de serie: también los argumentos y los `catch` sin usar
      // (un `_` delante dice «lo sé, no lo uso»), y const/var/=== como costumbre. Se
      // activaron el 18-nov-2026 sin cambiar nada de comportamiento: lo único que saltó
      // fue un `let` que debía ser `const`. `ignoreReadBeforeAssign` deja pasar el
      // `let io` de useRevealOnScroll, que su propio callback lee antes de asignarse.
      'no-unused-vars': ['error', {
        args: 'all',
        argsIgnorePattern: '^_',
        caughtErrors: 'all',
        caughtErrorsIgnorePattern: '^_',
      }],
      'prefer-const': ['error', { ignoreReadBeforeAssign: true }],
      'no-var': 'error',
      eqeqeq: ['error', 'smart'],
      'no-unused-expressions': 'error',
    },
  },
  // Los globales se reparten en dos bloques que no se pisan (los de varios bloques se
  // suman): navegador para todo menos DE_NODE, y solo Node para DE_NODE.
  {
    files: ['**/*.{js,jsx}'],
    ignores: DE_NODE,
    languageOptions: { globals: globals.browser },
  },
  {
    files: DE_NODE,
    languageOptions: { globals: globals.node },
  },
  // pico.js es una copia literal de un detector de caras ajeno (ver su cabecera):
  // se deja como vino, con su `var`, su `==` y sus expresiones sueltas.
  {
    files: ['src/lib/pico.js'],
    rules: { 'no-var': 'off', eqeqeq: 'off', 'no-unused-expressions': 'off' },
  },
]
