import type { NotaTipo } from "@/stores/vaultStore";

/**
 * Qué extensión le corresponde a cada tipo de documento, **sin punto**.
 *
 * Vive acá por el mismo motivo que los íconos viven en `lib/iconosDeTipo`
 * (`FUN-S-11`): la pregunta «qué extensión tiene este tipo» no puede tener dos
 * respuestas en dos archivos. Antes había dos copias —`EXTENSION_POR_TIPO` en
 * el explorador y la lista de extensiones que `resolveWikilink` sabe quitar— y
 * la segunda decía solo `excalidraw|md`, así que `![[Lienzo.canvas]]` y
 * `![[Tareas.base]]` **no resolvían a nada** y el embed se dibujaba como «no
 * existe» con el archivo ahí al lado.
 *
 * > [!important] El `Record<NotaTipo, …>` es la parte que importa
 * > Es lo que hace que agregar un tipo **no compile** hasta contestar acá. Un
 * > `Record<string, …>` habría dejado pasar el tipo nuevo en silencio, que es
 * > exactamente como se coló el defecto.
 */
export const EXTENSION_POR_TIPO: Record<NotaTipo, string> = {
  markdown: "md",
  excalidraw: "excalidraw",
  base: "base",
  canvas: "canvas",
};

/**
 * Todas las extensiones de nota, sin punto.
 *
 * La usan la resolución de wikilinks —para quitar la extensión de
 * `![[archivo.ext]]`, ya que el título de una nota no la incluye— y cualquiera
 * que tenga que reconocer «esto nombra a un archivo del vault».
 */
export const EXTENSIONES_DE_NOTA: readonly string[] = Object.values(EXTENSION_POR_TIPO);

/**
 * Quita la extensión de nota del final de un nombre, si la tiene.
 *
 * `"Lienzo.canvas"` → `"Lienzo"`; `"notas.de.ayer"` → `"notas.de.ayer"`
 * (`de.ayer` no es una extensión de nota, y recortarla rompería el nombre).
 */
export function sinExtensionDeNota(nombre: string): string {
  const i = nombre.lastIndexOf(".");
  if (i <= 0) return nombre;
  const ext = nombre.slice(i + 1).toLowerCase();
  return EXTENSIONES_DE_NOTA.includes(ext) ? nombre.slice(0, i) : nombre;
}
