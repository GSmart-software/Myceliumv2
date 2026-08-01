# FUN-M-11 — `.mycignore`: qué ignora Mycelium (por vault)

**HU:** Como usuario, quiero decidir qué carpetas y archivos ignora Mycelium en
**este** vault (como un `.gitignore`), para poder ver en la app documentación que
hoy queda oculta por vivir en carpetas con punto (p. ej. `.claude/`), o para
esconder carpetas de trabajo que no son notas.

Antes, Mycelium ignoraba **siempre** todo directorio que empezara con `.` (regla
fija en Rust). Ahora esa regla es el **valor por defecto**, y es configurable.

## Criterios de aceptación

1. **CA1 — Por vault**: la configuración vive en `<vault>/.mycignore`. Cada vault
   tiene la suya; no es una preferencia global de la app.
2. **CA2 — Por defecto**: sin archivo, se ignoran los directorios ocultos y las
   carpetas de dependencias/compilación. Equivale a un `.mycignore` con:

   ```
   .*/
   node_modules/
   target/
   dist/
   out/
   ```

   > [!info] El default cambió en 1.1.1
   > Hasta [[Version 1.1.0]] el default era solo `.*/` (el comportamiento histórico).
   > Abrir un repo como vault —el caso de uso central de
   > [[Mycelium como memoria de la IA]]— indexaba entonces miles de README de
   > dependencias: 1830 archivos donde había ~50 notas. Se amplió en `FUN-M-12`
   > ([[Version 1.1.1]]); el diagnóstico está en
   > [[Rendimiento de la apertura del vault]].
   >
   > `build/` y `vendor/` quedaron **fuera** a propósito: es más probable que sean
   > carpetas legítimas de notas que ruido de compilación.

   > [!warning] Un `.mycignore` presente reemplaza al default por completo
   > No hay negaciones en la sintaxis. Si creás el archivo, repetí las líneas del
   > default que quieras conservar (el editor de Configuración precarga esa plantilla).
   > Y al revés: los vaults que **ya** tenían `.mycignore` antes de 1.1.1 **no** se
   > benefician solos — hay que agregarles las líneas a mano. No se implementó
   > migración automática: reescribir un archivo del usuario sin pedirlo va contra la
   > política del proyecto.
3. **CA3 — Sintaxis** (subconjunto de `.gitignore`, sin negaciones):
   - `# comentario` y líneas vacías se omiten.
   - `nombre/` → **directorios** con ese nombre, en cualquier nivel (y su contenido).
   - `nombre` → archivos o carpetas con ese nombre, en cualquier nivel.
   - `ruta/anidada/` (con `/` interno) → **anclada** a la raíz del vault.
   - `*` y `?` → comodines dentro de un segmento (`*.tmp.md`, `.*/`).
4. **CA4 — `.mycelium/` siempre ignorado**: el índice interno y la papelera nunca
   se indexan, esté o no listado.
5. **CA5 — Alcance**: aplica al **indexado** (archivos y carpetas, incluidas las
   vacías) y al **watcher** de cambios externos. Editar el `.mycignore` desde fuera
   de la app también dispara reindex.
6. **CA6 — UI**: Configuración → Vault → "Archivos ignorados (.mycignore)": editor
   de texto con la plantilla comentada, y "Guardar y reindexar" (aplica al instante).

## Implementación

- `src-tauri/src/mycignore.rs`: parser + matcher (glob por segmento, patrones
  anclados vs por nombre, `solo_dir`), `cargar(base)` con el default (constante
  `DEFAULT`), y `ignorada(rel, es_dir, patrones)`. **Con tests unitarios** (`cargo test
  --lib mycignore`: 5 casos — default de ocultos, default de dependencias/build,
  `.mycelium` siempre, anclados/comodines, y que sin el default los ocultos sí se
  indexan).
- La plantilla `IGNORE_DEFAULT` de `components/settings/VaultSection.tsx` **espeja**
  esa constante: si cambia una, cambia la otra, o el editor deja de ofrecer "lo mismo
  que sin archivo".
- Los templates del framework de IA (`lib/ia/framework.ts`) también describen el
  default en dos lugares (regla 9 del `CLAUDE.md` y la sección `.mycignore` de la skill
  `mycelium-vault`): cambiarlo obliga a subir `FRAMEWORK_IA_VERSION`. Ver
  [[Versionado del sistema]].
- `archivos.rs`: `listar_archivos_meta` y `listar_directorios` cargan los patrones
  y los pasan a los walkers; se eliminó el filtro fijo `es_oculto` de esos caminos
  (sigue usándose en la importación de Obsidian, que es otro flujo).
- `vault_watch.rs`: el watcher ya no descarta rutas ocultas por sí mismo; usa los
  patrones (recargados por ráfaga) y trata `.mycignore` como cambio relevante.
- UI en `components/settings/VaultSection.tsx` (escribe con `escribir_nota`, luego
  `indexarVault` + `loadTree`).

## Nota sobre la versión web

En **web** no hay carpeta en disco: las notas viven en la base de datos, así que no
existe un árbol de archivos que "ignorar" al indexar. La funcionalidad equivalente
sería: (a) patrones de ignore al **importar** un vault de Obsidian (hoy `.obsidian/`
está hardcodeado) y (b) filtro de visualización del árbol, con la config guardada
como preferencia del vault en el backend. Queda registrado en el BACKLOG
(`FUN-M-11`, parte web) porque requiere tocar el backend .NET.

## Relacionadas

- [[Capa de datos del desktop]] — el indexado y el watcher que consumen estos patrones.
- [[vault-en-carpeta]] — el modelo de vault donde aplica.
- [[Generar el framework de IA en un vault]] — por qué `.claude/` no se ve por defecto.
- [[Rendimiento de la apertura del vault]] — por qué el default se amplió en 1.1.1.
- [[Version 1.1.1]] — el release del default nuevo.
- [[BACKLOG]] — la parte web pendiente (`FUN-M-11`).
