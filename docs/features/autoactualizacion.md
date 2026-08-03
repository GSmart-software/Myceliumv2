# Autoactualización (`FUN-L-14` · `UPDATER-AUTOACTUALIZACION`)

Spec de la actualización asistida del escritorio: Mycelium comprueba una vez al día si hay
una versión nueva, muestra **qué trae** y ofrece instalarla. Nunca obliga y nunca bloquea.

> [!info] Alcance: **SOLO-DESKTOP**, por naturaleza
> La web se actualiza sola al recargar la página: no hay nada que instalar. Esta es una de
> las [[Diferencias funcionales aceptadas entre versiones]] que no tiene equivalente en
> `web-cloud`, como la terminal o el framework de IA.

> [!important] Funcionalidad nueva → **minor** cuando salga
> Y la primera que le da a Mycelium una **dependencia de infraestructura propia**: un
> bucket que hay que mantener y una clave que hay que custodiar. Ver el § 6.

---

## 1. Qué es y por qué

Hoy publicar una versión es: compilar, copiar el instalador a `installers/v<version>/`,
hacérselo llegar al usuario y que lo instale a mano. El usuario no tiene forma de enterarse
de que existe una versión nueva salvo que se lo digan.

**Objetivo**: que el usuario se entere solo y actualice con un clic — sin que eso se
convierta en una app que interrumpe, insiste o se actualiza por su cuenta. La actualización
es una oferta, no un trámite.

Reglas que fija el usuario y que la implementación no puede negociar:

1. **No bloqueante siempre.** Ni al arrancar ni al actualizar. Si no hay conexión, no pasa
   nada y no se avisa de nada: no es un error del usuario que su wifi esté caído.
2. **Nunca obliga.** No hay actualización silenciosa ni forzada.
3. **Una comprobación al día**, en el primer arranque de la jornada. No en cada apertura.
4. **Se ve qué trae** antes de decidir.

---

## 2. Estado de partida (verificado en el repo)

| Pieza | Cómo está hoy |
|---|---|
| `tauri-plugin-updater` | **No está**, ni el crate ni el paquete npm. Hay que añadirlo |
| `bundle.createUpdaterArtifacts` | Existe en la CLI 2.11 y está en **`false`** (su valor por defecto). Es lo que genera los `.sig` |
| Firma | **No hay claves.** El workflow dice explícitamente "SIN firmar" |
| `bundle.targets` | `"all"` → en Windows produce **MSI (WiX) y NSIS** |
| `bundle.windows.wix.upgradeCode` | Fijado. **No se toca nunca**: es la identidad de la app para Windows |
| CI | `.github/workflows/desktop-build.yml` ya usa `tauri-apps/tauri-action` y crea un Release en borrador al empujar un tag `v*` |
| Notas de release | Ya existen y están bien escritas: `docs/estado/Version X.Y.Z.md` |
| Preferencias | `stores/preferencesStore.ts` (tipo `Preferencias`, guardado con debounce) |

Dos cosas que salen de acá y ahorran trabajo: el **changelog ya está escrito** (las notas de
release son la fuente), y **el CI ya sabe compilar y publicar** — hay que enseñarle a firmar
y a subir a R2, no a construir.

---

## 3. Las piezas

### 3.1 El plugin y la firma

Se usa el **plugin oficial** `tauri-plugin-updater` (crate + `@tauri-apps/plugin-updater`).
Hace lo que hay que hacer y no conviene reimplementarlo: descarga, **verifica la firma**,
instala y reinicia.

- `bundle.createUpdaterArtifacts: true` en `tauri.conf.json`.
- Claves con `npx tauri signer generate`. La **pública** va en la config del plugin (se
  compila dentro de la app); la **privada** firma cada release y vive fuera del repo.
- Endpoint del updater: la URL del manifiesto en R2 (§ 3.2).

> [!danger] La clave privada es el activo más delicado del proyecto
> **Si se pierde**: ningún Mycelium ya instalado podrá volver a actualizarse jamás. La
> pública está compilada dentro de cada copia, así que una clave nueva no valida nada de lo
> que ya está en el mundo — habría que redistribuir a mano y empezar de cero.
>
> **Si se filtra**: cualquiera puede publicar una actualización que todas las instalaciones
> aceptarán como legítima y ejecutarán. Es ejecución de código arbitrario en la máquina del
> usuario, con su confianza.
>
> No entra en el repo, ni siquiera cifrada. Copia de seguridad fuera de la máquina de
> desarrollo. En CI, como secreto (`TAURI_SIGNING_PRIVATE_KEY` y su contraseña).

> [!warning] Los usuarios de hoy no se van a autoactualizar
> La clave pública se **compila** en el binario. La primera versión que la incluya es la
> primera que puede recibir actualizaciones; `1.3.0` y anteriores no tienen forma de
> verificar nada. Esa primera versión con updater hay que **instalarla a mano** — es la
> última vez.

### 3.2 Cloudflare R2 y el manifiesto

Un bucket de R2 con dominio público, sin Worker ni lógica: el updater de Tauri solo
necesita una URL que devuelva JSON.

```
mycelium-releases/
├── latest.json                       ← el manifiesto que consulta la app
└── 1.4.0/
    ├── Mycelium_1.4.0_x64-setup.exe
    └── Mycelium_1.4.0_x64-setup.exe.sig
```

`latest.json` con el formato que espera el plugin:

```json
{
  "version": "1.4.0",
  "notes": "## Qué entra\n\n- Ver PDF y código en el vault…",
  "pub_date": "2026-08-10T12:00:00Z",
  "platforms": {
    "windows-x86_64": {
      "signature": "<contenido del .sig>",
      "url": "https://<dominio>/1.4.0/Mycelium_1.4.0_x64-setup.exe"
    }
  }
}
```

- **`notes` lleva Markdown**, que es lo que la app renderiza (§ 4.2). Sale de la nota de
  release correspondiente.
- Se conservan las versiones anteriores en el bucket: sirven de archivo y permiten volver
  atrás si una versión sale mal.
- **R2 no cobra egress** y el nivel gratuito son 10 GB: con instaladores de ~9 MB esto no
  va a costar nada en mucho tiempo.

> [!important] Usar un **dominio propio**, no la URL `r2.dev`
> La URL del manifiesto queda **compilada dentro de cada copia de Mycelium, para siempre**:
> las versiones ya instaladas seguirán consultando esa dirección pase lo que pase. Con un
> dominio propio delante del bucket, mudar el almacenamiento el día de mañana es cambiar un
> DNS; con la URL `r2.dev` por defecto, es abandonar a todo lo que ya está instalado.
> Cloudflare además desaconseja `r2.dev` para producción. **Hay que decidirlo antes de
> publicar la primera versión con updater.**

> [!note] Un bucket público **no** expone ninguna credencial
> Pregunta que surgió al revisar la spec, y conviene dejarla contestada porque va a volver:
> sin Worker, ¿no queda una API key pública?
>
> **No.** R2 tiene dos accesos y solo uno usa claves. **Leer** el manifiesto y el instalador
> es un `GET` anónimo a una URL pública — la app no lleva token, no firma peticiones y no
> habla con la API S3. **Escribir** en el bucket sí necesita un token de R2, pero ese vive
> en la máquina de quien publica o como secreto del CI, y nunca viaja dentro de la app. Un
> Worker sería igual de público y anónimo: no cambia nada en ese frente.
>
> **La protección no es el transporte, es la firma.** Si alguien reemplazara el instalador
> dentro del bucket, Mycelium lo rechazaría igual: no coincidiría con la firma verificada
> contra la clave pública compilada en la app (criterio de aceptación 10). Por eso el bucket
> puede ser completamente público sin debilitar nada. Lo que hay que proteger es **escribir**
> —el token de R2 y, sobre todo, la clave privada de firma—, no leer.
>
> Corolario para quien implemente: **el cliente nunca lleva credenciales**. Si una solución
> las necesita para descargar, está mal diseñada.
>
> Un Worker tendrá sentido el día que se quieran canales beta/estable, despliegue gradual o
> contar instalaciones. Para seguridad, no aporta.

> [!important] El canal de actualización es **NSIS**, no MSI
> Los dos se siguen generando, pero el manifiesto apunta al `-setup.exe`. El motivo es
> concreto y está verificado en el schema de la CLI: el NSIS de Tauri instala por defecto
> en modo **`currentUser`**, así que actualizar **no dispara UAC**. El MSI instala por
> máquina y pediría elevación en cada actualización, lo que convierte "un clic" en "un clic
> y un diálogo del sistema".
>
> El MSI se sigue publicando para la instalación inicial y el despliegue silencioso.

### 3.3 El proceso de release cambia

[[Generar instaladores desktop]] pasa a tener un paso más y deja de terminar en
`installers/v<version>/`:

1. Consolidar la versión en los cuatro archivos **y `Cargo.lock`**.
2. Compilar (`CARGO_BUILD_JOBS=2 npx tauri build`) — ahora también emite los `.sig`.
3. Subir instalador y `.sig` a R2 bajo `<version>/`.
4. Escribir `latest.json` con la versión, la firma y las notas de la release.

Automatizarlo en el workflow que ya existe es la continuación natural, pero **no entra en
esta unidad**: primero se hace a mano y se comprueba que el circuito completo funciona. Se
registra como continuación en el [[BACKLOG]].

---

## 4. Comportamiento en la app

### 4.1 Cuándo comprueba

- Al arrancar, **si la última comprobación no fue hoy**. La fecha se guarda en
  `Preferencias` (`preferencesStore`), como el resto.
- **En segundo plano y sin bloquear** el arranque: si tarda o falla, Mycelium abre igual.
- **Sin conexión: silencio absoluto.** Ni aviso, ni icono de error, ni entrada en el log
  visible. Se reintenta al día siguiente.
- Además, un botón **"Buscar actualizaciones"** en Configuración → Vault (o su propia
  sección), que comprueba en el momento e informa también cuando **no** hay nada nuevo —
  ahí sí, porque lo pidió el usuario explícitamente.
- Y un interruptor para **desactivar la comprobación automática**. "No obligar" incluye no
  obligar a que la app hable con un servidor.

### 4.2 El diálogo

```
╭─ Hay una versión nueva ───────────────╮
│                                       │
│  Mycelium 1.4.0    (tenés la 1.3.0)   │
│  ─────────────────────────────────    │
│  ## Qué entra                         │
│  • Ver PDF y código en el vault       │
│  • Resaltado de sintaxis              │
│                                       │
│  ### Correcciones                     │
│  • El ícono de Esporas ya no es…      │
│                                       │
│  [ Omitir esta versión ]              │
│         [ Más tarde ]  [ Actualizar ] │
╰───────────────────────────────────────╯
```

- Las notas se renderizan **con el motor de Mycelium** (`renderMarkdown`), no como texto
  plano. Es coherente con el resto de la app y sale gratis.
- **Tres salidas**, decisión del usuario:
  - **Actualizar** — descarga con progreso visible, instala y reinicia.
  - **Más tarde** — se cierra; mañana en el primer arranque se vuelve a ofrecer.
  - **Omitir esta versión** — no se vuelve a mencionar **esa** versión; se avisa cuando
    salga otra. Se guarda el número omitido en `Preferencias`.
- El diálogo **no roba el foco de golpe ni interrumpe la escritura**: aparece cuando la app
  ya está usable.
- Mientras descarga, se puede seguir trabajando. La instalación (que cierra la app) solo
  ocurre cuando la descarga terminó y el usuario lo confirma.

> [!warning] Cuidado con reiniciar sobre trabajo sin guardar
> El editor guarda con debounce de 800 ms. Antes de reiniciar hay que **forzar el guardado
> pendiente** y esperar a que termine. Perder la última frase que escribió el usuario por
> actualizar sería el peor resultado posible de esta funcionalidad.

---

## 5. Criterios de aceptación

1. Con una versión nueva publicada en R2, abrir Mycelium muestra el diálogo con el número
   correcto y el changelog **renderizado** (títulos y viñetas, no `##` en crudo).
2. El arranque **no se retrasa** por la comprobación: la app es usable antes de que aparezca
   el diálogo.
3. Sin conexión: Mycelium abre normalmente y **no muestra ningún error**.
4. Cerrar el diálogo con "Más tarde" y reabrir la app **el mismo día** no vuelve a
   preguntar. Simulando el día siguiente, sí.
5. "Omitir esta versión" y reabrir al día siguiente: no aparece. Al publicar una versión
   posterior, vuelve a aparecer.
6. "Actualizar" descarga con progreso visible, instala y Mycelium vuelve a abrir **en la
   versión nueva** (comprobable en el pie de Configuración).
7. Al actualizar con una nota a medio escribir, el texto está **completo** después del
   reinicio.
8. Actualizar **no pide UAC**.
9. Actualizar **no borra ni toca el vault**, ni las preferencias, ni los snippets CSS, ni
   las pestañas abiertas.
10. Un manifiesto con **firma inválida** hace que la actualización se rechace con un
    mensaje claro, y la app sigue funcionando en su versión actual.
11. Con la comprobación automática desactivada, no se hace ninguna petición de red al
    arrancar. El botón manual sigue funcionando.
12. El botón manual, cuando ya se está en la última versión, lo dice en vez de no hacer nada.

---

## 6. Riesgos y compromiso operativo

Esta es la primera funcionalidad que le deja a Mycelium **cosas que mantener fuera del
código**:

- **Un bucket de R2** que tiene que seguir existiendo y respondiendo. Si `latest.json` deja
  de estar disponible, la comprobación falla — silenciosamente, que es el comportamiento
  correcto, pero nadie se actualiza más.
- **Una clave privada** custodiada durante toda la vida del producto (ver el aviso del § 3.1).
- **Un formato de manifiesto** que hay que mantener correcto en cada release. Un `.sig`
  pegado mal o una URL equivocada rompe la actualización de todos.

Por eso el criterio 10 no es un detalle: la app tiene que **sobrevivir a un manifiesto
roto** sin quedar inservible.

> [!note] Por qué es `L` y no `XL`
> El [[BACKLOG]] clasifica como `XL` lo que depende de infraestructura de nube, y esto
> depende. Pero no hay rearquitectura ni cambia dónde viven los datos: el plugin oficial
> hace el trabajo pesado y la parte de nube es **un bucket con archivos estáticos**, no un
> servicio. El esfuerzo es de `L`; lo que sí es nuevo —y por eso está escrito arriba— es el
> compromiso operativo permanente.

---

## 7. Versionado

**Minor** cuando salga: el usuario puede hacer algo que antes no podía (enterarse y
actualizar desde la app). Los cuatro archivos de siempre más `Cargo.lock`.

`FRAMEWORK_IA_VERSION` **no cambia**: no afecta a lo que la IA debe saber del vault.

## 8. Verificación

- `cd frontend && npx tsc --noEmit -p tsconfig.json`
- `cd frontend/src-tauri && cargo check` — acá **sí** se toca Rust (plugin nuevo).
- **La prueba real es de extremo a extremo y no la sustituye ningún compilador**: publicar
  una versión de prueba en R2 y actualizar desde una instalación real. Hasta que eso no se
  haga, la funcionalidad no está verificada.
- Probar también el camino desgraciado: manifiesto inexistente, JSON mal formado, firma
  inválida, y descarga interrumpida a mitad.

## 9. Documentación a actualizar

- [[Generar instaladores desktop]] — el proceso gana los pasos de firma y publicación.
- [[BACKLOG]] — `FUN-L-14` y su continuación (automatizar la publicación en el workflow).
- [[Arquitectura de Mycelium]] — Mycelium pasa a tener una dependencia externa propia.
- [[Diferencias funcionales aceptadas entre versiones]] — solo-desktop por naturaleza.
- [[Estado del proyecto]] y la nota de release correspondiente.
- Un proceso nuevo en `docs/procesos/` para publicar una versión, con la custodia de la
  clave escrita.

## Relacionadas

- [[Generar instaladores desktop]] — de dónde salen los artefactos que se publican.
- [[Versionado del sistema]] — qué número lleva cada release que se publique.
- [[Diferencias funcionales aceptadas entre versiones]] — por qué esto no va a web.
- [[BACKLOG]] — `FUN-L-14` en la agrupación en releases.
- [[Mapa de documentacion]] — índice general.
