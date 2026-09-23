"use client";

import { Search, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useUiStore } from "@/stores/uiStore";
import styles from "./AppTopbar.module.css";

/**
 * AppTopbar del workspace (HU-38): logo, el disparador de la paleta de notas y
 * comandos, Compartir y avatar. Siempre visible.
 *
 * El centro era un campo «Buscar en Mycelium…» que no buscaba nada (`DEF-090`):
 * el `<input>` nunca tuvo manejador, era un marcador de la maqueta. Ahora abre la
 * paleta, que es lo que la gente espera de ese sitio. Rediseño del cascarón,
 * 2026-09-19.
 *
 * Compartir se queda, al contrario que en desktop: acá hay cuenta y servidor
 * (ver `lib/capacidades.ts`).
 */
export function AppTopbar({
  shareFolder,
}: {
  shareFolder: { id: string; nombre: string } | null;
}) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setSettingsOpen = useUiStore((s) => s.setSettingsOpen);
  const setShareTarget = useUiStore((s) => s.setShareTarget);
  const setPaleta = useUiStore((s) => s.setPaleta);

  const initials = (user?.nombre ?? "?")
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // El botón Compartir se habilita cuando la nota activa está en una carpeta
  // compartible (HU-35 CA1b).
  const canShare = shareFolder !== null;

  return (
    <header className={styles.topbar}>
      <button
        type="button"
        className={styles.logo}
        onClick={() => router.push("/workspace")}
        title="Mycelium"
        aria-label="Mycelium"
      >
        <svg viewBox="0 0 32 32" width="27" height="27" aria-hidden className={styles.logoMark}>
          <path
            d="M9 10L23 8M9 10L16 23M23 8L16 23"
            stroke="var(--mic-marco-glow)"
            strokeWidth="1.5"
            opacity="0.55"
            fill="none"
          />
          <circle cx="9" cy="10" r="4" fill="var(--mic-marco-glow)" />
          <circle cx="23" cy="8" r="3" fill="var(--mic-marco-acento)" />
          <circle cx="16" cy="23" r="4" fill="var(--mic-callout-info-border)" />
        </svg>
        <span className={styles.logoFull}>Mycelium</span>
      </button>

      <button type="button" className={styles.searchBar} onClick={() => setPaleta("notas")}>
        <Search size={14} aria-hidden className={styles.searchIcon} />
        <span className={styles.searchPlaceholder}>Ir a una nota o comando…</span>
        {/* La tecla que hace LO MISMO que este botón: abrir la paleta en notas.
            Decía Ctrl+P, que abre la de comandos (crítica del cascarón). */}
        <kbd className={styles.searchKey}>Ctrl+O</kbd>
      </button>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.shareButton}
          disabled={!canShare}
          onClick={() => shareFolder && setShareTarget(shareFolder)}
          title={
            canShare
              ? "Compartir la carpeta de esta nota"
              : "Disponible cuando la nota esté en una carpeta compartible"
          }
        >
          <Share2 size={14} aria-hidden />
          <span className={styles.shareLabel}>Compartir</span>
        </button>

        <button
          type="button"
          className={styles.avatar}
          onClick={() => setSettingsOpen(true)}
          title={user?.nombre ?? "Cuenta"}
          aria-label="Abrir configuración"
        >
          {initials}
        </button>
      </div>
    </header>
  );
}
