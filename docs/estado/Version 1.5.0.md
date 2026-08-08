# Versión 1.5.0

**Solo desktop** (`desktop-tauri`) · 2026-08-03 · un minor sobre [[Version 1.4.0]]

Un solo tema: **el ancho de tabulación se configura** (`FUN-S-02` · `EDITOR-TAB-WIDTH`).

> [!warning] Probada por el usuario: no cumplía lo que prometía · **corregido después**
> Lo de abajo es lo que se encontró al probarla. Los dos defectos ya están resueltos y
> confirmados en `desktop-tauri` (2026-08-03), pero **el binario 1.5.0 que está en R2 no los
> lleva**: hace falta publicar una `1.5.1`.
>
> `DEF-049` — **no se notaba en los documentos ya escritos**, que era el objetivo. La causa no
> es un fallo de código sino de esta misma spec: `tabSize` solo reescala tabuladores
> literales y el markdown se indenta con espacios; `indentUnit` solo afecta a lo que se
> escriba después. Lo que hacía falta era cambiar **cómo se ve la sangría**, y eso se
> controla por CSS.
>
> `DEF-050` — al cambiarlo desaparecían los indicadores de plegado en la vista de lectura.
>
> Ambos se rehicieron el mismo día: la sangría se controla por CSS (`--mic-tab-width`), el
> valor se **escribe libremente** entre 1 y 16 con **4 por defecto**, y los plegados
> sobreviven al cambio. Ver [[bugs-progreso]].

> [!success] Cerró el circuito de la autoactualización
> Esta versión existía sobre todo para verificar la otra mitad de `FUN-L-14`, y lo hizo: el
> 2026-08-03 una instalación **detectó y aplicó** esta versión posterior. `FUN-L-14` y
> `FUN-L-15` quedan confirmadas —esta fue además la **primera publicada con
> `npm run publicar`**, en su primera ejecución real—.
>
> Queda sin probar solo el **modo avanzado** (`FUN-M-16`), roto hasta `DEF-051`.

## Por qué sube minor y no patch

Se pidió como `1.4.1`, pero la regla del proyecto decide por el efecto, no por el tamaño:
**¿el usuario puede hacer algo que antes no podía?** Sí — elegir cuánto vale una
tabulación, que hasta ahora era un valor fijo de CodeMirror. Eso es funcionalidad nueva →
**minor**, y al subir el minor el patch vuelve a `0`. Ver [[Versionado del sistema]].

Que el cambio sea de cuatro archivos no lo hace patch: el tamaño mide esfuerzo, no impacto.

<!-- notas-release:inicio -->
## Ancho de tabulación configurable

- En **Configuración → Editor → Ancho de tabulación** podés elegir entre **2, 4 u 8
  espacios**.
- Vale para las dos cosas a la vez: cuántos espacios inserta la tecla <kbd>Tab</kbd> y
  cuánto ocupa un tabulador que ya estaba en el archivo.
- El cambio se aplica **al instante en las notas que tengas abiertas**, sin cerrarlas ni
  perder dónde estabas.
- Se nota sobre todo en listas anidadas y bloques de código.

> Antes, la tecla <kbd>Tab</kbd> insertaba 2 espacios y un tabulador del archivo se veía
> como 4. Ahora las dos cosas valen lo mismo, y por defecto **4**. Si preferís lo de antes,
> elegí 2.
<!-- notas-release:fin -->

## Las dos caras que CodeMirror trata por separado

El detalle que hacía falta entender para que esto no quedara a medias: CodeMirror tiene
**dos** ajustes distintos, y por defecto **no coinciden**.

| Ajuste | Qué controla | Valor por defecto |
|---|---|---|
| `tabSize` | Cuántas columnas ocupa un tabulador **ya escrito** en el archivo | 4 |
| `indentUnit` | Qué inserta la tecla <kbd>Tab</kbd> (vía `indentWithTab`) | 2 espacios |

Configurar solo uno habría dejado la mitad del problema: elegir "8 espacios" y ver que Tab
sigue metiendo 2. `lib/editor/tabWidth.ts` fija los dos con el mismo número, que es lo que
alguien espera al elegir un ancho.

**Se indenta con espacios, no con tabuladores**: una lista anidada se ve igual en cualquier
visor, y no se mezclan ambos en un archivo que después edite otra herramienta.

## Dónde vive el código

| Archivo | Qué hace |
|---|---|
| `frontend/lib/editor/tabWidth.ts` | **Nuevo.** `extensionesTab(ancho)` → `tabSize` + `indentUnit` con el mismo valor |
| `frontend/stores/preferencesStore.ts` | `tabWidth` (2/4/8, por defecto 4), `TAB_WIDTHS` y `anchoTabValido()` |
| `frontend/components/settings/EditorSection.tsx` | El selector |
| `frontend/components/editor/NoteEditor.tsx` | `tabCompartment` + el efecto que lo reconfigura al cambiar la preferencia |
| `frontend/lib/editor/cssExtensions.ts` | El editor de CSS usa el mismo ancho |

> [!note] Por qué un compartimento y no recrear la vista
> Cambiar el ancho tenía que verse en las notas **ya abiertas**. Recrear el editor las
> habría recargado, perdiendo cursor y scroll — justo lo que `DEF-039` costó arreglar. El
> compartimento de CodeMirror permite reconfigurar una extensión en caliente, y es el mismo
> mecanismo que ya usaban el modo en vivo y la colaboración.
>
> El editor de CSS no lo necesita: se monta y desmonta con su panel, así que toma el valor
> nuevo al reabrirlo.

## Cómo comprobarlo en la app

1. Configuración → Editor → **Ancho de tabulación**: el selector ofrece 2, 4 y 8.
2. Con una nota abierta, cambiar el valor: la sangría de lo que ya está escrito con
   tabuladores cambia **sin cerrar la nota**, y sin que se mueva el scroll.
3. Pulsar <kbd>Tab</kbd> inserta tantos espacios como diga el ajuste.
4. Abrir el editor de CSS (Configuración → Apariencia → Snippets): usa el mismo ancho.
5. El valor sobrevive a cerrar y abrir Mycelium.

## Lo que esta versión sirvió para probar

Lo importante no era la tabulación, era esto — y **funcionó** el 2026-08-03:

1. La **1.4.0 instalada** a mano (desde `installers/v1.4.0/`), la última instalación manual.
2. Esta **1.5.0** publicada con `npm run publicar`, primera ejecución real del script.
3. La 1.4.0 **la detectó**, mostró este changelog, la instaló y reinició en 1.5.0.

Con eso `FUN-L-14` y `FUN-L-15` quedan verificadas de punta a punta y ninguna versión
posterior necesita instalación manual. Paso a paso en [[Publicar una version]].

## Relacionadas

- [[Version 1.4.0]] — la autoactualización, que esta versión terminó de verificar.
- [[Publicar una version]] — cómo se publica, ahora con el script.
- [[Versionado del sistema]] — por qué esto es minor y no patch.
- [[BACKLOG]] — `FUN-S-02` y el resto del inventario.
- [[Mapa de documentacion]] — índice general.
