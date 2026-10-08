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
| [[Compilacion y entorno de desarrollo]] | `cargo` sin memoria, `tee` que oculta fallos, `pipefail` que inventa fallos en CI, procesos huérfanos en `:3000` |
| [[Auditoria de codigo 2026-09-26]] | Auditoría a tres bandas (complejidad, eficiencia, código muerto) con mediciones sobre tres vaults, cuatro defectos nuevos y el plan en tandas; los tres informes crudos enlazados desde ahí |
| [[Auditoria e2e 2026-10-07]] | Uso intensivo de la app por CDP, como un usuario: 40 hallazgos, `DEF-134` a `DEF-150` y `FUN-S-31` a `FUN-M-50`; el patrón de fondo (crear no mueve el foco, nada impide dos títulos iguales) y cómo manejar la ventana de desarrollo sin cerrar la instalada |
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
11. **La marca de «hecho» se escribe al final.** Un `.drawio` escrito por una IA desde la
    terminal se abría en blanco, también tras recargar (`DEF-121`): su fila de `notas`
    estaba, la de `contenidos` y la de búsqueda no. El indexador escribe cada tanda en
    varias sentencias **sueltas** —el pool de `tauri-plugin-sql` no garantiza que un
    `BEGIN … COMMIT` caiga en una sola conexión, ver [[Rendimiento de la apertura del vault]]—
    y la primera era la de `notas`, **con el `mtime` del archivo**, que es justo lo que el
    indexado incremental compara para saltear una nota. La secuencia: el watcher ve el
    archivo nuevo → `INSERT INTO notas` con `mtime` al día → algo corta la tanda antes de
    `INSERT INTO contenidos` (una sentencia que falla con el índice ocupado —el log de esa
    sesión tiene un `INSERT` de una sola fila tardando 1,5 s—, o la ventana que se recarga
    a mitad del indexado) → todo indexado posterior ve el `mtime` igual y no la relee
    **nunca más**; `getContenido` devolvía `""` y la vista lo tomaba por un diagrama nuevo.
    No fue la huella de `FUN-M-38` ni una ráfaga borrar+crear: la nota nunca pasó por
    `putContenido` (su `creado_en` = `actualizado_en`, el del indexado) y la limpieza
    habría borrado también la fila de `notas`. El arreglo tiene tres capas: la fila de
    `notas` entra con `mtime` 0 (o el viejo) y el `mtime` real y las huellas van en la
    **última** sentencia de la tanda; cada indexado relee además las notas sin
    `contenidos` o sin fila de búsqueda aunque el `mtime` coincida (repara los índices ya
    dañados); y `getContenido`, si falta la fila, lee el disco y la repone en vez de
    devolver vacío. Mirar el índice real dejó otro hallazgo: en un vault del usuario, 32
    notas tenían su fila de búsqueda sin anotar en `fts_filas` y 5 anotaciones apuntaban a
    filas que ya no existían — lo que deja alternar la 2.1.0 y una versión de desarrollo
    sobre el mismo índice; la reparación las limpia (`ftsBorrarHuerfanas`) antes de
    reescribirlas. **Sin transacción, cada sentencia tiene que dejar el índice en un
    estado del que el siguiente indexado sepa salir; y «la fila no está» no es «vacío».**
12. **`busy_timeout` no cubre todos los «database is locked» de SQLite.** Con WAL y dos
    procesos sobre el mismo archivo hay dos que llegan **sin esperar**: el cambio de modo
    de journal (`PRAGMA journal_mode=WAL`) cuando otro está haciendo lo mismo, y una
    transacción `DEFERRED` que empieza leyendo y después quiere escribir si otro escribió
    en el medio (SQLite no espera para no provocar un interbloqueo). Apareció al probar dos
    servidores MCP arrancando en frío a la vez (`FUN-L-09`). La salida es pedir la
    escritura al empezar —`BEGIN IMMEDIATE`, ahí sí espera— y reintentar la apertura un
    rato. Detalle en [[MCP de Mycelium - memoria]] § 13.2.
13. **Lo que un widget reemplaza deja de ser texto para el editor.** El buscador de la nota
    no resaltaba nada dentro de las tablas renderizadas (`DEF-125`): la búsqueda de
    CodeMirror marca rangos del documento con decoraciones, y sobre un rango que un
    `Decoration.replace` cambió por un widget esa marca no se dibuja. Peor que no verse: se
    **contaba** el markdown oculto (`|`, `---`, `**`) y «siguiente» llevaba a un lugar sin
    nada marcado. Toda función que recorre el texto del editor —buscar, contar, corregir,
    resaltar— tiene que decidir qué hace con los rangos reemplazados: ahí lo que el usuario
    ve es el **DOM del widget**, que se busca aparte (Highlight API, como la lectura en
    `DEF-057`) y que fuera de pantalla no existe, así que la lista se arma desde el modelo
    con el mismo render que usa el widget. Detalle en [[bugs-progreso]].
14. **Una ruta relativa en el HTML es relativa a la página, no al documento que la
    escribió.** Las imágenes del vault no se veían en las notas (`DEF-126`): en lectura,
    `![](foto.png)` salía como `<img src="foto.png">`, que el webview pide relativo a la
    página de la app —no a la carpeta de la nota, ni al disco— y da el ícono roto; en vivo
    no había widget de imagen (el único `![](…)` que se dibujaba era el vídeo, `FUN-S-21`);
    y `![[foto.png]]` se buscaba entre las **notas**, donde una imagen nunca está (no se
    indexa: vive en `vaultStore.otros`). El visor de archivos sí las mostraba porque pasaba
    por `convertFileSrc` (protocolo `asset:`, `FUN-L-11`). Ahora una sola resolución pura
    (`lib/imagenes.ts`: por nombre entre las imágenes del vault; `![](…)` relativo a la nota,
    luego a la raíz) alimenta las dos vistas y la exportación (`lib/imagenesRender.ts`), y la
    lectura deja un hueco sin `src` que quien sabe **qué nota es** rellena con la URL
    `asset:`. **Todo lo que apunta a un archivo del vault se traduce a una URL que el webview
    sepa servir; escrito tal cual, el navegador lo resuelve contra otra cosa.**
15. **Un filtro de eventos tiene que mirar lo mismo que el que muestra.** Una imagen o un PDF
    agregados desde fuera no aparecían en el explorador (`DEF-127`), aunque el recorrido del
    vault los listaba y el explorador los sabía dibujar: el watcher filtraba con otra regla
    —«¿es una nota?»—, pensada cuando el explorador solo mostraba notas, y nadie la revisó
    al aparecer los otros archivos (`FUN-S-03`). Ahora el watcher usa el mismo `.mycignore`
    que el recorrido, y el ruido que no se quiere (temporales de Office, descargas a medias)
    se filtra **en los dos** con la misma función: si solo lo filtrara el watcher, un
    `~$informe.docx` listado por un reindexado cualquiera quedaría colgado en el árbol al
    borrarse. Y al ensanchar el filtro, revisá qué otra cosa dependía de que fuera angosto:
    el `Modify` que Windows emite sobre una **carpeta** cuando cambia algo adentro antes moría
    por no ser nota, y si hubiera pasado, cada guardado de la app habría traído una ruta
    ajena y reindexado (`FUN-M-38`).

16. **Una API que entrega por partes no avisa cuando se la llama una sola vez.**
    `FileSystemDirectoryReader.readEntries` devuelve como mucho 100 entradas por llamada en
    Chromium/WebView2 y hay que repetirla hasta que vuelva vacía; llamarla una vez dejaba
    fuera, sin error, todo lo que pasara de 100 al soltar una carpeta (`DEF-128`). Y los bytes
    por la IPC de Tauri **no van en el JSON**: un `Uint8Array` pasado como `number[]` ocupa
    unas cuatro veces su tamaño (20 MB → 71 MB, ~2,3 s); `invoke(cmd, uint8array, { headers })`
    los manda crudos y Rust los lee de `tauri::ipc::Request` (`InvokeBody::Raw`), con los
    datos en encabezados ASCII (`encodeURIComponent`). Además, un comando **sincrónico** corre
    en el hilo principal: el que mueva archivos grandes va con `#[tauri::command(async)]`
    (`FUN-S-26`, detalle en [[archivos-del-vault-en-vivo]] y [[Tauri y el WebView]]).

17. **Lo que el usuario ve no tiene que esperar a lo que el usuario no ve.** Un archivo
    agregado desde fuera tardaba ~1 s en aparecer en el explorador porque el árbol salía del
    índice: dos debounces (400 + 300 ms) y un indexado completo antes de pintarlo. El evento
    del watcher ya sabía qué había cambiado; ahora dice además **qué hay** en cada ruta (nota,
    otro, carpeta o nada), el árbol se actualiza con eso en el acto (~70 ms) y el índice va
    detrás, solo con esas rutas (`FUN-M-42`, `FUN-M-14`). Tres condiciones lo hicieron
    simple: (1) **el id ya era la ruta**, así que la entrada provisional es la definitiva y no
    hay ids que reconciliar; (2) **aplicar el cambio es idempotente**, así que se puede
    reaplicar lo que el índice todavía no tiene (los «pendientes») encima de cada recarga
    desde el índice, en vez de pelear con las ~15 operaciones que la disparan; y (3) un
    evento que se pierde se repara **comparando con el disco** (reconciliación al foco y botón
    «Refrescar»), no confiando en que llegue. Y al acortar un debounce, mirá qué ruido
    escondía: el temporal de la escritura atómica propia (`nota.md.tmp-<pid>`) no terminaba
    en `.tmp` y pasaba el filtro desde `DEF-127`; con 400 ms se fundía con su renombrado, con
    60 ms podía asomar en el árbol. Detalle en [[archivos-del-vault-en-vivo]].

18. **Para que un contenedor tiña lo de adentro sin pisarlo, que el hijo lea una variable;
    no le fuerces el color.** El título de un callout quedaba gris porque el resaltado pinta
    la cita en un span interno, y se arregló con `.mic-live-callout-head span { color:
    inherit }`: eso alcanzó también a los enlaces y a los `_énfasis_`, que salían del color
    del callout (`FUN-S-06`). La salida no fue un selector más fino sino invertir quién
    decide: la regla de cita usa `var(--mic-cita-color, gris)` y el contenedor define
    `--mic-cita-color: currentColor` —en `color`, equivale a heredar—. Cada regla con color
    propio sigue ganando por su cuenta, y fuera del contenedor no cambia nada. Y su pariente
    de `FUN-S-01`: **dos parsers de la misma sintaxis tienen que decidir con la misma
    condición, y un test tiene que pasarles el mismo documento.** Ni `@lezer/markdown` (vivo)
    ni `remark-gfm` (lectura) aceptaban `[-]`; extender uno solo habría hecho aparecer y
    desaparecer la casilla al cambiar de vista. Detalle en [[estados-de-tarea]] y
    [[CodeMirror y la vista en vivo]].
19. **Un nombre de nodo no dice lo mismo en todo contexto: decidí mirando el padre.** La vista
    en vivo ocultaba todo nodo `URL` fuera de la línea del cursor, pensando en el `(url)` de
    `[texto](url)`, donde lo visible es el texto. Pero GFM también llama `URL` a una dirección
    suelta (`https://…`, `www.…`, un correo) y a la de `<https://…>`, y ahí la URL **es** el
    texto: desaparecía entera (`DEF-132`). Al decorar o esconder un nodo del árbol de
    `@lezer/markdown`, preguntá **dentro de qué** está (`node.node.parent?.name`) antes de
    tratarlo, sobre todo si lo que hacés es ocultarlo. Ver [[bugs-progreso]].
20. **Cuando la referencia es un nombre y no una identidad, toda operación que cambia nombres
    o profundidades cambia a dónde llevan referencias que nadie tocó.** `[[Tomate]]` no
    apunta a un archivo: apunta a «la nota llamada Tomate más cercana a la raíz». Renombrar
    otra nota a «Tomate» en la raíz **robaba** los enlaces del cultivo sin escribir un byte,
    y el renombrado siguiente —que repara «los enlaces que llegan a esta nota» según el
    índice— los reescribía hacia la nota equivocada: el índice había registrado el robo como
    verdad (`DEF-134`). La reparación no puede preguntar «quién enlaza a lo que cambia» sino
    «a dónde llevaba cada enlace **antes**, y a dónde lleva **después**»: se resuelve contra
    los dos estados del vault y se escribe con ruta lo que cambiaría. Y eso hay que leerlo
    antes de la operación, porque después el índice ya re-resolvió. Ver
    [[titulos-homonimos]].
21. **Un botón que crea algo editable tiene que entregar el foco.** Crear es asíncrono y el
    `<button>` pulsado conserva el foco; un botón enfocado se activa con **espacio y Enter**,
    así que lo que el usuario teclea para lo nuevo crea más cosas (`DEF-135`: diez notas
    «Sin título» por escribir un título). Lo creado tiene que tomar el foco cuando exista
    —un pedido de un solo uso que consume quien lo monta, como `pendingMatch`— y el botón
    soltarlo en el clic. Y su pariente: **un actualizador de `setState` tiene que ser puro.**
    El lienzo sorteaba el id de la tarjeta nueva dentro del actualizador y desde ahí la
    marcaba en edición; React lo corre dos veces en desarrollo y se queda con una pasada, así
    que la tarjeta podía tener otro id que el «en edición» y nunca abría su texto. Lo que no
    es determinista (`Math.random`, `Date.now`) y los otros `setState` van afuera. Ver
    [[bugs-progreso]].

## Relacionadas

- [[Estado del proyecto]] — qué está hecho y qué falta; contexto de estos hallazgos.
- [[bugs-progreso]] — checklist de los bugs `DEF-*` donde se descubrieron.
- [[Bugs_errores_y_defectos]] — el reporte original del usuario que los originó.
