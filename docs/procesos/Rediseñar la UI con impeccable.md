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
6. **Cierre**: su revisor final y su documentador, que actualiza `DESIGN.md`.

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
