# Acceso nativo al sistema de archivos (SOLO desktop)

## Objetivo

En la versión de escritorio todo el vault vive dentro de un único SQLite
(`%APPDATA%/com.mycelium.desktop/mycelium.db`): las notas están en la tabla
`contenidos` y las carpetas son un árbol virtual. No hay ningún `.md` en disco.

Hasta ahora exportar/importar pasaba por el navegador: el ZIP se descargaba a
`Downloads` y la importación de carpetas usaba `<input type="file" webkitdirectory>`.
Es UX de web dentro de una app nativa, y deja los datos cautivos de la base.

Esta feature añade **exportar el vault a una carpeta real** (árbol de `.md`) e
**importar desde una carpeta real**, con los diálogos nativos del SO. Con eso el
vault puede versionarse con git o sincronizarse con Dropbox/OneDrive.

El export a `.zip` y el import de `.zip` se **conservan**: siguen siendo lo más
cómodo para compartir o hacer un backup puntual.

## Decisión de arquitectura: la E/S se hace en Rust

Toda lectura/escritura de archivos ocurre en **comandos propios de Rust**, no con
`tauri-plugin-fs` desde JS.

Motivo: en Tauri v2 el plugin `fs` trabaja con un *scope* declarado en las
capabilities. Las rutas que aquí interesan son arbitrarias — las elige el usuario
en tiempo de ejecución con el selector de carpeta — y ampliar el scope para
cubrirlas termina en un permiso demasiado abierto o en fricción constante con el
scope runtime. Desde Rust el acceso al FS es directo y la superficie expuesta al
frontend queda acotada exactamente a los tres comandos de abajo.

Del lado JS solo se usa `tauri-plugin-dialog` (`open({ directory: true })`) para
los selectores de carpeta; requiere el permiso `dialog:default` en
`src-tauri/capabilities/default.json`. Los comandos propios no requieren permiso.

## Comandos expuestos (`src-tauri/src/archivos.rs`)

| Comando | Firma | Qué hace |
|---|---|---|
| `exportar_a_carpeta` | `(destino: String, archivos: Vec<ArchivoExport>) -> Result<usize, String>` | Crea los subdirectorios necesarios y escribe cada archivo en UTF-8. Devuelve cuántos escribió. Sobrescribe los homónimos. |
| `leer_carpeta` | `(origen: String) -> Result<Vec<ArchivoLeido>, String>` | Recorre `origen` recursivamente y devuelve los `.md` y `.excalidraw` con su ruta relativa (separador `/`) y contenido UTF-8. |
| `carpeta_no_vacia` | `(ruta: String) -> Result<bool, String>` | `true` si la carpeta tiene alguna entrada. Sirve para la confirmación de sobrescritura. |

`ArchivoExport { ruta_relativa, contenido }` y `ArchivoLeido { ruta_relativa, contenido }`.

Reglas de `leer_carpeta`:
- Ignora los directorios **ocultos** (nombre que empieza por `.`): `.git`,
  `.obsidian`, etc. El pipeline de importación además filtra `.obsidian/` por su
  cuenta, así que la regla es redundante pero barata.
- Omite en silencio los archivos que no se leen como UTF-8 (binarios, otra
  codificación): la importación es best-effort.

Los errores se devuelven como `String` legible y la UI los muestra tal cual (no se
tragan).

## Seguridad: path traversal

El frontend arma las rutas relativas a partir de **títulos de nota y nombres de
carpeta escritos por el usuario**. Aunque `safeName()` ya sanea en TS, el comando
Rust no confía en eso: `ruta_segura()` recompone cada ruta componente a componente
sobre el destino y **rechaza** `..` (`Component::ParentDir`), rutas absolutas
(`RootDir`) y prefijos de unidad de Windows (`Prefix`), además de comprobar
`starts_with(base)` al final. Cualquier intento de escaparse aborta la exportación
con un error. Hay un test unitario (`rechaza_escapes_de_la_carpeta_destino`).

## Flujo — Exportar a carpeta

1. Botón **"Exportar a carpeta…"** en Ajustes → Vault.
2. `open({ directory: true })` → si el usuario cancela, no pasa nada.
3. `carpeta_no_vacia(destino)`; si es `true`, `window.confirm` avisando que los
   archivos con el mismo nombre se sobrescriben. Si cancela, se aborta.
4. `recolectarArchivosVault()` (en `lib/export.ts`) recorre `useVaultStore.notas`,
   arma `notePath(carpetaId) + safeName(titulo) + ".md"`, lee el contenido con
   `fetchNoteContent` y añade los diagramas Excalidraw referenciados como
   `adjuntos/<id>.excalidraw`. Reporta progreso por nota.
5. `exportar_a_carpeta(destino, archivos)` → mensaje final con el número de
   archivos escritos y la ruta.

`recolectarArchivosVault` es un **refactor extraído de `exportVaultZip`**:
`exportVaultZip` ahora la consume y su comportamiento observable no cambia.

## Flujo — Importar desde carpeta

1. Botón **"Importar desde carpeta…"** (reemplaza al `<input webkitdirectory>`).
2. `open({ directory: true })`.
3. `collectFromNativeFolder(origen)` invoca `leer_carpeta` y envuelve cada
   resultado en un `File` con su `path` relativo, produciendo `CollectedFile[]`.
4. Se pasa a `useImportStore.run(files, activeFolderId, "Vault de Obsidian")`: el
   pipeline existente (creación de carpetas, resolución de conflictos, progreso,
   resumen) **no cambia**.
5. Si la carpeta no tiene ninguna nota, se avisa en la UI.

## Fuera de alcance

- No hay sincronización bidireccional ni "vault abierto sobre una carpeta": son
  operaciones puntuales de export/import, la fuente de verdad sigue siendo SQLite.
- Los adjuntos binarios (imágenes, PDF) siguen sin almacenarse en el vault; el
  export solo emite `.md` y `.excalidraw`.

## Relacionadas

- [[vault-en-carpeta]] — el modelo que habilitó esta integración.
- [[Capa de datos del desktop]] — dónde encaja en la arquitectura.
- [[Tauri y el WebView]] — límites del WebView y comandos nativos.
