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

Desde el framework **2.0.0** (`FUN-L-29`):

- En `CLAUDE.md`, **solo un bloque** entre `<!-- mycelium:inicio vX -->` y
  `<!-- mycelium:fin -->`: el núcleo de ~2 KB. Si el archivo no existe se crea con el bloque;
  si es del usuario, el bloque va arriba y lo suyo queda debajo, intacto.
- En `.claude/`, todo con prefijo `mycelium`: nueve skills `skills/mycelium-*` (con sus
  validadores), seis comandos en `commands/mycelium/` (se siguen llamando `/vault-*`) y el
  marcador de versión `mycelium-ia.json`. Con el control de la IA encendido, además
  `hooks/mycelium-mv-rm.mjs` (y su entrada en `settings.json`, que se fusiona) y `.mcp.json`
  en la raíz.

> [!warning] `.claude/` no se ve en la app por defecto
> El `.mycignore` por defecto ignora los directorios que empiezan con `.`. Los archivos
> existen en disco y la IA los usa, pero no aparecen en el explorador ni en el grafo.
> Para verlos, editar el `.mycignore` (ver [[mycignore]]).

## Nunca se pisa un archivo del usuario

> [!danger] Incidente que originó esta regla
> La primera versión **sobrescribió** el `CLAUDE.md` del repo (que tenía la guía del
> proyecto). Se recuperó con `git restore CLAUDE.md` porque estaba committeado. Sin git
> se habría perdido.

Hasta la 1.8 la regla se cumplía con **copias al lado** (`CLAUDE (mycelium-ia vX).md` y un
reporte `Conflictos instrucciones IA.md`) que nadie integraba. Desde la **2.0.0** no hay
conflictos posibles, porque está separado qué es de quién:

- **De Mycelium** —se reescribe siempre—: el bloque de `CLAUDE.md` y lo que lleva prefijo
  `mycelium` en `.claude/`.
- **Del usuario** —no se toca nunca—: todo lo demás, incluido lo de `CLAUDE.md` fuera del
  bloque, byte a byte.

La migración desde la 1.x (un `CLAUDE.md` viejo, sin tocar o editado; los comandos sueltos
en `.claude/commands/`) está en [[ia-framework-vault]] § «Framework 2.0.0».

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
`mycelium-memoria`, comandos `/vault-buscar` y `/vault-recordar`) · … · `1.7.0` una
skill por herramienta con sus validadores · … · `2.0.0` instrucciones por capas (bloque
gestionado, núcleo de 2 KB, prefijo `mycelium`). El historial completo está en
[[ia-framework-vault]].

> [!warning] El núcleo no crece
> Lo que va en el bloque de `CLAUDE.md` se carga en **cada** sesión. Una función nueva que
> la IA deba conocer va a una skill (o a la `description` de su herramienta del MCP), y el
> núcleo, a lo sumo, gana un puntero. `scripts/test-framework-ia.mjs` falla si el bloque pasa
> de 2,5 KB.

> [!important] Las skills por herramienta NO se editan en `framework.ts`
> Desde la `1.7.0` (`FUN-L-26`) las skills de herramientas (`mycelium-drawio`,
> `-canvas`, `-excalidraw`, `-base`, `-esporas`, `-calendario` y, desde la `2.0.0`,
> `-operar`) se escriben en
> `frontend/lib/ia/borradores/<skill>.md`, y los validadores que viajan con ellas son
> `frontend/scripts/validar-{drawio,canvas,excalidraw}.mjs`. Después de tocar cualquiera:
>
> ```sh
> cd frontend && node scripts/generar-skills-ia.mjs
> ```
>
> Eso regenera `lib/ia/skillsGeneradas.ts`; `scripts/test-skills-generadas.mjs` falla si
> alguien se olvidó. Un validador que viaja **no puede importar nada** fuera de `node:*`
> (en el vault no hay `node_modules`): el generador lo rechaza. Ver
> [[ia-skills-herramientas]].

## Verificar el markdown generado

Los templates son *template literals* con backticks y escapes (`\[\[` para los grep de
backlinks, `\|` en tablas): conviene **renderizarlos** antes de dar por bueno un
cambio. Lo más simple hoy es lo que hace `scripts/test-framework-ia.mjs`: transpilar
`framework.ts` con `typescript`, cambiar `invoke` por un disco en memoria, llamar a
`generarFramework` y volcar el `Map` a una carpeta temporal (fuera del repo) para
leer los archivos y correr los validadores desde ahí. El mismo test tiene la tabla
`DONDE_QUEDO`: cada regla del `CLAUDE.md` 1.8.1 y la skill donde vive ahora; si se reescribe
una frase, se actualiza la fila, no se borra.

## Relacionadas

- [[ia-framework-vault]] — especificación: qué contiene cada archivo y por qué.
- [[mycignore]] — por qué `.claude/` no se ve y cómo cambiarlo.
- [[terminal-integrada]] — dónde corre el asistente.
- [[Mycelium como memoria de la IA]] — el objetivo de fondo.
- [[Mapa de documentacion]] — índice general.
