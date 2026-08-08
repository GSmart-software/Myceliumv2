/**
 * Confirmación del usuario, con la MISMA firma que en la versión de escritorio
 * para que los componentes compartidos no tengan que saber dónde corren.
 *
 * Acá alcanza con el `confirm` del navegador, que es síncrono y devuelve un
 * booleano de verdad. En desktop no: el WebView de Tauri intercepta
 * `window.confirm` y devuelve una promesa —siempre "truthy"— así que allá hay que
 * usar el diálogo del plugin. De ahí que la función sea asíncrona en las dos: es
 * la forma que impone el escritorio, y la web se adapta para que el código de
 * arriba sea idéntico. Ver `DEF-051`.
 */
export async function confirmar(mensaje: string, _titulo = "Mycelium"): Promise<boolean> {
  return window.confirm(mensaje);
}
