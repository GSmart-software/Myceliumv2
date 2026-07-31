# Versión 1.1.0

**Solo desktop** (`desktop-tauri`) · 2026-07-31 · minor sobre [[Version 1.0.0]]

Primera versión donde las dos líneas **se separan**: web sigue en `1.0.0` porque no
recibió ninguno de estos cambios. Es una divergencia esperada y aceptada — ver
[[Diferencias funcionales aceptadas entre versiones]].

## Por qué minor y no patch

El criterio de [[Versionado del sistema]]: funcionalidad nueva compatible (tamaños
S/M/L) → **minor**. Este release trae cinco funcionalidades nuevas (dos de tamaño L),
ninguna rearquitectura y ningún cambio incompatible.

> [!info] El secuenciado del BACKLOG se adelantó
> `FUN-L-07` estaba propuesta para `1.3.0`; el usuario priorizó la línea de IA apenas
> cerrada la 1.0.0. Esperable: el secuenciado de [[BACKLOG]] es un borrador, no un
> compromiso.

## Qué entra

### Línea de IA sobre el vault

El eje del release (ver [[Mycelium como memoria de la IA]]):

- **[[terminal-integrada]]** (`FUN-L-07`) — consola nativa real (PTY/ConPTY) como
  pestaña del workspace: se mueve entre paneles, divide la pantalla y admite varias
  instancias. Panel de **Consolas** en el rail para crear, reabrir, renombrar y
  finalizar; cerrar la pestaña **no** mata el shell. Shell por defecto configurable +
  selector por terminal, "Abrir terminal aquí" en carpetas, y restauración de sesiones
  al reabrir la app.
- **[[ia-framework-vault]]** (`FUN-L-08`) — generador **opt-in** (Configuración →
  Vault) del framework de instrucciones dentro del vault: `CLAUDE.md`, las skills
  `mycelium-vault` y `mycelium-memoria`, y seis comandos `/vault-*`. Versionado propio,
  hoy en **v1.2.0**, con política de **no pisar** archivos del usuario. Ver
  [[Generar el framework de IA en un vault]].
- **[[mycignore]]** (`FUN-M-11`) — qué ignora Mycelium, configurable **por vault** con
  sintaxis tipo `.gitignore`. La antigua regla fija ("ignorar todo directorio que
  empiece con punto") pasa a ser el valor por defecto.

### Grafo

- **Reordenar reglas por arrastre** — las reglas de color y de exclusión se aplican por
  orden (gana la primera que coincide); ahora se reacomodan arrastrando su asa, o con
  ↑/↓ desde el teclado.
- **Optimización del dibujo** — sprites cacheados en vez de un `shadowBlur` por nodo,
  culling por viewport y micro-optimizaciones, sin cambiar el aspecto. Detalle y
  medición en [[Rendimiento del grafo]].
- **Corrección** — las etiquetas de los nodos usaban el `sans-serif` del sistema en vez
  de la tipografía de Mycelium (el canvas no resuelve `var()` en `ctx.font`).

### Herramientas y experiencia

- **Devtools en producción** — F12 / Ctrl+Shift+I abren las herramientas de
  desarrollador también en las builds finales (feature `devtools` del crate `tauri`).
  Útiles para escribir CSS propio y depurar el uso diario.
- **Panel lateral como espacio de pestañas** — el dock de [[def-023-visor-sidebar]] se
  generalizó: cualquier pestaña (nota, grafo, excalidraw, consola) se puede anclar con
  **cualquier** sección activa, no solo con el explorador.

### Documentación

La documentación del proyecto pasó a mantenerse **en Mycelium**, como red de notas
enlazadas: ver [[Mapa de documentacion]].

## Al empaquetar

Los instaladores saldrán como `Mycelium_1.1.0_x64_*` — ver
[[Generar instaladores desktop]]. Recordar `CARGO_BUILD_JOBS=2` y preservar los
artefactos antes de limpiar `target/`.

## Relacionadas

- [[Version 1.0.0]] — el release anterior.
- [[Versionado del sistema]] — criterio y los cuatro archivos a sincronizar.
- [[Estado del proyecto]] — situación actual.
- [[BACKLOG]] — qué sigue.
