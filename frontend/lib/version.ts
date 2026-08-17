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
 */
export const APP_VERSION = "1.2.0";
