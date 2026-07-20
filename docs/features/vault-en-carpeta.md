# Vault en carpeta: el sistema de archivos como fuente de verdad (desktop)

> Estado: **diseño aprobado, implementación por fases**.
> Alcance: **solo-desktop**. La versión web mantiene la BD como fuente de verdad
> (un navegador no tiene acceso al sistema de archivos del usuario).

## 1. Objetivo

Que las notas vivan como **archivos `.md` reales en una carpeta del usuario**, como
en Obsidian: se pueden abrir con cualquier editor, versionar con git, sincronizar
con Dropbox/Syncthing y sobreviven a que esta app desaparezca.

Hoy todo vive dentro de un único SQLite (`%APPDATA%/com.mycelium.desktop/mycelium.db`):
las notas en la tabla `notas`, el texto en `contenidos`, y las carpetas son un árbol
virtual (`carpetas.padre_id`). No hay ni un `.md` en disco.

## 2. La idea central: invertir quién manda

**No se elimina SQLite.** Cambia su rol:

| | Antes | Después |
|---|---|---|
| Fuente de verdad | SQLite | **Los archivos en disco** |
| Rol de SQLite | Almacén | **Índice derivado y reconstruible** |
| Si se borra el índice | Se pierden las notas | Se regenera releyendo la carpeta |

Es exactamente el modelo de Obsidian (su carpeta `.obsidian/` guarda caché e índices
desechables). La búsqueda FTS5 y el grafo de wikilinks **siguen resolviéndose en SQL**:
si consultaran el disco directamente, el rendimiento se hundiría.

### Por qué esto es viable aquí (hallazgo clave)

Los **wikilinks ya se resuelven por título, no por id** (`grafo.ts`:
`porTitulo.get(destino.toLowerCase())`). El contenido markdown **nunca contiene UUIDs**:
ya es portable y limpio. Los identificadores son un detalle interno de la BD, no
contaminan los archivos. Esto elimina el mayor obstáculo típico de esta migración.

## 3. Layout en disco

```
<carpeta del vault>/
  Proyectos/
    2026/
      plan.md
  notas sueltas.md
  adjuntos/
    diagrama.excalidraw
  .mycelium/            ← equivalente a .obsidian/ (todo desechable)
    index.db            ← el SQLite, ahora índice derivado
    config.json
    .trash/             ← papelera (retención de 30 días, como hoy)
```

- **Carpetas** = directorios reales (deja de existir el árbol virtual).
- **Notas markdown** = archivos `.md`; el **título es el nombre del archivo**.
- **Excalidraw** = archivos `.excalidraw` (ya se exportan así).
- **`.mycelium/`** se ignora al indexar, igual que `.git`/`.obsidian`.

## 4. Decisiones de diseño

### 4.1 Identidad de una nota → **la ruta relativa** (decidido)

Hoy la identidad es un UUID. Con archivos como verdad, la identidad natural es la
**ruta relativa** (`Proyectos/2026/plan.md`), como en Obsidian. **Decisión tomada:
identidad por ruta**, sin UUIDs en los archivos (los `.md` quedan puros).

- El índice mantiene una tabla `notas(ruta PRIMARY KEY, titulo, tipo, mtime, tamano)`.
- Se conserva un `id` estable **derivado de la ruta** para no romper el frontend
  (pestañas, rutas `?note=`, grafo), que hoy referencia notas por id.
- **Consecuencia asumida:** renombrar o mover una nota **desde fuera** de la app
  cambia su identidad. Las pestañas abiertas de esa nota se cierran o se reabren en
  la ruta nueva. Es el comportamiento de Obsidian y es aceptable.

*Alternativa descartada:* incrustar UUIDs en el frontmatter de cada `.md`. Sobrevive a
renombrados externos, pero ensucia los archivos y rompe la pureza que justifica todo
este cambio.

### 4.2 Escritura → **debounce obligatorio**

Hoy cada guardado es un `UPDATE`. Escribir un archivo en disco en cada pulsación es
inviable (y destroza los SSD y los clientes de sincronización).

- Se escribe con **debounce de ~800 ms** tras dejar de teclear, más un *flush* forzado
  al cambiar de nota, cerrar pestaña o cerrar la app.
- Escritura **atómica**: escribir a temporal + `rename` (evita archivos a medias si se
  corta la luz o el proceso muere).

### 4.3 Cambios externos → **watcher con validación por `mtime`**

- Watcher nativo en Rust (crate `notify`) sobre la carpeta del vault.
- Eventos con **debounce** (~300 ms) porque los editores generan ráfagas.
- Al arrancar no se relee todo: se compara `mtime`+tamaño contra el índice y **solo se
  reindexa lo que cambió**.
- **Ignorar los propios escritos** de la app (marca de escritura reciente) para no
  entrar en bucle watcher → reindex → watcher.

### 4.4 Papelera

Borrar mueve el archivo a `.mycelium/.trash/` conservando su ruta original (ya existe
la columna `ruta_original`). Se mantiene la retención de 30 días y la purga.

### 4.5 Conflictos de nombre

El sistema de archivos impone reglas que la BD no tenía: caracteres prohibidos
(`\ / : * ? " < > |`), nombres reservados en Windows (`CON`, `PRN`, `AUX`, `NUL`,
`COM1`…), límite de longitud de ruta y colisiones entre dos notas con el mismo título
en la misma carpeta. Hay que sanear al escribir y desambiguar con sufijos.

## 5. Rendimiento: qué se paga y cómo se mitiga

El usuario acepta **algo menos de rendimiento a cambio de portabilidad**. Costes reales:

| Operación | Antes | Después | Mitigación |
|---|---|---|---|
| Abrir una nota | `SELECT` (~1 ms) | leer archivo (~1-5 ms) | Imperceptible |
| Guardar | `UPDATE` por pulsación | escribir archivo | **Debounce 800 ms** + escritura atómica |
| Buscar (FTS5) | SQL | **igual** (el índice sigue en SQLite) | Sin cambio |
| Grafo/wikilinks | SQL | **igual** | Sin cambio |
| Arranque en frío | abrir DB | indexar el vault | Solo la 1ª vez; luego validación por `mtime` |
| Mover/renombrar carpeta | `UPDATE` | mover en disco + reindexar subárbol | Aceptable |

**Referencia con el vault actual** (354 notas, 459 KB): el indexado inicial es del
orden de cientos de milisegundos. El coste se nota a partir de **miles** de notas.

**Riesgo conocido — carpetas en la nube:** un vault dentro de Dropbox/OneDrive/Drive
genera eventos de watcher constantes y puede provocar reindexados espurios y conflictos
de escritura. Debe documentarse como escenario no recomendado o, al menos, con el
watcher menos agresivo.

## 5bis. Múltiples vaults y selector de arranque (decidido)

Modelo Obsidian completo: los vaults pueden vivir en **cualquier carpeta del
dispositivo** y Mycelium las abre. La app mantiene un **registro de vaults
vinculados** (en el config-dir, fuera de los vaults).

- **Registro** (`vaults.json` en el config-dir): lista de `{ ruta, nombre,
  ultimoAcceso }` + `autoAbrir: ruta | null`.
- **Al arrancar:**
  - Si hay `autoAbrir` → abre ese vault directo.
  - Si no → muestra el **selector de vaults**: lista de vinculados (por acceso
    reciente), botón "Abrir", "Vincular carpeta…" (diálogo del SO), quitar de la
    lista, y un check **"Abrir este vault automáticamente"**.
- **Salir del vault:** una acción dentro del workspace cierra la sesión del vault
  actual y vuelve al selector, para elegir/vincular otro.
- **Vincular** = añadir la carpeta al registro (no copia nada; solo la recuerda).
  **Desvincular** = quitarla del registro (los archivos en disco no se tocan).
- `nombre` por defecto = nombre de la carpeta; editable a futuro.

El "vault abierto" es estado de runtime (qué carpeta usa la sesión actual),
distinto del registro (qué vaults conoce la app).

## 6. Estrategia de arranque: **empezar vacío** (decidido)

No hay migración automática del vault SQLite actual. El modo carpeta es un modo
nuevo que **coexiste** con el SQLite clásico durante el desarrollo:

1. El usuario elige la carpeta del vault (diálogo nativo, ya disponible). Puede estar
   **vacía** o contener ya `.md`/`.excalidraw` (p. ej. una carpeta de Obsidian, o el
   resultado de "Exportar a carpeta" de la opción 1).
2. Se crea `.mycelium/index.db` y se indexa lo que haya (vacío → vault vacío).
3. **El `mycelium.db` clásico no se toca**: queda intacto y separado. Quien quiera
   sembrar la carpeta desde su vault SQLite usa "Exportar a carpeta" (opción 1),
   manualmente.

El modo activo (SQLite clásico vs carpeta) se resuelve por configuración: si hay una
carpeta de vault seleccionada, la app trabaja contra ella; si no, sigue con el SQLite
clásico. A futuro el modo carpeta puede volverse el único de desktop.

## 7. Fases de implementación

1. **Selección y persistencia del vault** — elegir carpeta, guardarla, arrancar contra ella.
2. **Índice derivado** — nuevo esquema (`ruta` como clave), indexador inicial y validación por `mtime`.
3. **Lectura desde disco** — `tree`, `getContenido`, `buscar`, `grafo` sobre el índice+archivos.
4. **Escritura a disco** — crear/renombrar/mover/borrar notas y carpetas, con debounce y escritura atómica.
5. **Watcher** — cambios externos reflejados en la UI.
6. **Migración** — asistente para pasar del vault SQLite al vault en carpeta.
7. **Endurecido** — nombres inválidos, colisiones, rutas largas, papelera, casos borde.

Cada fase se verifica con `cargo check`/`cargo test`, `tsc` y prueba en la app antes de
seguir. Se integra por ramas de feature según el flujo de `CLAUDE.md`.

---

## 8. Cómo volver atrás (SQLite como fuente de verdad)

> Sección pedida explícitamente: si el rendimiento con vaults grandes resulta
> inaceptable, este es el camino de vuelta.

**La vuelta es viable por diseño** y esa es justamente la ventaja de que los archivos
sean texto plano: no hay nada propietario que rescatar.

### Señales que justificarían revertir
- Indexado inicial de varios segundos con vaults grandes (>5.000 notas).
- Watcher consumiendo CPU de forma sostenida, o eventos espurios en carpetas de nube.
- Corrupción o pérdida de datos por conflictos de sincronización externa.
- Latencia perceptible al guardar pese al debounce.

### Procedimiento de vuelta
1. **Importar la carpeta a SQLite**: `collectFromNativeFolder()` + el pipeline de
   importación **ya existen y quedan funcionando**. Un vault en carpeta se reimporta a
   un `mycelium.db` clásico sin escribir código nuevo.
2. **Volver a la capa de datos anterior**: la implementación pre-migración queda en el
   historial de git; el commit de la fase 3 es el punto de corte. No se borra código:
   se sustituye, y `git revert` del rango de fases lo restituye.
3. **Conservar el respaldo**: el `mycelium.db` original nunca se borra en la migración
   (§6.4), así que existe un punto de retorno inmediato para quien no haya escrito
   notas nuevas desde el cambio.

### Diseño que mantiene la puerta abierta
- **No incrustar UUIDs ni metadatos propietarios en los `.md`** (§4.1): los archivos
  siguen siendo markdown puro en ambas direcciones.
- **Mantener el contrato de `lib/api.ts` intacto**: el dispatcher expone las mismas
  rutas (`/notas/:id/contenido`, `/vaults/:id/tree`…). Cambiar de motor de
  almacenamiento no debe tocar los ~53 call-sites del frontend. Esta es la garantía
  más importante para poder ir y volver.
- **El índice es desechable**: nunca debe contener información que no se pueda
  reconstruir releyendo la carpeta.

### Alternativa intermedia (si el problema es solo rendimiento)
Antes de revertir del todo, se puede mantener el modelo de archivos pero **cachear más
agresivamente**: contenido en memoria para las notas abiertas, indexado incremental en
segundo plano y watcher desactivable por configuración. Es mucho menos costoso que
volver atrás.
