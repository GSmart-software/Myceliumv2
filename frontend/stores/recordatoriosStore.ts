import { create } from "zustand";
import {
  archivoVacio,
  avisosPendientes,
  descartar,
  fechaLocal,
  leerArchivo,
  limpiarOcurrencias,
  momentoLocal,
  posponer,
  type ArchivoRecordatorios,
  type Aviso,
  type Recordatorio,
} from "@/lib/recordatorios";
import {
  detenerProgramador,
  iniciarProgramador,
  notificarNuevos,
  olvidarNotificados,
  pedirPermisoNotificaciones,
} from "@/lib/avisosRecordatorio";
import { api, ApiError } from "@/lib/api";
import { avisar } from "@/stores/avisosStore";
import { useAuthStore } from "@/stores/authStore";

/**
 * Los recordatorios del calendario (`FUN-L-22`), **del vault abierto**.
 *
 * En desktop viven en `.mycelium/recordatorios.json`, dentro de la carpeta del
 * vault. En web no hay carpeta: el **mismo documento**, con la misma forma, se
 * guarda entero en el backend (`GET`/`PUT /vaults/{id}/recordatorios`, tabla
 * `recordatorios_vault`). No son notas —no aparecen en el explorador, la
 * búsqueda ni el grafo— pero son del vault: abrir otro trae los suyos, y con
 * ellos sus avisos.
 *
 * Lo único que difiere de desktop es el adaptador de lectura y escritura
 * (`leerDocumento` / `escribirDocumento`); el modelo es `lib/recordatorios.ts`,
 * compartido tal cual.
 *
 * El ciclo lo lleva el workspace: `cargar(vaultId)` al entrar con un vault
 * activo, que además arranca el programador de avisos, y `cargar(null)` al
 * salir, que lo detiene y vacía todo.
 *
 * > [!warning] Entre dispositivos, la última escritura gana
 * > Cada cambio reemplaza el documento entero. Dos navegadores con el mismo
 * > vault abierto que editan a la vez pueden pisarse: gana el último `PUT`.
 * > Es una limitación aceptada; no hay fusión ni aviso de conflicto.
 */

const token = () => useAuthStore.getState().accessToken;

const rutaApi = (vaultId: string) => `/vaults/${encodeURIComponent(vaultId)}/recordatorios`;

/** Lee el documento del vault. El backend devuelve uno vacío si no hay. */
async function leerDocumento(vaultId: string): Promise<unknown> {
  return api<unknown>(rutaApi(vaultId), { token: token() });
}

async function escribirDocumento(vaultId: string, archivo: ArchivoRecordatorios): Promise<void> {
  await api(rutaApi(vaultId), { method: "PUT", token: token(), body: archivo });
}

/** Qué pidió «Abrir» en una tarjeta: el día, y el recordatorio a seleccionar. */
export type FocoCalendario = { fecha: string; id: string | null; n: number };

type Estado = {
  /** Vault de estos recordatorios (su id); `null` = ninguno abierto. */
  ruta: string | null;
  archivo: ArchivoRecordatorios;
  /**
   * El documento existe pero no se pudo leer (o el servidor no respondió).
   * Mientras tanto **no se escribe**: el calendario arranca vacío y
   * sobrescribirlo borraría lo que todavía se puede recuperar (§ 3).
   */
  bloqueado: boolean;
  /** Los avisos que se muestran ahora: tarjetas que no se van solas. */
  avisos: Aviso[];
  /** El último pedido de «Abrir» desde una tarjeta; lo consume el calendario. */
  foco: FocoCalendario | null;

  cargar: (ruta: string | null) => Promise<void>;
  /** Crea o reemplaza un recordatorio (por `id`). */
  guardar: (r: Recordatorio) => void;
  eliminar: (id: string) => void;
  /** «Listo» en una tarjeta. */
  listo: (clave: string) => void;
  /** «Posponer» en una tarjeta. */
  posponer: (clave: string, hasta: Date) => void;
  /** Recalcula qué hay que avisar. La llama el programador cada minuto. */
  revisar: () => void;
  enfocar: (fecha: string, id: string | null) => void;
  /** El calendario ya aplicó el pedido de «Abrir». */
  consumirFoco: () => void;
};

/**
 * Las escrituras van en fila: dos cambios seguidos —descartar una tarjeta y
 * enseguida otra— no pueden llegar al servidor en otro orden y dejar el primero.
 */
let cola: Promise<void> = Promise.resolve();
let avisadoBloqueo = false;
let avisadoSinPermiso = false;

function persistir(vaultId: string, archivo: ArchivoRecordatorios) {
  cola = cola
    .then(() => escribirDocumento(vaultId, archivo))
    .catch((e) => {
      console.error("[Mycelium] recordatorios · no se pudo guardar el calendario", e);
      if (e instanceof ApiError && e.status === 403) {
        // Un lector ve el calendario pero no puede cambiarlo: se dice una vez.
        if (!avisadoSinPermiso) {
          avisadoSinPermiso = true;
          avisar("Tu rol en este vault no permite cambiar el calendario. Los cambios no se guardan.");
        }
        return;
      }
      avisar("No se pudo guardar el calendario. El último cambio puede perderse al cerrar.");
    });
}

let serie = 0;
/** Cuál es la última carga pedida: una más vieja que termina tarde no manda. */
let cargaVigente = 0;

export const useRecordatoriosStore = create<Estado>((set, get) => {
  /** Aplica un archivo nuevo: lo guarda en el servidor y recalcula los avisos. */
  function aplicar(archivo: ArchivoRecordatorios) {
    set({ archivo });
    const { ruta, bloqueado } = get();
    if (ruta !== null) {
      if (bloqueado) {
        // Se conserva en memoria, pero el documento que no se pudo leer no se
        // toca. Se dice una vez: repetirlo en cada cambio no ayudaría.
        if (!avisadoBloqueo) {
          avisadoBloqueo = true;
          avisar(
            "El calendario no se guarda: no se pudieron leer los recordatorios de este vault. Recargá la página para volver a intentarlo.",
          );
        }
      } else {
        persistir(ruta, archivo);
      }
    }
    get().revisar();
  }

  return {
    ruta: null,
    archivo: archivoVacio(),
    bloqueado: false,
    avisos: [],
    foco: null,

    async cargar(ruta) {
      if (get().ruta === ruta) return;
      const carga = ++cargaVigente;
      detenerProgramador();
      olvidarNotificados();
      avisadoBloqueo = false;
      avisadoSinPermiso = false;
      set({ ruta: null, archivo: archivoVacio(), bloqueado: false, avisos: [], foco: null });
      if (ruta === null) return;

      let archivo = archivoVacio();
      let bloqueado = false;
      try {
        const json = await leerDocumento(ruta);
        const leido = leerArchivo(json);
        if (leido === null) {
          bloqueado = true;
          console.error(
            "[Mycelium] recordatorios · el documento del vault no tiene una forma válida; el calendario arranca vacío y NO se sobrescribe",
          );
        } else {
          archivo = leido;
        }
      } catch (e) {
        // Sin poder leer no se sabe qué hay: por las dudas, tampoco se escribe.
        bloqueado = true;
        console.error("[Mycelium] recordatorios · no se pudieron leer los recordatorios", e);
      }
      // Otro `cargar` pudo empezar mientras se leía (cambio rápido de vault, o
      // salir antes de que termine de abrir): manda el último.
      if (carga !== cargaVigente) return;
      const limpio = limpiarOcurrencias(archivo, new Date());
      set({ ruta, archivo: limpio, bloqueado });
      get().revisar();
      iniciarProgramador(() => get().revisar());
    },

    guardar(r) {
      const { archivo } = get();
      const previo = archivo.recordatorios.find((x) => x.id === r.id);
      // `vigenteDesde` se renueva si cambia CUÁNDO ocurre: editar un diario de
      // las 9 a las 8, a las 8:30, no debe avisar en el acto por las 8 de hoy.
      const cambiaCuando =
        !previo ||
        previo.fecha !== r.fecha ||
        previo.hora !== r.hora ||
        previo.repeticion !== r.repeticion;
      const nuevo: Recordatorio = {
        ...r,
        vigenteDesde: cambiaCuando ? momentoLocal(new Date()) : previo?.vigenteDesde,
      };
      const recordatorios = previo
        ? archivo.recordatorios.map((x) => (x.id === r.id ? nuevo : x))
        : [...archivo.recordatorios, nuevo];
      aplicar({ ...archivo, recordatorios });
      // El permiso de notificaciones del navegador se pide recién ahora, al
      // guardar uno con hora: es cuando se entiende para qué es. Pedirlo al
      // cargar la página es lo que hace que la gente lo niegue por reflejo.
      if (r.hora !== null) pedirPermisoNotificaciones();
    },

    eliminar(id) {
      const { archivo } = get();
      // Se va la serie entera (§ 4.3), y con ella el estado de sus ocurrencias.
      aplicar(
        limpiarOcurrencias(
          { ...archivo, recordatorios: archivo.recordatorios.filter((r) => r.id !== id) },
          new Date(),
        ),
      );
    },

    listo(clave) {
      aplicar(descartar(get().archivo, clave));
    },

    posponer(clave, hasta) {
      aplicar(posponer(get().archivo, clave, hasta));
    },

    revisar() {
      if (get().ruta === null) {
        set({ avisos: [] });
        return;
      }
      const avisos = avisosPendientes(get().archivo, new Date());
      set({ avisos });
      notificarNuevos(avisos);
    },

    enfocar(fecha, id) {
      set({ foco: { fecha, id, n: ++serie } });
    },

    consumirFoco() {
      set({ foco: null });
    },
  };
});

/** Hoy, como `AAAA-MM-DD` local: el día en el que arranca el calendario. */
export const hoy = () => fechaLocal(new Date());

/** Un id nuevo para un recordatorio. */
export function idRecordatorio(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// ── Qué ventana del calendario está abierta ───────────────────────────────

/**
 * El modal del calendario: ver un recordatorio (su detalle renderizado, con
 * Editar y Eliminar) o editarlo en el formulario. Uno solo para toda la app,
 * montado en el workspace: lo abren la pestaña, el panel y las tarjetas.
 */
export type ModalRecordatorio =
  | { tipo: "ver"; id: string; fecha: string }
  | { tipo: "editar"; borrador: Recordatorio; nuevo: boolean };

export const useModalRecordatorioStore = create<{
  modal: ModalRecordatorio | null;
  abrir: (m: ModalRecordatorio) => void;
  cerrar: () => void;
}>((set) => ({
  modal: null,
  abrir: (modal) => set({ modal }),
  cerrar: () => set({ modal: null }),
}));

/** Abre el formulario para un recordatorio nuevo en `fecha`. */
export function nuevoRecordatorio(fecha: string): void {
  useModalRecordatorioStore.getState().abrir({
    tipo: "editar",
    nuevo: true,
    borrador: {
      id: idRecordatorio(),
      titulo: "",
      fecha,
      hora: null,
      repeticion: "ninguna",
      color: 1,
      detalle: "",
    },
  });
}
