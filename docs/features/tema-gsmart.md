# FUN-M-52 — Tema GSmart (solo modo dev)

**Solo desktop.** Pedido por el usuario el 2026-10-08, después de aprobar el tema Arrecife
([[tema-arrecife]]) en la app («ahora sí que me gusta»). Fila en [[BACKLOG]] (`FUN-M-52` ·
`TEMA-GSMART`).

Un **cuarto tema**, con la marca personal del usuario, **GSmart**. Fuente única de los
valores: la skill `gsmart-marca` (`~/.claude/skills/gsmart-marca/SKILL.md` y su `tokens.css`).
Lo de abajo es la parte que aplica a Mycelium.

> [!warning] Es secreto, como todo el modo dev
> Ni la ayuda, ni el changelog, ni el buscador de Configuración sin el modo nombran a GSmart.
> Va a `frontend/scripts/secreto-dev.mjs` ([[Lo del modo dev no se anuncia]]).

## Decisiones

Las mismas que el usuario tomó para Arrecife (2026-10-08), que valen para todo tema de marca:

1. **Colores + forma + presencia de marca.** No solo la paleta: el degradado de la marca
   donde Arrecife lleva el suyo, con el mismo nivel de presencia que el usuario aprobó en la
   segunda vuelta de Arrecife (`571decb`): nombre de la app y título de la nota en degradado,
   filete bajo la barra superior, rail con lavado vertical y botón activo resaltado, línea en
   la pestaña activa, barra de la nota abierta del árbol, íconos de nota y carpeta en los dos
   tonos, viñetas, etiquetas en pastilla, selección de texto, barras de desplazamiento y
   brillo ambiental sobre el lienzo.
2. **Apagar el modo dev no lo saca.** La muestra solo aparece con el modo.
3. **Las atmósferas no aplican**: selector atenuado y deshabilitado, como con Arrecife.

## Valores de GSmart

| Rol | Oscuro (el preferido) | Claro |
|---|---|---|
| Degradado de marca | `#2b4aa6` → `#12a8e8` (en la skill va a 90°) | igual |
| Acento (enlaces, bordes activos) | `#3b9be8` | `#1f6fc4` |
| Aguamarina (las líneas de la G) | `#a3ece2` | — (sobre claro no se lee: derivar) |
| Fondo | `#1e2023` | `#f3f5f8` |
| Fondo 2 | `#25282b` | `#e8ecf1` |
| Panel | `#2e3134` | `#ffffff` |
| Panel 2 | `#373a3e` | `#eef2f6` |
| Borde | `#44484d` | `#d3d9e0` |
| Texto · secundario · terciario | `#eceff2` · `#b3b9c0` · `#868c93` | `#1b1f24` · `#4a525b` · `#78808a` |
| Código | `#18191b` | `#eef2f6` |
| Texto sobre el degradado | `#f2fbff` | igual |
| Éxito · aviso · error | `#34c38f` · `#e0a63a` · `#e5534b` | igual |
| Sombra | `0 12px 34px rgba(0,0,0,.38)` | `0 10px 26px rgba(20,30,60,.09)` |

**Grises fríos, nunca verdosos ni cálidos.** El segundo color de la marca, donde Arrecife usa
el violeta (íconos de nota, H2, el «glow»), sale de la propia paleta: el **aguamarina**
`#a3ece2` o el **cian** `#12a8e8` en oscuro, y un derivado legible en claro. Que la elección
quede anotada con su contraste.

### Forma y letras

- Esquinas de 12 a 20 (`12` controles, `16` base, `20` grande); bordes finos de **1 px** (no
  1.5 como Arrecife).
- **Manrope** para la interfaz (en lugar de Geist).
- **Michroma** para títulos y etiquetas, **nunca en párrafos**: el nombre de la app, el título
  de la nota, los títulos de sección en mayúsculas (como «ARCHIVOS») con espaciado amplio
  (`letter-spacing: .3em` en la marca; ajustarlo si no entra). Los H1 y H2 de la nota pueden
  ir en Michroma: son títulos.
- **JetBrains Mono** para el código de la interfaz que hoy usa la mono del sistema.
- **El cuerpo de las notas no se toca**: su tipografía la elige el usuario en Configuración.
- Las tres familias tienen que funcionar **sin red** (la app es local). Cargarlas con
  `next/font/google` sin precarga —se empaquetan al compilar—, o con archivos en el repo; nunca
  un `<link>` a Google Fonts en ejecución (ver `DEF-153`, las fuentes de Excalidraw).

## Cómo encaja

- `data-theme="gsmart"`, con la misma estructura que Arrecife: colores en `styles/tokens.css`
  sobre los `--mic-raw-*` y semánticos existentes, forma en un `styles/gsmart.css` propio,
  reglas por componente con `:global(:root[data-theme='gsmart'])`. Si conviene, compartir con
  Arrecife lo que es igual en los dos (p. ej. qué temas son «de marca» y no admiten
  atmósferas) en `lib/temas.ts`, sin cambiar cómo se ve Arrecife.
- El catálogo de `lib/temas.ts` gana la muestra «GSmart», `soloDev`. Persistencia, PDF
  (`lib/printStyles.ts`) y buscador de Configuración, como Arrecife.
- El logo de Mycelium se queda: es un tema, no un cambio de producto.

## Criterios de aceptación

1. Con el modo dev, Apariencia muestra «GSmart» con la marca «dev».
2. Elegido, la app toma la paleta de GSmart en oscuro y en claro, con el degradado
   azul profundo → cian en los mismos lugares que Arrecife, Manrope en la UI y Michroma en
   títulos y etiquetas; el cuerpo de las notas conserva su tipografía.
3. Atmósferas atenuadas y deshabilitadas; apagar el modo no saca el tema; reiniciar lo
   conserva.
4. Sin red, las tres familias se ven igual.
5. Ni la ayuda ni el changelog lo nombran; `test-modo-dev.mjs` lo comprueba.
6. Contraste medido ≥ 4.5:1 para texto principal y secundario sobre sus fondos, en los dos
   modos.
7. Bioluminiscencia, Cantarela y Arrecife no cambian.

## Relacionadas

- [[tema-arrecife]] — el primer tema de marca; este sigue su estructura.
- [[modo-dev]] · [[Lo del modo dev no se anuncia]].
- [[BACKLOG]] — `FUN-M-52`.
