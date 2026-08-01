# Versionado del sistema

## La versión de la app

Se muestra al pie del drawer de Configuración y sale de una constante compartida:
`frontend/lib/version.ts` → `APP_VERSION`.

> [!info] Estado actual
> **desktop `1.1.1`** ([[Version 1.1.1]]) · **web `1.0.0`** ([[Version 1.0.0]]).
> Las líneas se separaron en el release 1.1.0 porque todo lo que entró es solo-desktop.

Al subir de versión hay que tocar **todos** estos lugares:

| Archivo | Aplica |
|---|---|
| `frontend/lib/version.ts` (`APP_VERSION`) | Ambas versiones — es lo que ve el usuario |
| `frontend/package.json` | Ambas |
| `frontend/src-tauri/Cargo.toml` | Solo desktop |
| `frontend/src-tauri/tauri.conf.json` | Solo desktop (define el nombre del instalador) |

> [!warning] Mantenerlos sincronizados a mano
> No hay automatización. Si `tauri.conf.json` queda atrás, el instalador sale con el
> número viejo aunque la app muestre el nuevo.

## Criterio (SemVer, guía del proyecto)

| Tipo de cambio | Impacto |
|---|---|
| Corrección o ajuste trivial | **patch** (`1.0.x`) |
| **Optimización o mejora de lo existente, sin funcionalidad nueva** | **patch** (`1.0.x`) |
| Funcionalidad nueva compatible (S/M/L) | **minor** (`1.x.0`) |
| Rearquitectura, cambio de almacenamiento o nube (XL) | **major** (`x.0.0`) |

La pregunta que decide entre patch y minor es una sola: **¿el usuario puede hacer algo
que antes no podía?** Si la respuesta es no —lo mismo, más rápido, mejor comunicado o
sin un defecto—, es **patch**, por más trabajo que haya costado.

## Cuántas unidades sube: una por funcionalidad

> [!important] Regla del proyecto: cada funcionalidad nueva suma **un** minor
> Si en un mismo release entran **dos** funcionalidades, la versión sube **dos** minors.
> No se agrupan en un solo salto. El número cuenta cuánto se agregó, no cuántas veces se
> publicó.

**Al subir un dígito, los de la derecha vuelven a `0`.**

Partiendo de `1.1.1`:

| Qué entra | Queda en |
|---|---|
| 1 funcionalidad | `1.2.0` |
| 2 funcionalidades | **`1.3.0`** (no `1.2.0`) |
| 3 funcionalidades | `1.4.0` |
| 1 funcionalidad + 2 correcciones | `1.2.0` — el minor sube y el patch **se resetea**: las correcciones quedan absorbidas |
| 2 correcciones sueltas | `1.1.3` |

> [!note] Qué cuenta como "una funcionalidad"
> Una entrada del [[BACKLOG]] (`FUN-*`) o, si no estaba registrada, una capacidad nueva
> que el usuario podría nombrar por separado. Un refactor que habilita otra cosa **no**
> cuenta aparte: se versiona por lo que el usuario recibe, no por los pasos internos.
> Ante la duda, contá lo que pondrías en la nota de release como ítems distintos.
>
> La misma lógica aplica a las correcciones: **cada corrección suma un patch**. Esto es
> una extensión del criterio a lo que el usuario enunció para las funcionalidades; si no
> es lo que se busca, corregir esta línea.

Consecuencia esperada y aceptada: los números crecen rápido y `1.9.0 → 1.10.0` es
normal. No son decimales.

> [!warning] El tamaño del BACKLOG mide ESFUERZO, no impacto de versión
> Los IDs `FUN-S/M/L/XL` del [[BACKLOG]] dicen **cuánto cuesta** implementar algo, no
> cuánto cambia para el usuario. Un `FUN-M` o incluso un `FUN-L` puede no agregar
> ninguna capacidad nueva y ser **patch** igual. El caso testigo es
> [[Version 1.1.1]] (`FUN-M-12`): tocó Rust, el indexador, la UI y el framework de IA,
> y aun así es patch, porque nadie puede hacer nada que no pudiera antes.
>
> Usá el tamaño para planificar; usá la pregunta de arriba para versionar.

> [!info] El secuenciado del BACKLOG es tentativo
> Está pensado como borrador a acordar. Ya se desvió: `FUN-L-07` (terminal) estaba
> propuesta para `1.3.0` y se implementó apenas cerrada la 1.0.0, porque el usuario
> priorizó la línea de IA. Es esperable y no es un problema.

## Las versiones de las dos líneas pueden separarse

Web y desktop se consolidaron juntas en [[Version 1.0.0]] y **se separaron** en
[[Version 1.1.0]]: todo lo que entró (terminal, framework de IA, `.mycignore`, mejoras
del grafo, devtools) es solo-desktop, así que web se quedó en `1.0.0`. Ver
[[Diferencias funcionales aceptadas entre versiones]].

> [!tip] Al versionar, mirá qué recibió cada rama
> `git log --oneline <commit-de-la-version-anterior>..HEAD` en cada rama. Si una no
> recibió cambios funcionales, **no se le sube la versión**: un número nuevo sin
> contenido nuevo es ruido.

## Versión del framework de IA (independiente)

`FRAMEWORK_IA_VERSION` en `frontend/lib/ia/framework.ts` **no** sigue la versión de la
app: versiona el contenido de las instrucciones que se generan en el vault.

> [!important] Regla
> Si Mycelium gana una función que la IA deba conocer → **subir
> `FRAMEWORK_IA_VERSION` y actualizar los templates**. La UI detecta la versión
> instalada en el vault y ofrece actualizar.
>
> Vale también al revés: si un cambio deja **desactualizado** un texto de los
> templates (no agrega instrucciones, corrige las que hay), se sube igual — en
> **patch**. Si el texto no acompaña al cambio, el framework miente.

Historial: `1.0.0` inicial · `1.1.0` `.mycignore` + política de conflictos · `1.2.0`
reenfoque a memoria · `1.2.1` default de `.mycignore` corregido en los templates.
Ver [[Generar el framework de IA en un vault]].

## Relacionadas

- [[Version 1.1.1]] — el release más reciente (y el caso testigo de "grande ≠ minor").
- [[Version 1.0.0]] — el primer release consolidado.
- [[Generar instaladores desktop]] — dónde impacta la versión.
- [[BACKLOG]] — tamaños e impacto por funcionalidad.
- [[Estado del proyecto]] — situación actual.
