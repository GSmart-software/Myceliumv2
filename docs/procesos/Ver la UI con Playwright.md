# Ver la UI con Playwright

Cómo hace una sesión de IA para **ver la app de verdad** —capturas, estilos
computados, contraste medido— en vez de depender de capturas que le pase el usuario.
Se montó el 2026-09-18 para el rediseño con impeccable
([[Rediseñar la UI con impeccable]]), pero sirve para cualquier trabajo visual.

> [!success] Verificado el 2026-09-19
> Enganche por CDP al WebView2 de `tauri dev` (Edge 153), captura de la ventana
> (1280×800), `eval` sobre la página y cambio de tema en vivo. Todo lo de abajo está
> probado así, salvo el script Node con `connectOverCDP`, que no se usó.

## Por qué no sirve abrir `next dev` en un navegador

El frontend de desktop **no tiene modo navegador**: `lib/api.ts` despacha a `lib/db`,
que habla con SQLite a través de Tauri. En Chrome la app arranca sin vault, sin
explorador y sin notas — se vería una cáscara vacía (ver [[Capa de datos del desktop]]).
Por eso tampoco aplica el modo `live` de impeccable.

Lo que sí funciona: en Windows, Tauri dibuja con **WebView2, que es Chromium** y acepta
depuración remota. Playwright se engancha a la **ventana real**, con datos reales.

## Qué está instalado

Global (no toca el `package.json` de ninguna rama):

```sh
npm i -g @playwright/cli@0.1.21 playwright@1.63.0
playwright-cli --help        # comprobar
```

**No** hace falta `npx playwright install`: no se descarga ningún navegador, el
navegador es el WebView2 de la app.

`playwright-cli` trae su propia guía para agentes; la ruta la imprime `--help` en la
primera línea («Agent skill: …/SKILL.md»). Leela antes de usarlo por primera vez.

## 1. Levantar la app con el puerto de depuración

```sh
cd frontend
export WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS="--remote-debugging-port=9222"
export WEBVIEW2_USER_DATA_FOLDER="$LOCALAPPDATA/com.mycelium.desktop/EBWebView-capturas"
CARGO_BUILD_JOBS=2 npm run tauri dev
```

Listo cuando `curl -s http://localhost:9222/json/version` devuelve un JSON.

Las **dos** variables hacen falta, y cada una tiene su motivo:

| Variable | Por qué |
|---|---|
| `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS` | Abre el puerto CDP 9222 |
| `WEBVIEW2_USER_DATA_FOLDER` | El binario de desarrollo y el instalado comparten `identifier`, y por lo tanto la carpeta `EBWebView`. Si hay un Mycelium abierto, la instancia nueva **se une a su proceso de navegador y el flag se ignora en silencio**: no hay puerto y nada avisa. Con carpeta propia, proceso propio |

> [!info] Efecto secundario de la carpeta aparte
> Lo que vive en `localStorage` (pestañas abiertas, carpetas expandidas del explorador,
> algunos ajustes de UI) arranca **vacío** en esa instancia. La lista de vaults no: vive
> en `vaults.json` del config-dir de la app, compartido con el instalado.

## 2. Engancharse

> [!warning] Correlo desde una carpeta de trabajo, NO desde la raíz del repo
> `playwright-cli` escribe en el directorio actual una carpeta `.playwright-cli/`
> (snapshots `.yml`, logs de consola) y las capturas sin ruta. En la raíz ensucia el
> árbol de git y el vault. Usá el scratchpad de la sesión y pasá `--filename` con ruta
> cuando la captura tenga que ir a otro lado.

```sh
playwright-cli attach --cdp=http://localhost:9222
playwright-cli snapshot                 # árbol accesible con refs para click/hover
playwright-cli screenshot --filename=captura.png   # captura de la ventana
playwright-cli eval "() => getComputedStyle(document.body).backgroundColor"
playwright-cli detach                   # suelta la app sin cerrarla
```

Desde un script Node, lo mismo es `chromium.connectOverCDP("http://localhost:9222")`.
Ojo: un `import` ESM **no** encuentra los paquetes globales; el script tiene que
resolver `playwright` con `createRequire` desde la ruta que da `npm root -g`.

La respuesta de `eval` sale bajo `### Result`, seguida del código que ejecutó. Para
devolver un objeto, envolvelo en `JSON.stringify(...)`. Las capturas se leen con la
herramienta de lectura de archivos: son PNG normales.

Las capturas que se le pasan a impeccable van a `.impeccable/review/` (es donde las
busca su revisor final). **No se commitean**: se agregan archivos por ruta, nunca
`git add .impeccable`.

## 3. Recetas

**Recorrer los temas sin tocar Configuración** — el tema y el modo son dos atributos
del `<html>` (ver [[DESIGN_SYSTEM]]); cambiarlos a mano no persiste nada:

```sh
playwright-cli eval "() => { const h = document.documentElement; h.dataset.theme = 'cantarela'; h.dataset.dark = 'true'; }"
playwright-cli screenshot --filename=cantarela-oscuro.png
```

Al terminar, devolvé los atributos a como estaban (o recargá la ventana): el usuario
puede estar mirándola.

**Quitar el indicador de Next antes de capturar** — en `tauri dev` aparece un botón
«N» en la esquina inferior derecha que no es parte de la interfaz:

```sh
playwright-cli eval "() => document.querySelector('nextjs-portal')?.remove()"
```

Las combinaciones son `bioluminiscencia` / `cantarela` × `data-dark` `true` / `false`
(más `sofka` en la rama `experimento/ui-plana`). Un defecto que solo aparece en un
modo es justo el que se escapa sin esto.

**Qué regla ganó** — antes de deducir especificidad a mano, preguntarle al navegador:

```sh
playwright-cli eval "() => { const el = document.querySelector('[class*=panelLeft]'); return getComputedStyle(el).backgroundImage; }"
```

**Estados que una captura estática no muestra**: `hover`, foco con teclado (`press
Tab`), menús y `<select>` abiertos — la lista de un `<select>` en modo oscuro es el
defecto que [frontend/AGENTS.md](../../frontend/AGENTS.md) pide probar siempre.

## Trampas encontradas al montarlo

> [!danger] Cerrá el otro Mycelium antes de levantar este
> La garantía de «un vault en una sola ventana» (`VentanasState`) es **por proceso**.
> Con el instalado y el de desarrollo abiertos sobre el mismo vault habría **dos
> indexadores escribiendo el mismo índice**.
>
> No te fíes de la pantalla de selección: en la prueba del 2026-09-19, con
> `abrirUltimo` en `false`, la ventana de desarrollo arrancó **directo en el vault del
> repo**. Con el otro Mycelium cerrado no hay riesgo, y el vault del repo es el mejor
> contenido de prueba que hay: notas reales, bases, lienzos.

- **El instalado es de instancia única y el de desarrollo no.** Por eso esta receta usa
  `tauri dev`: un segundo `app.exe` de release solo avisa al primero y se cierra.
- **«Another next dev server is already running».** Next 16 no admite dos servidores de
  desarrollo en la misma carpeta, y a veces queda uno huérfano de otra sesión. En vez de
  matarlo (puede ser de otra sesión en uso), se reutiliza:

  ```sh
  npx tauri dev --config '{"build":{"devUrl":"http://localhost:<puerto>","beforeDevCommand":""}}'
  ```

  El puerto lo imprime el propio error. Sirve la misma carpeta, así que da lo mismo.
- **Disco.** `target/debug` crece hasta ~13 GB entre `deps` e `incremental`; con el
  disco lleno el enlace final falla con `os error 112` — pasó en la primera prueba.
  Liberar `target/debug/incremental` (se regenera) es lo primero a probar. Con la caché
  en su sitio, `tauri dev` compiló en ~1 minuto.
- **Memoria.** Lanzado en segundo plano desde una sesión de IA, el sistema lo cortó por
  falta de memoria a los pocos minutos (2026-09-19, con otro `next dev` y otra sesión
  abiertos). Levantalo cuando vayas a capturar, no antes, y cerralo al terminar.

## Relacionadas

- [[Rediseñar la UI con impeccable]] — para qué se montó esto.
- [[Levantar Mycelium en desarrollo]] — el arranque normal, sin depuración.
- [[Verificar antes de integrar]] — lo visible lo confirma el usuario; esto no lo
  reemplaza, lo adelanta.
- [[Mapa de documentacion]] — índice general.
