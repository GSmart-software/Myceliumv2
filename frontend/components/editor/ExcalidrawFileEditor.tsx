"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { motivoDeExcepcion } from "@/lib/archivosIlegibles";
import { leerEscena, type EscenaLeida } from "@/lib/excalidraw";
import { useAuthStore } from "@/stores/authStore";
import { useSyncStore } from "@/stores/syncStore";
import { useVaultStore } from "@/stores/vaultStore";
import { ArchivoIlegible } from "./ArchivoIlegible";
import styles from "./ExcalidrawFileEditor.module.css";

const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  { ssr: false },
);

type ExcalidrawApi = {
  getSceneElements: () => readonly unknown[];
  getFiles: () => Record<string, unknown>;
};

/**
 * Qué muestra la vista. `ilegible` (`DEF-119`) NO monta Excalidraw: sin editor
 * no hay `onChange`, ni guardado, ni forma de pisar el archivo original.
 */
type Estado =
  | { tipo: "cargando" }
  | { tipo: "lista"; escena: EscenaLeida }
  | { tipo: "ilegible"; motivo: string };

/**
 * Editor Excalidraw a pantalla de pane para los archivos .excalidraw del vault
 * (HU-16): carga el contenido (JSON) de la nota tipo 'excalidraw', lo edita y
 * autoguarda con debounce vía el endpoint de contenido, como cualquier nota.
 */
export function ExcalidrawFileEditor({ notaId }: { notaId: string }) {
  const apiRef = useRef<ExcalidrawApi | null>(null);
  const [estado, setEstado] = useState<Estado>({ tipo: "cargando" });
  /**
   * Cuántas veces se montó Excalidraw. Va de `key`: cuando un archivo ilegible
   * se corrige y se reintenta, el editor se monta de cero con lo nuevo
   * (`initialData` solo se lee al montar).
   */
  const [montaje, setMontaje] = useState(0);
  /** Espejo de `estado.tipo === "ilegible"` para el guardado, que corre fuera del render. */
  const ilegibleRef = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titulo = useVaultStore((s) => s.notas.find((n) => n.id === notaId)?.titulo);
  const dark =
    typeof document !== "undefined" && document.documentElement.dataset.dark === "true";

  /**
   * Pasa la vista al aviso de ilegible (`DEF-119`). Sin editor montado no hay
   * API: nada puede guardar, y se cancela un autoguardado en espera.
   */
  const mostrarAviso = useCallback((motivo: string) => {
    ilegibleRef.current = true;
    apiRef.current = null;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = null;
    setEstado({ tipo: "ilegible", motivo });
  }, []);

  /**
   * Pide el contenido al servidor y lo muestra. Es la carga inicial y el
   * «Reintentar»: en web no hay watcher que avise de un arreglo hecho desde
   * fuera, así que la salida del aviso es esta.
   */
  const cargar = useCallback(
    async (vigente: () => boolean) => {
      let contenido: string;
      try {
        const d = await api<{ contenido: string }>(`/notas/${notaId}/contenido`, {
          token: useAuthStore.getState().accessToken,
        });
        contenido = d.contenido ?? "";
      } catch (e) {
        // Antes esto abría una escena vacía: un fallo de lectura quedaba igual
        // que un dibujo en blanco, y dibujar encima pisaba el archivo.
        if (vigente()) mostrarAviso(`No se pudo leer el archivo: ${motivoDeExcepcion(e)}`);
        return;
      }
      const lectura = await leerEscena(contenido);
      if (!vigente()) return;
      if ("ilegible" in lectura) {
        mostrarAviso(lectura.ilegible);
        return;
      }
      ilegibleRef.current = false;
      setEstado({ tipo: "lista", escena: lectura.escena });
      setMontaje((m) => m + 1);
    },
    [notaId, mostrarAviso],
  );

  useEffect(() => {
    let cancelled = false;
    void cargar(() => !cancelled);
    return () => {
      cancelled = true;
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [cargar]);

  const save = () => {
    const api2 = apiRef.current;
    if (!api2 || ilegibleRef.current) return;
    const contenido = JSON.stringify({
      type: "excalidraw",
      version: 2,
      source: "micelio",
      elements: api2.getSceneElements(),
      appState: {},
      files: api2.getFiles(),
    });
    useSyncStore.getState().setSyncState(notaId, "syncing");
    void api(`/notas/${notaId}/contenido`, {
      method: "PUT",
      token: useAuthStore.getState().accessToken,
      body: { contenido },
    })
      .then(() => useSyncStore.getState().setSyncState(notaId, "synced"))
      .catch(() => useSyncStore.getState().setSyncState(notaId, "error"));
  };

  const onChange = () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(save, 800); // autoguardado (HU-04)
  };

  if (estado.tipo === "ilegible") {
    return (
      <div className={styles.host}>
        <ArchivoIlegible
          nombre={`${titulo ?? "dibujo"}.excalidraw`}
          formato="dibujo de Excalidraw"
          motivo={estado.motivo}
          onReintentar={() => void cargar(() => true)}
        />
      </div>
    );
  }

  return (
    <div className={styles.host}>
      {estado.tipo === "lista" && (
        <Excalidraw
          key={montaje}
          excalidrawAPI={(a) => {
            apiRef.current = a as unknown as ExcalidrawApi;
          }}
          theme={dark ? "dark" : "light"}
          initialData={{
            elements: estado.escena.elements as never,
            files: estado.escena.files as never,
          }}
          onChange={onChange}
        />
      )}
    </div>
  );
}
