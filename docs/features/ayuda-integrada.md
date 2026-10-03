# Ayuda integrada

`FUN-L-27` · **ambas** · pedida por el usuario el 2026-10-03 · sin implementar

## Qué se pide

Un apartado en Configuración, «como una wiki o ayuda», para conocer **todo lo que se puede
hacer con Mycelium**: cada herramienta disponible y los estilos especiales que Mycelium
agrega al markdown (el ejemplo del usuario: varios `_` alrededor de un texto lo estilan
distinto que `*`).

## Comportamiento

- **Dónde**: una sección «Ayuda» en la ventana de Configuración, con un índice a la
  izquierda y la página a la derecha, y un buscador por título y contenido.
- **Qué páginas**:
  - **Herramientas**: notas y edición (lectura, en vivo, títulos que renombran), propiedades,
    Esporas, bases, lienzos, dibujos de Excalidraw, draw.io, calendario, grafo, búsqueda,
    terminal, corrector ortográfico, papelera, varios vaults y ventanas, IA del vault
    (framework de instrucciones y MCP), atajos de teclado. Solo las que existen en la versión
    que se está usando: web no muestra la terminal ni draw.io.
  - **Sintaxis propia de Mycelium**: énfasis con `_`, `__`, `___` frente a `*`; callouts y sus
    tipos (y plegables); embeds `![[…]]` de notas, dibujos, diagramas y videos; KaTeX en línea
    y en bloque; Mermaid; tablas editables en el render; enlaces con alias y carpeta.
- **Cada página**: qué es, para qué sirve, cómo se usa en dos o tres pasos, y **ejemplos que
  se ven renderizados** con el mismo motor del editor —el ejemplo es la verdad, no una
  captura—, junto al texto que los produce, con un botón para copiarlo.
- **Desde los ajustes**: una explicación larga de un ajuste (ver `FUN-M-41`) puede llevar un
  «Más en la ayuda» que abre la página correspondiente.

## Lo difícil: que no envejezca

La plantilla de snippets quedó desactualizada sin que nadie lo notara (`DEF-123`). La ayuda
tiene el mismo riesgo multiplicado. Defensas:

1. **Los ejemplos se renderizan en vivo**: si una sintaxis deja de funcionar, la página lo
   muestra roto en vez de mentir.
2. **Una sola fuente donde se pueda**: la referencia de sintaxis comparte material con la
   skill `mycelium-vault` del framework de IA, que ya describe esa misma sintaxis (verificada
   contra Mycelium). Generar las dos desde el mismo texto evita que digan cosas distintas.
3. **Un test** que recorra las páginas y compruebe que cada herramienta registrada en la app
   (por ejemplo, cada tipo de archivo de `lib/extensionesDeTipo`) tiene su página, y que cada
   ejemplo renderiza sin error.
4. **Regla de proceso**: una funcionalidad nueva no se da por terminada sin su página de
   ayuda (sumarlo a [[Verificar antes de integrar]] al implementar esto).

## Criterios de aceptación

1. Configuración tiene una sección «Ayuda» con índice y buscador.
2. Hay una página por cada herramienta disponible en esa versión, y una referencia de la
   sintaxis propia de Mycelium.
3. Los ejemplos se ven renderizados con el motor real y se pueden copiar.
4. El test de cobertura falla si una herramienta no tiene página.
5. Funciona sin conexión (el contenido viaja con la app).

## A decidir al especificar en detalle

- Si la ayuda se abre también como **pestaña** del área de trabajo (para tenerla al lado de
  la nota) además de dentro de Configuración.
- Relación con `FUN-S-05` (vault de ejemplo por defecto): un vault de ejemplo enseña
  haciendo; la ayuda, explicando. Pueden compartir ejemplos.
- Idioma: hoy la interfaz es solo en español; con `FUN-L-13` (idiomas de la interfaz) la
  ayuda tendría que traducirse.

## Relacionadas

- [[BACKLOG]] — `FUN-L-27`, bloque **P** de la agrupación.
- [[ia-framework-vault]] — la skill `mycelium-vault`, la otra descripción de la sintaxis.
- [[Bugs_errores_y_defectos]] — `DEF-123`, la plantilla de snippets desactualizada.
