# Reflejar cambios de desktop a web

Receta para llevar a `web-cloud` una funcionalidad ya confirmada en `desktop-tauri`.
Es el proceso que más se usó durante la fase de bugs (`DEF-*`) y el que más cuidado
exige: **no se hace con merge ni cherry-pick** entre ramas — ver
[[Implementacion independiente por rama]].

> [!important] Requisito del usuario
> *"Es de vital importancia que verifiques que ese reflejo no genera conflictos y
> realmente funciona en web."* El reflejo **no está hecho** hasta que `tsc` y
> `next build` pasan en un worktree de `web-cloud`.

## Flujo

### 1. Worktree temporal de `web-cloud`

Se trabaja en un worktree aparte para no cambiar de rama en el directorio principal
(donde el usuario tiene la app corriendo):

```sh
git worktree add "$TEMP/mycelium-web-<slug>" web-cloud
```

### 2. Clasificar cada archivo tocado

La clave del proceso. Para cada archivo del cambio, decidir si es **compartido** o
**divergente**:

```sh
# ¿Difiere entre ramas SOLO por este cambio?
git diff --stat web-cloud desktop-tauri -- <archivo>
```

- **Compartido** (idéntico salvo por este cambio): se trae **entero**.
- **Divergente**: se aplica **a mano** o con parche; nunca se trae entero.

Ver la lista viva de archivos divergentes en [[RAMAS]].

### 3. Traer los compartidos y los nuevos

```sh
cd "$TEMP/mycelium-web-<slug>"
git checkout desktop-tauri -- <archivos compartidos y nuevos>
```

### 4. Aplicar los divergentes

Dos técnicas, según el caso:

**a) Parche de tres vías** — cuando el cambio cae en zonas comunes del archivo:

```sh
git diff <baseline> desktop-tauri -- <archivo> > /tmp/parche.patch
git apply --3way --whitespace=nowarn /tmp/parche.patch
```

Suele aplicar con pocos conflictos. Los que aparecen son casi siempre en los
**imports** (cada rama importa lo suyo). Resolverlos a mano.

**b) A mano** — cuando la divergencia es estructural (la lógica **no** es la misma en
web). Ejemplo real: `lib/export.ts`. En desktop el PDF se genera en el cliente
(iframe + `window.print()`); en web se hace **POST al backend .NET** (PuppeteerSharp).
El reflejo de `DEF-024` no fue copiar código, fue **adaptar**: enviar
`css: buildPrintCss(opts)` en el body en vez de `PRINT_CSS`.

> [!warning] Si un parche automático falla con "0 coincidencias"
> No fuerces: es la señal de que el archivo **diverge de verdad**. Leé la versión de
> web y adaptá. Un script que aplica pares old→new debe **abortar** (assert de
> coincidencias) antes de escribir, no dejar el archivo a medias.

### 5. Verificar en serio

```sh
cd frontend
npm ci                                  # el worktree no tiene node_modules
npx tsc --noEmit -p tsconfig.json
npx next build
```

Ambos deben pasar. Ver [[Verificar antes de integrar]].

### 6. Commitear y limpiar

Commit en `web-cloud` con mensaje equivalente al de desktop (adaptado si la
implementación difiere), **sin ninguna atribución de IA** — ver
[[Convenciones de commits]]. Después:

```sh
git worktree remove --force "$TEMP/mycelium-web-<slug>"
```

### 7. Registrar

Marcar el ítem como reflejado en [[bugs-progreso]] (o en la spec de la funcionalidad),
anotando **los dos commits** (desktop y web) y cualquier adaptación hecha.

## Qué salió mal (y cómo evitarlo)

| Situación | Lección |
|---|---|
| Script de pares old→new falló en el par 4 (`export.ts`) | El archivo divergía; el script escribía **después** del loop, así que no dejó daño. Siempre validar todos los pares antes de escribir. |
| Conflicto en imports al aplicar parche | Web importaba `insertRefAtPoint` (que el cambio eliminaba) y el parche traía `revelarEnSistema` (solo-desktop). Resolución: quitar el primero y **no** añadir el segundo. |
| `SettingsDrawer` "parecía" compartido | Diverge: web tiene sección de cuenta y "Cerrar sesión". Se aplicó solo el bloque nuevo a mano. |

## Cuándo NO reflejar

- La funcionalidad es **solo-desktop** por naturaleza (terminal, framework IA,
  `.mycignore`): ver [[Diferencias funcionales aceptadas entre versiones]].
- La semántica en web sería **otra cosa**: entonces no es un reflejo, es una
  funcionalidad nueva de web. Registrarla en [[BACKLOG]] en vez de improvisarla.

## Relacionadas

- [[RAMAS]] — qué archivos divergen (lista viva).
- [[Implementacion independiente por rama]] — por qué no se usa merge entre ramas.
- [[Verificar antes de integrar]] — el detalle de la verificación.
- [[Arquitectura de Mycelium]] — por qué las capas de datos difieren.
- [[Mapa de documentacion]] — índice general.
