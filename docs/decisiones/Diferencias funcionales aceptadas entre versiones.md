# Diferencias funcionales aceptadas entre versiones

**Decisión** · vigente

El criterio general es **si se puede hacer en las dos, se hace en las dos**. Pero
cuando una funcionalidad depende de algo que una versión no tiene, se implementa **solo
donde aplica**, y eso **no** se considera un defecto.

> [!info] Palabras del usuario
> Sobre la terminal integrada: *"solo desktop, web no incluye la funcionalidad. Genera
> diferencia en versiones entre web y desktop, no es problema, es normal."*

## Diferencias vigentes

| Funcionalidad | Dónde | Motivo |
|---|---|---|
| [[terminal-integrada]] (`FUN-L-07`) | Solo desktop | Una shell nativa necesita acceso al sistema; el navegador no lo da |
| [[ia-framework-vault]] (`FUN-L-08`) | Solo desktop | Escribe archivos en la carpeta del vault; requiere vault en carpeta |
| [[mycignore]] (`FUN-M-11`) | Solo desktop (por ahora) | En web no hay árbol de archivos que ignorar al indexar |
| [[autoactualizacion]] (`FUN-L-14` + `FUN-M-16`) | Solo desktop | La web se actualiza sola al recargar: no hay nada que instalar, ni versión que elegir |
| [[vault-en-carpeta]] | Solo desktop | El modelo "la carpeta es la verdad" no aplica a datos en servidor |
| [[desktop-sin-login]] | Solo desktop | App local monousuario |
| Login, OAuth, colaboración en tiempo real, export ZIP en servidor | Solo web | Requieren backend, usuarios y nube |
| Exportar PDF | **Ambas, distinto** | Desktop imprime en cliente (iframe + `window.print()`); web delega en el backend (PuppeteerSharp) |
| Exportar vault | **Ambas, distinto** | Desktop: a carpeta nativa **o** ZIP; web: solo ZIP |
| [[marco-de-ventana]] (`FUN-M-31`) | Solo desktop | En web la ventana es la del navegador: una página no dibuja sus botones de ventana ni el menú de anclaje |
| [[otros-tipos-de-archivo]] (`FUN-L-11` + `FUN-M-26`) | Solo desktop | Lee y escribe archivos sueltos de la carpeta del vault, que en web no existen |
| Compartir carpetas (HU-35) | Solo web | Necesita cuenta y servidor. En desktop el botón pedía el email de otra persona y no hacía nada: se apagó con `lib/capacidades.ts` (`HAY_COMPARTIR`) |
| Snippets de CSS | **Ambas, distinto** | Web: asociados a la cuenta, viajan entre dispositivos. Desktop: en el índice local del vault abierto. El texto de la pantalla lo dice distinto en cada una, a propósito |
| [[drawio]] (`FUN-L-20`) | Solo desktop (por decisión, no por imposibilidad) | El editor es frontend y en web funcionaría, pero habría que sumar el tipo de archivo al backend .NET y decidir dónde vive la webapp de draw.io —102 MB de estáticos que en desktop viajan en el instalador—. El foco está en desktop |

## Cómo se decide

1. ¿Es **imposible** en una versión por naturaleza (sistema de archivos, procesos,
   usuarios)? → solo-una, y **decirlo explícitamente** con el motivo.
2. ¿Es posible pero **la semántica cambiaría**? → no es un reflejo, es una funcionalidad
   nueva de esa versión: se registra en [[BACKLOG]] en vez de improvisarla. Es el caso
   de `.mycignore` en web (sería filtro de importación + visualización, con la config en
   el backend).
3. ¿Es posible e igual? → se hace en las dos (ver
   [[Implementacion independiente por rama]]).

## Consecuencia sobre el versionado

Los números de versión de las dos líneas **pueden separarse**, y está bien. La versión
se consolidó en 1.0.0 para ambas ([[Version 1.0.0]]), pero desde entonces desktop sumó
funcionalidades que web no tiene. Ver [[Versionado del sistema]].

## Relacionadas

- [[Implementacion independiente por rama]] — cómo se implementa cada versión.
- [[Capa de datos de la web]] · [[Capa de datos del desktop]] — de dónde salen las diferencias.
- [[BACKLOG]] — dónde quedan registradas las partes pendientes por versión.
- [[Mapa de documentacion]] — índice general.
