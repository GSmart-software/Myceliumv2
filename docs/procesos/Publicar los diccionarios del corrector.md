# Publicar los diccionarios del corrector

Cómo subir a R2 los diccionarios que descarga el corrector ortográfico
([[corrector-ortografico]], `FUN-L-12`), y cómo **agregar un idioma** o **actualizar** uno
ya publicado. Es independiente de [[Publicar una version]]: los diccionarios no viajan en
el instalador, y se pueden subir sin publicar una versión de la app, antes o después.

> [!info] Dónde viven
> En el mismo bucket que los instaladores (`mycelium-releases`), bajo `diccionarios/`. La
> app lee `https://pub-4a4b6d7b99be4917a2fe0074be9dfa40.r2.dev/diccionarios/manifiesto.json`,
> compilado en `src-tauri/src/diccionarios.rs`. Los sube el usuario con su sesión de
> `wrangler` (la misma de [[Publicar una version]] § 1.1).

## Subir lo que ya está definido

Desde `frontend/`:

```sh
npm run publicar-diccionarios -- --simulacro   # arma la carpeta, no sube nada
npm run publicar-diccionarios                  # arma y sube
```

Lo que hace el script (`frontend/scripts/publicar-diccionarios.mjs`):

1. Baja los paquetes `dictionary-*` de npm a `frontend/.diccionarios-fuente/` (fuera de
   git), solo los que falten.
2. Arma `frontend/.diccionarios/` (fuera de git): por variante,
   `<id>/<version>/{<id>.aff.gz, <id>.dic.gz, LICENSE.txt}`, y el `manifiesto.json` con el
   sha256 de cada archivo **descomprimido**.
3. Lee el manifiesto publicado y **se niega a seguir** si una variante con la misma versión
   ya está arriba con otro contenido.
4. Sube cada archivo con su `content-type` y el `manifiesto.json` **al final**, que es el
   que hace visible lo nuevo.
5. Si una subida falla, lo ya subido queda: se puede repetir el comando entero.

Para comprobar: abrir la URL del manifiesto en el navegador. Tiene que devolver el JSON.

> [!warning] A mano, sin `Content-Encoding: gzip`
> Si alguna vez se sube desde el panel de R2 en vez de con el script: respetar la
> estructura bajo `diccionarios/`, el manifiesto al final, y que los `.gz` no queden con
> `Content-Encoding: gzip`. El navegador los descomprimiría solo, la app los volvería a
> descomprimir y la verificación del sha256 fallaría.

## Actualizar un diccionario ya publicado

Lo publicado es **inmutable**: la app no vuelve a descargar una variante cuya versión ya
tiene, así que reescribir los archivos dejaría a cada instalación con algo distinto.

1. En la tabla `IDIOMAS` del script, cambiar el `paquete` (p. ej. `dictionary-es@4.1.0`) y
   **subir la `version`** de esa variante (`1.0.0` → `1.1.0`). La `version` es la del
   diccionario en R2, no la del paquete de npm.
2. `npm run publicar-diccionarios`. Las versiones viejas quedan en el bucket; el manifiesto
   pasa a apuntar a la nueva.

## Agregar un idioma

1. Buscar el paquete en [wooorm/dictionaries](https://github.com/wooorm/dictionaries)
   (`dictionary-fr`, `dictionary-pt`, …) y **leer su licencia** (ver abajo).
2. Agregar una entrada a `IDIOMAS` con `id`, `nombre`, `porDefecto`, `licencia`,
   `urlFuente`, `autor` y sus `variantes` (`region`, `id`, `paquete`, `version: "1.0.0"`).
   Si la licencia es nueva, sumar su URL a `TEXTOS_LICENCIA`.
3. `--simulacro`, probar en la app apuntando `MYCELIUM_DICCIONARIOS` a
   `frontend/.diccionarios` (ver [[corrector-ortografico]] § «Cómo probarlo localmente»),
   y después subir.

La app arma la lista de idiomas desde el manifiesto, así que un idioma nuevo aparece en
Configuración → Editor **sin publicar una versión de Mycelium**. Único detalle: sin
conexión, lo ya descargado se nombra desde una tabla fija (`NOMBRES` en
`components/settings/DiccionariosCorrector.tsx`) y un idioma que no esté ahí se muestra
con su código (`fr`). Sumarlo ahí entra con la siguiente versión de la app.

## Licencias

Cada `LICENSE.txt` lleva el autor, la fuente, la licencia y las URLs de los textos
completos. El italiano es **solo GPL-3**: se distribuye aparte, opcional y sin modificar.
Lo que sigue abierto (Mycelium no tiene archivo LICENSE; no se consultó a un abogado) está
en [[corrector-ortografico]] § 8.

## Relacionadas

- [[corrector-ortografico]] — la spec: § 4 el formato del manifiesto, § 8 las licencias.
- [[Publicar una version]] — el bucket, `wrangler` y la publicación de la app.
- [[Mapa de documentacion]] — índice general.
