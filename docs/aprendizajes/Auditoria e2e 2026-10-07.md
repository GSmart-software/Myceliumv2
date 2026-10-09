# Auditoría e2e 2026-10-07

Uso intensivo de Mycelium **como lo usaría una persona**, a modo de pruebas de extremo a
extremo, para encontrar lo que funciona mal o incomoda. Pedido del usuario el 2026-10-07.
Salieron **40 hallazgos** (`H1`–`H40`): 17 defectos registrados (`DEF-134` a `DEF-150`, el
último es un lote de detalles), 8 mejoras al [[BACKLOG]] (`FUN-S-31` a `FUN-S-35`,
`FUN-M-48` a `FUN-M-50`) y uno que ya estaba pedido (`FUN-M-43`).

- **Versión probada**: `desktop-tauri` en `859388c` (2.4.0 + lo integrado después: `FUN-L-29`,
  `FUN-S-30`), app de desarrollo (`npx tauri dev`).
- **Vault**: «Huerta del barrio» (`C:\Huerta del barrio`), la copia del vault de demostración
  de las capturas de la landing: 50 notas, un `.canvas`, un `.base`, un `.excalidraw`, una
  Espora y recordatorios.
- **Cómo**: la ventana de desarrollo con `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--remote-debugging-port=9222`
  y una `WEBVIEW2_USER_DATA_FOLDER` propia, manejada por CDP con un script de Playwright que
  corre un paso por vez ([cdp.mjs](<auditoria-e2e-2026-10-07/cdp.mjs>); ver [[Ver la UI con Playwright]]).
  Teclado y mouse reales: clics, tipeo con demora, arrastre por pasos.
- **Respaldo**: el vault se copió antes de empezar y se **restauró** al final, porque `H38` le
  reescribió los enlaces.

> [!warning] Coordenadas de captura ≠ coordenadas de clic
> La ventana corre con `devicePixelRatio` 1.25: las capturas salen en 1600×1000 y la página
> mide 1280×800. Un clic en un `<canvas>` (el grafo) con las coordenadas de la captura cae
> en otro lado: hay que dividir por 1.25.

> [!danger] Para cerrar la app de desarrollo, nunca por nombre de imagen
> `taskkill /IM app.exe` cerró también el **Mycelium instalado** del usuario
> (`%LOCALAPPDATA%\Mycelium\app.exe`): los dos ejecutables se llaman `app.exe`. Se cierra por
> PID (el del puerto 3000/9222 o el que lanzó la tarea), nunca por nombre.

## Qué anduvo bien

Autocompletado de `[[`, continuación de listas y tareas, deshacer y rehacer, Ctrl+F en la
nota; renombrar desde el explorador **reparó los 7 enlaces**; papelera con selección y
borrado definitivo con confirmación; la búsqueda salta a la coincidencia y la resalta; mover
arrastrando; confirmación al borrar una carpeta con notas; recordatorios con repetición y
`[[enlaces]]` en el detalle; recarga de una nota cambiada por fuera (sin cambios locales);
estados de tarea; callouts plegables y anidados; KaTeX; terminal (PowerShell en el vault);
ayuda con F1; tabla `.base` con vistas, orden y buscador.

## Hallazgos

### Críticos y graves

| H | Qué pasa | Registro |
|---|---|---|
| H38 | Renombrar una nota a un título que **ya existe en otra carpeta** se permite sin aviso. La nueva, más cerca de la raíz, se queda con todos los `[[Tomate]]`; al renombrarla de nuevo, Mycelium reescribió **los 17 enlaces del cultivo** hacia la nota de riego | `DEF-134` |
| H6, H25 | «Nueva nota» y «Tarjeta de texto» (lienzo) dejan el **foco en el botón**: lo que se escribe enseguida se pierde y cada espacio o Enter **crea otra**. Tipeando «Riego de verano⏎…» se crearon 10 «Sin título» ([nueva-nota-diez-sin-titulo.png](<auditoria-e2e-2026-10-07/nueva-nota-diez-sin-titulo.png>)); en el lienzo quedó una tarjeta vacía apilada ([lienzo-tarjeta-apilada.png](<auditoria-e2e-2026-10-07/lienzo-tarjeta-apilada.png>)) | `DEF-135` |
| H7, H8 | Una de esas creaciones falló con «Error desconocido» como error de runtime, sin aviso al usuario. `lib/api.ts:164` convierte en «Error desconocido» todo error que no sea `Error`, y los rechazos de `invoke` de Tauri son texto | `DEF-136` |
| H28 | Lienzo sin deshacer: **Supr** borra la tarjeta seleccionada sin confirmar y **Ctrl+Z** no la recupera | `DEF-137` |
| H36 | Nota con cambios sin guardar + cambio en disco: lo externo **se pierde en silencio** al guardar | `DEF-138` |

### Funcionan mal

| H | Qué pasa | Registro |
|---|---|---|
| H9 | Renombrar desde el título: Enter confirma y el foco va a `<body>`; lo que se escribe después se pierde | `DEF-139` |
| H21 | Clic en una Espora crea una nota **con el mismo título que la Espora**: dos notas homónimas | `DEF-140` |
| H32 | `[[Tomate#Cuidados]]` se ve como **enlace roto** aunque nota y encabezado existen, y no navega | `DEF-141` |
| H33 | Mermaid en lectura con **tema claro** sobre fondo oscuro (flecha casi invisible) ([mermaid-tema-claro-y-tabla.png](<auditoria-e2e-2026-10-07/mermaid-tema-claro-y-tabla.png>)). Que no se vea en vivo ya era `FUN-M-43` | `DEF-142` |
| H34 | La alineación de columna `---:` se respeta en vivo y **no en lectura** | `DEF-143` |
| H13 | Búsqueda: el texto ignora tildes («pulgon» → Pulgón) pero `clave:valor` no («familia:solanaceas» → 0) | `DEF-144` |
| H14 | `clave:valor` con espacios no encuentra nada: `bancal:"Bancal 1"` → 0 | `DEF-145` |
| H15 | Buscar «Tomate» no pone la nota Tomate primera: sale casi última | `DEF-146` |
| H30 | Excalidraw en inglés («Library», «To move canvas…») | `DEF-147` |
| H16, H19 | Fragmentos de resultados: frontmatter aplastado («cultivo cucurbitáceas Bancal 3…»), markdown crudo y, en un `.canvas`, `\n` literales | `DEF-148` |
| H20 | Grafo con «Nombres: Todos»: faltan etiquetas y otras se pisan con nodos ([grafo-etiquetas.png](<auditoria-e2e-2026-10-07/grafo-etiquetas.png>)) | `DEF-149` |

### Detalles (lote `DEF-150`)

| H | Qué pasa |
|---|---|
| H2 | Al abrir una nota, el explorador resalta su carpeta pero no la despliega |
| H3 | En vivo, las viñetas son «-» y en una tarea queda «- » delante de la casilla |
| H12 | Papelera: el origen de una nota de la raíz se muestra como «/»; tarjetas muy altas |
| H17 | El buscador global tiene **dos** botones de limpiar (el nativo y el propio) ([busqueda-dos-botones.png](<auditoria-e2e-2026-10-07/busqueda-dos-botones.png>)) |
| H22 | Renombrar desde el explorador no preselecciona el nombre |
| H23 | Popup de un recordatorio con tres tipografías (Geist, Source Serif, la del editor) ([calendario-tipografias.png](<auditoria-e2e-2026-10-07/calendario-tipografias.png>)) |
| H24 | Panel del calendario: el título del día se trunca con un hueco grande; «7 de octubre» en dos líneas |
| H26 | La tarjeta nueva del lienzo cae encima de la tarjeta central |
| H27 | Cada tarjeta de texto del lienzo lleva el rótulo «Texto»; el texto en serif |
| H29 | Ordenar por una columna de un `.base` reescribe el archivo (sort guardado y reformateo) sin decirlo |
| H35 | En vivo, las cercas ` ``` ` de un bloque de código quedan visibles con el cursor fuera |
| H37a | Con panes divididos, las pestañas se encogen hasta «T…» en vez de desplazarse ([panes-pestanas-encogidas.png](<auditoria-e2e-2026-10-07/panes-pestanas-encogidas.png>)) |
| H39 | Renombrar con `:` o `?` los cambia por `-` sin avisar |
| H40 | «Ancho de tabulación» ocupa 460px para una cifra; Tipografía sin los «Más» del resto |

### Mejoras (al BACKLOG)

| H | Qué falta | Registro |
|---|---|---|
| H4 | Clic en un enlace roto no hace nada (la ayuda lo documenta así); Obsidian crea la nota | `FUN-S-31` |
| H11 | Menú de una nota sin «Mover a…», «Abrir al lado», «Copiar enlace» | `FUN-S-32` |
| H31 | `==resaltado==` no se dibuja | `FUN-S-33` |
| H1 | Un enlace abierto en pestaña nueva deja «Atrás» deshabilitado: no se puede volver | `FUN-S-34` |
| H37b | «Dividir a la derecha» mueve la pestaña en vez de mostrar la misma nota a los dos lados | `FUN-S-35` |
| H5 | Paleta de comandos con unos 12 comandos | `FUN-M-48` |
| H10 | Explorador sin selección múltiple ni Supr/F2 | `FUN-M-49` |
| H18 | Búsqueda sin `-término`, `OR` ni comparaciones (`kilos:>2`) | `FUN-M-50` |
| H33b | Mermaid en la vista en vivo | `FUN-M-43` (ya estaba) |

## El patrón de fondo

Dos causas explican los más graves:

1. **Las acciones de crear no mueven el foco a lo creado** (`H6`, `H25`, `H9`, `H21`). Mycelium
   crea la nota, la tarjeta o el título y deja al usuario donde estaba. Con el teclado, eso
   no solo incomoda: **multiplica** lo creado y **pierde** lo escrito.
2. **Nada impide dos títulos iguales** (`H38`, `H21`), y la resolución por profundidad hace
   que la recién llegada se quede con los enlaces de la otra sin que se note. El arreglo de
   enlaces al renombrar, que funciona bien, **propaga** el error a todo el vault.

## Relacionadas

- [[Bugs_errores_y_defectos]] · [[bugs-progreso]] — `DEF-134` a `DEF-150`.
- [[BACKLOG]] — `FUN-S-31` a `FUN-S-35`, `FUN-M-48` a `FUN-M-50`.
- [[Auditoria de UI 2026-09-19]] — la auditoría anterior de la interfaz, por mediciones.
- [[Auditoria de codigo 2026-09-26]] — la auditoría del código a tres bandas.
- [[Ver la UI con Playwright]] — cómo enganchar la app por CDP.
- [[Aprendizajes tecnicos]] — mapa del área.
