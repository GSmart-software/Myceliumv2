# FUN-L-08 — Framework IA del vault (solo desktop)

**HU:** Como usuario que desarrolla proyectos (de IA u otros) documentándolos en
Mycelium, quiero generar en mi vault un conjunto de instrucciones para asistentes
de IA por terminal (Claude Code, corriendo en la terminal integrada FUN-L-07), para
que la IA entienda cómo navegar y mantener mi documentación aprovechando los
vínculos `[[...]]` — la "memoria" navegable que visualiza el grafo.

Referencias estudiadas: `claude-obsidian` (AgriciDaniel) y el enfoque minimalista
de D. Rowse. Este framework toma el punto medio: convenciones claras + pocos
comandos de alto valor.

## Qué genera (v1.0.0)

| Archivo en el vault | Rol |
|---|---|
| `CLAUDE.md` | Instrucciones base: qué es Mycelium, estructura, vínculos, reglas para la IA, funciones del sistema (conocer, no controlar) |
| `.claude/skills/mycelium-vault/SKILL.md` | Referencia completa: sintaxis verificada (wikilinks/alias/embeds/tags/callouts/Mermaid/KaTeX), cómo explorar (backlinks por grep), flujos (crear/renombrar/documentar/responder con evidencia), precauciones |
| `.claude/commands/vault-mapa.md` | `/vault-mapa`: genera/actualiza el MOC "Mapa del vault" |
| `.claude/commands/vault-vincular.md` | `/vault-vincular <nota>`: agrega `[[enlaces]]` a notas relacionadas |
| `.claude/commands/vault-huerfanas.md` | `/vault-huerfanas`: audita huérfanas + enlaces rotos (reporte, no aplica solo) |
| `.claude/commands/vault-nota.md` | `/vault-nota <título>`: crea una nota siguiendo las convenciones (sin dejarla huérfana) |
| `.claude/mycelium-ia.json` | Marcador de versión del framework |

Contenido **verificado contra el código real** de Mycelium: `[[Título|alias]]`,
`![[embed]]`, `![[X.excalidraw]]`, `#tag`, callouts (10 tipos, plegables `-/+`,
anidados), `.mycelium/.trash`, frontmatter YAML aún NO interpretado (FUN-M-04),
renombrar NO reescribe enlaces (FUN-M-08) — la IA debe actualizarlos con grep.

## Versionado

- `FRAMEWORK_IA_VERSION` en `frontend/lib/ia/framework.ts` (hoy `1.0.0`),
  independiente de la versión de la app. **Al agregar funciones a Mycelium que la
  IA deba conocer, subir la versión y actualizar los templates.**
- Cada archivo generado lleva el marcador `<!-- mycelium-ia vX -->`; la versión
  instalada vive en `.claude/mycelium-ia.json`.
- Configuración → Vault muestra instalada vs disponible y ofrece
  Generar / Actualizar / Regenerar. **Solo se genera si el usuario lo pide.**

## UI

Configuración → Vault → "Asistente IA (Claude Code)": descripción + estado de
versión + botón. Solo con **vault en carpeta** (los archivos se escriben en
disco); en SQLite clásico se muestra el motivo.

## Implementación

- Escritura: reutiliza el comando Rust `escribir_nota` (atómico, `ruta_segura`).
- Lectura de versión: comando Rust nuevo `leer_archivo_texto` (devuelve `None` si
  no existe).
- Regenerar sobrescribe SOLO los archivos del framework; no toca el resto.
- El watcher del vault ignora `.claude/` (directorios ocultos), así que generar no
  dispara reindexados.

## Alcance actual (definido)

La IA **entiende** Mycelium (documentos, vínculos, extensiones, metadatos y
funciones) pero **no lo controla**. Control de la app, MCP y demás quedan como
extensiones futuras (ver BACKLOG `FUN-L-08`/`FUN-L-09`).
