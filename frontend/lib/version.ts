/**
 * Versión del sistema, mostrada en Configuración. Se mantiene en sincronía con
 * `package.json` (y, en desktop, con `src-tauri/tauri.conf.json` y `Cargo.toml`).
 *
 * 1.0.0 = primera versión final consolidada, común a las dos líneas.
 * 1.1.0 = las funcionalidades que el escritorio estrenó entre su 1.1.0 y su
 *         1.5.0 y que aplican también acá: propiedades del frontmatter, Esporas,
 *         ancho de tabulación y navegación por pestaña. Un solo incremento
 *         porque es un solo release, del tamaño del cambio más significativo
 *         (ver `docs/decisiones/Versionado del sistema.md`). Las dos líneas NO
 *         comparten numeración: cada una cuenta lo suyo.
 * 1.3.0 = la parte que aplica acá de la tanda de la 1.7.0 de escritorio. Las
 *         tablas `.base` se vuelven de trabajar (negar y agrupar filtros,
 *         buscador de campos, ordenar por columna, buscar dentro, ancho de
 *         columna); la búsqueda del vault deja elegir si busca por nombre, por
 *         contenido o por los dos, y agrupa los resultados por carpeta; las
 *         pestañas y el explorador ganan marcas (ícono del tipo, guías de
 *         indentación); y el título de la nota renombra el archivo. Con ellas
 *         llegan las **preferencias del vault** (`FUN-M-29`), que acá viven en
 *         el navegador y no viajan con el vault — la diferencia está anotada en
 *         `docs/features/preferencias-por-vault.md`.
 *
 *         **Se quedan fuera por naturaleza**: el color por consola y el
 *         resaltado de sintaxis del visor, que dependen de la terminal y del
 *         visor de archivos, los dos solo-desktop.
 * 2.0.0 = **el rediseño de la interfaz**, reflejado del escritorio (el
 *         experimento de impeccable, integrado allá el 2026-09-21 y reflejado
 *         acá el 2026-09-22): la barra superior pasa a ser la paleta de notas y
 *         comandos, Configuración se muda a una ventana con categorías y
 *         buscador, aparecen las **atmósferas** (un tercer eje del estilo, al
 *         lado de tema y modo), la barra de estado al pie, los avisos con
 *         deshacer, el diálogo de confirmación propio y la interfaz entera
 *         usable con el teclado.
 *
 *         **MAJOR por decisión del usuario, no por la regla** — igual que en
 *         desktop: por dentro no hay rearquitectura, pero quien entra no
 *         encuentra las cosas donde estaban, y el aspecto por defecto cambia
 *         porque la atmósfera nueva se aplica sola. Que las dos líneas coincidan
 *         en `2.0.0` es casualidad: siguen sin compartir numeración.
 *
 *         **Se queda fuera por naturaleza**: el marco de ventana propio
 *         (`FUN-M-31`) —acá la ventana es la del navegador—, y con él los
 *         controles de minimizar/maximizar/cerrar y el menú de anclaje.
 */
export const APP_VERSION = "2.1.0";
