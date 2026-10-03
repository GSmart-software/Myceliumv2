# Versión 2.3.0

**Solo desktop** (`desktop-tauri`) · 2026-10-03 · sobre [[Version 2.2.0]]

> [!success] Publicada el 2026-10-03 a las 19:58 (UTC)
> Con `npm run publicar -- --sin-compilar`, sobre la compilación del ensayo (instaladores en
> `installers/v2.3.0/`). El script verificó los tres manifiestos, que la firma coincide con el
> `.sig` y que el `.exe` del bucket es el firmado (sha256 `035c287c…`). El primer ensayo falló
> porque `next build` revisaba recursos binarios de `src-tauri/target`; se arregló excluyendo
> esa carpeta del `tsconfig` (`cc94d8a`).

La versión de la **IA que trabaja con Mycelium**. Dos funcionalidades la definen: el **MCP de
control** (`FUN-L-09`), con el que Claude Code opera la app —muestra cosas, maneja el calendario,
renombra y mueve sin romper enlaces, usa la papelera y el diccionario—, y las **skills por
herramienta** (`FUN-L-26`, framework de IA `1.7.0`), que le enseñan a crear y modificar
diagramas, lienzos y dibujos bien hechos, armar bases, usar Esporas y consultar el calendario.
Con ellas: los lienzos, diagramas y dibujos abiertos **se recargan solos** cuando cambian en
disco y **abren encuadrados**. Viajan además dos mejoras chicas —seleccionar varios en la
papelera (`FUN-S-04`) y la rueda en las flechas del historial (`FUN-S-13`)— y los arreglos
`DEF-118` a `DEF-122` y `DEF-124`. El crate compartido `mycelium-vault` (base de `FUN-L-10`)
entra como infraestructura del MCP, sin cambios visibles.

## Por qué sube este dígito

**Minor, y uno solo**: el usuario puede hacer cosas que antes no podía —dejar que la IA opere
Mycelium y que cree diagramas, lienzos y dibujos con criterio—, y eso manda. Las correcciones y
las mejoras chicas viajan absorbidas ([[Versionado del sistema]]). La `2.2.1` que se anotó para
`DEF-118` nunca salió: la absorbe este minor.

<!-- notas-release:inicio -->
## La IA trabaja con Mycelium

### Claude Code puede operar Mycelium

- Activá **«Dejar que la IA controle Mycelium»** en Configuración → Vault (viene apagado). Desde ahí,
  Claude Code puede **mostrarte** una nota, el grafo o el calendario, saber qué tenés abierto,
  **crear y editar recordatorios**, **renombrar y mover** notas reparando los enlaces, mandar a
  la **papelera** y recuperar, y agregar palabras al **diccionario del vault**.
- Todo lo que hace queda en **«Actividad de la IA»**, en la barra lateral, con un botón para
  **deshacer**. Lo que toca muchas notas a la vez te pide confirmación antes.

### Diagramas, lienzos y dibujos hechos por la IA

- La IA del vault sabe ahora crear y modificar **diagramas de draw.io**, **lienzos** y
  **dibujos de Excalidraw** con las flechas enganchadas, sin cajas encimadas y con el texto que
  entra, y los revisa antes de dártelos. También arma **tablas**, usa tus **Esporas** y responde
  qué tenés en el **calendario**. Regenerá las instrucciones de IA desde Configuración → Vault
  para que las aprenda.
- Si actualizás las instrucciones y ampliaste tu `CLAUDE.md` a mano, **ya no se pisa**: la
  versión nueva se escribe al lado.

### Más cómodo

- Un lienzo, diagrama o dibujo abierto **se actualiza solo** cuando cambia el archivo, y abre
  **encuadrado** en su contenido.
- En la **papelera** podés seleccionar varios y recuperarlos o eliminarlos de una vez.
- Un clic con la **rueda** en las flechas de atrás y adelante abre ese documento en una
  **pestaña nueva**.

### Correcciones

- Un dibujo o diagrama que no se puede leer avisa y **no deja pisar el original**.
- Un archivo creado desde fuera ya no puede quedar abriéndose **vacío**.
- Al abrir la app, los enlaces de las pestañas restauradas ya no aparecen todos rotos.
- Un dibujo y una nota con el mismo nombre ya no se confunden al embeberlos.
- En una ventana de otro vault se pueden **arrastrar las pestañas** para dividir la pantalla.
<!-- notas-release:fin -->

## Qué entra

| Qué | ID | Dónde |
|---|---|---|
| MCP de control: 12 herramientas, interruptor, registro de actividad con Deshacer, confirmación por alcance, hook que frena `mv`/`rm` | `FUN-L-09` | [[mcp-control]] |
| Skills por herramienta (draw.io, canvas, Excalidraw, bases, Esporas, calendario) con validadores; framework de IA `1.7.0` | `FUN-L-26` | [[ia-skills-herramientas]] |
| Lienzos, diagramas y dibujos se recargan desde disco y abren encuadrados | `FUN-L-26` | [[ia-skills-herramientas]] |
| Seleccionar varios en la papelera | `FUN-S-04` | [[BACKLOG]] |
| La rueda en las flechas del historial abre una pestaña nueva | `FUN-S-13` | [[BACKLOG]] |
| Actualizar las instrucciones de IA no pisa un `CLAUDE.md` ampliado | `DEF-118` | [[bugs-progreso]] |
| Un dibujo o diagrama ilegible avisa y no se puede pisar | `DEF-119` | [[bugs-progreso]] |
| Enlaces y embeds respetan el tipo de archivo y la carpeta | `DEF-120` | [[bugs-progreso]] |
| El índice nunca deja una nota sin contenido (y se repara al abrir) | `DEF-121` | [[bugs-progreso]] |
| Los enlaces de las pestañas restauradas se evalúan al cargar el vault | `DEF-122` | [[bugs-progreso]] |
| Las ventanas de otro vault dejan arrastrar pestañas | `DEF-124` | [[bugs-progreso]] |
| Crate `mycelium-vault` compartido por la app y el MCP (infraestructura) | base de `FUN-L-10` | — |

## Cómo comprobarlo en la app

1. **MCP**: Configuración → Vault → encender «Dejar que la IA controle Mycelium»; desde Claude Code,
   pedirle que muestre una nota, que cree un recordatorio y que renombre una nota enlazada;
   verlo en «Actividad de la IA» y deshacer. Recorrido completo en [[mcp-control]] § «Estado al
   cerrar las cuatro partes».
2. **Skills**: regenerar las instrucciones de IA y pedirle a Claude un diagrama, un lienzo y un
   dibujo; abrirlos y ver que las flechas están enganchadas.
3. **Recarga**: con un lienzo abierto, cambiarlo desde la terminal: se actualiza solo.
4. **Papelera**: borrar tres notas, seleccionarlas y recuperarlas de una vez.
5. **Ventanas**: abrir otro vault desde la barra superior y dividir la pantalla arrastrando una
   pestaña.

## Relacionadas

- [[Version 2.2.0]] — la versión anterior.
- [[Versionado del sistema]] — el criterio del número.
- [[BACKLOG]] — el inventario.
- [[Mapa de documentacion]] — índice general.
