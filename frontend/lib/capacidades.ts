/**
 * Qué funciones existen en esta versión de Mycelium.
 *
 * **Compartir** necesita cuenta y servidor, y acá los hay: esta es la versión
 * web. Es el único valor que cambia entre las dos ramas — en `desktop-tauri`
 * está en `false`, porque allá no hay cuenta ni backend y el formulario pedía el
 * email de otra persona en una app que promete que nada del vault sale de la
 * máquina (critique del cascarón, 2026-09-19).
 *
 * El módulo existe para que los componentes compartidos —el explorador, la barra
 * superior, el menú contextual— no tengan que saber en cuál de las dos corren.
 */
export const HAY_COMPARTIR = true;
