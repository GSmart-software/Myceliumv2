# Aprendizajes técnicos

Mapa del área **aprendizajes**: causas raíz y trampas que costaron tiempo real en
Mycelium. No es documentación de funcionalidades (eso vive en `docs/features/`, ver
[[Mapa de documentacion]]), sino **conocimiento de depuración**: por qué algo fallaba
y qué principio general dejó.

> [!tip] Antes de depurar algo del editor, del drag & drop o del WebView, leé la nota
> del área. Varias de estas causas raíz se descubrieron después de 2–3 hipótesis
> equivocadas; están escritas para que no se repitan.

## Por área

| Nota | Qué contiene |
|---|---|
| [[CodeMirror y la vista en vivo]] | Height-map, widgets de bloque, gutter desfasado, decoraciones por profundidad |
| [[Drag and drop en Mycelium]] | Los tres sistemas de arrastre que conviven y por qué se estorban entre sí |
| [[Estado con Zustand]] | `persist`, `partialize` y el efecto de `set()` sobre el DOM en el mismo handler |
| [[Tauri y el WebView]] | ConPTY, `dragDropEnabled`, `elementFromPoint`, límites del WebView2 |
| [[Compilacion y entorno de desarrollo]] | `cargo` sin memoria, `tee` que oculta fallos, procesos huérfanos en `:3000` |
| [[Auditoria de codigo 2026-09-26]] | Auditoría a tres bandas (complejidad, eficiencia, código muerto) con mediciones sobre tres vaults, cuatro defectos nuevos y el plan en tandas; los tres informes crudos enlazados desde ahí |
| [[Como construye Obsidian su grafo]] | Por qué el grafo de Obsidian es fluido: índice de enlaces persistente e incremental, grafo como lectura del índice, física en un worker con Barnes-Hut, WebGL; qué copiar y en qué orden |
| [[Rendimiento del grafo]] | Dónde se va el tiempo por frame (repulsión O(n²), `shadowBlur`, flujo animado) y el segundo análisis para más de 1.000 notas (`DEF-109`) |
| [[Rendimiento de la apertura del vault]] | Por qué tarda abrir un vault grande: `.mycignore` insuficiente, 14 MB por IPC, 11.000 statements sueltos |

## Principios que se repiten

1. **Verificá la hipótesis antes de "arreglar".** Varios bugs (notablemente el
   desfase del gutter con tablas, ver [[CodeMirror y la vista en vivo]]) tuvieron dos
   intentos fallidos porque se corrigió el síntoma. El usuario reportando "sigue
   pasando" es la señal de que la causa raíz no estaba encontrada.
2. **Un síntoma que "aparece y desaparece" suele ser un evento cancelado**, no un
   estilo mal aplicado. Ver el caso de `pointercancel` en
   [[Drag and drop en Mycelium]].
3. **Lo que mide el navegador no siempre es lo que ves.** `offsetHeight` ignora
   márgenes; `elementFromPoint` puede devolver un overlay. Cuando un cálculo de
   layout falla, sospechá de la unidad de medida antes que de la lógica.
4. **En el escritorio hay dos mundos** (WebView y Rust): un síntoma "del frontend"
   puede tener causa nativa — el caso de `dragDropEnabled` en
   [[Tauri y el WebView]] es el ejemplo canónico.
5. **Lo que parece basura puede ser deliberado.** Un byte **NUL literal** dentro de un
   template literal (`` `${a}\0${b}` ``) hace que git trate el archivo como **binario**: deja
   de diffear y nadie puede revisarlo. Pasaba en `lib/db/grafo.ts` y en
   `components/editor/PropiedadesTab.tsx`, y al implementar `FUN-M-19` se lo tomó por
   suciedad y se lo reemplazó por espacios — cambiando el separador de una clave compuesta
   por el carácter que **sí** puede aparecer dentro de una ruta. Se escribe `\u0000`: mismo
   valor en runtime, archivo de texto para git. **Si algo parece un descuido y está en
   producción, buscá para qué sirve antes de limpiarlo.**
6. **`position: fixed` sale del flujo, pero NO de la composición.** Un `opacity` (o un
   `transform`, o un `filter`) en cualquier ancestro compone el subárbol entero como una
   imagen, y el elemento «suelto» se pinta dentro de ella igual. El buscador de campos de
   las bases se veía translúcido con un fondo de token opaco, y la causa estaba tres
   niveles más arriba: un `opacity: 0.65` puesto para marcar una condición incompleta.
   Cuando un elemento se ve mal y su propio CSS es correcto, **subí por los ancestros
   antes de tocarle nada**. La salida es el portal al `body`. Regla completa en
   [[DESIGN_SYSTEM]] § Estados visuales comunes.
7. **Al imprimir, Chromium ahorra tinta si no le decís lo contrario.** Sin
   `print-color-adjust: exact`, no dibuja ningún fondo y oscurece los colores claros del
   texto. Las opciones de estilo del PDF (`DEF-024`) funcionaban solo si el usuario tildaba
   «Gráficos de fondo» en el diálogo de impresión, y un día dejaron de verse (`DEF-116`).
   Se comprobó imprimiendo con Edge desde Playwright (`page.pdf({ printBackground: false })`
   imita el diálogo por defecto) y rasterizando con `pdftoppm`: sin la propiedad, blanco y
   negro; con ella, el tema entero. **Todo CSS pensado para imprimir la declara.** En web no
   se veía porque el backend genera el PDF con `PrintBackground = true`.
8. **Una marca dice quién creó un archivo, no quién lo tocó después.** El framework de IA
   decidía si podía sobrescribir un archivo por la marca `<!-- mycelium-ia v` de su primera
   línea; el usuario amplió el `CLAUDE.md` generado sin borrarla, y al actualizar se perdió
   todo lo agregado, sin copia ni aviso (`DEF-118`). Para sobrescribir hace falta saber que
   el archivo **sigue igual a lo que se escribió**: se guarda la huella (sha256) de lo
   generado, y para lo generado antes de guardarla se recalcularon desde git las huellas de
   cada versión publicada, que reconocen el archivo intacto sin adivinar.
9. **«No lo entiendo» no es «no tiene nada».** Los dibujos (`.excalidraw`) y diagramas
   (`.drawio`) que no se podían leer se abrían **vacíos**, y lo primero que se dibujaba
   encima se guardaba sobre el original (`DEF-119`). El error venía de un atajo razonable:
   un archivo recién creado tiene 0 bytes y se abre en blanco, así que el `catch` del
   parseo caía en la misma escena vacía — y en draw.io, lo que ni parecía XML se cambiaba
   por un diagrama nuevo. Con una IA escribiendo esos archivos, un error de sintaxis suyo
   dejaba al usuario ante un lienzo en blanco listo para pisar el trabajo. Son **tres**
   estados, no dos: vacío (editor en blanco), legible (editor) e ilegible (aviso **sin
   editor**, para que nada pueda guardarse encima; `lib/archivosIlegibles.ts`). Y ojo con
   las librerías que «toleran» basura: `restoreElements` de Excalidraw descarta en
   silencio los elementos de tipo desconocido (se perderían al guardar) y **tira** con una
   flecha sin `points`; draw.io embebido no avisa por el protocolo cuando un `load` falla
   —muestra su diálogo, emite `load` igual y deja editar el vacío—, así que el XML se
   revisa con `DOMParser` **antes** de mandárselo. Todo parseo que alimente un editor con
   autoguardado distingue «vacío» de «ilegible».
10. **Si el que llama sabe qué tipo quiere, se lo dice al que busca; no filtra después.**
    Con `Devoluciones.md` en la raíz y el dibujo `Eval/excalidraw/Devoluciones.excalidraw`,
    el embed del dibujo decía «No se pudo cargar el diagrama» (`DEF-120`). El resolutor de
    wikilinks (`lib/wikilinks.ts`) agrupaba por título **sin extensión** y elegía entre
    **todos** los homónimos —nota, dibujo, lienzo— por la ruta más corta; el embed le
    llegaba ya sin `.excalidraw` (`EXCALIDRAW_RE` la recorta), así que ganaba la nota de la
    raíz, y recién después `resolveExcalidrawTarget` la descartaba por no ser un dibujo, en
    vez de elegir **entre** los dibujos. Mismo origen, dos efectos más: `[[Pedido]]` podía
    abrir `Pedido.excalidraw` (o `.base`, por id) en lugar de `Pedido.md`, y una pista de
    carpeta que no calzaba caía a todos los candidatos, de modo que `Otra/x` llevaba a la
    `x` de otra carpeta. Ahora el tipo es parte de la consulta: con extensión solo compiten
    archivos de ese tipo, sin extensión gana el `.md` (como Obsidian), y una pista que no
    calza no resuelve. **Un filtro aplicado al resultado de otro que ya eligió no corrige la
    elección: la descarta.**

## Relacionadas

- [[Estado del proyecto]] — qué está hecho y qué falta; contexto de estos hallazgos.
- [[bugs-progreso]] — checklist de los bugs `DEF-*` donde se descubrieron.
- [[Bugs_errores_y_defectos]] — el reporte original del usuario que los originó.
