# El modo SQLite clasico queda muerto

**Decisión del usuario, 2026-09-26.** El «modo SQLite clásico» de desktop —las notas
viviendo solo dentro de `mycelium.db`, sin carpeta en disco— **se declara muerto y se
retira del código**. El vault en carpeta ([[vault-en-carpeta]]) es el único modo de la
versión de escritorio.

## Por qué

- Desde que existe el vault en carpeta, **las tres entradas de la app abren una carpeta
  antes de mostrar el workspace**; no hay ninguna forma de usar el modo clásico desde la
  interfaz. La única manera de caer en él es pegar la URL del workspace a mano sin vault,
  y lo que aparece es un workspace vacío contra `mycelium.db`.
- No hay migración de una carpeta hacia esa base, así que tampoco sirve como «vuelta
  atrás»: el procedimiento de vuelta de la spec presuponía que el usuario seguía teniendo
  sus notas allí, cosa que ya no es verdad para nadie.
- Costaba en cada función de la capa de datos una rama `if (vault === null)` para un caso
  que no ocurre (unas veinte), tres funciones que solo existían para esa rama
  (`ftsRetitular`, `nuevoId` en parte, `tituloUnico`), la migración sqlx `001_init.sql`
  con su espejo a mano en el esquema TS del índice, y comentarios que describían un
  sistema dual que confundía a quien leía. Todo esto lo documentó la
  [[Auditoria de codigo 2026-09-26]] (complejidad H1 y H14; código muerto § rama clásico).
- La spec lo había dejado abierto en 2026-07-20: «coexiste durante el desarrollo… a
  futuro el modo carpeta puede volverse el único». Ese futuro es este.

## Consecuencias

- La **identidad interna** heredada de web (`authStore`, `lib/db/auth.ts`, tablas
  `usuarios`, `vaults`, `membresias`) pierde su última justificación: la spec
  [[desktop-sin-login]] la conservaba porque el checksum de la migración sqlx de
  `mycelium.db` impedía tocar el esquema. Sin `mycelium.db`, ese argumento desaparece: el
  índice del vault se crea con `CREATE TABLE IF NOT EXISTS` y no usa migraciones. Se
  retira junto con el modo clásico ([[auditoria-capa-de-datos]]).
- `vaultActual` pasa a ser obligatorio en la capa de datos; `getVaultActual()` lanza si no
  hay vault, y el guard del workspace redirige a la selección de vaults.
- Un `mycelium.db` que quede en el app-data de instalaciones viejas **no se borra**: se
  ignora. No contiene nada que el usuario pueda ver hoy.

## Relacionadas

- [[vault-en-carpeta]] — la spec que dejó la decisión abierta; su § 6 remite acá.
- [[desktop-sin-login]] — la decisión de esquema que esta reemplaza.
- [[auditoria-capa-de-datos]] — la tanda que lo implementa (`FUN-L-24`).
- [[Auditoria de codigo 2026-09-26]] — de dónde salió.
- [[Capa de datos del desktop]] — la arquitectura resultante.
