import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "@/lib/api";
import type { CambioDeRuta } from "@/lib/enlaces";
import { EVENTO_RECARGA } from "@/lib/eventos";
import { EXTENSION_POR_TIPO } from "@/lib/extensionesDeTipo";
import {
  coincidencias,
  involucradas,
  planHomonimos,
  repararTexto,
  rutaDeCarpeta,
  textoAviso,
  trasTraslados,
  type NotaRuta,
  type Traslado,
  type Vault,
} from "@/lib/homonimos";
import { avisar } from "@/stores/avisosStore";
import { useAuthStore } from "@/stores/authStore";
import { useGraphStore } from "@/stores/graphStore";
import { refreshAllLiveViews } from "@/lib/editor/livePreview";

/**
 * Marca el grafo como desactualizado y redispara el live preview tras un cambio
 * que altera nodos/enlaces (también afecta el feedback de wikilinks rotos).
 */
const markGraphStale = () => {
  useGraphStore.getState().markStale();
  refreshAllLiveViews();
};

export type TreeCarpeta = { id: string; padreId: string | null; nombre: string };
export type NotaTipo = "markdown" | "excalidraw" | "base" | "canvas";
export type TreeNota = {
  id: string;
  carpetaId: string | null;
  titulo: string;
  tipo: NotaTipo;
  actualizadoEn: string;
};
export type PapeleraItem = {
  notaId: string;
  titulo: string;
  rutaOriginal: string;
  eliminadoEn: string;
};

type RawCarpeta = { id: string; padre_id: string | null; nombre: string };
type RawNota = {
  id: string;
  carpeta_id: string | null;
  titulo: string;
  tipo?: string;
  actualizado_en: string;
};
type RawPapeleraItem = {
  nota_id: string;
  titulo: string;
  ruta_original: string;
  eliminado_en: string;
};

type LastMove =
  | { type: "nota"; id: string; prevParentId: string | null }
  | { type: "carpeta"; id: string; prevParentId: string | null };

type VaultState = {
  vaultId: string | null;
  carpetas: TreeCarpeta[];
  notas: TreeNota[];
  papelera: PapeleraItem[];
  /** Ids de carpetas compartidas (con membresías) para marcarlas en el árbol (HU-35 CA5). */
  sharedCarpetaIds: string[];
  /** Estado expandido/colapsado por carpeta — persiste en localStorage (HU-22 CA5). */
  expanded: Record<string, boolean>;
  /** Carpeta activa: destino de "Nueva nota"/importaciones (HU-23 CA1). */
  activeFolderId: string | null;
  /** Último movimiento, para deshacer con Ctrl+Z (HU-24 CA7). */
  lastMove: LastMove | null;
  loadTree: (vaultId: string) => Promise<void>;
  loadPapelera: () => Promise<void>;
  createCarpeta: (nombre: string, padreId: string | null) => Promise<void>;
  renameCarpeta: (id: string, nombre: string) => Promise<void>;
  deleteCarpeta: (id: string) => Promise<void>;
  moveCarpeta: (id: string, destinoId: string | null) => Promise<void>;
  /** `titulo` solo lo usan las Esporas (`FUN-M-03`): la nota nueva se llama como
   *  la plantilla. Sin él, el nombre por defecto de siempre. */
  createNota: (carpetaId: string | null, tipo?: NotaTipo, titulo?: string) => Promise<string>;
  renameNota: (id: string, titulo: string) => Promise<void>;
  deleteNota: (id: string) => Promise<void>;
  duplicateNota: (id: string) => Promise<void>;
  moveNota: (id: string, destinoId: string | null) => Promise<void>;
  restoreNota: (id: string) => Promise<void>;
  deleteNotaForever: (id: string) => Promise<void>;
  /**
   * Recupera varias de la papelera de una vez (`FUN-S-04`). Sigue con las demás si
   * una falla, recarga papelera y árbol **una sola vez** al final, y devuelve los
   * ids que no se pudieron recuperar.
   */
  restoreNotas: (ids: readonly string[]) => Promise<string[]>;
  /** Elimina varias definitivamente (`FUN-S-04`), con el mismo criterio. */
  deleteNotasForever: (ids: readonly string[]) => Promise<string[]>;
  undoLastMove: () => Promise<void>;
  toggleExpanded: (id: string) => void;
  /** Despliega estas carpetas (sin plegar ninguna): «revelar» un archivo (`DEF-150 a`). */
  expandirCarpetas: (ids: Iterable<string>) => void;
  setActiveFolder: (id: string | null) => void;
  /** Carpetas descendientes de una carpeta (incluida ella) — para validar D&D. */
  subtreeIds: (id: string) => Set<string>;
};

const token = () => useAuthStore.getState().accessToken;

// Guard de generación para loadTree: si varias recargas se solapan (red lenta),
// solo la última iniciada puede escribir el estado. Evita que una recarga vieja
// (que leyó antes de un move) resuelva última y revierta el árbol.
let treeSeq = 0;

// Movimientos recientes (id de nota/carpeta → carpeta/padre destino) para que una
// lectura del árbol que aún NO refleja el cambio (réplica/caché del backend que
// va por detrás del UPDATE) no revierta visualmente un archivo recién movido.
// Cada entrada se confirma y limpia en cuanto el servidor refleja el destino;
// expira por seguridad pasado el período (si el servidor nunca confirma).
const pendingMoves = new Map<string, { parent: string | null; ts: number }>();
const MOVE_GRACE_MS = 60_000;


// ── Reparación de enlaces (`FUN-M-08`, `DEF-134`) ───────────────────────────
//
// Renombrar, crear, duplicar o mover puede cambiar a dónde lleva un
// `[[enlace]]` que ya existía: el que iba a la renombrada se rompe, y el que iba
// a una homónima pasa a llevar a la nota tocada si ésta queda más cerca de la
// raíz (`DEF-134`). La regla es la de `lib/homonimos.ts`: antes de la operación
// se anota quién enlaza a lo involucrado, y después se reescribe con su ruta el
// enlace que cambiaría de destino.
//
// Va por `api()`; **solo toca las notas que ya enlazaban** —las que devuelve
// `conexiones`—, no el vault entero.

/** Qué pasó con los enlaces entrantes. */
type Reparacion = {
  /** Notas reescritas (o, al simular, las que habría que reescribir). */
  reescritas: string[];
  /** Las que enlazaban pero no se pudieron leer o escribir: quedan con el enlace viejo. */
  fallidas: string[];
  /** De `reescritas`, las que recibieron al menos un enlace con ruta (`DEF-134`). */
  conRuta: string[];
};

const SIN_REPARACION: Reparacion = { reescritas: [], fallidas: [], conRuta: [] };

/**
 * Lo que hay que leer **antes** de una operación: el vault de antes, las notas
 * involucradas y quién las enlaza. Después de la operación el backend ya
 * re-resolvió los títulos y no sabría decir a dónde iba cada enlace.
 */
type Previa = { antes: Vault; involucradas: string[]; entrantes: Set<string> };

/** El vault del árbol como lo ve la reparación (`DEF-134`). */
function vaultDe(notas: readonly TreeNota[], carpetas: readonly TreeCarpeta[]): Vault {
  return { notas: [...notas], carpetas: [...carpetas] };
}

/**
 * `trasladadas`: los ids que cambian de título o de carpeta (vacío al crear).
 * `titulos`: los títulos con que quedan las notas tocadas, para sumar a sus
 * homónimas.
 */
async function leerPrevia(
  antes: Vault,
  trasladadas: readonly string[],
  titulos: readonly string[],
): Promise<Previa> {
  const inv = involucradas(antes.notas, trasladadas, titulos);
  const entrantes = new Set<string>();
  for (const id of inv) {
    try {
      const con = await api<{ retro: { id: string }[] }>(`/notas/${encodeURIComponent(id)}/conexiones`, {
        token: token(),
      });
      for (const r of con.retro) entrantes.add(r.id);
    } catch {
      // Sin retroenlaces no se puede reparar, pero la operación en sí no depende
      // de esto: se sigue igual.
    }
  }
  return { antes, involucradas: inv, entrantes };
}

/**
 * Repara los enlaces después de la operación contra el vault `despues`.
 * `traslados` lleva el cambio de ruta de lo renombrado o movido, para reparar
 * también los enlaces con pista de carpeta (`[[Carpeta/Nota]]`).
 *
 * Si una nota falla se sigue con las demás —es preferible reparar nueve de diez
 * enlaces que abortar y dejar los diez rotos— y queda en `fallidas`.
 */
async function repararTrasOperacion(
  previa: Previa,
  despues: Vault,
  traslados: readonly Traslado[],
): Promise<Reparacion> {
  if (previa.entrantes.size === 0) return SIN_REPARACION;
  const plan = planHomonimos(previa.antes, despues, previa.involucradas, traslados);
  const reescritas: string[] = [];
  const fallidas: string[] = [];
  const conRuta: string[] = [];
  for (const id of previa.entrantes) {
    try {
      const actual = await api<{ contenido: string | null }>(`/notas/${encodeURIComponent(id)}/contenido`, {
        token: token(),
      });
      const r = repararTexto(actual.contenido ?? "", plan);
      if (r.cambios === 0) continue;
      await api(`/notas/${encodeURIComponent(id)}/contenido`, {
        method: "PUT",
        token: token(),
        body: { contenido: r.texto },
      });
      reescritas.push(id);
      if (r.conRuta > 0) conRuta.push(id);
    } catch {
      fallidas.push(id);
    }
  }
  if (reescritas.length > 0) window.dispatchEvent(new Event(EVENTO_RECARGA));
  return { reescritas, fallidas, conRuta };
}

/** El cambio de ruta de una nota que pasa de `antes` a `despues`. */
function cambioDe(nota: NotaRuta, titulo: string, antes: Vault, despues: Vault, carpetaNueva: string | null): CambioDeRuta {
  return {
    tituloViejo: nota.titulo,
    tituloNuevo: titulo,
    carpetaVieja: rutaDeCarpeta(nota.carpetaId, antes.carpetas),
    carpetaNueva: rutaDeCarpeta(carpetaNueva, despues.carpetas),
    extension: `.${EXTENSION_POR_TIPO[nota.tipo as NotaTipo] ?? "md"}`,
  };
}

/**
 * Avisa que una operación dejó notas con el mismo título que otras (`DEF-134`)
 * y cuántas notas se reescribieron con la ruta para que sus enlaces siguieran
 * llevando a la misma nota. `siempre`: la operación **creó** la coincidencia
 * (renombrar, crear, duplicar) y se avisa aunque no se haya reescrito nada; si
 * solo la cambió de lugar (mover), se avisa solo si hubo que reescribir.
 */
function avisarCoincidencias(despues: Vault, tocadas: readonly string[], r: Reparacion, siempre: boolean): void {
  if (!siempre && r.conRuta.length === 0) return;
  const texto = textoAviso(coincidencias(despues, tocadas), r.conRuta.length);
  if (texto !== null) avisar(texto);
}

/**
 * Después de crear o duplicar: los enlaces que iban a una homónima y ahora
 * resolverían a la nota nueva se escriben con la ruta de la de antes, y se avisa
 * la coincidencia (`DEF-134`).
 */
async function repararNueva(previa: Previa, nueva: TreeNota): Promise<void> {
  const despues: Vault = { notas: [...previa.antes.notas, nueva], carpetas: previa.antes.carpetas };
  const r = await repararTrasOperacion(previa, despues, []);
  // «Sin título» en otra carpeta no es una coincidencia que valga la pena
  // anunciar cada vez que se crea una nota: solo si hubo que reescribir algo.
  const porDefecto = TITULO_POR_DEFECTO[nueva.tipo];
  const sufijo = nueva.titulo.startsWith(`${porDefecto} `) ? nueva.titulo.slice(porDefecto.length + 1) : null;
  const esPorDefecto = nueva.titulo === porDefecto || (sufijo !== null && /^\d+$/.test(sufijo));
  avisarCoincidencias(despues, [nueva.id], r, !esPorDefecto);
}

/**
 * El título que el backend le va a dar a una nota nueva o a una copia en
 * `carpetaId`: el pedido si está libre en esa carpeta, y si no `Base N` con el
 * primer `N` libre desde 2 (`EnsureUniqueTituloAsync` de `VaultEndpoints.cs`).
 * Hace falta saberlo ANTES de crearla para leer los retroenlaces de sus
 * homónimas (`DEF-134`).
 */
function tituloUnicoEnCarpeta(notas: readonly NotaRuta[], carpetaId: string | null, titulo: string): string {
  const existentes = new Set(notas.filter((n) => n.carpetaId === carpetaId).map((n) => n.titulo.toLowerCase()));
  if (!existentes.has(titulo.toLowerCase())) return titulo;
  const partes = titulo.split(" ");
  const base = partes.length > 1 && /^-?\d+$/.test(partes[partes.length - 1]) ? partes.slice(0, -1).join(" ") : titulo;
  let n = 2;
  while (existentes.has(`${base} ${n}`.toLowerCase())) n++;
  return `${base} ${n}`;
}

/** Título de una nota nueva sin nombre, por tipo. */
const TITULO_POR_DEFECTO: Record<NotaTipo, string> = {
  markdown: "Sin título",
  excalidraw: "Dibujo sin título",
  base: "Base sin título",
  canvas: "Lienzo sin título",
};

/** Una carpeta y todas sus descendientes. */
function subarbol(carpetas: readonly { id: string; padreId: string | null }[], id: string): Set<string> {
  const result = new Set<string>([id]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const carpeta of carpetas) {
      if (carpeta.padreId !== null && result.has(carpeta.padreId) && !result.has(carpeta.id)) {
        result.add(carpeta.id);
        changed = true;
      }
    }
  }
  return result;
}

/** Las notas que cuelgan (a cualquier profundidad) de las carpetas `ids`. */
function notasBajo(notas: readonly NotaRuta[], ids: ReadonlySet<string>): NotaRuta[] {
  return notas.filter((n) => n.carpetaId !== null && ids.has(n.carpetaId));
}

/**
 * Lo que cambia para las notas de una carpeta que se mueve o se renombra: su
 * título y su carpeta (el id) siguen iguales, pero la ruta no.
 */
function trasladosDeCarpeta(afectadas: readonly NotaRuta[], antes: Vault, despues: Vault): Traslado[] {
  return afectadas.map((n) => ({
    id: n.id,
    titulo: n.titulo,
    carpetaId: n.carpetaId,
    cambio: cambioDe(n, n.titulo, antes, despues, n.carpetaId),
  }));
}

/**
 * Mover cambia la profundidad, y con ella cuál de dos homónimas gana un
 * `[[Título]]` sin ruta; además rompe los enlaces con pista de carpeta. Los
 * retroenlaces se leen ANTES: después ya no resuelven (`DEF-134`). Lo comparten
 * mover y deshacer el último movimiento (Ctrl+Z).
 */
async function previaDeMoverCarpeta(antes: Vault, id: string): Promise<{ previa: Previa; afectadas: NotaRuta[] }> {
  const afectadas = notasBajo(antes.notas, subarbol(antes.carpetas, id));
  const previa = await leerPrevia(
    antes,
    afectadas.map((n) => n.id),
    afectadas.map((n) => n.titulo),
  );
  return { previa, afectadas };
}

async function repararMoverCarpeta(
  previa: Previa,
  afectadas: readonly NotaRuta[],
  id: string,
  destinoId: string | null,
): Promise<void> {
  const despues: Vault = {
    notas: previa.antes.notas,
    carpetas: previa.antes.carpetas.map((c) => (c.id === id ? { ...c, padreId: destinoId } : c)),
  };
  const r = await repararTrasOperacion(previa, despues, trasladosDeCarpeta(afectadas, previa.antes, despues));
  avisarCoincidencias(despues, afectadas.map((n) => n.id), r, false);
}

async function previaDeMoverNota(antes: Vault, id: string): Promise<Previa> {
  const nota = antes.notas.find((n) => n.id === id);
  return leerPrevia(antes, [id], nota ? [nota.titulo] : []);
}

async function repararMoverNota(previa: Previa, id: string, destinoId: string | null): Promise<void> {
  const nota = previa.antes.notas.find((n) => n.id === id);
  if (!nota) return;
  const traslado: Traslado = { id, titulo: nota.titulo, carpetaId: destinoId, cambio: undefined };
  const despues: Vault = { notas: trasTraslados(previa.antes.notas, [traslado]), carpetas: previa.antes.carpetas };
  traslado.cambio = cambioDe(nota, nota.titulo, previa.antes, despues, destinoId);
  const r = await repararTrasOperacion(previa, despues, [traslado]);
  avisarCoincidencias(despues, [id], r, false);
}

export const useVaultStore = create<VaultState>()(
  persist(
    (set, get) => ({
      vaultId: null,
      carpetas: [],
      notas: [],
      papelera: [],
      sharedCarpetaIds: [],
      expanded: {},
      activeFolderId: null,
      lastMove: null,

      async loadTree(vaultId) {
        const seq = ++treeSeq;
        const data = await api<{ carpetas: RawCarpeta[]; notas: RawNota[] }>(
          `/vaults/${vaultId}/tree`,
          { token: token() },
        );
        // Si ya se inició una recarga más nueva, descartar este resultado viejo.
        if (seq !== treeSeq) return;

        const carpetas: TreeCarpeta[] = data.carpetas.map((c) => ({
          id: c.id,
          padreId: c.padre_id,
          nombre: c.nombre,
        }));
        const notas: TreeNota[] = data.notas.map((n) => ({
          id: n.id,
          carpetaId: n.carpeta_id,
          titulo: n.titulo,
          tipo:
            n.tipo === "excalidraw" || n.tipo === "base" || n.tipo === "canvas"
              ? n.tipo
              : "markdown",
          actualizadoEn: n.actualizado_en,
        }));

        // Reconciliar con los movimientos recientes: si el árbol recibido todavía
        // no refleja un move (lectura atrasada del backend), mantener la posición
        // local; si ya lo refleja, dar el move por confirmado y olvidarlo.
        const now = Date.now();
        for (const [id, m] of pendingMoves) {
          if (now - m.ts > MOVE_GRACE_MS) pendingMoves.delete(id);
        }
        for (const c of carpetas) {
          const m = pendingMoves.get(c.id);
          if (!m) continue;
          if (c.padreId === m.parent) pendingMoves.delete(c.id);
          else c.padreId = m.parent;
        }
        for (const n of notas) {
          const m = pendingMoves.get(n.id);
          if (!m) continue;
          if (n.carpetaId === m.parent) pendingMoves.delete(n.id);
          else n.carpetaId = m.parent;
        }

        set({ vaultId, carpetas, notas });
        // Un editor montado antes de que llegara el árbol —las pestañas que se
        // restauran al abrir la app— decoró sus [[enlaces]] contra una lista vacía
        // y los marcó todos como inexistentes; nada lo volvía a evaluar (`DEF-122`).
        refreshAllLiveViews();
        // Marcador de carpetas compartidas para el árbol general (HU-35 CA5)
        try {
          const shared = await api<{ ids: string[] }>(
            `/vaults/${vaultId}/carpetas-compartidas`,
            { token: token() },
          );
          if (seq !== treeSeq) return;
          set({ sharedCarpetaIds: shared.ids });
        } catch {
          if (seq === treeSeq) set({ sharedCarpetaIds: [] });
        }
      },

      async loadPapelera() {
        const { vaultId } = get();
        if (!vaultId) return;
        const data = await api<{ items: RawPapeleraItem[] }>(
          `/vaults/${vaultId}/papelera`,
          { token: token() },
        );
        set({
          papelera: data.items.map((i) => ({
            notaId: i.nota_id,
            titulo: i.titulo,
            rutaOriginal: i.ruta_original,
            eliminadoEn: i.eliminado_en,
          })),
        });
      },

      async createCarpeta(nombre, padreId) {
        const { vaultId } = get();
        if (!vaultId) return;
        await api(`/vaults/${vaultId}/carpetas`, {
          method: "POST",
          token: token(),
          body: { nombre, padreId },
        });
        if (padreId) set((s) => ({ expanded: { ...s.expanded, [padreId]: true } }));
        await get().loadTree(vaultId);
      },

      async renameCarpeta(id, nombre) {
        // Los enlaces con pista de carpeta (`[[Vieja/Nota]]`) dejan de resolver:
        // se leen los retroenlaces de las notas de adentro ANTES (`DEF-134`).
        const { notas, carpetas } = get();
        const antes = vaultDe(notas, carpetas);
        const afectadas = notasBajo(notas, get().subtreeIds(id));
        const previa = await leerPrevia(
          antes,
          afectadas.map((n) => n.id),
          afectadas.map((n) => n.titulo),
        );
        await api(`/carpetas/${id}`, { method: "PATCH", token: token(), body: { nombre } });
        const despues = vaultDe(
          notas,
          carpetas.map((c) => (c.id === id ? { ...c, nombre } : c)),
        );
        const r = await repararTrasOperacion(previa, despues, trasladosDeCarpeta(afectadas, antes, despues));
        avisarCoincidencias(despues, afectadas.map((n) => n.id), r, false);
        await get().loadTree(get().vaultId!);
        refreshAllLiveViews(); // la ruta cambió: refrescar wikilinks por ruta
      },

      async deleteCarpeta(id) {
        await api(`/carpetas/${id}`, { method: "DELETE", token: token() });
        await get().loadTree(get().vaultId!);
      },

      async moveCarpeta(id, destinoId) {
        const prev = get().carpetas.find((c) => c.id === id)?.padreId ?? null;
        // DEF-134: el vault y los retroenlaces se leen ANTES de mover.
        const antes = vaultDe(get().notas, get().carpetas);
        // Optimista: mover la carpeta en el árbol al instante (no esperar la red).
        set((s) => ({
          carpetas: s.carpetas.map((c) => (c.id === id ? { ...c, padreId: destinoId } : c)),
          lastMove: { type: "carpeta", id, prevParentId: prev },
          expanded: destinoId ? { ...s.expanded, [destinoId]: true } : s.expanded,
        }));
        pendingMoves.set(id, { parent: destinoId, ts: Date.now() });
        let previa: Previa;
        let afectadas: NotaRuta[];
        try {
          ({ previa, afectadas } = await previaDeMoverCarpeta(antes, id));
          await api(`/carpetas/${id}/mover`, {
            method: "POST",
            token: token(),
            body: { destinoId },
          });
        } catch (e) {
          // Revertir si el backend rechazó el movimiento, y decir por qué: antes
          // la carpeta volvía a su lugar sin explicación (`DEF-136`).
          pendingMoves.delete(id);
          set((s) => ({
            carpetas: s.carpetas.map((c) => (c.id === id ? { ...c, padreId: prev } : c)),
          }));
          throw e;
        }
        await repararMoverCarpeta(previa, afectadas, id, destinoId);
        await get().loadTree(get().vaultId!);
        refreshAllLiveViews(); // la ruta cambió: refrescar wikilinks por ruta
      },

      async createNota(carpetaId, tipo = "markdown", titulo) {
        const { vaultId } = get();
        if (!vaultId) throw new Error("Sin vault activo");
        const base = titulo && titulo.trim() !== "" ? titulo.trim() : TITULO_POR_DEFECTO[tipo];
        // Una nota nueva con el título de otra se queda con sus `[[Título]]` sin
        // ruta si queda más cerca de la raíz (`DEF-134`): se lee ANTES quién
        // enlaza a las homónimas.
        const previa = await leerPrevia(vaultDe(get().notas, get().carpetas), [], [
          base,
          tituloUnicoEnCarpeta(get().notas, carpetaId, base),
        ]);
        const result = await api<{ id: string; titulo?: string }>(`/vaults/${vaultId}/notas`, {
          method: "POST",
          token: token(),
          body: { titulo: base, carpetaId, tipo },
        });
        await repararNueva(previa, {
          id: result.id,
          titulo: result.titulo ?? base,
          carpetaId,
          tipo,
          actualizadoEn: "",
        });
        if (carpetaId) set((s) => ({ expanded: { ...s.expanded, [carpetaId]: true } }));
        await get().loadTree(vaultId);
        markGraphStale();
        return result.id;
      },

      async renameNota(id, titulo) {
        // FUN-M-08: los `[[enlaces]]` resuelven por titulo, asi que renombrar
        // los rompe todos. Se leen los retroenlaces ANTES de renombrar —despues
        // ya no apuntan a nada y el grafo no los encuentra— y se reescriben
        // despues, cuando el titulo nuevo ya es el bueno.
        //
        // DEF-134: también se leen los de las notas que ya se llaman como el
        // título nuevo. Si la renombrada queda más cerca de la raíz que ellas,
        // sus `[[Título]]` sin ruta pasarían a llevar a la renombrada: después
        // del renombrado se escriben con la ruta de la nota a la que iban.
        const nota = get().notas.find((n) => n.id === id) ?? null;
        const anterior = nota?.titulo ?? null;
        const antes = vaultDe(get().notas, get().carpetas);
        const previa =
          anterior !== null && anterior !== titulo ? await leerPrevia(antes, [id], [titulo.trim()]) : null;

        const res = await api<{ id: string; titulo?: string }>(`/notas/${id}`, {
          method: "PATCH",
          token: token(),
          body: { titulo },
        });

        // DEF-084: el titulo que la nota OBTUVO, no el que se pidio. Aca los dos
        // coinciden —el titulo es texto de la base y no pasa por ningun saneo,
        // que en desktop es lo que los separa— pero se lee del servidor igual:
        // si algun dia web empieza a normalizarlo, los `[[enlaces]]` no van a
        // quedar apuntando a una nota que nunca existio.
        const efectivo = res.titulo ?? titulo;
        if (previa !== null && nota !== null && anterior !== null && anterior !== efectivo) {
          // Por título y también con pista de carpeta (`[[Carpeta/Vieja]]`).
          const traslado: Traslado = { id, titulo: efectivo, carpetaId: nota.carpetaId };
          const despues: Vault = { notas: trasTraslados(antes.notas, [traslado]), carpetas: antes.carpetas };
          traslado.cambio = cambioDe(nota, efectivo, antes, despues, nota.carpetaId);
          const r = await repararTrasOperacion(previa, despues, [traslado]);
          avisarCoincidencias(despues, [id], r, anterior.trim().toLowerCase() !== efectivo.trim().toLowerCase());
        }
        await get().loadTree(get().vaultId!);
        markGraphStale();
      },

      async deleteNota(id) {
        await api(`/notas/${id}`, { method: "DELETE", token: token() });
        await get().loadTree(get().vaultId!);
        markGraphStale();
      },

      async duplicateNota(id) {
        // La copia puede quedar con el título de una nota de otra carpeta: es una
        // homónima nueva (`DEF-134`). El backend elige el título (único en su
        // carpeta), así que se leen las homónimas del original y de la copia.
        const original = get().notas.find((n) => n.id === id);
        const previa = original
          ? await leerPrevia(vaultDe(get().notas, get().carpetas), [], [
              tituloUnicoEnCarpeta(get().notas, original.carpetaId, original.titulo),
            ])
          : null;
        const res = await api<{ id: string; titulo?: string }>(`/notas/${id}/duplicar`, {
          method: "POST",
          token: token(),
        });
        if (previa !== null && original) {
          const tituloCopia = res.titulo ?? tituloUnicoEnCarpeta(previa.antes.notas, original.carpetaId, original.titulo);
          await repararNueva(previa, { ...original, id: res.id, titulo: tituloCopia, actualizadoEn: "" });
        }
        await get().loadTree(get().vaultId!);
        markGraphStale();
      },

      async moveNota(id, destinoId) {
        const prev = get().notas.find((n) => n.id === id)?.carpetaId ?? null;
        // DEF-134: el vault se toma ANTES del movimiento optimista.
        const antes = vaultDe(get().notas, get().carpetas);
        // Optimista: mover la nota en el árbol al instante (no esperar la red).
        set((s) => ({
          notas: s.notas.map((n) => (n.id === id ? { ...n, carpetaId: destinoId } : n)),
          lastMove: { type: "nota", id, prevParentId: prev },
          expanded: destinoId ? { ...s.expanded, [destinoId]: true } : s.expanded,
        }));
        pendingMoves.set(id, { parent: destinoId, ts: Date.now() });
        let previa: Previa;
        try {
          previa = await previaDeMoverNota(antes, id);
          await api(`/notas/${id}/mover`, {
            method: "POST",
            token: token(),
            body: { destinoId },
          });
        } catch (e) {
          // Revertir si el backend rechazó el movimiento, y decir por qué: antes
          // la nota volvía a su lugar sin explicación (`DEF-136`).
          pendingMoves.delete(id);
          set((s) => ({
            notas: s.notas.map((n) => (n.id === id ? { ...n, carpetaId: prev } : n)),
          }));
          throw e;
        }
        await repararMoverNota(previa, id, destinoId);
        await get().loadTree(get().vaultId!);
        refreshAllLiveViews(); // la ruta cambió: refrescar wikilinks por ruta
      },

      async restoreNota(id) {
        await api(`/notas/${id}/recuperar`, { method: "POST", token: token() });
        await Promise.all([get().loadPapelera(), get().loadTree(get().vaultId!)]);
        markGraphStale();
      },

      async deleteNotaForever(id) {
        await api(`/notas/${id}/permanente`, { method: "DELETE", token: token() });
        await get().loadPapelera();
      },

      async restoreNotas(ids) {
        const fallidas: string[] = [];
        // De a una y en orden: dos recuperadas que vuelven a la misma carpeta con el
        // mismo nombre tienen que desambiguarse una después de la otra.
        for (const id of ids) {
          try {
            await api(`/notas/${encodeURIComponent(id)}/recuperar`, { method: "POST", token: token() });
          } catch {
            fallidas.push(id);
          }
        }
        await Promise.all([get().loadPapelera(), get().loadTree(get().vaultId!)]);
        markGraphStale();
        return fallidas;
      },

      async deleteNotasForever(ids) {
        const fallidas: string[] = [];
        for (const id of ids) {
          try {
            await api(`/notas/${encodeURIComponent(id)}/permanente`, { method: "DELETE", token: token() });
          } catch {
            fallidas.push(id);
          }
        }
        await get().loadPapelera();
        return fallidas;
      },

      async undoLastMove() {
        const move = get().lastMove;
        if (!move) return;
        set({ lastMove: null });
        pendingMoves.set(move.id, { parent: move.prevParentId, ts: Date.now() });
        // Deshacer también es mover: repara los enlaces igual (`DEF-134`).
        const antes = vaultDe(get().notas, get().carpetas);
        if (move.type === "nota") {
          const previa = await previaDeMoverNota(antes, move.id);
          await api(`/notas/${move.id}/mover`, {
            method: "POST",
            token: token(),
            body: { destinoId: move.prevParentId },
          });
          await repararMoverNota(previa, move.id, move.prevParentId);
        } else {
          const { previa, afectadas } = await previaDeMoverCarpeta(antes, move.id);
          await api(`/carpetas/${move.id}/mover`, {
            method: "POST",
            token: token(),
            body: { destinoId: move.prevParentId },
          });
          await repararMoverCarpeta(previa, afectadas, move.id, move.prevParentId);
        }
        await get().loadTree(get().vaultId!);
        refreshAllLiveViews();
      },

      toggleExpanded(id) {
        set((s) => ({ expanded: { ...s.expanded, [id]: !s.expanded[id] } }));
      },

      expandirCarpetas(ids) {
        const faltan = [...ids].filter((id) => !get().expanded[id]);
        // Sin cambios no hay `set`: no se re-dibuja el árbol ni se persiste nada.
        if (faltan.length === 0) return;
        set((s) => ({ expanded: { ...s.expanded, ...Object.fromEntries(faltan.map((id) => [id, true])) } }));
      },

      setActiveFolder(id) {
        set({ activeFolderId: id });
      },

      subtreeIds(id) {
        const { carpetas } = get();
        const result = new Set<string>([id]);
        let changed = true;
        while (changed) {
          changed = false;
          for (const carpeta of carpetas) {
            if (
              carpeta.padreId !== null &&
              result.has(carpeta.padreId) &&
              !result.has(carpeta.id)
            ) {
              result.add(carpeta.id);
              changed = true;
            }
          }
        }
        return result;
      },
    }),
    {
      name: "micelio-explorer",
      partialize: (state) => ({ expanded: state.expanded }),
    },
  ),
);
