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

Se cargan al **abrir** el vault y se limpian al **salir**, en
`vaultSessionStore`. La carga no se espera: si tarda o falla, el vault se abre
igual con los valores por defecto — un ajuste de aspecto no puede demorar la
apertura.

En Configuración, un control cuya preferencia es del vault se **desactiva**
cuando no hay ninguno abierto, en vez de aceptar un cambio que se perdería.

## 5. Sus dos consumidores

### `FUN-M-28` — números de línea

Solo en las vistas de **edición**, apagados por defecto. Ver
[[numeros-de-linea]] para lo que costó: el orden de los márgenes, los bloques
renderizados, y por qué **no** están en la vista de lectura.

### `FUN-M-21` — nombres del grafo

Tres modos: todos, el apuntado y sus vecinos, o solo el apuntado. El control
está en el menú del grafo y no en Configuración: es una opción de esa vista y se
toca mientras se la mira.

## 6. Lo que falta

> [!warning] En web no hay carpeta, así que esto no se refleja tal cual
> El almacén es un comando de Tauri sobre el sistema de archivos. Llevar las dos
> funcionalidades a web **no es un reflejo**: hay que decidir dónde viven ahí y
> aceptar que la propiedad que motivó la elección —que viajen con el vault— solo
> se conserva si las guarda el backend. Ver [[RAMAS]].

## Relacionadas

- [[numeros-de-linea]] — el primer consumidor, y el que más pulido necesitó.
- [[BACKLOG]] — `FUN-M-28`, `FUN-M-21` y `FUN-M-25`, que hereda este almacén.
- [[RAMAS]] — la divergencia con web.
- [[mycignore]] — por qué `.mycelium/` no aparece en la app.
- [[Mapa de documentacion]] — índice general.
