# FUN-S-36 — Modo desarrollador (`>dev`)

**Solo desktop.** Implementada el 2026-10-08 (rama `feat/modo-dev-desktop`), sin confirmar
en la app. Fila en [[BACKLOG]] (`FUN-S-36` · `MODO-DEV`).

Un modo **oculto** que habilita lo que sirve para desarrollar y probar Mycelium y estorba
al usuario normal. **Reemplaza al modo avanzado** de `FUN-M-16` ([[autoactualizacion]]
§ 4.3), que se activaba con siete clics en el número de versión del pie de Configuración.

> [!warning] Es oculto a propósito
> Ni la ayuda integrada, ni el changelog, ni ninguna lista o búsqueda de la app nombran el
> comando, el modo **ni nada de lo que habilita** (regla del usuario, 2026-10-08: «todo lo
> que pertenezca a funcionalidad de dev no puede aparecer en el changelog»). Una sola lista,
> `frontend/scripts/secreto-dev.mjs`, alimenta los dos controles: `scripts/test-modo-dev.mjs`
> falla si una página de `frontend/ayuda/` la toca, y `npm run publicar` rechaza el
> changelog que la toque, antes de compilar. La decisión y su alcance: [[Lo del modo dev no se anuncia]].

## Cómo se activa

En la paleta (Ctrl+P, o Ctrl+O y empezar con `>`), escribir **`>dev`** y Enter. Alterna:
lo enciende si estaba apagado y lo apaga si estaba encendido. La paleta se cierra y un aviso
breve confirma «Modo desarrollador activado» / «Modo desarrollador desactivado».

- Vale sin importar mayúsculas ni espacios alrededor de `dev` (`> DEV `). Tiene que ser
  exactamente `dev`: `>de` o `>devx` no hacen nada especial.
- **No es una opción**: no aparece al escribir `>d`, `>de` ni `>dev`. Mientras la consulta es
  `>dev` la lista se ve como cualquier consulta sin coincidencias («Ningún comando se llama
  así.»), y Enter dispara el cambio.
- En modo notas (sin `>`), `dev` es una búsqueda más: una nota llamada «dev» se abre normal.
- También se apaga con el comando de desarrollador «Desactivar el modo desarrollador».

La lógica pura vive en `frontend/lib/modoDev.ts` (`esConsultaDev`, `comandosDisponibles`).

## Qué queda detrás

1. **Actualizador**: en Configuración → Actualizaciones, «Versiones publicadas» (instalar
   cualquier versión, incluida una anterior) y «Servidor de actualizaciones» (endpoint propio).
   Sus entradas del buscador de Configuración llevan `soloDev: true`: sin el modo no se
   encuentran.
2. **Comandos de desarrollador** en la paleta: sin el modo **no existen** —ni buscándolos por
   su nombre—. Se distinguen por una marca «dev» discreta antes del título. Hoy son:
   - «Desactivar el modo desarrollador».
   - «Abrir las herramientas de desarrollador» (el mismo comando `alternar_devtools` que F12).
3. **El tema Arrecife** (`FUN-M-51`, [[tema-arrecife]]): la tercera muestra de Configuración →
   Apariencia, con la marca «dev» de la paleta. Es la primera funcionalidad detrás del modo que
   **no** es de desarrollo. Sin el modo la muestra no existe y su alias en el buscador de
   Configuración («arrecife») lleva `soloDev`; pero **apagar el modo no cambia el tema**: un
   vault que lo tiene se sigue pintando así. La muestra la filtra `temasVisibles(dev)` de
   `lib/temas.ts`, con el mismo `comandosDisponibles` de la paleta. `secreto-dev.mjs` atrapa
   «arrecife» y `FUN-M-51`.
4. **El tema GSmart** (`FUN-M-52`, [[tema-gsmart]]): la cuarta muestra, la marca personal del
   usuario, con las mismas reglas que Arrecife —marca «dev», alias del buscador («gsmart») con
   `soloDev`, apagar el modo no cambia el tema—. Lo que los dos temas de marca comparten (no
   admiten atmósferas) vive en `TEMAS_DE_MARCA` de `lib/temas.ts`. `secreto-dev.mjs` atrapa
   «gsmart» (la palabra entera) y `FUN-M-52`.
5. **Bioluminiscencia experimental** (`FUN-M-53`, [[tema-bioexp]]): la quinta muestra,
   «Biolum. exp.», con los colores de Bioluminiscencia y la forma de los temas de marca. Mismas
   reglas —marca «dev», alias del buscador («bioexp», «biolum. exp.», «experimental») con
   `soloDev`, apagar el modo no cambia el tema, sin atmósferas (`TEMAS_DE_MARCA`)—.
   `secreto-dev.mjs` atrapa «bioexp», «Bioluminiscencia (exp.)», «Biolum. exp.» y `FUN-M-53`,
   pero **no** «Bioluminiscencia» a secas, que es el tema público por defecto.

F12 y Ctrl+Shift+I **siguen abiertos a todos** (`DevToolsHotkey`): no dependen del modo.

**Indicador**: con el modo encendido, el pie de Configuración dice «Mycelium vX.Y.Z · dev».
Explica por qué hay opciones de más en Actualizaciones sin decir cómo se llega; apagado no
se ve nada. El número de versión ya no es un botón.

## Persistencia

Global a la app (no por vault) y sobrevive reinicios: el campo `dev` de `actualizador.json`
en el config-dir, el mismo archivo y mecanismo que usaba el modo avanzado. Se cambia con el
comando Rust `updater_set_dev` y se lee en `updater_estado` (`EstadoUpdater.dev`).

**Compatibilidad**: el campo se llamaba `avanzado`. `#[serde(alias = "avanzado")]` lee los
archivos viejos, así quien tenía el modo avanzado encendido quedó con el modo desarrollador
encendido; al próximo guardado se escribe como `dev`. Lo cubre el test
`el_modo_avanzado_guardado_se_lee_como_dev` de `actualizador.rs`.

## Cómo agregar un comando de desarrollador

En `frontend/components/workspace/PaletaComandos.tsx`, sumar la opción al arreglo `comandos`
con **`soloDev: true`**:

```ts
{
  id: "cmd-dev-algo",
  titulo: "Hacer algo de desarrollo",
  icono: Wrench,
  soloDev: true,
  ejecutar: () => { /* … */ },
},
```

`comandosDisponibles` lo saca de la lista cuando el modo está apagado y la paleta le pone la
marca «dev». En el código no hace falta nada más, pero **sumá su título a
`scripts/secreto-dev.mjs`** si no lo cubre ya un patrón (hoy «comandos de desarrollador» y
«Desactivar el modo desarrollador»): así no se cuela en un changelog ni en la ayuda.

Lo mismo para cualquier otra funcionalidad nueva que quede detrás del modo: su ID y los
nombres con que se ve en la app van a esa lista, y en la nota de su versión se documenta
**fuera** de los delimitadores `notas-release` (ver [[Publicar una version]]). Si el comando nuevo debe esconderse también en otra
búsqueda (Configuración, por ejemplo), esa búsqueda tiene que mirar `useUpdaterStore`
(`estado.dev`) como hace `VentanaAjustes` con `soloDev`.

## Relacionadas

- [[autoactualizacion]] — el actualizador y la selección de versión que quedan detrás.
- [[configuracion]] — el pie y el buscador de Configuración.
- [[tema-arrecife]] — el tema Arrecife (`FUN-M-51`), la primera función que no es de desarrollo detrás del modo.
- [[Lo del modo dev no se anuncia]] — la decisión: nada del modo sale en el changelog ni en la ayuda.
- [[Publicar una version]] — dónde se escribe el changelog y cuándo se comprueba.
