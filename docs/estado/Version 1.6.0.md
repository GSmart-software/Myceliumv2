# Versión 1.6.0

> [!warning] Esta versión **nunca se publicó**
> Nadie la tiene instalada: quedó absorbida por la [[Version 1.6.2]], que es la que salta
> desde la 1.5.0 y cuyo changelog cubre las tres. Esta nota se conserva por el detalle de qué
> entró y por qué, no como un release que alguien haya recibido.

**Solo desktop** (`desktop-tauri`) · 2026-08-13 · sobre [[Version 1.5.0]]

Un tema: **el vault se mira de más maneras**. Entran tres tipos de superficie nueva —las
bases (`FUN-L-03`), el canvas (`FUN-L-18`) y la pantalla de referencias (`FUN-L-17`, con el
núcleo de `FUN-M-17`)— y, de paso, las correcciones del 2026-08-03 que nunca llegaron a
publicarse.

> [!important] Esta versión NO se publicó todavía
> El número está puesto en los cinco archivos, pero no se generó instalador ni se subió a
> R2: primero se van a corregir defectos. Cuando se publique, el proceso es
> [[Publicar una version]].

## Por qué sube este dígito

El usuario puede hacer varias cosas que antes no podía —consultar el vault como una tabla,
disponer notas en un lienzo, adoptar un proyecto que ya existía— así que es **minor**.

Y es **uno solo**. El tamaño del salto lo decide el cambio más significativo, nunca cuántos
cambios lleva: tres funcionalidades juntas son un minor, que además **absorbe** las
correcciones que vengan con ellas. Por eso la `1.5.1` que estaba prevista ya no existe —
`DEF-046`, `DEF-049`, `DEF-050` y `DEF-051` viajan acá dentro. Ver
[[Versionado del sistema]].

## Qué entra

| Qué | ID | Detalle |
|---|---|---|
| **Bases**: el archivo `.base` agrega notas por sus propiedades en una tabla | `FUN-L-03` | [[bases-tabla]] |
| **Canvas**: el archivo `.canvas`, notas y textos en el espacio | `FUN-L-18` | [[canvas]] |
| **Referencias del vault**: auditar y convertir referencias sin estructura | `FUN-L-17` + núcleo de `FUN-M-17` | [[auditoria-y-relinkeado]] |
| La papelera recupera de verdad, y el borrado va a la del sistema | `DEF-046` | [[bugs-progreso]] |
| El ancho de tabulación se nota en lo ya escrito, y no rompe el plegado | `DEF-049` · `DEF-050` | |
| Se vuelve a preguntar antes de borrar | `DEF-051` | |

Las tres funcionalidades comparten un mismo criterio, que es lo que las emparenta más que
el calendario: **las tres adoptan un formato de Obsidian** —`.base`, JSON Canvas y los
`[[wikilinks]]` como destino de la conversión— para que el vault siga siendo intercambiable.

<!-- notas-release:inicio -->
## Tu vault, de tres maneras nuevas

- **Tablas.** Un archivo de tipo *base* reúne tus notas por sus propiedades y las muestra
  en una tabla, con filtros y columnas que elegís vos. Sirve para índices, catálogos y
  seguimientos, sin salir de Markdown.
- **Lienzos.** Un *canvas* te deja poner notas y textos en el espacio y unirlos con
  flechas. Las tarjetas pueden ser una nota de verdad —se ve su contenido en vivo— y los
  enlaces que escribas dentro funcionan y navegan. Ahora también podés pintarlas.
- **Adoptar un proyecto que ya tenías.** Si abriste Mycelium sobre documentos que se
  referencian entre sí «a mano» y el grafo se veía vacío, hay una pantalla que los
  encuentra y los convierte en enlaces de verdad. Audita sin tocar nada, y al convertir
  deja respaldo y permite deshacer.

Los dos tipos de archivo usan el mismo formato que Obsidian, así que se abren allá y al
revés.

**Además**: lo que mandás a la papelera vuelve a poder recuperarse (y al borrarlo del todo
va a la papelera del sistema), el ancho de tabulación se nota en los documentos que ya
tenías escritos, y vuelve a preguntarse antes de borrar una carpeta o una plantilla.
<!-- notas-release:fin -->

## Cómo comprobarlo en la app

1. **Base**: botón de la barra del explorador → se abre la tabla → *Filtros* → añadir
   `estado es igual a activo` → la tabla se recorta. *Columnas* → marcar una propiedad →
   aparece. *Fuente* → se ve el YAML y se puede editar a mano.
2. **Canvas**: botón de la barra → *Tarjeta de texto* → doble clic para escribir
   `[[BACKLOG]]` → clic fuera → el enlace navega. Arrastrar desde un ancla hasta otra
   tarjeta crea una flecha. Rueda sobre una tarjeta con scroll: **solo** desplaza.
3. **Interoperabilidad** (lo que más importa de las dos): abrir el `.base` y el `.canvas`
   en Obsidian y comprobar que se ven igual.
4. **Referencias**: Configuración → Vault → *Auditar las referencias*. Comprobar con `git
   status` que auditar **no cambió ningún archivo**. Después, *Simulacro* antes de
   convertir.
5. **Papelera**: borrar una nota → aparece en la papelera → recuperarla. Borrarla del todo
   → está en la papelera de Windows.

## Lo que queda pendiente

- **Confirmar en la app**: nada de esto lo miró todavía el usuario en pantalla.
- **El framework de IA se quedó atrás.** Sigue en `1.4.0` y no conoce ni los `.base`, ni
  los `.canvas`, ni el léxico de `.claude/enlaces-lexico.json` que la pantalla de
  referencias comparte con él. Subirlo a `1.5.0` es trabajo aparte, ya especificado en
  [[auditoria-y-relinkeado]] § 10, y arrastra los dos comandos que faltan de `FUN-M-17`.
- **En web**, un canvas todavía no aporta aristas al grafo (ver [[RAMAS]]).
- `FUN-M-16` (modo avanzado del updater) sigue sin probarse.

## Relacionadas

- [[Version 1.5.0]] — la versión anterior.
- [[Version 1.1.0 de web]] — la línea web, con su propia numeración.
- [[Versionado del sistema]] — por qué esto es un minor y uno solo.
- [[Publicar una version]] — cómo se publica, cuando toque.
- [[BACKLOG]] — el inventario.
- [[Mapa de documentacion]] — índice general.
