module.exports = {
    root: true,
    env: { browser: true, es2020: true },
    extends: [
      'eslint:recommended',
      'plugin:react/recommended',
      'plugin:react/jsx-runtime',
      'plugin:react-hooks/recommended',
    ],
    ignorePatterns: ['dist', '.eslintrc.cjs'],
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
    },
    // Estos tres no corren en el navegador y por eso usan `process`: la funcion de
    // Vercel que inyecta las etiquetas meta, la configuracion de Vite y su prueba.
    // Sin esto el linter los marca con "'process' is not defined", que es cierto en el
    // navegador y falso donde viven. Se declara el entorno en vez de silenciar la regla.
    overrides: [
      {
        files: ['vite.config.js', 'api/**/*.js', '**/*.test.mjs'],
        env: { node: true, browser: false },
      },
    ],
  }
  