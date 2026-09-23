# Los temas los define Mycelium, no el usuario

**Decisión** · vigente · 2026-09-23

No va a haber un creador de temas dentro de la app. La idea se registró como `FUN-M-36`
(`THEME-PERSONALIZADO`) el 2026-09-23 y **el usuario la descartó el mismo día**, al ver lo
que costaba y lo que ponía en riesgo.

> [!info] Palabras del usuario
> *«Quizás demasiada personalización podría arruinar el producto. Entonces mejor quitemos
> esta funcionalidad, no la implementaremos, un usuario siempre puede editar estas cosas con
> snippets si así lo desea. Si más adelante quiero agregar nuevos estilos (que es la idea),
> entonces lo trabajaremos juntos teniendo en cuenta el mantener la calidad visual del
> producto.»*

## Por qué

La calidad visual de Mycelium **está medida**, no es una impresión: los temas y las
[[atmosferas]] se verificaron con contraste ≥4,5:1 en los dieciséis combos de tema × modo ×
atmósfera. Un creador de temas entrega esa garantía a quien elija los colores, y el resultado
más probable de una mala elección no es «un tema feo»: es una app que se ve rota y de la que
Mycelium sigue siendo responsable.

A cambio de eso, el usuario ya tiene una salida: los **snippets de CSS** de Configuración.
Quien quiera tocar colores puede, asumiendo lo que asume quien escribe CSS.

**Los estilos nuevos se van a seguir agregando** —esa es la intención—, pero hechos y
medidos acá, como se hizo con las cuatro atmósferas, y no delegados a un formulario.

> [!tip] El criterio, para la próxima vez que aparezca una idea parecida
> No es «nada de personalización»: es que **lo que Mycelium ofrece, Mycelium lo garantiza**.
> Elegir entre opciones cuidadas (tema, modo, atmósfera) es personalizar; componer una
> combinación que nadie verificó es otra cosa. Cuando la variante nueva se pueda medir de
> antemano, entra.

## Lo que quedó aprendido del análisis

Vale guardarlo: es el terreno de cualquier estilo nuevo que se agregue más adelante.

- **Un tema son ocho colores crudos por modo**, dieciséis en total (`--mic-raw-accent`,
  `-glow`, `-base`, `-base-deep`, `-canvas`, `-mist`, `-ink`, `-ink-muted`), en
  `styles/tokens.css`. Todo el resto de la interfaz son tokens **semánticos** calculados a
  partir de esos ocho.
- **Los colores de identidad son una elección; los fondos y los textos son consecuencia.** Su
  trabajo es tener el contraste justo contra los primeros, así que se **derivan** —es lo que
  ya hacen las [[atmosferas]], escritas como `color-mix` sobre los raw, y por eso una sola
  definición sirve para los dos temas—. Si algún día se suma un tema, conviene construirlo
  así: hereda las cuatro atmósferas sin trabajo extra.
- **El tema es hoy una unión cerrada de dos literales** (`"bioluminiscencia" | "cantarela"`)
  repetida en siete sitios: `stores/preferencesStore.ts`, el esquema y la siembra del índice
  (`lib/db/indexer.ts`, `lib/db/auth.ts`), `lib/db/preferencias.ts`, el buscador de ajustes,
  la lista de swatches de Apariencia y —el que más se olvida— **`lib/printStyles.ts`**, el
  CSS autocontenido del PDF, que lleva los colores de los dos temas escritos dentro. Sumar un
  tema significa tocar esos siete, incluido el del PDF, o exportar sale con otros colores.

## Relacionadas

- [[atmosferas]] — el eje de estilo que sí se entregó, y el precedente de derivar por fórmula.
- [[DESIGN_SYSTEM]] — los tokens y las reglas de color.
- [[configuracion]] — dónde viven los snippets de CSS, la salida que le queda al usuario.
- [[Bandeja de entrada]] — de dónde salió la idea, y dónde consta que se descartó.
- [[Mapa de documentacion]] — índice general.
