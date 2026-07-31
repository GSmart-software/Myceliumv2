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
| [[vault-en-carpeta]] | Solo desktop | El modelo "la carpeta es la verdad" no aplica a datos en servidor |
| [[desktop-sin-login]] | Solo desktop | App local monousuario |
| Login, OAuth, colaboración en tiempo real, export ZIP en servidor | Solo web | Requieren backend, usuarios y nube |
| Exportar PDF | **Ambas, distinto** | Desktop imprime en cliente (iframe + `window.print()`); web delega en el backend (PuppeteerSharp) |
| Exportar vault | **Ambas, distinto** | Desktop: a carpeta nativa **o** ZIP; web: solo ZIP |

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
