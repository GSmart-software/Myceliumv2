# Bandeja de entrada

> [!important] Escribí acá sin pensar en el formato
> Este es el **único sitio** donde tenés que anotar lo que encontrás o se te ocurre. No
> hace falta ID, ni categoría, ni redacción cuidada: escribilo como te salga, aunque sea
> media frase. Yo lo tomo, lo defino bien y lo documento donde corresponde.
>
> Cuando quieras que lo procese, decímelo: **"revisá la bandeja"**.

## Cómo escribir una entrada

Separá cada entrada con una línea `---`. Nada más es obligatorio.

Dicho eso, hay dos cosas que si las ponés me ahorran preguntarte:

- **Un defecto** se define solo con tres datos: **qué hiciste**, **qué esperabas** y **qué
  pasó en cambio**. Con eso alcanza. Si sabés reproducirlo, el paso a paso vale oro.
- **Una idea** se define con **qué querés poder hacer** y **para qué**. El *cómo* lo
  decidimos después — si ya lo tenés pensado escribilo igual, pero no hace falta.

Si no sabés si es un defecto o una idea, escribilo en cualquiera de las dos: eso lo
clasifico yo.

---

## Defectos sin procesar

*(vacío)*

---

## Ideas sin procesar

*(vacío)*

---

## Qué hago yo al procesarla

| Lo que escribiste | Qué hago | Dónde queda |
|---|---|---|
| Un defecto | Le asigno el `DEF-NNN` libre siguiente y escribo **qué sucede** —el síntoma, sin lenguaje de solución— | [[Bugs_errores_y_defectos]], y su estado en [[bugs-progreso]] |
| Una idea | La clasifico por esfuerzo (`FUN-S/M/L/XL`), le doy nombre e ID, y la ubico en la agrupación en releases | [[BACKLOG]] |
| Una idea que no es trivial | Además escribo la especificación de comportamiento con criterios de aceptación | `docs/features/<slug>.md` |

Después **muevo la entrada** de acá a la tabla de abajo. Así, lo que sigue en las dos
secciones de arriba es siempre lo que está **sin procesar**: no tenés que marcar nada.

Si algo de lo que escribís ya existe documentado, no lo duplico: amplío lo que hay y te
lo digo.

## Procesado

| Fecha | Lo que escribiste | Quedó como |
|---|---|---|
| — | — | — |

> [!note] Esta tabla se puede vaciar cuando moleste
> Es una comodidad para que veas en qué terminó cada cosa, no un registro canónico. La
> trazabilidad real vive en [[Bugs_errores_y_defectos]], [[BACKLOG]] y el historial de
> commits.

## Relacionadas

- [[Bugs_errores_y_defectos]] — el catálogo de defectos ya definidos.
- [[BACKLOG]] — el inventario de funcionalidades con IDs, tamaños y agrupación en releases.
- [[Ideas Mycelium]] — el documento donde anotabas ideas antes que esta bandeja.
- [[Mapa de documentacion]] — índice general.
