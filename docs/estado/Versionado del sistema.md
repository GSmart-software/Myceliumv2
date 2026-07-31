# Versionado del sistema

## La versión de la app

Se muestra al pie del drawer de Configuración y sale de una constante compartida:
`frontend/lib/version.ts` → `APP_VERSION`.

> [!info] Estado actual
> **desktop `1.1.0`** ([[Version 1.1.0]]) · **web `1.0.0`** ([[Version 1.0.0]]).
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
| Funcionalidad nueva compatible (S/M/L) | **minor** (`1.x.0`) |
| Rearquitectura, cambio de almacenamiento o nube (XL) | **major** (`x.0.0`) |

El [[BACKLOG]] clasifica cada idea por **tamaño** (`FUN-S-*`, `FUN-M-*`, `FUN-L-*`,
`FUN-XL-*`) justamente para poder decidir esto: el ID comunica el impacto esperado.

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

Historial: `1.0.0` inicial · `1.1.0` `.mycignore` + política de conflictos · `1.2.0`
reenfoque a memoria. Ver [[Generar el framework de IA en un vault]].

## Relacionadas

- [[Version 1.0.0]] — el primer release consolidado.
- [[Generar instaladores desktop]] — dónde impacta la versión.
- [[BACKLOG]] — tamaños e impacto por funcionalidad.
- [[Estado del proyecto]] — situación actual.
