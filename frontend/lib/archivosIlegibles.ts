/**
 * ¿Se puede leer este dibujo? (`DEF-119`)
 *
 * Un `.excalidraw` que no se podía leer —JSON mal formado, típicamente porque
 * alguien lo escribió a mano con un error de sintaxis— se abría como si
 * estuviera **vacío**, y lo primero que se hiciera encima se guardaba sobre el
 * archivo: el original se perdía sin aviso. La causa era que la vista trataba
 * «no lo entiendo» igual que «no tiene nada», porque para un archivo recién
 * creado (0 bytes) las dos cosas daban lo mismo.
 *
 * Acá se separan los tres casos, y la vista hace algo distinto con cada uno:
 *
 * - `vacio`: el archivo no tiene nada (recién creado). Es un dibujo en blanco
 *   **válido**: se abre el editor y se puede dibujar.
 * - `legible`: se abre el editor con lo que hay.
 * - `ilegible`: **no** se abre el editor —nada que se dibuje puede pisar el
 *   original—; se avisa con el `motivo` y se espera a que se corrija.
 *
 * Puro y sin imports, para que `scripts/test-archivos-ilegibles.mjs` lo pruebe sin
 * navegador.
 *
 * > [!info] En web solo Excalidraw
 * > En desktop este módulo también diagnostica los `.drawio`; draw.io es
 * > solo-desktop, así que esa mitad no se reflejó.
 */

export type LecturaArchivo =
  | { estado: "vacio" }
  | { estado: "legible" }
  | { estado: "ilegible"; motivo: string };

// ── Excalidraw ────────────────────────────────────────────────────────────────

/**
 * Tipos de elemento que `restoreElements` de Excalidraw 0.18 sabe reconstruir.
 * Un elemento de otro tipo **no rompe** la carga: se descarta en silencio, y el
 * próximo guardado lo borraría del archivo. Por eso cuenta como ilegible.
 * `selection` también se descarta, pero es un resto legítimo del propio editor;
 * `draw` es el nombre viejo de `line` y se migra.
 */
const TIPOS_EXCALIDRAW = new Set([
  "rectangle",
  "ellipse",
  "diamond",
  "arrow",
  "line",
  "draw",
  "text",
  "freedraw",
  "image",
  "frame",
  "magicframe",
  "embeddable",
  "iframe",
  "selection",
]);

/**
 * Diagnóstico de la **forma** de un `.excalidraw`: JSON válido, un objeto con la
 * lista `elements`, y cada elemento un objeto con un `type` que Excalidraw
 * conoce.
 *
 * No alcanza por sí solo: `restoreElements` todavía puede tirar con algo que
 * tiene la forma correcta (una flecha sin `points`, por ejemplo). Ese segundo
 * filtro lo hace la vista, que es la que tiene la librería cargada; ver
 * `motivoDeExcepcion`.
 */
export function diagnosticarExcalidraw(contenido: string): LecturaArchivo {
  if (contenido.trim() === "") return { estado: "vacio" };
  let raiz: unknown;
  try {
    raiz = JSON.parse(contenido);
  } catch (e) {
    return { estado: "ilegible", motivo: `No es JSON válido: ${motivoDeExcepcion(e)}` };
  }
  if (typeof raiz !== "object" || raiz === null || Array.isArray(raiz)) {
    return {
      estado: "ilegible",
      motivo: "No es un dibujo de Excalidraw: se esperaba un objeto con la lista `elements`.",
    };
  }
  const elementos = (raiz as { elements?: unknown }).elements;
  if (!Array.isArray(elementos)) {
    return {
      estado: "ilegible",
      motivo:
        elementos === undefined
          ? "Falta la lista `elements`: no es un dibujo de Excalidraw."
          : "`elements` no es una lista.",
    };
  }
  for (let i = 0; i < elementos.length; i++) {
    const e = elementos[i] as { type?: unknown } | null;
    if (typeof e !== "object" || e === null || Array.isArray(e)) {
      return { estado: "ilegible", motivo: `El elemento ${i + 1} no es un objeto.` };
    }
    if (typeof e.type !== "string") {
      return { estado: "ilegible", motivo: `El elemento ${i + 1} no tiene \`type\`.` };
    }
    if (!TIPOS_EXCALIDRAW.has(e.type)) {
      return {
        estado: "ilegible",
        motivo: `El elemento ${i + 1} es de un tipo que Excalidraw no conoce («${e.type}»): se perdería al guardar.`,
      };
    }
  }
  return { estado: "legible" };
}

// ── Común ─────────────────────────────────────────────────────────────────────

/** El mensaje de una excepción, para mostrarlo en el aviso. */
export function motivoDeExcepcion(e: unknown): string {
  const texto = e instanceof Error ? e.message : String(e);
  // Los mensajes de algunos motores traen saltos de línea y
  // espacios de relleno: en el aviso van en una línea.
  return texto.replace(/\s+/g, " ").trim() || "error desconocido";
}
