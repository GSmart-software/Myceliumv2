# Versionado del sistema

## La versión de la app

Se muestra al pie del drawer de Configuración y sale de una constante compartida:
`frontend/lib/version.ts` → `APP_VERSION`.

> [!info] Estado actual
> **desktop `1.3.0`** ([[Version 1.3.0]]) · **web `1.0.0`** ([[Version 1.0.0]]).
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

## Cuántas unidades sube: **una**

> [!important] Un release = un incremento
> El tamaño del salto lo decide **el cambio más significativo** que lleve el release, no
> cuántos cambios lleva. Da igual que entren una corrección o quince: si el release solo
> corrige, sube **un** patch. Si además trae funcionalidad nueva, sube **un** minor y las
> correcciones **quedan absorbidas**.

**Al subir un dígito, los de la derecha vuelven a `0`.**

Partiendo de `1.1.1`:

| Qué entra en el release | Queda en |
|---|---|
| 1 corrección | `1.1.2` |
| 4 correcciones | `1.1.2` — es un release, no cuatro |
| 1 funcionalidad | `1.2.0` |
| 3 funcionalidades | `1.2.0` — el minor no cuenta cuántas |
| 1 funcionalidad + 2 correcciones | `1.2.0` — gana lo más significativo; el patch se resetea |
| 1 rearquitectura + lo que sea | `2.0.0` |

El número identifica **una publicación**, no un volumen de trabajo. Cuánto entró se
cuenta en la nota de release (`docs/estado/Version X.md`), que es su sitio: ahí caben los
matices que un dígito no puede expresar.

> [!note] Qué cuenta como "una funcionalidad"
> Sigue importando para decidir **qué dígito** sube, no cuántas veces. Una entrada del
> [[BACKLOG]] (`FUN-*`) o una capacidad nueva que el usuario podría nombrar por separado.
> Un refactor que habilita otra cosa **no** cuenta: se versiona por lo que el usuario
> recibe, no por los pasos internos.

> [!info] Por qué cambió esta regla (2026-08-03)
> Hasta acá el proyecto **contaba unidades**: cada funcionalidad sumaba un minor y cada
> corrección un patch. El usuario notó el síntoma —de `1.1.1` se saltó a **`1.1.5`** por
> cuatro correcciones, dejando `1.1.2`, `1.1.3` y `1.1.4` inexistentes— y se revisó.
>
> Contar unidades **no es la práctica de la industria** y contradice a SemVer, que sobre
> el minor dice explícitamente que *puede incluir cambios de patch*: un release con
> funcionalidad nueva **absorbe** las correcciones, no las suma encima. Los costos reales
> del conteo: el número deja de identificar un release (no se puede decir "actualizá
> desde la 1.1.3" si nunca existió), los huecos nunca tienen instalador en
> `installers/v<version>/`, y el MSI de Windows **limita `ProductVersion` a
> `255.255.65535`**, así que el minor tiene techo.
>
> **No se renumeró nada.** Como el patch se resetea al subir el minor, el número de hoy
> es el mismo con las dos reglas: la divergencia se materializó solo en la `1.1.5` y el
> minor siguiente la borró. [[Version 1.1.5]] conserva su número porque se publicó con
> él: la versión es la identidad de lo que salió.

Los números **no son decimales**: `1.9.0 → 1.10.0` es correcto.

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
reenfoque a memoria · `1.2.1` default de `.mycignore` corregido en los templates ·
`1.3.0` propiedades del frontmatter (`FUN-M-04`) · `1.4.0` Esporas (`FUN-M-03`) — los
dos minor, porque no corrigen un texto: enseñan una capacidad nueva del vault. Ver
[[Generar el framework de IA en un vault]].

> [!info] `1.1.5 → 1.2.0`, el caso inverso al de 1.1.1
> [[Version 1.2.0]] (`FUN-M-04`) es un `FUN-M` igual que `FUN-M-12`, y sin embargo sube
> **minor**: el usuario puede hacer algo que antes no podía (dar atributos a sus notas y
> consultarlos). Al subir el minor, el patch vuelve a `0` — de ahí que de `1.1.5` se pase
> a `1.2.0` y no a `1.2.5`.

## Relacionadas

- [[Version 1.3.0]] — el release más reciente (Esporas).
- [[Version 1.2.0]] — metadatos YAML, y el caso testigo de
  "un `FUN-M` puede ser minor".
- [[Version 1.1.5]] — el único que saltó varios patches de una; el síntoma que hizo
  revisar la regla. Bajo la regla actual habría sido `1.1.2`.
- [[Version 1.1.1]] — el caso testigo de "grande ≠ minor".
- [[Version 1.0.0]] — el primer release consolidado.
- [[Generar instaladores desktop]] — dónde impacta la versión.
- [[BACKLOG]] — tamaños e impacto por funcionalidad.
- [[Estado del proyecto]] — situación actual.
