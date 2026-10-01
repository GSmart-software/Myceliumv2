"use client";

import { FileWarning, RotateCw } from "lucide-react";
import styles from "./ArchivoIlegible.module.css";

/**
 * Aviso de un dibujo que no se pudo leer (`DEF-119`).
 *
 * Ocupa el lugar del editor a propósito: mientras se ve esto **no hay editor**,
 * así que nada de lo que haga el usuario puede guardarse encima del original.
 *
 * La salida es **Reintentar**: vuelve a pedir el contenido al servidor.
 *
 * > [!info] Distinto de desktop
 * > En desktop hay además «Abrir como texto» (el visor de texto de `FUN-L-11`)
 * > y la vista se recupera sola cuando el archivo se corrige en disco (la
 * > recarga de `FUN-L-26`). Web no tiene ni el visor ni el watcher: el archivo
 * > se corrige desde fuera (otra sesión, la API) y se reintenta a mano.
 */
export function ArchivoIlegible({
  nombre,
  formato,
  motivo,
  onReintentar,
}: {
  /** Nombre del archivo para mostrar (`Boceto.excalidraw`). */
  nombre: string;
  /** «dibujo de Excalidraw». */
  formato: string;
  motivo: string;
  onReintentar: () => void;
}) {
  return (
    <div className={styles.aviso} role="alert">
      <FileWarning size={28} aria-hidden className={styles.icono} />
      <p className={styles.titulo}>No se pudo leer «{nombre}»</p>
      <p className={styles.detalle}>
        El archivo no es un {formato} válido, así que no se abre el editor: lo que se dibujara
        acá reemplazaría el contenido original. <strong>El archivo guardado no se tocó.</strong>
      </p>
      <p className={styles.motivo}>{motivo}</p>
      <p className={styles.detalle}>Corregilo desde fuera del editor y tocá «Reintentar».</p>
      <div className={styles.acciones}>
        <button type="button" className={styles.accion} onClick={onReintentar}>
          <RotateCw size={14} aria-hidden />
          Reintentar
        </button>
      </div>
    </div>
  );
}
