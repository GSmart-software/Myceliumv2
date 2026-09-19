# Rediseñar la UI con impeccable

Cómo está montada la skill de diseño **impeccable** en este repo y en qué orden se usa.
Instalada el 2026-09-18 para probar un rediseño de la interfaz, después del experimento
con el tema Sofka (rama `experimento/ui-plana`).

> [!important] Dónde se trabaja
> Rama **`experimento/ui-impeccable`**, creada desde `desktop-tauri` (no desde el
> experimento Sofka, para que la comparación sea limpia). Nada de esto se integra a
> `desktop-tauri` sin que el usuario lo decida.

## Por qué impeccable y no ui-ux-pro-max

Se evaluaron las dos el 2026-09-18.

- **impeccable** ([pbakaus/impeccable](https://github.com/pbakaus/impeccable)): una skill,
  24 comandos, un detector de 61 reglas sin LLM. Lo decisivo: distingue **modos de
  superficie**, y Mycelium es modo *Operate* — familiaridad sobre expresión, una familia
  tipográfica, escala fija en rem, el acento reservado a selección y estado.
- **ui-ux-pro-max** ([nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)):
  **descartada**. Es una base de CSVs con búsqueda por palabras clave. Probada con
  Mycelium, lo clasificó como «landing de FAQ/documentación» y propuso pizarra + azul
  genérico: sirve para proyectos nuevos, no para uno con identidad. Sus 119 pautas UX se
  superponen con el `audit` de impeccable.

## Qué hay instalado y dónde

| Pieza | Dónde | En git |
|---|---|---|
| La skill | `.claude/skills/impeccable/` | No (`.claude/` está ignorado) |
| 4 subagentes (revisor final, documentador, productor de imágenes, aplicador de ediciones) | `.claude/agents/impeccable-*.md` | No |
| El motor (binario Rust) | `~/.impeccable/bin/0.1.5/` | No |
| `PRODUCT.md` y `DESIGN.md` | **`docs/design/`** | Sí |
| El sidecar legible por máquina | `.impeccable/design.json` (raíz) | Sí |

Se instaló **copiando** la skill, no con `npx impeccable install`, para no registrar
el hook que corre el detector después de cada edición: habría corrido también en las
sesiones de correcciones. El detector se corre a mano (ver abajo).

> [!warning] `docs/design/` depende de una variable de entorno
> impeccable solo busca `PRODUCT.md`/`DESIGN.md` en la raíz, en `docs/` y en
> `.agents/context/`. Para que use `docs/design/` está
> `IMPECCABLE_CONTEXT_DIR` en `.claude/settings.local.json`, y **solo la toma una sesión
> nueva**. Sin ella no los encuentra y **escribe copias nuevas en la raíz** — ya pasó
> una vez con `init`. Antes de empezar:
>
> ```sh
> echo $IMPECCABLE_CONTEXT_DIR
> ./.claude/skills/impeccable/scripts/impeccable context --target frontend
> ```
>
> El segundo tiene que mostrar `productPath` y `designPath` dentro de `docs\design\`.

**Pasale siempre el objetivo** (`--target frontend/...`). impeccable busca el código
visual en `app/`, `src/`, `styles/`… desde la raíz y el nuestro está en `frontend/`, así
que sin objetivo informa `hasVisualImplementation: false` y lo trataría como proyecto
nuevo.

## El orden de trabajo

1. ~~`/impeccable init`~~ → `docs/design/PRODUCT.md` (**hecho** 2026-09-18).
2. ~~`/impeccable document`~~ → `docs/design/DESIGN.md` + `.impeccable/design.json`
   (**hecho** 2026-09-18).
3. ~~**Ojos**~~: levantar la app con depuración y engancharse,
   [[Ver la UI con Playwright]] (**verificado** 2026-09-19). `critique` y `audit` valen
   mucho más con capturas de la app real que leyendo código: pasales las seis
   combinaciones de tema × modo, no solo la que esté puesta.
4. **Línea base**, antes de decidir nada:
   - `./.claude/skills/impeccable/scripts/impeccable detect --json frontend/components frontend/styles`
     — mecánico, sin LLM.
   - `/impeccable audit frontend` — puntaje técnico: a11y, rendimiento, tokens, oscuro.
     **Hecho**: [[Auditoria de UI 2026-09-19]], 14/20.
   - `/impeccable critique` **por superficie**: el cascarón (rail, topbar, explorador,
     editor), el grafo, las tablas de Bases, Configuración.
   - El mismo `critique` sobre `experimento/ui-plana`, como evaluación externa del
     experimento Sofka.
5. **Decidir el alcance** con los puntajes a la vista: refinar (`polish`, `typeset`,
   `layout`, `quieter` sobre lo peor puntuado) o rediseñar (su flujo de mundo visual
   nuevo, por el camino *code-led*: no hay generación de imágenes).
   **Hecho, en dos tiempos** (2026-09-19): primero se refinó —colorize, harden, animate,
   adapt, optimize, document, polish; cascarón 20 → 21 → 21, ver
   [[Auditoria de UI 2026-09-19]]— y, con lo estructural a la vista, se arrancó el
   rediseño.
6. **Rediseño — `shape`** (2026-09-19). El usuario vio tres direcciones sorteadas (un
   «plano de hifas» al estilo del mapa de Beck, documentos paralelos al estilo Xanadu y un
   pentagrama de enlaces) y **eligió el estándar de la categoría**: la estructura
   convencional (rail, árbol, pestañas, editor) hecha con todo el oficio, con **VS Code y
   Obsidian como vara**. Paleta y vocabulario fúngico fijos (anotado en [[PRODUCT]]).
   Brief confirmado para la **primera entrega**, un prototipo de la pantalla principal
   (solo desktop):
   - El buscador de arriba pasa a selector rápido y paleta de comandos (Ctrl+O / Ctrl+P):
     resuelve `DEF-090`.
   - Compartir sale de desktop (botón y sección). Tags sale del rail hasta que exista. El
     grafo, con ícono propio (el isotipo).
   - Barra del editor reducida a modos y acciones; el formato, por atajos y un menú.
   - Un solo documento en vivo y en lectura: mismo callout, mismo ancho, título en los dos.
   - Barra de estado al pie con enlaces, citas, palabras y guardado **en texto**; el panel
     de enlaces arranca **cerrado**.
   - Pestañas enfocables y sin truncar con espacio libre.
   - Se conserva: la función, el teclado y la accesibilidad de la tanda anterior, y el
     título con degradé. Grafo, Bases y Configuración heredan tokens, no se rediseñan aún.
   - Abierto: si la fuente de interfaz sigue siendo Geist, y el detalle de la barra de
     estado.
7. **Construir** la primera entrega con la dirección elegida; luego `polish` y un
   `critique` para comparar contra el 21/40.
   **Hecho 2026-09-19 (prototipo)**: paleta de notas y comandos (Ctrl+O / Ctrl+P), barra
   de estado de 24px, «Formato ▾» en lugar de la tira de 17 íconos, «Nuevo ▾» en el
   explorador, pestañas con teclado, la nota a 42rem en vivo y en lectura, Compartir y
   Tags fuera de desktop, isotipo del grafo. El revisor final pidió volver a capturar (la
   primera tanda de capturas tenía tamaños equivocados y el indicador de Next encima) y
   después dio **fix-then-ship**: se aplicaron la hora de guardado desde que se abre la
   nota, el color neutro de la barra de estado, el «…» al extremo derecho, el foco a la
   nota al abrirla desde la paleta y el «Nuevo ▾».
   > [!success] Las dos deudas anteriores al rediseño, cerradas
   > La franja lateral de 3px de los callouts y la celda fantasma de las tablas en vivo:
   > ver la exploración de formas, abajo.

   **Exploración de color (2026-09-19)**: el usuario notó que el prototipo había cambiado
   mucho la UX y poco la UI, y abrió la paleta a la exploración. Se hicieron tres variantes
   (Niebla, Bosque, Papel) contra la actual, comparadas en una página con los 16 combos.
   Prefirió Niebla en oscuro y Bosque en claro, y pidió que las cuatro fueran elegibles: así
   nacieron las [[atmosferas]] (`FUN-M-30`), con la actual rebautizada **Abisal**.

   **Herramientas visibles**: el usuario rechazó el formato y la creación siempre dentro de
   «Formato ▾» y «Nuevo ▾»; vuelven a la vista y solo se agrupan cuando no entran.

   **Exploración de formas (2026-09-19)**: cuatro lenguajes probados en vivo (Actual,
   Suave, Precisa, Luminosa) y elegidos **pieza por pieza**: pestañas y modos de Suave
   (píldoras, control segmentado), árbol y rail de Precisa (filas rectas, barra de 2px),
   callouts y todo el contenido del markdown sin cambios. Se cerraron así las dos deudas
   del revisor: la franja de los callouts queda por decisión del usuario y la celda
   fantasma de las tablas era `DEF-093`.
8. **Cierre**: su revisor final y su documentador, que actualiza `DESIGN.md`.

## Lo que no aplica a Mycelium

- **`live` y `generate`**: necesitan la app en un navegador, y fuera de Tauri la capa
  de datos no carga.
- **Las rondas con *comps***: piden generación de imágenes, que no hay. Queda el camino
  *code-led*, que la propia skill da por válido.
- **Las comprobaciones de móvil** (objetivos táctiles de 44px, capturas a 390px): es una
  app de escritorio.

## Relacionadas

- [[Ver la UI con Playwright]] — los ojos del proceso.
- [[PRODUCT]] · [[DESIGN]] — lo que impeccable lee antes de cada comando.
- [[DESIGN_SYSTEM]] — el sistema de diseño documentado antes de impeccable.
- [[Mapa de documentacion]] — índice general.
