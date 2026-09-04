"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { ImportDialogs } from "@/components/explorer/ImportDialogs";
import { ShareModal } from "@/components/explorer/ShareModal";
import { PaneTree } from "@/components/panes/PaneTree";
import { AppTopbar } from "@/components/workspace/AppTopbar";
import { LeftPanel } from "@/components/workspace/LeftPanel";
import { Rail } from "@/components/workspace/Rail";
import { SettingsDrawer } from "@/components/workspace/SettingsDrawer";
import { useAuthStore } from "@/stores/authStore";
import { usePanelLayoutStore } from "@/stores/panelLayoutStore";
import { useCssStore } from "@/stores/cssStore";
import { usePreferencesStore } from "@/stores/preferencesStore";
import { useUiStore } from "@/stores/uiStore";
import { useTabsStore } from "@/stores/tabsStore";
import { useVaultStore } from "@/stores/vaultStore";
import styles from "./workspace.module.css";

export default function WorkspacePage() {
  return (
    <Suspense>
      <WorkspaceGuard />
    </Suspense>
  );
}

/** Guard de sesión: restaura desde la cookie de refresh o redirige a /login. */
function WorkspaceGuard() {
  const router = useRouter();
  const { user, initialized, restore } = useAuthStore();

  useEffect(() => {
    if (!initialized) {
      void restore().then((ok) => {
        if (!ok) router.replace("/login");
      });
    } else if (!user) {
      router.replace("/login");
    }
  }, [initialized, user, restore, router]);

  // Aplicar tema, modo oscuro, tipografía y CSS propio al autenticarse (HU-12/14/13)
  useEffect(() => {
    if (user) {
      usePreferencesStore.getState().hydrateFromUser();
      void useCssStore.getState().load();
    }
  }, [user]);

  if (!user) {
    return (
      <main className={styles.loading}>
        <p>Cargando…</p>
      </main>
    );
  }

  return <WorkspaceShell />;
}

/**
 * Shell del workspace: grid de 4 columnas × 2 filas (docs/DESIGN_SYSTEM.md).
 * HU-38 (topbar) + HU-28 (rail) + HU-29 (paneles) + HU-20 (URL ?note=).
 */
function WorkspaceShell() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeNoteId = searchParams.get("note");
  const activeNote = useVaultStore((s) =>
    activeNoteId ? s.notas.find((n) => n.id === activeNoteId) ?? null : null,
  );
  const carpetas = useVaultStore((s) => s.carpetas);
  const shareFolder = activeNote?.carpetaId
    ? {
        id: activeNote.carpetaId,
        nombre: carpetas.find((c) => c.id === activeNote.carpetaId)?.nombre ?? "carpeta",
      }
    : null;

  const { activeSection, leftWidth, toggleLeft } = usePanelLayoutStore();
  const vaultId = useAuthStore((s) => s.vaults[0]?.id) ?? null;
  const notas = useVaultStore((s) => s.notas);
  const reconciledRef = useRef(false);

  // Cargar el árbol del vault al entrar, aunque el explorador esté colapsado:
  // hace falta para los títulos de las pestañas y para reconciliar el layout
  // restaurado. Idempotente (treeSeq descarta recargas solapadas).
  useEffect(() => {
    if (vaultId && useVaultStore.getState().vaultId !== vaultId) {
      void useVaultStore.getState().loadTree(vaultId);
    }
  }, [vaultId]);

  // Una vez cargado el árbol, descartar del layout restaurado las pestañas cuyas
  // notas ya no existen (borradas mientras el sistema estaba cerrado).
  useEffect(() => {
    if (reconciledRef.current || notas.length === 0) return;
    reconciledRef.current = true;
    useTabsStore.getState().reconcileNotes(new Set(notas.map((n) => n.id)));
  }, [notas]);

  // La URL es la fuente de navegación (HU-20): abrir la nota en el pane activo
  useEffect(() => {
    if (activeNoteId) useTabsStore.getState().openNote(activeNoteId);
  }, [activeNoteId]);

  // Atajos de paneles (HU-29) y de pestañas (HU-25 CA4/CA7)
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      // Ctrl/Cmd+F abre la búsqueda en la nota, no el buscador del navegador.
      if ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === "f") {
        event.preventDefault();
        useUiStore.getState().setSearchInNoteOpen(true);
        return;
      }
      if (event.ctrlKey && event.code === "Backslash") {
        event.preventDefault();
        // El panel derecho es de cada pane (`DEF-060`), así que el atajo actúa
        // sobre el que tiene el foco, no sobre todos.
        if (event.shiftKey) {
          const { activePaneId, togglePanelMeta } = useTabsStore.getState();
          togglePanelMeta(activePaneId);
        } else {
          toggleLeft();
        }
        return;
      }
      if (event.ctrlKey && !event.shiftKey && event.key.toLowerCase() === "w") {
        event.preventDefault();
        useTabsStore.getState().closeActiveTab();
        syncUrlWithTabs();
        return;
      }
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "t") {
        event.preventDefault();
        useTabsStore.getState().reopenLastClosed();
        syncUrlWithTabs();
        return;
      }
      // Alt+←/→: historial de la pestaña activa (DEF-040). Si el editor ya
      // consumió la pulsación, no se duplica la acción.
      if (event.altKey && !event.ctrlKey && !event.shiftKey && !event.defaultPrevented) {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          navegarHistorialActivo(-1);
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          navegarHistorialActivo(1);
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toggleLeft]);

  /**
   * Botones auxiliares del ratón (DEF-040): 3 = atrás, 4 = adelante. Hasta
   * ahora navegaban el historial del NAVEGADOR (la pila de `router.push` de
   * todas las aperturas, global y sin relación con el pane), que es justamente
   * lo que hacía que "atrás" mostrara cualquier cosa — e incluso podía salirse
   * del workspace. Se cancelan en `mousedown`/`auxclick` (así el navegador no
   * navega) y se enrutan al historial de la pestaña activa.
   */
  useEffect(() => {
    function onMouseDown(event: MouseEvent) {
      if (event.button !== 3 && event.button !== 4) return;
      event.preventDefault();
      navegarHistorialActivo(event.button === 3 ? -1 : 1);
    }
    function onAuxClick(event: MouseEvent) {
      if (event.button === 3 || event.button === 4) event.preventDefault();
    }
    window.addEventListener("mousedown", onMouseDown, { capture: true });
    window.addEventListener("auxclick", onAuxClick, { capture: true });
    return () => {
      window.removeEventListener("mousedown", onMouseDown, { capture: true });
      window.removeEventListener("auxclick", onAuxClick, { capture: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function navegarHistorialActivo(delta: -1 | 1) {
    const { activePaneId, navegarHistorial } = useTabsStore.getState();
    navegarHistorial(activePaneId, delta);
    syncUrlWithTabs();
  }

  // `replace` y no `push` (DEF-040): con historial propio por pestaña, la pila
  // del navegador solo compite y confunde. La URL sigue reflejando la nota activa.
  function syncUrlWithTabs() {
    const nid = useTabsStore.getState().activeNotaId();
    router.replace(nid ? `/workspace?note=${nid}` : "/workspace");
  }

  return (
    <div
      className={styles.workspace}
      style={
        {
          "--mic-panel-left-width": activeSection !== null ? `${leftWidth}px` : "0px",
        } as React.CSSProperties
      }
    >
      <AppTopbar shareFolder={shareFolder} />
      <Rail />
      <LeftPanel />
      <EditorArea />
      <SettingsDrawer />
      <ImportDialogs />
      <ShareModal />
    </div>
  );
}

/** Área central: árbol de panes con pestañas (HU-25/26/27). */
function EditorArea() {
  const root = useTabsStore((s) => s.root);
  return (
    <section className={styles.editorArea}>
      <PaneTree node={root} />
    </section>
  );
}
