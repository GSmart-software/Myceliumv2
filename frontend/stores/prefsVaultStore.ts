import { create } from "zustand";

/**
 * Preferencias **de un vault**, no del usuario (`FUN-M-28` / `FUN-M-21`).
 *
 * `preferencesStore` guarda lo que es de la persona —tema, tipografía, ancho de
 * tabulación— y vale para todo. Acá van los ajustes que pertenecen al vault: si
 * se ven los números de línea, cómo se muestran los nombres en el grafo. Abrir
 * otro vault trae los suyos.
 *
 * > [!warning] En web NO viajan con el vault (`FUN-M-29`)
 * > En desktop viven en `.mycelium/preferencias.json` **dentro de la carpeta**,
 * > así que copiarla a otra máquina se lleva también sus ajustes. Acá no hay
 * > carpeta: viven en el `localStorage` del navegador, indexadas por `vaultId`.
 * > Eso significa que **quedan en ese navegador** — el mismo vault abierto desde
 * > otro equipo arranca con los valores por defecto.
 * >
 * > Es la diferencia aceptada al portar (`FUN-M-29`). La alternativa, un
 * > endpoint `.NET` que las guardara junto al vault, conserva lo que motivó el
 * > diseño pero cuesta backend, migración y una llamada de red en el arranque, y
 * > todo eso por unos ajustes de aspecto. Si algún día hace falta que viajen, lo
 * > único que cambia es el cuerpo de `cargar` y de `guardarDiferido`: la
 * > superficie que ven los componentes es **la misma que en desktop**, y esa
 * > igualdad es lo que mantiene compartidos a `BaseView`, `NoteEditor` y el
 * > grafo. Ver [[preferencias-por-vault]] y [[RAMAS]].
 *
 * > [!important] Los valores por defecto están en UN solo sitio
 * > `POR_DEFECTO`. Un vault sin archivo, con el archivo corrupto, o con una
 * > preferencia que todavía no existía cuando se guardó, cae acá. Repartir los
 * > defaults por los componentes haría que «apagado por defecto» significara
 * > cosas distintas según quién preguntara.
 */

/** Modos de nombres del grafo (`FUN-M-21`). */
export type ModoNombresGrafo = "todos" | "vecinos" | "apuntado";

/**
 * Anchos de columna de los archivos tabla (`FUN-M-25`).
 *
 * `id del .base` → `referencia de la columna` → ancho en píxeles.
 *
 * Está acá y no dentro del `.base` porque ese archivo es **formato de
 * Obsidian**: meterle una clave nuestra rompería la promesa de que los dos
 * programas abren el mismo archivo. Y está en las preferencias **del vault** y
 * no en las del usuario porque acompaña a la base, que vive en el vault.
 *
 * Las vistas de una misma base **comparten** el ancho de una columna: la clave
 * es la referencia (`estado`, `file.name`), no el par vista+referencia. Es lo
 * que la mayoría espera —una columna se llama igual y se lee igual en las dos
 * vistas— y evita tener que reajustarla en cada una.
 */
export type AnchosTabla = Record<string, Record<string, number>>;

export type PrefsVault = {
  /** Números de línea al costado de una nota markdown (`FUN-M-28`). */
  numerosDeLinea: boolean;
  /** Qué nombres se dibujan en el grafo (`FUN-M-21`). */
  nombresGrafo: ModoNombresGrafo;
  /** Ancho de las columnas de cada archivo tabla (`FUN-M-25`). */
  anchosTabla: AnchosTabla;
};

/**
 * Los valores con los que arranca un vault que nunca guardó nada.
 *
 * `numerosDeLinea` va **apagado** a propósito: es lo que pidió el usuario y es
 * lo que hace que un vault existente no cambie de aspecto al actualizar.
 */
export const POR_DEFECTO: PrefsVault = {
  numerosDeLinea: false,
  nombresGrafo: "todos",
  anchosTabla: {},
};

/**
 * Mezcla lo leído del disco con los valores por defecto, quedándose solo con lo
 * que reconoce y con el tipo correcto.
 *
 * Es deliberadamente desconfiada: el archivo vive en la carpeta del usuario y se
 * puede editar a mano, y una preferencia agregada después no está en los vaults
 * viejos. Un valor con el tipo equivocado se ignora en vez de propagarse hasta
 * el componente que lo use.
 *
 * Pura y exportada para poder testearla sin Tauri.
 */
export function normalizar(crudo: unknown): PrefsVault {
  if (crudo === null || typeof crudo !== "object") return { ...POR_DEFECTO };
  const o = crudo as Record<string, unknown>;
  return {
    numerosDeLinea:
      typeof o.numerosDeLinea === "boolean" ? o.numerosDeLinea : POR_DEFECTO.numerosDeLinea,
    nombresGrafo:
      o.nombresGrafo === "todos" || o.nombresGrafo === "vecinos" || o.nombresGrafo === "apuntado"
        ? o.nombresGrafo
        : POR_DEFECTO.nombresGrafo,
    anchosTabla: normalizarAnchos(o.anchosTabla),
  };
}

/** Ancho mínimo de una columna, en píxeles. Por debajo no se lee nada. */
export const ANCHO_MIN = 60;

/**
 * Se queda solo con los anchos que son números usables.
 *
 * Este valor es el único de las preferencias con forma de diccionario anidado,
 * así que es el único donde un archivo editado a mano puede colar un `NaN`, un
 * `0` o un objeto donde va un número — y un `0` que llegara hasta el `<col>`
 * dejaría una columna invisible sin forma evidente de recuperarla.
 */
function normalizarAnchos(crudo: unknown): AnchosTabla {
  if (crudo === null || typeof crudo !== "object") return {};
  const salida: AnchosTabla = {};
  for (const [tabla, cols] of Object.entries(crudo as Record<string, unknown>)) {
    if (cols === null || typeof cols !== "object") continue;
    const limpias: Record<string, number> = {};
    for (const [ref, ancho] of Object.entries(cols as Record<string, unknown>)) {
      if (typeof ancho === "number" && Number.isFinite(ancho) && ancho >= ANCHO_MIN) {
        limpias[ref] = Math.round(ancho);
      }
    }
    if (Object.keys(limpias).length > 0) salida[tabla] = limpias;
  }
  return salida;
}

type EstadoPrefsVault = {
  prefs: PrefsVault;
  /**
   * Vault que cargó estas preferencias; null = ninguno todavía.
   *
   * Se llama `ruta` porque en desktop lo es. Acá es el `vaultId`: el nombre se
   * conserva para que el store sea **el mismo** de las dos ramas de puertas
   * afuera, que es lo que evita que sus consumidores diverjan.
   */
  ruta: string | null;
  /**
   * Carga las del vault indicado. Idempotente para el mismo vault.
   *
   * Devuelve una promesa aunque acá no espere a nada: en desktop lee un archivo
   * y sí la necesita, y la firma tiene que ser la misma para que quien la llama
   * no tenga que saber en qué versión corre.
   */
  cargar: (ruta: string | null) => Promise<void>;
  set: <K extends keyof PrefsVault>(clave: K, valor: PrefsVault[K]) => void;
};

/** Dónde guarda cada vault sus preferencias dentro del navegador. */
const claveDe = (vaultId: string) => `mycelium:prefs-vault:${vaultId}`;

/**
 * Guardado diferido: cambiar un ajuste con un interruptor no debe escribir en
 * cada pulsación, y algunos —el modo de nombres del grafo, el ancho de una
 * columna mientras se arrastra— se tocan muchas veces seguidas.
 */
const ESPERA_GUARDADO_MS = 400;
let temporizador: ReturnType<typeof setTimeout> | null = null;

function guardarDiferido(ruta: string | null, prefs: PrefsVault) {
  if (ruta === null) return;
  if (temporizador) clearTimeout(temporizador);
  temporizador = setTimeout(() => {
    temporizador = null;
    try {
      window.localStorage.setItem(claveDe(ruta), JSON.stringify(prefs));
    } catch {
      // Modo privado, cuota llena o almacenamiento bloqueado. Se pierde la
      // preferencia y no pasa nada más: no se avisa porque no hay nada que el
      // usuario pueda hacer, y un cartel por un ajuste de aspecto sería más
      // molesto que el propio fallo.
    }
  }, ESPERA_GUARDADO_MS);
}

export const usePrefsVaultStore = create<EstadoPrefsVault>((set, get) => ({
  prefs: { ...POR_DEFECTO },
  ruta: null,

  async cargar(ruta) {
    if (get().ruta === ruta) return;
    if (ruta === null) {
      set({ prefs: { ...POR_DEFECTO }, ruta: null });
      return;
    }
    let crudo: unknown = null;
    try {
      const texto = window.localStorage.getItem(claveDe(ruta));
      crudo = texto === null ? null : JSON.parse(texto);
    } catch {
      // Ni un vault sin preferencias ni un JSON corrupto deben impedir abrirlo:
      // se arranca con los valores por defecto y el próximo guardado lo rehace.
      crudo = null;
    }
    set({ prefs: normalizar(crudo), ruta });
  },

  set(clave, valor) {
    const prefs = { ...get().prefs, [clave]: valor };
    set({ prefs });
    guardarDiferido(get().ruta, prefs);
  },
}));

/** Atajo de lectura para los componentes. */
export const usePrefVault = <K extends keyof PrefsVault>(clave: K): PrefsVault[K] =>
  usePrefsVaultStore((s) => s.prefs[clave]);
