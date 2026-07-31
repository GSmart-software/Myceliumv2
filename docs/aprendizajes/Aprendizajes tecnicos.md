# Aprendizajes técnicos

Mapa del área **aprendizajes**: causas raíz y trampas que costaron tiempo real en
Mycelium. No es documentación de funcionalidades (eso vive en `docs/features/`, ver
[[Mapa de documentacion]]), sino **conocimiento de depuración**: por qué algo fallaba
y qué principio general dejó.

> [!tip] Antes de depurar algo del editor, del drag & drop o del WebView, leé la nota
> del área. Varias de estas causas raíz se descubrieron después de 2–3 hipótesis
> equivocadas; están escritas para que no se repitan.

## Por área

| Nota | Qué contiene |
|---|---|
| [[CodeMirror y la vista en vivo]] | Height-map, widgets de bloque, gutter desfasado, decoraciones por profundidad |
| [[Drag and drop en Mycelium]] | Los tres sistemas de arrastre que conviven y por qué se estorban entre sí |
| [[Estado con Zustand]] | `persist`, `partialize` y el efecto de `set()` sobre el DOM en el mismo handler |
| [[Tauri y el WebView]] | ConPTY, `dragDropEnabled`, `elementFromPoint`, límites del WebView2 |
| [[Compilacion y entorno de desarrollo]] | `cargo` sin memoria, `tee` que oculta fallos, procesos huérfanos en `:3000` |

## Principios que se repiten

1. **Verificá la hipótesis antes de "arreglar".** Varios bugs (notablemente el
   desfase del gutter con tablas, ver [[CodeMirror y la vista en vivo]]) tuvieron dos
   intentos fallidos porque se corrigió el síntoma. El usuario reportando "sigue
   pasando" es la señal de que la causa raíz no estaba encontrada.
2. **Un síntoma que "aparece y desaparece" suele ser un evento cancelado**, no un
   estilo mal aplicado. Ver el caso de `pointercancel` en
   [[Drag and drop en Mycelium]].
3. **Lo que mide el navegador no siempre es lo que ves.** `offsetHeight` ignora
   márgenes; `elementFromPoint` puede devolver un overlay. Cuando un cálculo de
   layout falla, sospechá de la unidad de medida antes que de la lógica.
4. **En el escritorio hay dos mundos** (WebView y Rust): un síntoma "del frontend"
   puede tener causa nativa — el caso de `dragDropEnabled` en
   [[Tauri y el WebView]] es el ejemplo canónico.

## Relacionadas

- [[Estado del proyecto]] — qué está hecho y qué falta; contexto de estos hallazgos.
- [[bugs-progreso]] — checklist de los bugs `DEF-*` donde se descubrieron.
- [[Bugs_errores_y_defectos]] — el reporte original del usuario que los originó.
