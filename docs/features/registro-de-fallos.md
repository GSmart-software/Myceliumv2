# Registro de fallos en la consola (`FUN-L-21` · `DIAGNOSTICO-FALLOS`)

Que **ningún fallo pase en silencio**: todo lo que sale mal en Mycelium —en el frontend o
en Rust— deja una línea en la **consola de las herramientas de desarrollador** (F12), con
dónde pasó, qué se intentaba hacer y el error original. Es para **depurar** y para
**usuarios experimentados**; el usuario común no ve nada nuevo.

Pedido por el usuario el 2026-09-25, antes de atacar `DEF-105` a `DEF-108`: «no deberíamos
tener fallos y bugs silenciosos». **Definida, no implementada.**

> [!important] No es solo agregar `console.error`
> El pedido explícito es **recorrer todo el proyecto** y hacerlo **con una estructura
> correcta, usando patrones de diseño**, para que se pueda mantener. Un `console.error`
> suelto en cada `catch` resuelve hoy y se degrada mañana: formatos distintos, nada que
> impida el próximo `catch {}` vacío, y los fallos de Rust siguen sin llegar a la consola.
> Esta spec define la pieza central, las reglas de uso y cómo se hace cumplir.

## 1. El problema, medido

Inventario del 2026-09-25 sobre `desktop-tauri` (`app`, `components`, `lib`, `stores`),
contado con el parser de TypeScript, no con `grep`:

| Qué | Cuántos |
|---|---|
| Bloques `catch` en total | 100 |
| `catch {}` **vacíos** (o solo con un comentario) | **24**, en 17 archivos |
| `catch` que hacen algo pero **no registran nada** (devuelven un valor por defecto, siguen de largo) | **40** |
| `catch` que le muestran el error al usuario | 27 |
| `catch` que relanzan | 3 |
| `catch` que registran en consola | **6** |
| Promesas con `.catch(() => {})` o que devuelven `null`/`[]` en silencio | **25** |
| Rust: `let _ =`, `.ok();`, `unwrap_or_default()` sobre resultados | **~46** |

O sea: de cada diez fallos que el código prevé, **uno** llega a la consola. Y **ninguno** de
Rust: `tauri-plugin-log` solo se instala en debug y escribe a la salida estándar, que en la
app empaquetada no ve nadie.

**Casos reales en los que esto costó caro:**

- `DEF-106`: `lib/vaultWatch.ts` traga el error del reindexado con
  `// Best-effort: un reindex fallido no debe romper la UI`. Si el reindexado falla, un
  archivo nuevo simplemente no aparece, y no queda rastro de por qué.
- `DEF-105`: la pantalla de carga se quedó quieta sin decir nada. Con este registro habría
  habido algo que leer en F12 antes de ir a abrir el SQLite a mano.

## 2. Qué se ve

Cada fallo es **una entrada en la consola**, con un formato único y filtrable:

```
[Mycelium] ✖ indexado · No se pudo leer el archivo          ← console.error
    operación: leer_archivos (tanda 3 de 27)
    vault: C:\…\ASDD
    error: Error: El sistema no puede encontrar la ruta…     ← el objeto original, con su stack
```

- **Prefijo `[Mycelium]`** y un **área** (`indexado`, `watcher`, `editor`, `grafo`,
  `terminal`, `rust:vault_fs`…): en F12 se filtra por área escribiéndola.
- **El error original**, como objeto, no convertido a texto: así la consola muestra el
  stack desplegable.
- **Contexto** de qué se intentaba: la operación y los datos que permiten reproducirlo
  (rutas, ids, tamaños). **Nunca el contenido de una nota** (§ 6).
- Los que vienen de **Rust** se ven igual, con el área `rust:<módulo>`.

## 3. Los tres niveles

**Este es el punto central de la spec.** No todo `catch` es un fallo. Muchos son
**control de flujo**: el `ALTER TABLE` que falla porque la columna ya existe, el
`localStorage` que no está en una ventana privada, el archivo opcional que no existe.
Mandar todo a `console.error` ahogaría los fallos de verdad en ruido.

| Nivel | Cuándo | Consola | Ejemplo |
|---|---|---|---|
| **Fallo** | La operación que el usuario o la app esperaban **no se hizo** | `console.error`, siempre | No se pudo guardar la nota. El reindexado falló |
| **Degradado** | La operación siguió, pero **peor** o con un respaldo | `console.warn`, siempre | Sin watcher, no hay auto-refresco. KaTeX no pudo dibujar una fórmula |
| **Esperado** | Es la forma normal de un caso previsto | `console.debug`, **solo en modo diagnóstico** (§ 5) | La columna ya existe. `.mycignore` no existe → default |

La regla que lo hace mantenible: **todo `catch` declara su nivel**. No hay un cuarto
camino «silencioso sin explicación».

## 4. Diseño

### 4.1 Una fachada: `lib/fallos.ts`

Un **único punto de entrada** —patrón *Facade*— que todo el código usa y que nadie
saltea:

```ts
fallo(area, mensaje, error, contexto?)      // la operación no se hizo
degradado(area, mensaje, error, contexto?)  // siguió, pero peor
esperado(area, motivo, error?)              // control de flujo; solo en modo diagnóstico
```

- **Qué gana**: el formato vive en un solo lugar, cambiar a dónde van los fallos no toca a
  los que los producen, y buscar `fallo(` da el inventario completo.
- **`area`** es un tipo cerrado (`type Area = "indexado" | "watcher" | …`), no un texto
  libre: así las áreas no se multiplican con variantes (`indexer`, `indexador`, `index`).

### 4.2 Destinos intercambiables (*Strategy* / *Observer*)

La fachada no escribe en la consola directamente: **publica** la entrada a una lista de
**destinos**. Cada uno es una estrategia con la misma interfaz:

| Destino | Qué hace | Cuándo |
|---|---|---|
| `consola` | El formato del § 2 | Siempre |
| `memoria` | Guarda las **últimas N** entradas en un anillo | Siempre; cuesta casi nada |

Agregar un destino —un archivo de log, un panel «Diagnóstico» en Configuración, un botón
«copiar informe»— es **registrar uno más**, sin tocar ningún `catch`. El de memoria existe
desde el principio porque es lo que hará posible un «copiar informe de fallos» para
adjuntar a un reporte como el de `DEF-105`.

### 4.3 Envolventes para no repetir el `try/catch` (*Decorator*)

La mayoría de los `catch` silenciosos tienen la misma forma: probar algo, y si falla
devolver un valor por defecto. Para esos casos:

```ts
const texto = await intentar("vault", "leer .mycignore", () => leer(ruta), { siFalla: null, nivel: "esperado" });
```

`intentar` ejecuta, registra con el nivel indicado y devuelve el respaldo. Reemplaza el
patrón `try { … } catch { return null; }` sin perder el registro, y deja el nivel escrito en
la llamada.

### 4.4 Lo que se escapa de todo `catch`

Tres redes globales, instaladas una vez al arrancar:

- `window.addEventListener("error")`: excepciones no capturadas.
- `window.addEventListener("unhandledrejection")`: promesas rechazadas sin `.catch`, que
  hoy son muchas por el patrón `void algo()`.
- Un **`ErrorBoundary`** de React en el cascarón del workspace: un componente que revienta
  al dibujarse deja hoy la pantalla en blanco sin decir nada.

Las tres pasan por la fachada como **fallo**, con área `global`.

### 4.5 Rust

- **Un rasgo de extensión sobre `Result`** —`.registrar("vault_fs", "listar directorios")`—
  que reemplaza `let _ =` y `.ok()`: registra el error y devuelve el `Option`, así el cambio
  en cada sitio es de una línea.
- **`tauri-plugin-log` también en release**, con el destino **`Webview`**: lo que Rust
  registra con `log::error!` / `log::warn!` **aparece en la consola de F12**, con el área
  `rust:<módulo>`. Hoy solo se instala en debug y escribe a la salida estándar.
- Los comandos que ya devuelven `Err(String)` al frontend no cambian: ahí el error **ya
  viaja**, y el que lo recibe decide su nivel con la fachada.

## 5. Modo diagnóstico

- **Fallo** y **degradado** se escriben **siempre**. Solo se ven con F12 abierto y no
  cuestan nada si nadie mira, así que no hace falta activarlos.
- **Esperado** solo se escribe con el **modo diagnóstico** encendido: un interruptor en
  Configuración (una sección «Avanzado», que hoy no existe), **apagado por defecto**. Sirve para cuando un fallo no se
  entiende y hay que ver también el camino «normal» que tomó el código.

## 6. Reglas

1. **Nunca el contenido de una nota**, ni fragmentos, en el contexto de una entrada. Rutas,
   ids, tamaños y conteos sí: son lo que hace falta para reproducir, y la consola es local.
2. **Deduplicar ráfagas**: el mismo fallo, con la misma área y el mismo mensaje, repetido
   en pocos segundos (un watcher en bucle) se escribe **una vez** con un contador
   (`×37 en 5 s`), no 37 veces.
3. **El registro no puede fallar**: la fachada nunca lanza. Si un destino falla, se lo
   saltea.
4. **No reemplaza el aviso al usuario.** Los 27 `catch` que ya le muestran el error siguen
   haciéndolo; **además** registran. Uno no sustituye al otro: el usuario necesita saber
   que no se guardó, y quien depura necesita el stack.

## 7. Cómo se hace cumplir

Sin esto, dentro de un mes vuelve a haber `catch {}` vacíos.

- **Un chequeo automático**, `scripts/check-fallos.mjs`, con el parser de TypeScript (el
  mismo método del inventario del § 1): **falla** si encuentra un `catch` que no llama a la
  fachada, ni relanza, ni lleva `// esperado: <motivo>`. Se agrega a la lista de
  [[Verificar antes de integrar]].
- En **Rust**, el mismo chequeo busca `let _ =` y `.ok();` sobre un `Result` sin
  `.registrar(…)`.
- Las excepciones legítimas (el `// esperado:`) quedan **escritas en el código**, no
  implícitas.

## 8. Cómo se implementa

1. **La infraestructura**: la fachada, los destinos, `intentar`, las tres redes globales,
   el rasgo de Rust y el plugin de log en release. Todavía sin tocar ningún `catch`.
2. **El recorrido, por área**, una tanda por área (indexado y watcher primero, que es donde
   están `DEF-105` y `DEF-106`; después editor, grafo, terminal, configuración…). En cada
   `catch` se decide el nivel, y esa decisión es el trabajo real: no es mecánico.
3. **El chequeo del § 7**, al final, cuando ya pasa en verde. Desde ahí, un `catch` nuevo
   sin nivel no se puede integrar.

## 9. Criterios de aceptación

1. Un fallo del reindexado del watcher aparece en F12 como `[Mycelium] ✖ watcher · …`, con
   el error original y el stack.
2. Un error en un comando de Rust registrado con `log::error!` aparece en F12, **también en
   la app empaquetada**.
3. Una excepción que nadie captura y una promesa rechazada sin `.catch` aparecen como
   fallos del área `global`.
4. Un componente que revienta al dibujarse no deja la pantalla en blanco sin rastro: queda
   el fallo en F12.
5. Con el modo diagnóstico apagado, abrir un vault sano **no escribe nada** en la consola.
   Encendido, se ven los `esperado`.
6. Un fallo que se repite en bucle aparece una vez con su contador.
7. `scripts/check-fallos.mjs` pasa en verde sobre todo el proyecto, y falla si se agrega un
   `catch {}` vacío.
8. Ninguna entrada contiene texto de una nota.

## 10. Alcance por versión

**Ambas, con diferencias.** La fachada, los destinos, las redes globales y el recorrido del
frontend son **compartidos**. Lo de Rust es **solo desktop**. En web, el equivalente del
lado servidor sería el logging de .NET, que ya existe: esta funcionalidad es del cliente.

## Relacionadas

- [[BACKLOG]] — `FUN-L-21`.
- [[Bugs_errores_y_defectos]] — `DEF-105` y `DEF-106`, que se habrían diagnosticado solos
  con esto.
- [[Verificar antes de integrar]] — donde entra el chequeo del § 7.
