# Preferencias por vault (`FUN-M-28` · `FUN-M-21`)

Ajustes que pertenecen **al vault** y no a la persona. Se guardan dentro de su
carpeta, en `.mycelium/preferencias.json`.

> [!info] Estado
> Implementado en desktop el 2026-09-05, con sus dos primeros consumidores:
> los números de línea (`FUN-M-28`) y los modos de nombres del grafo (`FUN-M-21`).

---

## 1. Por qué hizo falta

Hasta ahora las preferencias eran **del usuario**: viven en el servidor
(`preferencesStore` → `PUT /auth/preferencias`) y valen para todo lo que abras.
Eso está bien para el tema, la tipografía o el ancho de tabulación.

Pero hay ajustes que son del vault. «Ver los números de línea» o «cuántos
nombres dibujar en el grafo» dependen de **qué vault estás mirando**, no de
quién sos: un vault de cien notas y uno de cinco mil no quieren lo mismo, y los
abre la misma persona. Sin un sitio donde ponerlos, las dos funcionalidades
tenían que resolverlo cada una por su cuenta — o no cumplirse.

## 2. Dónde viven, y por qué ahí

En **`.mycelium/preferencias.json`, dentro del vault**. Se eligió entre tres
opciones y ganó por un motivo concreto:

| Opción | Qué pasa al copiar o sincronizar el vault |
|---|---|
| **`.mycelium/` dentro del vault** ✅ | Los ajustes **viajan con él** |
| La config de la app (junto a `vaults.json`) | Se quedan en esa máquina |
| Un archivo visible en la raíz | Viajan igual, pero aparece entre las notas |

Guardarlos fuera del vault los ataría a la máquina, que es lo contrario de
«cada vault tiene la suya». Y `.mycelium/` ya cumple ese papel —ahí están la
papelera y el índice— y [[mycignore]] lo ignora siempre, así que el archivo no
aparece en la app ni en el grafo. Es el mismo lugar que ocupa `.obsidian/` en
Obsidian.

## 3. Cómo está hecho

### El contenido es opaco para Rust

`prefs_vault.rs` guarda y devuelve el JSON **tal cual**; el esquema lo decide el
frontend, que es quien conoce las preferencias. Agregar una no obliga a tocar
Rust ni a migrar nada — y eso importa, porque la próxima ya está a la vista: el
ancho de columnas de `FUN-M-25`.

### Se escribe con `escribir_atomico`

El mismo de las notas. Perder una preferencia es leve; un JSON truncado haría
que el vault arrancara **siempre** con los valores por defecto sin decir por qué.

### Ausente o corrupto no es un error

Un vault que nunca guardó nada es el caso **normal**. `leer` devuelve `None` y el
frontend cae a `POR_DEFECTO`; el próximo guardado reescribe el archivo entero.
Ni un archivo que falta ni uno roto pueden impedir abrir un vault.

### Los valores por defecto están en un solo sitio

`POR_DEFECTO`, en `stores/prefsVaultStore.ts`. Repartirlos por los componentes
haría que «apagado por defecto» significara cosas distintas según quién
preguntara.

### `normalizar` desconfía a propósito

El archivo está en la carpeta del usuario y se puede editar a mano, y una
preferencia agregada después no está en los vaults viejos. Un valor con el tipo
equivocado **se ignora** en vez de propagarse hasta el componente que lo use.

### El guardado es diferido

400 ms. Un interruptor no debe escribir el archivo en cada pulsación, y el modo
de nombres del grafo se toca varias veces seguidas mientras se busca el que
gusta.

## 4. Ciclo de vida

Se cargan al **abrir** el vault y se limpian al **salir**: en desktop lo hace
`vaultSessionStore`; en web, el efecto del workspace cuando hay vault activo. La
carga no se espera: si tarda o falla, el vault se abre igual con los valores por
defecto — un ajuste de aspecto no puede demorar la apertura.

En Configuración, un control cuya preferencia es del vault se **desactiva**
mientras no haya dónde escribir. La pregunta se le hace al **propio almacén**
(`prefsVaultStore.ruta !== null`) y no a la sesión del vault: lo que decide si el
control sirve no es que haya un vault abierto, sino que `cargar` ya haya
terminado de leer, que es exactamente cuando un cambio deja de perderse. Es
además lo único que las dos versiones responden igual, y por eso
`EditorSection.tsx` sigue siendo un archivo compartido.

## 5. Sus consumidores

### `FUN-M-28` — números de línea

Solo en las vistas de **edición**, apagados por defecto. Ver
[[numeros-de-linea]] para lo que costó: el orden de los márgenes, los bloques
renderizados, y por qué **no** están en la vista de lectura.

### `FUN-M-21` — nombres del grafo

Tres modos: todos, el apuntado y sus vecinos, o solo el apuntado. El control
está en el menú del grafo y no en Configuración: es una opción de esa vista y se
toca mientras se la mira.

### `FUN-M-25` — ancho de las columnas de un archivo tabla

`anchosTabla`: `id del .base` → `referencia de columna` → píxeles. Es el único
valor con forma de diccionario anidado, así que es el único donde un archivo
editado a mano puede colar un `0` — y un `0` que llegara al `<col>` dejaría una
columna invisible sin forma evidente de recuperarla. Por eso `normalizarAnchos`
descarta todo lo que no sea un número por encima de `ANCHO_MIN`. Ver
[[bases-tabla]] § La cabecera de la tabla.

## 6. El porte a web (`FUN-M-29`, 2026-09-05)

En web no hay carpeta, así que **no fue un reflejo**: se decidió dónde viven y
quién las carga.

Viven en `localStorage`, con la clave `mycelium:prefs-vault:<vaultId>`. La
consecuencia está aceptada y anotada en el propio módulo: **quedan en ese
navegador**, y el mismo vault abierto desde otro equipo arranca con los valores
por defecto. Es justo la propiedad que motivó el diseño en desktop, y se cede: la
alternativa —un endpoint `.NET` que las guardara junto al vault— cuesta backend,
migración y una llamada de red en el arranque, y todo eso por unos ajustes de
aspecto. Si algún día tienen que viajar, lo único que cambia es el cuerpo de
`cargar` y de `guardarDiferido`.

> [!important] Lo que hace valioso al porte no es el `localStorage`
> Es que `prefsVaultStore` expone **la misma superficie** en las dos ramas
> —`POR_DEFECTO`, `normalizar`, `cargar`, `set`, `usePrefVault`, y hasta el
> nombre `ruta`, que en web es el `vaultId`—. Eso es lo único que evita que sus
> consumidores diverjan: `BaseView`, `NoteEditor`, `EditorSection`, `MiniGraph` y
> `GraphOptionsMenu` se siguen trayendo enteros con un `git checkout`. Un almacén
> con otra forma habría convertido a cinco componentes compartidos en cinco
> archivos que hay que mantener dos veces.
>
> El caso que lo hizo evidente fue `FUN-M-25`: sin el porte, guardar los anchos
> habría metido un import solo-desktop en `BaseView.tsx`, que es de los últimos
> componentes grandes que quedan compartidos enteros.

## Relacionadas

- [[numeros-de-linea]] — el primer consumidor, y el que más pulido necesitó.
- [[bases-tabla]] — `FUN-M-25`, el consumidor que forzó el porte a web.
- [[BACKLOG]] — `FUN-M-28`, `FUN-M-21`, `FUN-M-25` y `FUN-M-29`.
- [[RAMAS]] — la divergencia con web: qué se trae entero y qué no.
- [[mycignore]] — por qué `.mycelium/` no aparece en la app.
- [[Mapa de documentacion]] — índice general.
