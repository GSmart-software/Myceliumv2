# Versión 2.4.0

**Solo desktop** (`desktop-tauri`) · 2026-10-06 · sobre [[Version 2.3.0]]

> [!success] Publicada el 2026-10-06 a las 22:43 (UTC)
> La **primera por el circuito de CI** (`FUN-L-28`): PR #3 de `desktop-tauri` a `despliegues`
> (fusionado a las 21:54 UTC, en `f263388`), artefactos de Windows, macOS y Linux bajados del
> run y `npm run publicar -- --ci`, ensayo primero. El script firmó los seis instaladores
> actualizables, verificó cada firma contra la `pubkey` de la app, subió los siete archivos y
> los tres manifiestos, y comprobó que lo que quedó en el bucket es lo firmado (sha256 del
> `.exe` `2d471a84…`). Detalle: el zip de Linux llegó con extensión `.zip.opdownload` (descarga
> del navegador sin renombrar) pero estaba completo; se descomprimió aparte.

La versión de los **archivos del vault**. El explorador deja de esperar al índice y muestra
lo que pasa en el disco al instante (`FUN-M-42`, que completa `FUN-M-14`); cualquier tipo de
archivo se puede soltar desde Windows (`FUN-S-26`), tiene su menú (`FUN-S-27`) y se ve dentro
de las notas si es una imagen (`DEF-126`). Con ella llegan los **estados de tarea**
(`FUN-S-01`), los íconos en los menús del explorador (`FUN-S-28`), el `.mycignore` en una
pestaña (`FUN-S-25`) y el color propio en el título de los callouts (`FUN-S-06`). Absorbe
`DEF-125` a `DEF-129`. Es además la **primera versión compilada por CI** para Windows, macOS y
Linux (`FUN-L-28`), y la del framework de IA `1.8.0`. Investigación de fondo en
[[archivos-del-vault-en-vivo]].

## Por qué sube este dígito

**Minor, y uno solo**: el usuario puede hacer cosas que antes no podía —marcar tareas con
estados, soltar cualquier archivo en el vault, operar sobre imágenes y PDF desde el
explorador— y eso manda. Las correcciones viajan absorbidas ([[Versionado del sistema]]).

<!-- notas-release:inicio -->
## Tus archivos, al instante

### El explorador sigue al disco

- Lo que agregás, movés o borrás **desde fuera de Mycelium** —una nota, una imagen, un PDF, una
  carpeta— aparece en el explorador **al instante**, sin esperar.
- Un botón **«Refrescar»** en el explorador, y al volver a la ventana Mycelium revisa solo si
  se le escapó algún cambio.

### Cualquier archivo

- **Arrastrá cualquier archivo o carpeta** desde el explorador de Windows a una carpeta de
  Mycelium: se copia ahí, con barra de progreso para los grandes. Las carpetas grandes entran
  completas.
- Las **imágenes del vault se ven dentro de las notas** (`![[foto.png]]` o `![](foto.png)`),
  en la edición, en la lectura y al exportar a PDF.
- Clic derecho en una imagen, un PDF o cualquier otro archivo: **abrir, abrir con su programa,
  renombrar, duplicar, guardar una copia, mostrarlo en el explorador o eliminarlo**.
- Los menús del explorador tienen un **ícono por opción**.

### Tareas con estados

- Además de pendiente y hecha: **en curso** `[/]`, **cancelada** `[-]`, **destacada** `[*]`,
  **pospuesta** `[>]`, **pregunta** `[?]`, **importante** `[!]` y **agregada** `[+]`. Con
  clic derecho en la casilla elegís el estado. La tarea hecha se ve apagada, sin tachar.

### Más cómodo

- El **buscador de la nota** encuentra y resalta lo que está dentro de las tablas.
- El `.mycignore` se edita en una **pestaña**, desde Configuración → Vault.
- En el título de un callout, los enlaces y el texto con estilo conservan su color.
- Mac y Linux: Mycelium se puede instalar también en esos sistemas.
<!-- notas-release:fin -->

## Qué entra

| Qué | ID | Dónde |
|---|---|---|
| El árbol del explorador sigue al disco al instante; indexado dirigido; reconciliación y botón «Refrescar» | `FUN-M-42`, `FUN-M-14` | [[archivos-del-vault-en-vivo]] |
| El watcher avisa de cualquier archivo no ignorado | `DEF-127` | [[bugs-progreso]] |
| Soltar cualquier archivo o carpeta desde el SO, con IPC binario y progreso | `FUN-S-26` | [[archivos-del-vault-en-vivo]] |
| Una carpeta soltada de más de 100 elementos entra completa | `DEF-128` | [[bugs-progreso]] |
| Menú contextual para los archivos que no son notas | `FUN-S-27` | [[BACKLOG]] |
| Íconos en los menús del explorador | `FUN-S-28` | [[BACKLOG]] |
| El `.mycignore` se edita en una pestaña del visor | `FUN-S-25` | [[BACKLOG]] |
| Estados de tarea; framework de IA `1.8.0` | `FUN-S-01` | [[estados-de-tarea]] |
| El título del callout no pisa el color propio | `FUN-S-06` | [[estados-de-tarea]] |
| Alternar una tarea dentro de un callout, en lectura, marca la correcta | `DEF-129` | [[bugs-progreso]] |
| El buscador recorre las tablas renderizadas | `DEF-125` | [[bugs-progreso]] |
| Las imágenes del vault se dibujan en las notas | `DEF-126` | [[bugs-progreso]] |
| Instaladores de Windows, macOS y Linux compilados en CI | `FUN-L-28` | [[instaladores-mac-linux]] |

> [!info] Confirmado en la app antes de publicar (2026-10-04)
> `DEF-125`, `DEF-126`, `DEF-127` + `FUN-M-42`, `FUN-S-26` (tras corregir el «Illegal
> invocation» al soltar), `FUN-S-01` y `FUN-S-06`. **Sin confirmar**: `DEF-128`, `DEF-129`,
> `FUN-S-25`, `FUN-S-27` y `FUN-S-28`.

## Cómo comprobarlo en la app

1. **Árbol en vivo**: copiar desde Windows una imagen, un PDF y un `.md` a una carpeta del vault;
   aparecen al instante. Mover una carpeta con contenido desde fuera. Probar «Refrescar».
2. **Soltar**: un archivo grande (barra en MB), una carpeta de más de 100 elementos y el mismo
   archivo dos veces (diálogo de conflicto).
3. **Imágenes**: `![[foto.png|200]]` y `![](captura.png)` en vivo, en lectura y en el PDF.
4. **Menú de archivo**: clic derecho en una imagen; renombrarla con su pestaña abierta.
5. **Tareas**: un ítem con cada símbolo y el menú del clic derecho; alternar una tarea dentro de
   un callout en lectura.
6. **`.mycignore`**: Configuración → Vault → «Editar .mycignore», agregar `Esporas/` y guardar.

## Relacionadas

- [[Version 2.3.0]] — la versión anterior.
- [[Versionado del sistema]] — el criterio del número.
- [[archivos-del-vault-en-vivo]] — la investigación y las tres partes de los archivos.
- [[instaladores-mac-linux]] — la compilación en CI.
- [[BACKLOG]] — el inventario.
- [[Mapa de documentacion]] — índice general.
