# Generar el framework de IA en un vault

Cómo se instala en un vault el conjunto de instrucciones que permite a un asistente de
IA por terminal (Claude Code) usar ese vault **como memoria**. La especificación
completa está en [[ia-framework-vault]]; acá va el **procedimiento** y sus reglas.

## Desde la app

**Configuración → Vault → "Asistente IA (Claude Code)"** → botón *Generar
instrucciones IA*.

- Es **opt-in estricto**: nada se escribe sin que el usuario lo pida.
- Solo disponible con **vault en carpeta** (los archivos se escriben en disco).
- La UI muestra la versión **instalada** vs la **disponible** y ofrece
  *Generar* / *Actualizar a vX* / *Regenerar*.

## Qué se escribe

En la raíz del vault: `CLAUDE.md`. En `.claude/`: dos skills
(`mycelium-vault`, `mycelium-memoria`), seis comandos `/vault-*` y el marcador de
versión `mycelium-ia.json`.

> [!warning] `.claude/` no se ve en la app por defecto
> El `.mycignore` por defecto ignora los directorios que empiezan con `.`. Los archivos
> existen en disco y la IA los usa, pero no aparecen en el explorador ni en el grafo.
> Para verlos, editar el `.mycignore` (ver [[mycignore]]).

## Conflictos: nunca se pisa un archivo del usuario

> [!danger] Incidente que originó esta regla
> La primera versión **sobrescribió** el `CLAUDE.md` del repo (que tenía la guía del
> proyecto). Se recuperó con `git restore CLAUDE.md` porque estaba committeado. Sin git
> se habría perdido.

Comportamiento actual, por archivo destino:

| Estado del destino | Acción |
|---|---|
| No existe | Se escribe normalmente |
| Existe y **tiene** la marca `<!-- mycelium-ia v` | Se sobrescribe (es la actualización esperada) |
| Existe y **no** tiene la marca (es del usuario) | **No se toca**; la versión nueva va al lado como `nombre (mycelium-ia vX).md`, y `… (1)`, `… (2)` si ya existiera |

Cuando hay conflictos, además del aviso en la UI se escribe en la raíz del vault el
reporte **`Conflictos instrucciones IA.md`** con `original → generado`.

> [!important] Lección general
> `escribir_nota` (el comando Rust) **sobrescribe sin avisar**. Cualquier generador que
> escriba en el vault del usuario tiene que comprobar existencia **antes**. Ver
> [[Tauri y el WebView]].

## Al actualizar Mycelium

Regla del proyecto: **si Mycelium gana una función que la IA deba conocer, se sube
`FRAMEWORK_IA_VERSION` y se actualizan los templates** en
`frontend/lib/ia/framework.ts`. La versión del framework es **independiente** de la
versión de la app (ver [[Versionado del sistema]]).

Historial: `1.0.0` inicial · `1.1.0` agrega `.mycignore` y la política de conflictos ·
`1.2.0` reenfoca todo a **memoria** (protocolos de recuperación y consolidación, skill
`mycelium-memoria`, comandos `/vault-buscar` y `/vault-recordar`).

## Verificar el markdown generado

Los templates son *template literals* con backticks y escapes (`\[\[` para los grep de
backlinks, `\|` en tablas): conviene **renderizarlos** antes de dar por bueno un
cambio. Truco usado: un script Node que recorta el módulo desde `FRAMEWORK_IA_VERSION`
hasta el cierre de `archivosFramework()`, quita `export`/líneas `type`, evalúa con
`new Function` y escribe los archivos a disco para inspeccionarlos.

## Relacionadas

- [[ia-framework-vault]] — especificación: qué contiene cada archivo y por qué.
- [[mycignore]] — por qué `.claude/` no se ve y cómo cambiarlo.
- [[terminal-integrada]] — dónde corre el asistente.
- [[Mycelium como memoria de la IA]] — el objetivo de fondo.
- [[Mapa de documentacion]] — índice general.
