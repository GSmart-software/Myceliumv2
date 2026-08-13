/**
 * Traducción entre el **id** de una nota y su **ruta** dentro del vault.
 *
 * Existe porque el formato JSON Canvas guarda `"file": "docs/BACKLOG.md"` —una
 * ruta, que es lo que hace que el archivo sea legible fuera de Mycelium— mientras
 * que la app trabaja con ids. En el **escritorio** los dos coinciden y este
 * módulo es la identidad; acá **no**, y por eso diverge entre ramas (igual que
 * `lib/confirmar.ts`).
 *
 * > [!important] No es un detalle interno: es interoperabilidad
 * > El id de una nota es un UUID y no dice nada de dónde está. Si un canvas
 * > guardara el id, escribiría `"file": "3fa85f64-…"` y el archivo dejaría de
 * > abrirse en Obsidian — que es justo lo que motivó adoptar el formato.
 *
 * Es la tercera vez que aparece la misma divergencia, tras las Esporas y el
 * endpoint de las bases: acá los ids no son rutas, y hay que reconstruirlas
 * subiendo por las carpetas.
 */
import { useVaultStore } from "@/stores/vaultStore";

/** Ruta de una carpeta, componiendo los nombres desde la raíz. */
function rutaDeCarpeta(carpetaId: string | null): string {
  const carpetas = useVaultStore.getState().carpetas;
  const partes: string[] = [];
  let actual = carpetaId;
  // El tope corta un ciclo si el árbol viniera corrupto: mejor una ruta truncada
  // que un bucle infinito al dibujar un canvas.
  for (let i = 0; actual !== null && i < 64; i++) {
    const c = carpetas.find((x) => x.id === actual);
    if (c === undefined) break;
    partes.unshift(c.nombre);
    actual = c.padreId;
  }
  return partes.join("/");
}

/** Ruta relativa de una nota, con su extensión, tal como la espera el formato. */
export function rutaDeNota(notaId: string): string {
  const nota = useVaultStore.getState().notas.find((n) => n.id === notaId);
  if (nota === undefined) return notaId;
  const ext =
    nota.tipo === "excalidraw"
      ? ".excalidraw"
      : nota.tipo === "base"
        ? ".base"
        : nota.tipo === "canvas"
          ? ".canvas"
          : ".md";
  const carpeta = rutaDeCarpeta(nota.carpetaId);
  const nombre = `${nota.titulo}${ext}`;
  return carpeta === "" ? nombre : `${carpeta}/${nombre}`;
}

/**
 * Id de la nota que vive en esa ruta, o `null` si no existe ninguna. La
 * extensión es opcional: un canvas escrito por Obsidian puede traer la ruta sin
 * ella.
 */
export function notaDeRuta(ruta: string, notas: { id: string }[]): string | null {
  const buscada = ruta.replace(/\.(md|canvas|base|excalidraw)$/i, "").toLowerCase();
  for (const n of notas) {
    const propia = rutaDeNota(n.id).replace(/\.(md|canvas|base|excalidraw)$/i, "");
    if (propia.toLowerCase() === buscada) return n.id;
  }
  return null;
}
