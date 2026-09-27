# Representaciones de micelio para el grafo

Exploración del 2026-09-25/26 sobre **cómo dibujar el grafo de otra manera** que el cúmulo
de fuerzas heredado de Obsidian: algo que represente lo que Mycelium es, un micelio. Salió
de la conversación sobre `DEF-109` (el grafo con más de 1.000 notas, ver
[[Rendimiento del grafo]]): tres de las cuatro ideas prescinden de la física, así que
además de estética son rendimiento. **Resultado**: el usuario decidió el 2026-09-26 sumar
tres de ellas a Mycelium, conservando el cúmulo actual → spec en [[grafo-disposiciones]]
(`FUN-L-23`). **Retirada el 2026-09-27** por decisión del usuario: no le gustó el
resultado en la app; queda solo el cúmulo.

## Las demos

Páginas HTML autocontenidas, con canvas, en `docs/design/demos/` (no se abren desde
Mycelium: son archivos para el navegador) y publicadas como artifacts privados del usuario:

| Página | Datos | Para qué sirvió |
|---|---|---|
| `micelio-del-vault.html` | Vault **sintético** de 1.500 notas (selector 800/3.000): 10 áreas, mapas por área, hubs por conexión preferencial, huérfanas, fechas | Probar las cuatro ideas con una cantidad real de nodos antes de tocar datos de nadie |
| `micelio-tesina.html` | Vault real «Tesina»: 1.306 notas, 3.275 enlaces, fechas de alta por git | El caso **muy enlazado**: mostró que con muchas aristas el rizoma se vuelve un disco y que el anillo se lee igual de bien |
| `micelio-trabajo.html` | Vault real «Trabajo y Estudio», hecho en Obsidian: 1.220 notas, 1.777 enlaces, 13 islas | El caso **con muchas carpetas y pocos cruces**: es donde la metáfora funciona mejor, y sobre el que el usuario afinó los parámetros |

Los scripts que las generan están al lado: `extraer-vault.mjs` (recorre un vault y arma el
grafo con la **misma resolución de enlaces que Mycelium**: `sinCodigo` + `destinoDeWikilink`
compilados del repo con esbuild a una carpeta `lib/`; fecha de creación por git y, si no,
por el archivo) y `armar-vault.py` (embebe el JSON en la página base).

## Las cuatro ideas y qué se decidió

| Idea | Metáfora | Física | Decisión |
|---|---|---|---|
| **Rizoma radial** | La nota raíz es la espora de origen; cada nivel de distancia, un anillo; las hifas del árbol gruesas según lo que cuelga y finas en las puntas; los enlaces fuera del árbol como anastomosis tenues; islas y huérfanas afuera | No | **Descartada** (2026-09-26): presupone una nota raíz de la que cuelga todo, y los vaults que se trabajan con Mycelium no se estructuran así. Era la más vistosa en «Trabajo y Estudio» (cada curso como un diente de león) |
| **Anillo de colonias** | Cada carpeta es una colonia en un arco del anillo; las hifas de la misma colonia se curvan por el borde con su tinte, las que cruzan pasan por el centro y forman el tapiz | No | **Adoptada** |
| **Crecimiento** | El vault se dibuja como creció: cada nota brota junto a las que ya citaba y se aleja del centro; las hifas van de la vieja a la nueva y se afinan en la punta; «Reproducir» lo hace brotar | No, e **incremental**: agregar notas no mueve las viejas | **Adoptada** |
| **Sustrato** | La disposición de siempre con piel de micelio: halo donde la colonia es densa, hifas ahusadas, esporas y cuerpos fructíferos en los hubs | Sí (la del cúmulo, con Barnes-Hut en la demo) | **Adoptada** |

## Lo que el usuario ajustó sobre las demos (y quedó en la spec)

| Ajuste | De | A | Por qué |
|---|---|---|---|
| Grosor de las hifas del rizoma | `0,7 + 1,6·log₂(hojas)` | `0,3 + 0,5·log₂(hojas)` | Un cordón con 200 hojas medía 13 unidades contra esporas de 2 |
| Distancia entre anillos del rizoma | paso 105, espaciado 9 | paso 50, espaciado 6,5 | Los anillos quedaban lejos del nodo que los une |
| Repulsión del sustrato | `k = 70`, fuerza ×1, tope 8 | `k = 45`, fuerza ×0,7, tope 6 | Los nodos quedaban demasiado separados |
| Brillo de las hifas (sustrato y crecimiento) | blanco al 42–50 % | verde del glow al 20–24 % | Donde se juntaban varias tapaban las esporas |

## Hallazgos de paso, sobre los vaults reales

- **Enlaces de solo ID** (`[[FTE-0051]]` para citar «FTE-0051 Horodecki et al 2009 — …»):
  807 en la Tesina, sobre 116 IDs, y **ninguno resuelve en Mycelium**, porque ninguna nota
  se titula así. Es el caso de uso de `FUN-M-15` (alias) o de una regla de resolución por
  prefijo. La demo lo muestra con un interruptor.
- **`[[nota#sección]]` no resuelve** con la lógica actual: el `#sección` queda pegado al
  título. Varios de los 116 «rotos» de «Trabajo y Estudio» son de este tipo. Pendiente de
  registrar como defecto.
- El `.mycignore` de la Tesina no tiene `.*/`, así que Mycelium indexa las 23 notas de su
  `.claude/` (mismo caso que `DEF-108`).

## Relacionadas

- [[grafo-disposiciones]] — la funcionalidad que salió de acá (`FUN-L-23`).
- [[Rendimiento del grafo]] — `DEF-109`, el problema que motivó buscar otra representación.
- [[DESIGN]] — el sistema de diseño; las demos usan los tokens `--mic-glow` y `--mic-accent`.
- [[Mapa de documentacion]] — índice general.
