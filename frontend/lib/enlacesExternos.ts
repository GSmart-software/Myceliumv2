/**
 * Qué pasa al hacer clic en un enlace a algo que no es una nota (`FUN-S-20`).
 *
 * En web, un `[texto](https://…)` se abre en una **pestaña nueva** y Mycelium
 * se queda donde estaba. En la vista en vivo, además, antes no hacía nada: el
 * live preview oculta el `(url)` y no deja ningún `<a>` al que hacerle clic.
 *
 * > [!info] Acá `DEF-101` no es grave, y la solución es la misma igual
 * > En el escritorio, navegar la webview se llevaba la aplicación entera —el
 * > marco de ventana es propio, así que no quedaba barra de dirección ni botón
 * > de volver—. En una pestaña del navegador, navegar es lo normal y el botón
 * > de atrás vuelve. Aun así se abre en una pestaña nueva: Mycelium es una
 * > aplicación de una sola página y perder su estado por seguir un enlace de
 * > una nota es un incordio evitable.
 *
 * > [!important] Esto vive en UN solo sitio, y es lo que más importa
 * > Los clics en enlaces se atienden en cinco lugares distintos: la vista de
 * > lectura (`NoteEditor`), la vista en vivo (`livePreview`), el widget de
 * > tablas, el de propiedades y el canvas. Arreglar uno dejaría enlaces que se
 * > comportan distinto según la vista en la que esté el usuario.
 *
 * > OJO: la parte de decidir es **pura y sin imports**, para que
 * > `scripts/test-enlaces-externos.mjs` la pruebe sin navegador.
 */

/**
 * Los únicos esquemas que se le entregan al sistema.
 *
 * > [!danger] La lista es corta a propósito
 * > Una nota puede venir importada, escrita por otra persona o generada por una
 * > IA. Pasarle al sistema un `file://`, un `javascript:` o un protocolo que
 * > registró otra aplicación (`ms-msdt:`, `search-ms:`…) es abrirle una puerta
 * > a cualquiera que consiga que abras una nota. Si algo no está acá, no se
 * > abre: no se intenta y se avisa.
 */
export const ESQUEMAS_PERMITIDOS = ["http:", "https:", "mailto:"] as const;

/** ¿Este `href` apunta afuera de Mycelium, con un esquema que sabemos abrir? */
export function esEnlaceExterno(href: string | null | undefined): boolean {
  return destinoExterno(href) !== null;
}

/**
 * El destino externo de un `href`, ya normalizado, o `null` si no lo es.
 *
 * Devuelve `null` —o sea, «esto no es cosa mía»— para:
 * - los enlaces internos de Mycelium (`#wikilink:`, `#tag:`, `#excalidraw`…);
 * - las anclas dentro de la misma nota (`#un-titulo`);
 * - las rutas relativas (`otra-nota.md`, `./imagen.png`), que son del vault;
 * - cualquier esquema que no esté en `ESQUEMAS_PERMITIDOS`.
 */
export function destinoExterno(href: string | null | undefined): string | null {
  if (typeof href !== "string") return null;
  const limpio = href.trim();
  if (limpio.length === 0) return null;
  // Un ancla o un enlace interno de la app: lo atiende quien lo puso.
  if (limpio.startsWith("#")) return null;

  // `URL` sin base: si no lanza, es absoluta. Una ruta relativa lanza, y es
  // justo lo que queremos descartar sin tener que adivinar su forma.
  let url: URL;
  try {
    url = new URL(limpio);
  } catch {
    return null;
  }
  if (!(ESQUEMAS_PERMITIDOS as readonly string[]).includes(url.protocol)) return null;
  return url.href;
}

/**
 * Abre `href` en una pestaña nueva del navegador.
 *
 * `noopener noreferrer` no es adorno: sin `noopener`, la página que se abre
 * recibe un `window.opener` con el que puede redirigir la pestaña de Mycelium
 * («tabnabbing»); `noreferrer` además le oculta de dónde vino.
 *
 * No lanza: si el esquema no está permitido o el navegador bloquea la ventana,
 * lo deja anotado en la consola y sigue. Un enlace que no abre es un incordio;
 * una excepción suelta en un manejador de clic puede dejar la vista a medio
 * pintar.
 */
export function abrirEnNavegador(href: string): boolean {
  const destino = destinoExterno(href);
  if (destino === null) {
    console.warn(`[enlaces] no se abre un destino con esquema no permitido: ${href}`);
    return false;
  }
  try {
    const ventana = window.open(destino, "_blank", "noopener,noreferrer");
    // Un bloqueador de ventanas emergentes devuelve `null`. Se avisa en vez de
    // fallar en silencio: el clic no hizo nada y el usuario no sabe por qué.
    if (ventana === null) {
      console.warn(`[enlaces] el navegador bloqueó la pestaña de ${destino}`);
      return false;
    }
    return true;
  } catch (e) {
    console.warn(`[enlaces] no se pudo abrir ${destino}:`, e);
    return false;
  }
}

/**
 * Atiende un clic que podría ser un enlace externo.
 *
 * Devuelve `true` si lo tomó (y entonces quien llama no debe hacer nada más).
 * **Siempre** hace `preventDefault()` cuando toma el enlace: sin eso la pestaña
 * actual navega igual y se pierde el estado de la aplicación, además de abrirse
 * la nueva.
 *
 * `objetivo` es el elemento del clic; se busca el `<a>` más cercano. Para las
 * vistas que no usan `<a>` —la edición en vivo pinta el enlace como texto— se
 * puede pasar el `href` a mano con `hrefExplicito`.
 */
export function manejarClicDeEnlace(
  evento: { preventDefault: () => void; target: EventTarget | null },
  hrefExplicito?: string | null,
): boolean {
  let href = hrefExplicito ?? null;
  if (href === null) {
    const elemento = evento.target as HTMLElement | null;
    href = elemento?.closest?.("a")?.getAttribute("href") ?? null;
  }
  if (!esEnlaceExterno(href)) return false;
  // El orden importa: cortar la navegación ANTES de abrir nada.
  evento.preventDefault();
  abrirEnNavegador(href as string);
  return true;
}
