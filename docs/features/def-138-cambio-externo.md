---
tags: [spec, editor, defecto]
---
# DEF-138 · Cambio externo con cambios sin guardar: avisar y elegir

Spec del arreglo de `DEF-138` ([[Bugs_errores_y_defectos]], estado en [[bugs-progreso]]).
Detectado en la [[Auditoria e2e 2026-10-07]] (`H36`). Implementado en desktop el 2026-10-07.

## Qué pasaba

Nota abierta con cambios sin guardar + el archivo cambia en disco (otro programa, la IA,
una sincronización) → el próximo guardado escribía encima y lo de afuera desaparecía sin
aviso. Sin cambios locales, la recarga externa ya funcionaba.

## Decisión del usuario (2026-10-07): avisar y elegir

Nada se pierde sin que el usuario lo decida. Cuando se detecta que el archivo cambió en
disco y la pestaña tiene cambios propios:

1. **No se guarda encima** automáticamente. El autoguardado de esa nota queda en pausa; se
   puede seguir escribiendo. El pie dice «Sin guardar: conflicto» y el punto de la pestaña
   queda ámbar.
2. Aparece una **barra en la nota**: «El archivo cambió fuera de Mycelium y tenés cambios
   sin guardar», con tres opciones:
   - **Ver lo de afuera**: descarta lo local y carga el disco. Pide confirmación y es
     deshacible con Ctrl+Z (el cambio entra al historial de CodeMirror).
   - **Quedarme con lo mío**: escribe lo local encima de lo externo (guardado forzado, sin
     comparar).
   - **Guardar lo mío como copia**: crea «Título (copia local)» en la misma carpeta con lo
     local (si existe, el vault le agrega número), carga lo de afuera en la nota y avisa con
     «Abrir» para ir a la copia.
3. **Cerrar la pestaña** con el conflicto pendiente (X, Supr, Ctrl+W, anclarla al panel
   lateral) pregunta: «Guardar copia y cerrar» o cancelar.
4. **Cerrar la ventana** no puede preguntar ni esperar: lo local se escribe en un archivo
   aparte, `Título (copia local AAAA-MM-DD HHmmss).md`, y la nota queda como la dejaron
   afuera.

El conflicto se deshace solo si el archivo vuelve a la base (lo de afuera se revirtió) o si
afuera queda exactamente lo que se ve.

## Cómo se detecta

Dos momentos, con el mismo criterio puro de `frontend/lib/conflictoExterno.ts`:

- **Al guardar** (`decidirAlGuardar`): el editor manda `esperado` = lo último que leyó o
  guardó (`ultimoGuardadoRef`); `putContenido` relee el **archivo** —no el índice, que va
  detrás del watcher— y si difiere de la base y de lo que se va a escribir, responde 409 y
  no escribe. Cubre la carrera en que el aviso del watcher todavía no llegó.
- **Al aviso del watcher, al volver a la pestaña y al guardarse la nota en otro panel**
  (`decidirAnteCambioExterno`): se lee el disco con `GET /notas/:id/contenido?origen=disco`
  y se decide `nada` / `alcanzado` / `recargar` / `conflicto`. Una revisión que se cruza con
  un guardado se descarta (contador de guardados), para no inventar conflictos.

Al volver a una pestaña, la base es la de la pestaña (`instanceCache.conocido`) y no lo que
hay en disco: tomar el disco absorbía el cambio de afuera. Se espera el guardado de al
salir si todavía viaja.

## Fuera de alcance

Tablas (`.base`), lienzos, diagramas y dibujos tienen **el mismo problema**: su criterio
(`hayQueRecargar` en `lib/recargaExterna.ts`) no recarga con cambios propios y el guardado
pisa lo de afuera. El texto del framework de IA lo sigue diciendo para ellos.
