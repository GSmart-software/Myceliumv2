"use client";

import { useRef } from "react";
import { exportVaultZip } from "@/lib/export";
import { collectFromFileList, collectFromZip } from "@/lib/import";
import { useExportStore } from "@/stores/exportStore";
import { useImportStore } from "@/stores/importStore";
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
