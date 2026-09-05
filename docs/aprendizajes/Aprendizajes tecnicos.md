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
| [[Rendimiento del grafo]] | Dónde se va el tiempo por frame (repulsión O(n²), `shadowBlur`) y cómo mejorarlo |
| [[Rendimiento de la apertura del vault]] | Por qué tarda abrir un vault grande: `.mycignore` insuficiente, 14 MB por IPC, 11.000 statements sueltos |

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
5. **Lo que parece basura puede ser deliberado.** Un byte **NUL literal** dentro de un
   template literal (`` `${a}\0${b}` ``) hace que git trate el archivo como **binario**: deja
   de diffear y nadie puede revisarlo. Pasaba en `lib/db/grafo.ts` y en
   `components/editor/PropiedadesTab.tsx`, y al implementar `FUN-M-19` se lo tomó por
   suciedad y se lo reemplazó por espacios — cambiando el separador de una clave compuesta
   por el carácter que **sí** puede aparecer dentro de una ruta. Se escribe `\u0000`: mismo
   valor en runtime, archivo de texto para git. **Si algo parece un descuido y está en
   producción, buscá para qué sirve antes de limpiarlo.**
6. **`position: fixed` sale del flujo, pero NO de la composición.** Un `opacity` (o un
   `transform`, o un `filter`) en cualquier ancestro compone el subárbol entero como una
   imagen, y el elemento «suelto» se pinta dentro de ella igual. El buscador de campos de
   las bases se veía translúcido con un fondo de token opaco, y la causa estaba tres
   niveles más arriba: un `opacity: 0.65` puesto para marcar una condición incompleta.
   Cuando un elemento se ve mal y su propio CSS es correcto, **subí por los ancestros
   antes de tocarle nada**. La salida es el portal al `body`. Regla completa en
   [[DESIGN_SYSTEM]] § Estados visuales comunes.

## Relacionadas

- [[Estado del proyecto]] — qué está hecho y qué falta; contexto de estos hallazgos.
- [[bugs-progreso]] — checklist de los bugs `DEF-*` donde se descubrieron.
- [[Bugs_errores_y_defectos]] — el reporte original del usuario que los originó.
