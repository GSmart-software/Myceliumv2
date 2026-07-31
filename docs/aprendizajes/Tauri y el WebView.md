# Tauri y el WebView

La versión desktop corre en **Tauri v2**: frontend Next.js exportado estático dentro
de un WebView (WebView2 en Windows) + backend nativo en Rust. Estas son las fronteras
que importaron. Parte de [[Aprendizajes tecnicos]].

## Tauri intercepta los drops del sistema operativo

**Caso**: `DEF-036` — arrastrar archivos desde el explorador de Windows a Mycelium no
hacía **nada**: ni feedback visual ni importación.

**Causa**: Tauri captura los eventos de arrastre del SO de forma **nativa**, antes de
que lleguen al webview, para exponerlos como eventos propios. Por eso el HTML5 drag &
drop del frontend nunca se disparaba.

**Fix**: `"dragDropEnabled": false` en la config de ventana de `tauri.conf.json`. La
documentación de Tauri lo dice explícitamente: *"Disabling it is required to use HTML5
drag and drop on the frontend on Windows"*. **Requiere reiniciar `tauri dev`** (es
config de ventana, no recarga en caliente).

> [!important] Principio
> En desktop, un síntoma "del frontend" puede tener causa **nativa**. Si un evento del
> navegador simplemente *no ocurre*, revisá si Tauri lo está interceptando antes.

## `elementFromPoint` no es fiable durante un arrastre

En el WebView, `document.elementFromPoint()` durante un drag devuelve el *ghost* del
`DragOverlay` o el editor, no la zona de drop esperada. Cualquier lógica de
hit-testing basada en el DOM bajo el puntero es frágil aquí: usar coordenadas +
geometría. Ver [[Drag and drop en Mycelium]].

## Pseudo-terminales: ConPTY vía `portable-pty`

Para la [[terminal-integrada]] se usa el crate `portable-pty` (ConPTY en Windows), no
un `Command` simple: hace falta un **PTY real** para que funcionen los programas
interactivos, los colores y las señales (Ctrl+C).

Detalles que importaron:

- El **hilo lector** del PTY necesita poder retirar su propia entrada del mapa de
  sesiones al llegar al EOF → el estado se comparte con `Arc<Mutex<HashMap>>`.
- El comando de apertura es **idempotente**: si el id ya existe, reutiliza la sesión.
  Efecto útil: recargar el webview (F5) **no** mata la shell, porque el proceso vive
  en Rust, no en la página.
- La salida se emite como evento Tauri (`terminal-datos`) con
  `String::from_utf8_lossy`.

## Escritura de archivos: atómica y con ruta validada

Todo lo que escribe en el vault pasa por `escribir_nota`, que hace *write + rename*
(atómico: un corte de luz no deja archivos a medias), y por `ruta_segura`, que rechaza
`..`, rutas absolutas y prefijos de unidad — la defensa contra *path traversal*, ya
que las rutas se arman con títulos que escribe el usuario.

> [!warning] `escribir_nota` sobrescribe sin avisar
> Fue la causa del incidente donde el generador del framework IA reemplazó un
> `CLAUDE.md` existente. Cualquier generador que escriba en el vault del usuario debe
> **verificar existencia antes**. Ver [[ia-framework-vault]] y
> [[Generar el framework de IA en un vault]].

## El watcher del vault y el bucle de realimentación

El watcher nativo (`notify-debouncer-full`, ~400 ms) emite `vault-cambios` y el
frontend reindexa. **No hay bucle** aunque la app escriba: el indexador solo **lee**
archivos y es incremental por `mtime`, así que "app escribe → watcher dispara →
reindexa" termina en un reindex idempotente. Por eso no hace falta rastrear los
propios escritos. Ver [[vault-en-carpeta]] y [[Capa de datos del desktop]].

## Relacionadas

- [[Aprendizajes tecnicos]] — mapa del área.
- [[Capa de datos del desktop]] — qué hace Rust y qué hace TypeScript.
- [[Compilacion y entorno de desarrollo]] — compilar Rust, instaladores, gotchas.
- [[MIGRACION-TAURI]] — cómo se llegó a esta arquitectura.
