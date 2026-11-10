/**
 * El menú del panel, como datos: lo pinta `AdminLayout`, lo busca el buscador (Ctrl+K)
 * y lo recorre la bienvenida (`guias/guiaPanel.js`). Una sola lista, para que los tres
 * digan lo mismo.
 *
 * Agrupado **por tarea** y no por tipo de cosa: antes «Contenido» tenía trece enlaces
 * mezclados (crear, archivos, la cinta, el béisbol, la publicidad…). Cada `nombre` es el
 * mismo que el título de la página a la que lleva: el menú decía «Suscriptores» y la
 * página «Boletín», o «Boletín» y la página «Entorno en Viñetas».
 *
 * Dos roles desde el 10-nov-2026: **Editor** (`publicador` en los datos) lo hace todo menos
 * llevar las cuentas del panel; **admin** es solo el dueño. El «escritor» dejó de existir.
 *
 * `permiso`: quién lo ve. `todos`, `crear` (cualquiera del panel), `editorial` (editor y
 * admin) o `admin`. `palabras`: otras formas de llamarlo, para el buscador.
 */
export const MENU_DEL_PANEL = [
  {
    clave: "redaccion",
    nombre: "Redacción",
    explica: "Escribir, revisar y publicar.",
    items: [
      { to: "/admin/posts", nombre: "Contenido", permiso: "todos", fin: true, palabras: "piezas noticias artículos listado publicar" },
      { to: "/admin/posts/new", nombre: "Crear pieza", permiso: "crear", palabras: "nueva noticia artículo editorial entrevista informe podcast" },
      { to: "/admin/media", nombre: "Archivos", permiso: "todos", palabras: "imágenes fotos pdf audio biblioteca subir" },
      { to: "/admin/traducciones", nombre: "Traducciones", permiso: "todos", palabras: "inglés english traducir claude" },
      { to: "/admin/comments", nombre: "Comentarios", permiso: "editorial", palabras: "moderar lectores" },
      { to: "/admin/submissions", nombre: "Propuestas de lectores", permiso: "editorial", palabras: "envíos colaborativos colaboradores ajustes abrir cerrar recibir" },
      { to: "/admin/equipo", nombre: "Fotos del equipo", permiso: "todos", palabras: "quiénes somos retratos" },
    ],
  },
  {
    clave: "automatico",
    nombre: "Automático",
    explica: "Lo que llega solo y se revisa aquí.",
    items: [
      { to: "/admin/titulares", nombre: "Titulares en caliente", permiso: "editorial", palabras: "última hora recolector" },
      { to: "/admin/resumen", nombre: "Resumen diario", permiso: "editorial", palabras: "whatsapp telegram ediciones mañana" },
      { to: "/admin/cinta", nombre: "Cinta de mercado", permiso: "todos", palabras: "monedas cotizaciones bolsa" },
      { to: "/admin/canal", nombre: "Canal de YouTube", permiso: "todos", palabras: "videos shorts al punto en la calle" },
      { to: "/admin/redes", nombre: "En redes", permiso: "todos", palabras: "instagram tiktok x twitter" },
      { to: "/admin/lvbp", nombre: "Béisbol LVBP", permiso: "todos", palabras: "marcador juegos" },
    ],
  },
  {
    clave: "comercial",
    nombre: "Comercial",
    explica: "Lo que se vende: anuncios, boletín y cursos.",
    items: [
      { to: "/admin/publicidad", nombre: "Publicidad", permiso: "editorial", palabras: "anuncios anunciantes campañas banner mapa" },
      { to: "/admin/boletin/numeros", nombre: "Entorno en Viñetas", permiso: "editorial", palabras: "boletín números lunes newsletter" },
      { to: "/admin/boletin", nombre: "Suscriptores del boletín", permiso: "editorial", fin: true, palabras: "boletín newsletter lista bajas" },
      { to: "/admin/educacion", nombre: "Educación", permiso: "todos", palabras: "cursos módulos lecciones compras" },
    ],
  },
  {
    clave: "lectores",
    nombre: "Lectores",
    explica: "Quién lee y cómo participa.",
    items: [
      { to: "/admin/analitica", nombre: "Audiencia", permiso: "todos", palabras: "analítica visitas lectores estadísticas" },
      { to: "/admin/users", nombre: "Usuarios", permiso: "editorial", palabras: "cuentas lectores registrados" },
      { to: "/admin/juegos/palabras", nombre: "La Clave", permiso: "editorial", palabras: "juego palabras wordle" },
      { to: "/admin/analista", nombre: "Ranking de El Analista", permiso: "editorial", palabras: "juego ranking" },
    ],
  },
  {
    clave: "sistema",
    nombre: "Sistema",
    explica: "Clasificación, cuentas y ajustes.",
    items: [
      { to: "/admin/topics", nombre: "Temas", permiso: "todos", palabras: "clasificación categorías" },
      { to: "/admin/places", nombre: "Lugares", permiso: "todos", palabras: "países regiones" },
      { to: "/admin/staff", nombre: "Personal", permiso: "admin", palabras: "equipo roles cuentas del panel" },
      { to: "/admin/perfil", nombre: "Mi perfil", permiso: "todos", palabras: "contraseña nombre correo" },
    ],
  },
];

/** Si este rol puede ver un enlace del menú. */
export const puedeVer = (permiso, role) => {
  if (permiso === "crear") return Boolean(role);
  if (permiso === "editorial") return role === "publicador" || role === "admin";
  if (permiso === "admin") return role === "admin";
  return true;
};

/** El menú que ve este rol: los grupos vacíos fuera. */
export const menuPara = (role) =>
  MENU_DEL_PANEL.map((g) => ({ ...g, items: g.items.filter((i) => puedeVer(i.permiso, role)) })).filter(
    (g) => g.items.length,
  );

/** Cómo se llama cada rol en pantalla. `escritor` queda por si llega una sesión vieja. */
export const NOMBRE_DE_ROL = { publicador: "Editor", admin: "Admin", escritor: "Escritor" };

/** El editor y el admin: todo lo del panel menos las cuentas del propio panel. */
export const esEditor = (role) => role === "publicador" || role === "admin";

/** El nombre de la página de una ruta, para el título de la pestaña. */
export const nombreDeRuta = (pathname) => {
  for (const g of MENU_DEL_PANEL) {
    for (const i of g.items) if (i.to === pathname) return i.nombre;
  }
  return null;
};
