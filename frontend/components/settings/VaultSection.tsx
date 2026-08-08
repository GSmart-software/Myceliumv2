"use client";

import { useRef, useState } from "react";
import { CARPETA_ESPORAS_DEFECTO, normalizarCarpetaEsporas } from "@/lib/esporas";
import { exportVaultZip } from "@/lib/export";
import { collectFromFileList, collectFromZip } from "@/lib/import";
import { useExportStore } from "@/stores/exportStore";
import { useImportStore } from "@/stores/importStore";
import { usePreferencesStore } from "@/stores/preferencesStore";
import { useVaultStore } from "@/stores/vaultStore";
import styles from "./Settings.module.css";

const T_ZIP = "Comprimiendo ZIP";

/** Sección Vault: exportar todo el vault como ZIP (HU-09) e importar Obsidian (HU-11). */
export function VaultSection() {
  // Progreso GLOBAL (DEF-018): no se pierde al cerrar el menú de opciones.
  const progreso = useExportStore((s) => s.progreso);
  const setProgreso = useExportStore((s) => s.setProgreso);
  const folderRef = useRef<HTMLInputElement>(null);
  const zipRef = useRef<HTMLInputElement>(null);

  // Carpeta de Esporas (FUN-M-03): borrador local (se teclea libre) + el error
  // de validación, que se muestra en vez de guardar una ruta imposible.
  const carpetaEsporasPref = usePreferencesStore((s) => s.prefs.carpetaEsporas);
  const [esporasBorrador, setEsporasBorrador] = useState(carpetaEsporasPref);
  const [esporasError, setEsporasError] = useState<string | null>(null);

  // La preferencia se hidrata en asíncrono al abrir el vault: el borrador se
  // resetea DURANTE el render (no en un efecto) para no pintar el valor viejo.
  const [esporasVisto, setEsporasVisto] = useState(carpetaEsporasPref);
  if (esporasVisto !== carpetaEsporasPref) {
    setEsporasVisto(carpetaEsporasPref);
    setEsporasBorrador(carpetaEsporasPref);
    setEsporasError(null);
  }

  /** Confirma la carpeta de Esporas: si la ruta no es válida, no se guarda. */
  const confirmarCarpetaEsporas = () => {
    if (esporasBorrador === carpetaEsporasPref) return;
    const limpia = normalizarCarpetaEsporas(esporasBorrador);
    if (limpia === null) {
      setEsporasError(
        "Tiene que ser una carpeta DENTRO del vault: sin rutas absolutas ni «..».",
      );
      return;
    }
    setEsporasError(null);
    setEsporasBorrador(limpia);
    usePreferencesStore.getState().setPref("carpetaEsporas", limpia);
  };

  const handleZip = async () => {
    setProgreso({ done: 0, total: 1, titulo: T_ZIP });
    try {
      await exportVaultZip((done, total) => setProgreso({ done, total, titulo: T_ZIP }));
    } finally {
      setProgreso(null);
    }
  };

  const activeFolder = () => useVaultStore.getState().activeFolderId;

  return (
    <div>
      {/* Esporas (FUN-M-03): dónde viven las plantillas de notas. */}
      <div className={styles.field}>
        <label className={styles.label} htmlFor="mic-carpeta-esporas">
          Carpeta de Esporas (plantillas)
        </label>
        <input
          id="mic-carpeta-esporas"
          className={styles.input}
          value={esporasBorrador}
          spellCheck={false}
          placeholder={CARPETA_ESPORAS_DEFECTO}
          onChange={(e) => setEsporasBorrador(e.target.value)}
          onBlur={confirmarCarpetaEsporas}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape") {
              setEsporasBorrador(carpetaEsporasPref);
              setEsporasError(null);
            }
          }}
        />
        <p className={styles.cssPreviewNote} style={{ color: "var(--mic-text-muted)" }}>
          Las notas de esta carpeta son <strong>Esporas</strong>: plantillas para crear notas
          ya con su estructura, o para insertar una estructura en una nota que ya existe.
          Admiten variables (<code>{"{{titulo}}"}</code>, <code>{"{{fecha}}"}</code>,{" "}
          <code>{"{{hora}}"}</code>, <code>{"{{fecha:DD/MM/AAAA}}"}</code>). Cambiar la
          carpeta <strong>no mueve ningún archivo</strong>: solo cambia dónde se buscan.
        </p>
        {esporasError && (
          <p
            className={styles.cssPreviewNote}
            style={{ color: "var(--mic-callout-error-border)" }}
            role="alert"
          >
            {esporasError}
          </p>
        )}
      </div>

      <div className={styles.field}>
        <span className={styles.label}>Exportar</span>
        <p className={styles.cssPreviewNote} style={{ color: "var(--mic-text-muted)" }}>
          Descarga todas las notas en un ZIP preservando la estructura de carpetas.
        </p>
        <div className={styles.btnRow}>
          <button
            type="button"
            className={styles.primaryBtn}
            disabled={progreso !== null}
            onClick={() => void handleZip()}
          >
            {progreso?.titulo === T_ZIP
              ? `Comprimiendo… ${progreso.done}/${progreso.total}`
              : "Exportar vault como ZIP"}
          </button>
        </div>
      </div>

      <div className={styles.field}>
        <span className={styles.label}>Importar vault de Obsidian</span>
        <p className={styles.cssPreviewNote} style={{ color: "var(--mic-text-muted)" }}>
          Importá una carpeta o un .zip. Se preserva la estructura, se ignora
          <code> .obsidian/</code> y los conflictos se resuelven uno a uno.
        </p>
        <div className={styles.btnRow}>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={() => folderRef.current?.click()}
          >
            Importar carpeta
          </button>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={() => zipRef.current?.click()}
          >
            Importar .zip
          </button>
        </div>
        <input
          ref={folderRef}
          type="file"
          hidden
          // @ts-expect-error atributos no estándar para selección de carpeta
          webkitdirectory=""
          directory=""
          multiple
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              void useImportStore
                .getState()
                .run(collectFromFileList(e.target.files), activeFolder(), "Vault de Obsidian");
            }
            e.target.value = "";
          }}
        />
        <input
          ref={zipRef}
          type="file"
          accept=".zip"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              void collectFromZip(file).then((files) =>
                useImportStore.getState().run(files, activeFolder(), "Vault de Obsidian"),
              );
            }
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
