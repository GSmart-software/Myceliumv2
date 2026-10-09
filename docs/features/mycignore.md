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
   > Si creás el archivo, repetí las líneas del default que quieras conservar (el editor
   > de Configuración precarga esa plantilla). Desde `FUN-S-30` hay negaciones, así que
   > para **ver** algo que el default oculta ya no hace falta desarmar `.*/`: se agrega
   > `!.claude/` debajo (ver § Negaciones, abajo).
   > Y al revés: los vaults que **ya** tenían `.mycignore` antes de 1.1.1 **no** se
   > benefician solos — hay que agregarles las líneas a mano. No se implementó
   > migración automática: reescribir un archivo del usuario sin pedirlo va contra la
   > política del proyecto.
3. **CA3 — Sintaxis** (subconjunto de `.gitignore`; con negaciones desde `FUN-S-30`):
   - `# comentario` y líneas vacías se omiten.
   - `nombre/` → **directorios** con ese nombre, en cualquier nivel (y su contenido).
   - `nombre` → archivos o carpetas con ese nombre, en cualquier nivel.
   - `ruta/anidada/` (con `/` interno) o `/nombre` (con `/` inicial) → **anclada** a la
     raíz del vault.
   - `*` y `?` → comodines dentro de un segmento (`*.tmp.md`, `.*/`).
   - `**` como segmento entero → cero o más carpetas (`docs/**/borrador.md`,
     `**/tmp/`); al final (`adjuntos/**`), todo lo que hay **dentro**, no la carpeta.
   - `!patrón` → **negación**: vuelve a incluir; `\!` al principio es un `!` literal. Ver
     § Negaciones, abajo.
4. **CA4 — `.mycelium/` siempre ignorado**: la papelera y las preferencias del vault nunca
   se indexan, esté o no listado, **y ninguna negación lo re-incluye** (`!.mycelium/` no
   hace nada: se decide antes de mirar los patrones). (El índice en sí no vive ahí sino en
   el app-data; ver [[Capa de datos del desktop]].)
5. **CA5 — Alcance**: aplica al **indexado** (archivos y carpetas, incluidas las
   vacías) y al **watcher** de cambios externos. Editar el `.mycignore` desde fuera
   de la app también dispara reindex.
6. **CA6 — UI**: Configuración → Vault → "Archivos ignorados (.mycignore)": editor
   de texto con la plantilla comentada, y "Guardar y reindexar" (aplica al instante).

## Negaciones (`FUN-S-30`)

Implementadas en desktop el 2026-10-06 (🛠️, sin confirmar en la app). Motivo: el default
`.*/` oculta `.claude/`, donde viven las normas del vault para la IA, y sin negaciones la
única forma de verlas era desarmar `.*/` y listar a mano cada carpeta oculta (propuesta 8
de [[ia-vaults-intensivos]]).

### Semántica (la de git, estricta)

1. **Gana la última regla que coincide.** Las reglas se leen en orden; una `!` posterior
   re-incluye y una regla normal posterior vuelve a ignorar. `*.log` + `!importante.log`
   muestra `importante.log`; en el orden inverso, no.
2. **Una regla se compara con la ruta misma, no con sus ancestros.** Lo que está dentro de
   una carpeta ignorada cae porque la carpeta cae: `ignorada()` mira primero cada carpeta
   de la ruta, de la raíz hacia abajo, y si alguna está ignorada la ruta también lo está,
   diga lo que diga una `!` sobre ella. Es decir: **no se puede re-incluir un archivo si
   una carpeta que lo contiene está ignorada, salvo re-incluyendo esa carpeta.**
3. `\!` al principio es un `!` literal (para un nombre que empieza con `!`).
4. `.mycelium/` en la raíz se ignora **antes** de mirar los patrones: ninguna `!` lo trae.

Cómo se comporta git con los casos que motivaron esto (verificado contra la documentación
de `gitignore` y su regla «It is not possible to re-include a file if a parent directory of
that file is excluded»):

| `.mycignore` | `.claude/` | `.claude/normas.md` | `.claude/skills/x/SKILL.md` |
|---|---|---|---|
| `.*/` | ignorada | ignorada | ignorada |
| `.*/` + `!.claude/*.md` | ignorada | **ignorada** (la carpeta sigue fuera) | ignorada |
| `.*/` + `!.claude/**` | ignorada | **ignorada** (`a/**` no incluye `a`) | ignorada |
| `.*/` + `!.claude/` | visible | visible | visible |
| `.*/` + `!.claude/` + `.claude/*` + `!.claude/*.md` | visible | visible | ignorada (`skills/` cae por `.claude/*`) |

`!.claude/` sola alcanza para ver todo: dentro de `.claude/` ninguna carpeta empieza con
punto, así que `.*/` ya no las toca. `!.claude/**` es redundante (y sola no sirve).

### Receta: ver las normas de `.claude/` en un vault con el default

`.mycignore` completo para ver **todo** `.claude/`:

```
.*/
node_modules/
target/
dist/
out/
!.claude/
```

`.mycignore` completo para ver **solo los `.md` de primer nivel** de `.claude/` (las normas,
sin las skills ni `settings.json`):

```
.*/
node_modules/
target/
dist/
out/
!.claude/
.claude/*
!.claude/*.md
```

Y todos los `.md` de `.claude/`, en cualquier nivel (re-incluye todas sus carpetas y vuelve a
ignorar lo que no es `.md`):

```
.*/
node_modules/
target/
dist/
out/
!.claude/
.claude/**
!.claude/**/
!.claude/**/*.md
```

> [!info] Por qué no se relajó la regla de git
> Se evaluó permitir que `!.claude/*.md` «abriera» sola la carpeta (como pedía el texto de la
> propuesta). Se descartó: (a) todo lo que se quería ver **se puede** con la regla estricta,
> como muestran las recetas; (b) quien copie un patrón de un `.gitignore` obtiene lo mismo
> que en git, sin sorpresas; y (c) la regla estricta es la que hace **correcta la poda** de
> los recorridos —una carpeta ignorada nunca tiene nada visible dentro, así que no entrar en
> ella no pierde nada—. Relajarla obligaría a recorrer `node_modules/` o `.git/` enteros por
> si alguna `!` posterior rescata algo adentro, que es justo el costo que `FUN-M-12` sacó.

### Cambios de paso, para alinear con git

- **`/` inicial ancla**: antes `/borradores/` se recortaba a `borradores/` y valía en
  cualquier nivel; ahora vale solo en la raíz, como en git. Nadie lo usaba en este repo.
- **`**`**: antes era un segmento con comodín más (un `*`); ahora es «cero o más carpetas».
  Hace falta para las recetas recursivas y para que funcionen los patrones copiados de git.

### Consumidores

Todos pasan por `mycignore::ignorada` y ninguno necesitó cambios: los tres recorridos
(`archivos::recorrer_todo` —índice, explorador, `listar_directorios`—,
`recorrer_observables` —caché del watcher— y `arbol_a_copiar` —importar—) podan la carpeta
ignorada, y por la regla 2 una carpeta re-incluida ya no está ignorada, así que entran solos.
El watcher (`vault_watch::es_relevante`) pregunta por rutas sueltas, y `ignorada` mira los
ancestros por él. El espejo en JS de los scripts de prueba (`scripts/lib-vault-fixture.mjs`,
`ignorado`) se actualizó con la misma semántica.

## Implementación

- `src-tauri/src/mycignore.rs`: parser + matcher (glob por segmento, `**`, patrones
  anclados vs por nombre, `solo_dir`, negaciones), `cargar(base)` con el default (constante
  `DEFAULT`), y `ignorada(rel, es_dir, patrones)`. **Con tests unitarios** (`cargo test
  --lib mycignore`): default de ocultos, default de dependencias/build, `.mycelium`
  siempre, anclados/comodines, sin el default los ocultos sí se indexan, y desde `FUN-S-30`
  orden de las negaciones, re-inclusión de carpeta, archivo dentro de carpeta excluida,
  `\!`, `.mycelium/` ante `!`, las recetas de `.claude/` y `/`+`**`. En `archivos.rs`,
  `recorrer_vault_respeta_las_negaciones` comprueba que el recorrido entra en la carpeta
  re-incluida.
- La plantilla del editor sale de Rust (`mycignore_default`: `CABECERA_PLANTILLA` +
  `DEFAULT`); la cabecera explica la `!` en una línea comentada. Antes la espejaba
  `IGNORE_DEFAULT` de `components/settings/VaultSection.tsx` (auditoría del 2026-09-26, H11).
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
