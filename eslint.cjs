module.exports = {
    root: true,
    env: { browser: true, es2020: true },
    extends: [
      'eslint:recommended',
      'plugin:react/recommended',
      'plugin:react/jsx-runtime',
      'plugin:react-hooks/recommended',
    ],
    // El Analista se trae tal cual de su repo y no se edita aquí: ver
    // scripts/traer-el-analista.mjs. Lintearlo solo invitaría a «arreglarlo».
    ignorePatterns: ['dist', '.eslintrc.cjs', 'src/juegos/el-analista/el-analista.jsx'],
    parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    settings: { react: { version: '18.2' } },
    plugins: ['react-refresh'],
    rules: {
      'react-refresh/only-export-components': 'off',
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
    // Estos tres no corren en el navegador y por eso usan `process`: la funcion de
    // Vercel que inyecta las etiquetas meta, la configuracion de Vite y su prueba.
    // Sin esto el linter los marca con "'process' is not defined", que es cierto en el
    // navegador y falso donde viven. Se declara el entorno en vez de silenciar la regla.
    overrides: [
      {
        files: ['vite.config.js', 'api/**/*.js', '**/*.test.mjs', 'scripts/**/*.mjs'],
        env: { node: true, browser: false },
      },
      // pico.js es una copia literal de un detector de caras ajeno (ver su cabecera):
      // se deja como vino, con su `var`, su `==` y sus expresiones sueltas.
      {
        files: ['src/lib/pico.js'],
        rules: { 'no-var': 'off', eqeqeq: 'off', 'no-unused-expressions': 'off' },
      },
    ],
  }
  