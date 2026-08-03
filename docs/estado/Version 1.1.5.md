# Versión 1.1.5

**Solo desktop** (`desktop-tauri`) · 2026-08-01 · cuatro patches sobre [[Version 1.1.1]]

Un solo tema: **leer varias notas en paralelo deja de entorpecerse**. Spec en
`docs/features/navegacion-por-pestana.md`.

> [!warning] Pendiente de comprobación del usuario
> `tsc` quedó en verde, pero **esta capa no tiene tests automáticos y `tsc` no prueba
> comportamiento**. Los tres defectos están **sin confirmar en la app**. El paso a paso
> para verificarlos está más abajo.

## Por qué salta cuatro patches y ningún minor

> [!warning] Este número no se repetiría hoy: sería `1.1.2`
> Fue el **único** release que saltó varios patches de una, y ese salto —con `1.1.2`,
> `1.1.3` y `1.1.4` inexistentes— es lo que hizo revisar la regla el 2026-08-03. El
> proyecto contaba unidades; ahora sigue SemVer estándar: **un release, un incremento**,
> del tamaño del cambio más significativo. Cuatro correcciones juntas son un patch.
>
> **El número se conserva** porque se publicó con él: la versión es la identidad de lo que
> salió, no una etiqueta reescribible. Y no arrastra nada, porque el minor siguiente
> reseteó el patch: `1.2.0` es el mismo número con las dos reglas. Ver
> [[Versionado del sistema]].

Lo que sigue es el razonamiento **con la regla que regía entonces**: cuatro unidades,
ninguna con capacidad nueva.

| Unidad | Qué es |
|---|---|
| `DEF-039` | corrección |
| `DEF-040` | corrección |
| `DEF-041` | corrección |
| Botones de atrás/adelante | mejora de lo existente |

Los botones **no** cuentan como funcionalidad: navegar hacia atrás ya existía, solo que
era una capacidad oculta que exigía botones especiales del ratón. Ponerle botones es
hacer visible lo que ya estaba.

## Qué entra

### `DEF-039` · El scroll se conserva al volver a una pestaña

**La causa raíz no era la restauración sino el guardado.** El scroll se leía en la
limpieza del `useEffect`, y React 18+ ejecuta esa limpieza **después** de sacar el nodo
del DOM; `scrollTop` de un elemento sin caja devuelve `0` por CSSOM. O sea que lo que se
guardaba era siempre el principio del documento, y la restauración funcionaba
perfectamente… restaurando un cero.

- La posición se captura **en vivo** mientras el usuario hace scroll, con
  `EditorView.scrollSnapshot()`, que ancla a un punto del **documento** y no a un píxel.
- Se restaura con el `scrollTo` del constructor de `EditorView`: CodeMirror reaplica el
  objetivo tras cada medición hasta que el height-map se estabiliza. Asignar `scrollTop`
  a mano nunca podría funcionar — al crear la vista solo está medido el viewport y el
  navegador recorta la asignación. Ver [[CodeMirror y la vista en vivo]].
- El scroller del panel de **lectura/dividido** no es el de CodeMirror y no se guardaba
  en ningún lado: ahora se sigue aparte y se restaura reintentando por frames, porque el
  alto real llega tarde (Mermaid, imágenes).

### `DEF-040` · Cada pestaña lleva su propio historial

**No existía ningún historial propio.** El botón auxiliar del ratón navegaba el historial
del **WebView**, alimentado por los `router.push` que disparaba cada apertura desde media
docena de lugares: una lista plana y global, en orden de pulsación, sin relación con qué
pane o pestaña mostró cada nota. De ahí que "atrás" devolviera cualquier cosa e incluso
pudiera salirse del workspace.

- `Tab` gana `historial` + `indice`. Al reemplazar una pestaña de previsualización, la
  nueva **hereda** la línea de la saliente con su documento al final: eso es lo que hace
  que volver a una pestaña y pulsar atrás devuelva lo que **esa** pestaña mostraba antes.
- Activar otra pestaña no es navegación y no agrega entradas. Navegar atrás y abrir otra
  cosa trunca la rama de adelante. Tope de 50 entradas por pestaña.
- Las líneas se depuran junto con las notas: renombres, movimientos, papelera y
  reconciliación al arrancar. Sin eso, "atrás" resucitaría notas borradas.
- Todos los `router.push` de apertura pasaron a `router.replace`: con historial propio,
  la pila del WebView solo competía.

> [!note] Las pestañas guardadas NO se pierden
> Los campos nuevos son opcionales y una pestaña sin ellos se lee como una línea de un
> solo elemento, así que **no se subió la versión del `persist`**. Subirla sin `migrate`
> haría que Zustand descartara el estado y el usuario perdiera todas sus pestañas
> abiertas — que es exactamente lo que pasó con `sidebarViewerStore` entre 1.0.0 y
> 1.1.0. Ver [[Estado con Zustand]].

### `DEF-041` · Reemplazo de la pestaña de previsualización — **endurecido, no confirmado**

> [!warning] Este es el único cambio sin causa raíz identificada
> Se corrigieron tres cosas que **pueden** producir el síntoma, pero no se logró
> reproducir el caso exacto del usuario. Si el defecto persiste, hay que volver acá.

Lo corregido: `splitWithTab` perdía el flag `preview` al duplicar una pestaña (creaba
`{id, notaId}` y descartaba el resto), la preferencia se compara ahora con `=== true` por
si llegara como un valor truthy no booleano, y se evita reabrir la nota que la pestaña
activa ya muestra.

### Botones de atrás/adelante

Dos flechas en la barra de pestañas de **cada pane**, ancladas a la izquierda (la barra
desplaza en horizontal cuando hay muchas pestañas). Se deshabilitan cuando no hay
destino y el tooltip nombra el documento al que llevan ("Atrás: RAMAS"). `Alt+←` /
`Alt+→` hacen lo mismo, y los botones 3 y 4 del ratón se cancelan y se enrutan al
historial de la pestaña.

## Cómo comprobarlo en la app

1. **`DEF-039`**: abrí el [[BACKLOG]], bajá hasta una `FUN-*` concreta, cambiá a otra
   pestaña y volvé → tiene que quedar donde estabas. Repetilo en modo lectura, que usa
   otro scroller.
2. **`DEF-040`**: abrí `RAMAS`, sobre esa pestaña abrí [[BACKLOG]]; en otra pestaña abrí
   `HUs` y reemplazala por [[DESIGN_SYSTEM]]. Volvé a la pestaña del BACKLOG y pulsá
   atrás → tiene que aparecer `RAMAS`, no `DESIGN_SYSTEM`.
3. **`DEF-041`**: con "pestañas de previsualización" activo, abrí A y después B sin tocar
   A → B debe **reemplazar** a A. Después editá A y abrí B: ahí sí debe crear pestaña
   nueva.
4. **Los botones**: que se vean deshabilitados cuando no hay a dónde ir y que el tooltip
   nombre el documento destino.

## Verificación

`npx tsc --noEmit` en verde (exit 0). Nada más: no hay tests de esta capa. Ver
[[Verificar antes de integrar]].

## Instaladores

**Todavía no generados**, igual que los de [[Version 1.1.1]]. Procedimiento en
[[Generar instaladores desktop]].

## Reflejo a web

Pendiente y **explícitamente diferido**: se hará cuando el usuario confirme el
comportamiento en desktop. Ojo que `tabsStore.ts` y `TabBar.tsx` ya divergían por la
terminal y este trabajo los aleja más — no van a poder traerse enteros. Ver
[[Reflejar cambios de desktop a web]] y [[RAMAS]].

## Relacionadas

- [[Version 1.1.1]] — el release anterior.
- [[navegacion-por-pestana]] — la spec, con los criterios de aceptación completos.
- [[Estado con Zustand]] — la trampa de `persist` que este trabajo esquivó.
- [[CodeMirror y la vista en vivo]] — el height-map, clave para el scroll.
- [[Versionado del sistema]] — por qué cuatro patches y ningún minor.
- [[Estado del proyecto]] — situación actual.
