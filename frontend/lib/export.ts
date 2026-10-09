import JSZip from "jszip";
import { api } from "@/lib/api";
import { getCachedNote } from "@/lib/idb";
import { renderMarkdown } from "@/lib/markdown";
import { renderMermaidIn, type TemaMermaid } from "@/lib/mermaid";
import { renderExcalidrawIn } from "@/lib/excalidraw";
import { buildPrintCss, type PdfPrintOpts } from "@/lib/printStyles";
import { useAuthStore } from "@/stores/authStore";
import { usePreferencesStore } from "@/stores/preferencesStore";
import { usePdfExportStore } from "@/stores/pdfExportStore";
import { useVaultStore } from "@/stores/vaultStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5279";
const EXCALIDRAW_RE = /!\[\[([0-9a-f-]+)\.excalidraw\]\]/gi;

/** Nombre de archivo seguro a partir del título de la nota. */
function safeName(titulo: string): string {
  return titulo.replace(/[\\/:*?"<>|]/g, "_").trim() || "nota";
}

/** Descarga un Blob en el cliente (HU-08 CA4). */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Contenido de una nota: backend primero, IndexedDB si no hay conexión (HU-08 CA5). */
export async function fetchNoteContent(notaId: string): Promise<string> {
  try {
    const data = await api<{ contenido: string }>(`/notas/${notaId}/contenido`, {
      token: useAuthStore.getState().accessToken,
    });
    return data.contenido;
  } catch {
    const cached = await getCachedNote(notaId);
    if (cached) return cached.content;
    throw new Error("No se pudo obtener el contenido de la nota.");
  }
}

/** Exporta la nota activa como `.md` crudo, 100% en cliente (HU-08). */
export async function exportNoteMd(notaId: string, titulo: string): Promise<void> {
  const contenido = await fetchNoteContent(notaId);
  downloadBlob(new Blob([contenido], { type: "text/markdown" }), `${safeName(titulo)}.md`);
}

/** Ruta de carpetas de una nota dentro del vault (sin el nombre del archivo). */
function notePath(carpetaId: string | null): string {
  if (!carpetaId) return "";
  const carpetas = useVaultStore.getState().carpetas;
  const byId = new Map(carpetas.map((c) => [c.id, c]));
  const parts: string[] = [];
  let current = byId.get(carpetaId);
  while (current) {
    parts.unshift(safeName(current.nombre));
    current = current.padreId ? byId.get(current.padreId) : undefined;
  }
  return parts.length ? `${parts.join("/")}/` : "";
}

/**
 * Exporta todo el vault como ZIP en el cliente (HU-09): preserva la estructura
 * de carpetas y agrega los diagramas referenciados en `adjuntos/`. La rama
 * servidor para vaults ≥ 200 MB queda diferida (docs/FUTURE_IMPLEMENTATIONS.md).
 */
export async function exportVaultZip(
  onProgress?: (done: number, total: number) => void,
): Promise<void> {
  const { notas, vaultId } = useVaultStore.getState();
  const vaultNombre = useAuthStore.getState().vaults.find((v) => v.id === vaultId)?.nombre ?? "vault";
  const token = useAuthStore.getState().accessToken;

  const zip = new JSZip();
  const adjuntos = new Set<string>();
  let done = 0;

  for (const nota of notas) {
    const contenido = await fetchNoteContent(nota.id);
    zip.file(`${notePath(nota.carpetaId)}${safeName(nota.titulo)}.md`, contenido);

    for (const match of contenido.matchAll(EXCALIDRAW_RE)) {
      adjuntos.add(`${nota.id}:${match[1]}`);
    }
    onProgress?.(++done, notas.length);
  }

  // Diagramas Excalidraw referenciados → adjuntos/ (HU-09 CA3)
  for (const ref of adjuntos) {
    const [notaId, diagId] = ref.split(":");
    try {
      const res = await fetch(`${API_URL}/notas/${notaId}/diagramas/${diagId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
      });
      if (res.ok) zip.file(`adjuntos/${diagId}.excalidraw`, await res.text());
    } catch {
      // adjunto inaccesible → se omite
    }
  }

  const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
  const fecha = new Date().toISOString().slice(0, 10);
  downloadBlob(blob, `vault-${safeName(vaultNombre)}-${fecha}.zip`);
}

/**
 * Renderiza la nota a HTML fuera de pantalla, incluyendo los SVG de Mermaid y
 * Excalidraw (HU-10 CA4), para enviarlo al backend tal cual se imprime.
 *
 * Mermaid (`DEF-142`): con «Fondo blanco» el documento se imprime con el tema
 * claro aunque la ventana esté en oscuro, así que los diagramas van con el tema
 * fijo de impresión (grises sobre blanco, legibles también en blanco y negro).
 * Sin «Fondo blanco» el PDF conserva el tema de la ventana, y Mermaid también.
 */
async function renderNoteHtml(notaId: string, temaMermaid: TemaMermaid): Promise<string> {
  const content = await fetchNoteContent(notaId);
  const container = document.createElement("div");
  container.className = "mic-preview";
  container.style.position = "fixed";
  container.style.left = "-99999px";
  container.style.top = "0";
  container.style.width = "800px";
  container.innerHTML = renderMarkdown(content);
  document.body.appendChild(container);
  try {
    await renderMermaidIn(container, temaMermaid);
    await renderExcalidrawIn(container, notaId);
    return container.innerHTML;
  } finally {
    container.remove();
  }
}

/** `url(...)` relativa: no `data:`, ni absoluta, ni de protocolo relativo, ni un `#id`. */
const URL_RELATIVA = /url\((['"]?)(?!data:|https?:|\/\/|#)([^'")]+)\1\)/g;

/**
 * Todo el CSS de la ventana, regla por regla (`DEF-116`). Una hoja de otro
 * origen no deja leer sus reglas y se saltea.
 *
 * El backend imprime la página en otro lugar, así que las `url(...)` relativas
 * —las fuentes, alguna imagen— se vuelven absolutas contra esta página; si no,
 * no las encontraría.
 */
function cssDeLaVentana(): string {
  const partes: string[] = [];
  for (const hoja of Array.from(document.styleSheets)) {
    let reglas: CSSRuleList;
    try {
      reglas = hoja.cssRules;
    } catch {
      // esperado: una hoja de otro origen no expone `cssRules`.
      continue;
    }
    for (const regla of Array.from(reglas)) partes.push(regla.cssText);
  }
  return partes
    .join("\n")
    .replace(URL_RELATIVA, (_m, q: string, ruta: string) => `url(${q}${new URL(ruta, location.href).href}${q})`);
}

/**
 * Las variables de las tipografías. Las define `next/font` en una clase del
 * `<html>`, que el documento del backend no tiene: sin esto, el PDF caería a
 * las fuentes por defecto.
 */
function variablesDeFuentes(): string {
  const estilo = getComputedStyle(document.documentElement);
  const decl: string[] = [];
  for (const prop of Array.from(estilo)) {
    if (prop.startsWith("--") && prop.includes("font")) {
      decl.push(`${prop}: ${estilo.getPropertyValue(prop)};`);
    }
  }
  return decl.length ? `html { ${decl.join(" ")} }` : "";
}

/** Exporta la nota como PDF con el tema aplicado, vía backend (HU-10). */
export async function exportNotePdf(
  notaId: string,
  titulo: string,
  pageSize: "A4" | "Letter",
  opts: PdfPrintOpts,
): Promise<void> {
  // Con fondo blanco se ignora el modo oscuro (blanco + negro); el estilo (fondo,
  // colores, callouts) viaja en el CSS que compone buildPrintCss (DEF-024).
  const { tema, modoOscuro } = usePreferencesStore.getState();
  const html = await renderNoteHtml(notaId, opts.fondoBlanco ? "imprimir" : "mycelium");
  const res = await fetch(`${API_URL}/notas/${notaId}/exportar-pdf`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(useAuthStore.getState().accessToken
        ? { Authorization: `Bearer ${useAuthStore.getState().accessToken}` }
        : {}),
    },
    body: JSON.stringify({
      pageSize,
      tema,
      modoOscuro: !opts.fondoBlanco && modoOscuro,
      html,
      // Con los estilos de Mycelium va el CSS REAL de la ventana (`DEF-116`), no
      // la copia reducida `PRINT_CSS`: así el PDF se ve como la vista de lectura.
      css: opts.estilosMycelium
        ? [cssDeLaVentana(), variablesDeFuentes(), buildPrintCss(opts, true)].join("\n")
        : buildPrintCss(opts),
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error((err as { error?: string })?.error ?? "No se pudo exportar el PDF.");
  }
  downloadBlob(await res.blob(), `${safeName(titulo)}.pdf`);
}

/**
 * Punto de entrada desde la UI (DEF-024): abre el diálogo de opciones de PDF para
 * la nota; la exportación real la dispara el diálogo con las opciones elegidas.
 */
export function exportNotePdfActive(notaId: string, titulo: string): void {
  usePdfExportStore.getState().abrir({ notaId, titulo });
}
