# Temas propios del usuario (`FUN-M-36` · `THEME-PERSONALIZADO`)

**Idea registrada el 2026-09-23** desde la [[Bandeja de entrada]]. Sin implementar.

> Pedido textual: «agregar un botón para añadir nuevos temas por parte del usuario. Estos
> nuevos temas deben ser básicos, solo permiten cambiar los colores y agregar un nombre para
> ese tema. Los temas personalizados aparecerán debajo de los temas originales, y aparecerán
> bajo el nombre de "Temas personalizados". Se verán igual que los temas por defecto de
> Mycelium, como "tarjetas" seleccionables. Simplemente se podrán elegir los colores, color
> primario, secundario, etc. No los colores de background, sino los colores generales y
> básicos que luego se utilizan para estilar toda la UI».

## 1. Qué es un tema hoy

Un tema son **ocho colores crudos por modo** —dieciséis en total— definidos en
`styles/tokens.css`:

| Token raw | Qué pinta |
|---|---|
| `--mic-raw-accent` | Botones y enlaces |
| `--mic-raw-glow` | Cursor, tags, nodos del grafo, resaltados |
| `--mic-raw-base` · `--mic-raw-base-deep` | Rail, barra superior, panel lateral; sombras y código |
| `--mic-raw-canvas` · `--mic-raw-mist` | Fondo del editor; paneles |
| `--mic-raw-ink` · `--mic-raw-ink-muted` | Texto y texto atenuado |

Todo lo demás de la interfaz son tokens **semánticos** calculados a partir de esos ocho
(`--mic-accent`, `--mic-border`, `--mic-marco-texto`…). Hay dos temas —Bioluminiscencia y
Cantarela— y el tema es, en el código, una **unión cerrada de dos literales**.

## 2. Lo que pide el usuario es exactamente la línea correcta

«Los colores generales, no los de background» separa el tema en dos mitades que se comportan
distinto:

- **Los colores de identidad** (principal y secundario) son una **elección**: son los que
  hacen que un tema se vea como se ve.
- **Los fondos y los textos** son **consecuencia**: su trabajo es tener el contraste justo
  contra los anteriores. Pedírselos a quien crea el tema es pedirle que resuelva a mano un
  problema de accesibilidad, y la forma más probable de que elija mal.

Así que un tema propio se define con **un nombre y dos o tres colores**, y el resto se
**deriva por fórmula**, en los dos modos.

> [!tip] Ya hay precedente, y funciona
> Es lo mismo que hacen las [[atmosferas]]: cada una redefine los tokens semánticos con
> `color-mix` sobre los raw del tema, y por eso **una sola definición sirve para los dos
> temas** conservando el matiz de cada uno. Acá se aplica un escalón más abajo: derivar los
> raw de fondo a partir de los de identidad.
>
> El regalo es que un tema nuevo **hereda las cuatro atmósferas sin trabajo**. Y es el
> argumento de fondo para no pedir dieciséis colores: quien los eligiera a mano rompería esa
> cadena.

## 3. Cómo se deriva

Las proporciones no se inventan: se **miden sobre los dos temas actuales** (qué tan oscuro
es `canvas` respecto de `accent`, cuánta saturación conserva `mist`, etc.) y se convierten en
una fórmula única con `color-mix` contra negro y blanco. Con porcentajes **fijos**, la
luminancia del resultado es la misma cualquiera sea el color elegido, así que el contraste no
depende del gusto de quien crea el tema.

> [!warning] El contraste es el riesgo real de esta funcionalidad
> Los temas de Mycelium están medidos: ≥4,5:1 en los dieciséis combos de tema × modo ×
> atmósfera (ver [[atmosferas]] § Verificación). Un color elegido a mano puede tirar eso
> abajo — un amarillo muy claro como principal deja los botones ilegibles en modo claro.
>
> Dos defensas, y hacen falta las dos: derivar con luminancias fijas (arriba), y **medir el
> contraste al elegir el color** para avisar en la misma tarjeta cuando no llega. Avisar, no
> prohibir: es su tema.

## 4. Cómo se ve y se usa

- Configuración → Apariencia, **debajo** de los temas de Mycelium: un grupo **«Temas
  personalizados»** con las mismas tarjetas seleccionables, más una tarjeta **«Nuevo tema»**.
- Crear abre un editor chico: nombre, los colores, y una **vista previa** que se pinta sola
  con la combinación —el mismo truco de las muestras de atmósfera, que repiten los atributos
  en un `<span>` para pintarse sin cambiar la app.
- Un tema propio se puede **editar, renombrar y borrar**. Borrar el tema en uso vuelve al
  anterior. El borrado usa el aviso con deshacer que ya existe ([[avisos-y-confirmaciones]]),
  porque es trabajo del usuario que desaparece.
- **Empezar desde uno existente** («duplicar Cantarela») evita la hoja en blanco, que es
  donde estas funciones se abandonan.

## 5. La mitad del trabajo que no se ve: el tema deja de ser una lista cerrada

Hoy `Tema` es `"bioluminiscencia" | "cantarela"`, y esa suposición está repetida en:

| Sitio | Qué supone |
|---|---|
| `stores/preferencesStore.ts` | El tipo `Tema`, y la validación que cae a Bioluminiscencia si no es Cantarela |
| `lib/db/auth.ts` · `lib/db/indexer.ts` | El `DEFAULT 'bioluminiscencia'` de la columna, en el esquema y en la siembra |
| `lib/db/preferencias.ts` | El mismo literal al guardar |
| `lib/printStyles.ts` | El CSS del PDF lleva **los tokens de los dos temas escritos a mano** |
| `components/settings/AppearanceSection.tsx` | La lista `TEMAS` con sus swatches |
| `components/settings/VentanaAjustes.tsx` | Los alias del buscador de ajustes |
| Backend .NET (web) | Valida y guarda el mismo campo |

Nada de eso es difícil, pero es **dónde está el tamaño**: la funcionalidad no es «una tarjeta
más», es que el tema pase a ser un dato. Los temas propios se guardan en el
`preferencias_json` del usuario —no hace falta columna nueva— y el campo `tema` pasa a
admitir un id propio.

> [!warning] La exportación a PDF no lee la pantalla
> `lib/printStyles.ts` es un CSS **autocontenido** con los colores escritos dentro. Un tema
> personalizado no existe ahí, así que exportar con uno puesto daría un PDF con los colores
> de otro tema si no se genera ese bloque en el momento. Es el sitio que más fácil se olvida.

## 6. Criterios de aceptación (borrador)

1. **CA1 — Crear**: un botón en Apariencia abre el editor; con un nombre y los colores queda
   un tema nuevo, listado bajo «Temas personalizados» y aplicable de un clic.
2. **CA2 — Deriva**: elegidos solo los colores de identidad, la interfaz entera queda pintada
   —fondos, marco, bordes, texto— sin pedir nada más.
3. **CA3 — Los dos modos**: el tema funciona en claro y en oscuro, y las cuatro atmósferas
   siguen funcionando encima.
4. **CA4 — Contraste**: el editor avisa cuando un color elegido deja texto o botones por
   debajo de 4,5:1, sin impedir guardarlo.
5. **CA5 — Persistencia**: sobrevive a cerrar la app, y al cambiar de vault (es del usuario,
   no del vault).
6. **CA6 — Editar y borrar**: se puede cambiar un tema propio y verlo aplicado al instante;
   borrarlo se puede deshacer, y si estaba en uso la app vuelve a un tema válido.
7. **CA7 — PDF**: exportar una nota con un tema propio puesto sale con **sus** colores.
8. **CA8 — Nada se rompe al leer un tema desconocido**: si el guardado nombra un tema que ya
   no existe, la app abre con el tema por defecto en vez de quedar sin estilos.

## 7. Abierto

- **Cuántos colores**: la propuesta es **dos** (principal y secundario) y evaluar un tercero
  para el tinte del marco. A confirmar con el usuario antes de implementar.
- Si los temas se pueden **exportar/importar** (compartirlos sería un archivo del vault).
- Si aplica también a `web-cloud`: el sistema de temas es frontend compartido, así que sí en
  teoría; lo que difiere es el guardado. Ver
  [[Diferencias funcionales aceptadas entre versiones]].

## Relacionadas

- [[BACKLOG]] — `FUN-M-36`, su tamaño y con qué viaja.
- [[atmosferas]] — el eje de estilo que se apoya en los mismos tokens, y el precedente de
  derivar por fórmula.
- [[DESIGN_SYSTEM]] — los tokens y las reglas de color.
- [[avisos-y-confirmaciones]] — el borrado con deshacer que reutiliza.
- [[Bandeja de entrada]] — de dónde salió la idea.
- [[Mapa de documentacion]] — índice general.
