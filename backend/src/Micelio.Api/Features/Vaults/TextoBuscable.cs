using System.Text.Json;
using System.Text.RegularExpressions;

namespace Micelio.Api.Features.Vaults;

/// <summary>
/// El texto que una nota aporta a la búsqueda (<c>DEF-148</c>): lo que va a
/// <c>notas_fts</c> y de donde sale el <b>fragmento</b> de cada resultado.
/// </summary>
/// <remarks>
/// Se separa en dos partes:
/// <list type="bullet">
/// <item><c>Visible</c>: el texto <b>como se lee</b>. Es la columna
/// <c>contenido</c> de <c>notas_fts</c>, y el <c>snippet()</c> del resultado sale
/// de acá. Un <c>[[Pulgón|pulgones]]</c> es «pulgones», un <c>**énfasis**</c> es
/// «énfasis», una fila de tabla es sus celdas; un canvas es el texto de sus
/// tarjetas, no su JSON.</item>
/// <item><c>Oculto</c>: lo que tiene que <b>encontrarse</b> pero no se ve en el
/// texto: el destino de un enlace con alias («Pulgón»), la URL de un enlace
/// markdown, la ruta de una tarjeta de nota. Va a la columna <c>extra</c>, que
/// se busca igual que el contenido pero de la que el fragmento sale solo si la
/// coincidencia está únicamente ahí.</item>
/// </list>
///
/// Antes se indexaba el texto crudo y el fragmento mostraba la sintaxis tal cual
/// —<c>[[Tomate]] + [[Albahaca]]</c>, <c>| |---|---|</c>, y en un canvas o un
/// dibujo el JSON con <c>\n</c> literales—. Limpiar al indexar, y no al pintar, es
/// lo que permite que el <c>snippet()</c> de FTS5 corte y resalte sobre el texto
/// ya limpio: limpiar el fragmento después no sabría qué hacer con un
/// <c>…Pulgón|pulgones]]</c> cortado a la mitad.
///
/// La limpieza es <b>para leer</b>, no un parser de markdown. Las palabras no
/// cambian —el tokenizador ya ignoraba <c>[</c>, <c>*</c>, <c>|</c> y compañía—,
/// así que buscar sigue encontrando lo mismo; lo que se saca del texto visible
/// pasa a <c>Oculto</c>.
///
/// Port de <c>frontend/lib/textoBuscable.ts</c> de desktop. La web no tiene
/// diagramas <c>.drawio</c>, así que esa rama no se trae.
/// </remarks>
public static partial class TextoBuscable
{
    public sealed record Resultado(string Visible, IReadOnlyList<string> Oculto);

    /// <summary>
    /// <c>[[destino#ancla|alias]]</c> y <c>![[…]]</c>. El separador del alias
    /// puede venir escapado (<c>\|</c>): así se escribe dentro de una tabla
    /// (<c>DEF-045</c>).
    /// </summary>
    [GeneratedRegex(@"!?\[\[([^\]\n]+?)\]\]")]
    private static partial Regex WikilinkRegex();

    [GeneratedRegex(@"\\?\|")]
    private static partial Regex SeparadorAliasRegex();

    /// <summary><c>[texto](url)</c> y <c>![alt](url)</c>.</summary>
    [GeneratedRegex(@"!?\[([^\]\n]*)\]\(([^)\s]+)(?:\s+""[^""]*"")?\)")]
    private static partial Regex EnlaceMdRegex();

    /// <summary>Fila separadora de una tabla: <c>|---|:--:|</c>.</summary>
    [GeneratedRegex(@"^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$")]
    private static partial Regex SeparadorTablaRegex();

    /// <summary>Una regla horizontal (<c>---</c>, <c>***</c>, <c>___</c>).</summary>
    [GeneratedRegex(@"^\s*([-*_])(\s*\1){2,}\s*$")]
    private static partial Regex ReglaRegex();

    [GeneratedRegex(@"^\s*(```|~~~)")]
    private static partial Regex VallaRegex();

    [GeneratedRegex(@"^(\s*>\s?)+")]
    private static partial Regex CitaRegex();

    [GeneratedRegex(@"^\s*\[![^\]]*\][-+]?\s*")]
    private static partial Regex CalloutRegex();

    [GeneratedRegex(@"^\s*#{1,6}\s+")]
    private static partial Regex EncabezadoRegex();

    [GeneratedRegex(@"^\s*(?:[-*+]|\d+[.)])\s+(?:\[.\]\s+)?")]
    private static partial Regex ListaRegex();

    [GeneratedRegex(@"^\s*\|.*\|\s*$")]
    private static partial Regex FilaTablaRegex();

    [GeneratedRegex(@"(?<!\\)\|")]
    private static partial Regex CeldaRegex();

    [GeneratedRegex(@"(\*\*|__|~~|==)(?=\S)(.+?)(?<=\S)\1")]
    private static partial Regex EnfasisDobleRegex();

    [GeneratedRegex(@"(^|[^\p{L}\p{N}*])\*(?=\S)(.+?)(?<=\S)\*(?![\p{L}\p{N}*])")]
    private static partial Regex EnfasisAsteriscoRegex();

    [GeneratedRegex(@"(^|[^\p{L}\p{N}_])_(?=\S)(.+?)(?<=\S)_(?![\p{L}\p{N}_])")]
    private static partial Regex EnfasisGuionBajoRegex();

    [GeneratedRegex(@"`([^`]+)`")]
    private static partial Regex CodigoEnLineaRegex();

    [GeneratedRegex(@"</?[A-Za-z][^>]*>")]
    private static partial Regex EtiquetaHtmlRegex();

    [GeneratedRegex(@"\r?\n")]
    private static partial Regex SaltoRegex();

    /// <summary>
    /// Markdown → texto legible. <paramref name="oculto"/> recibe lo que deja de
    /// verse pero tiene que seguir encontrándose.
    /// </summary>
    public static string MarkdownLegible(string md, List<string> oculto)
    {
        var lineas = new List<string>();
        var enBloqueCodigo = false;
        foreach (var cruda in SaltoRegex().Split(md))
        {
            // Las vallas de un bloque de código no son texto; su contenido sí, tal cual.
            if (VallaRegex().IsMatch(cruda))
            {
                enBloqueCodigo = !enBloqueCodigo;
                continue;
            }
            if (enBloqueCodigo)
            {
                lineas.Add(cruda);
                continue;
            }
            if (SeparadorTablaRegex().IsMatch(cruda)) continue;
            if (ReglaRegex().IsMatch(cruda)) continue;
            lineas.Add(LineaLegible(cruda, oculto));
        }
        return string.Join('\n', lineas);
    }

    private static string LineaLegible(string linea, List<string> oculto)
    {
        var l = linea;

        // Enlaces primero: su `|` de alias no es el de una celda de tabla.
        l = WikilinkRegex().Replace(l, m =>
        {
            var partes = SeparadorAliasRegex().Split(m.Groups[1].Value);
            var d = partes[0].Trim();
            var alias = string.Join('|', partes.Skip(1)).Trim();
            if (alias.Length > 0)
            {
                if (d.Length > 0) oculto.Add(d);
                return alias;
            }
            // `[[Nota#Encabezado]]` se lee «Nota › Encabezado»; `[[#Encabezado]]`,
            // solo el encabezado.
            var segmentos = d.Split('#');
            var legibles = new[] { segmentos[0].Trim() }
                .Concat(segmentos.Skip(1).Select(a => a.TrimStart('^').Trim()))
                .Where(p => p.Length > 0);
            return string.Join(" › ", legibles);
        });
        l = EnlaceMdRegex().Replace(l, m =>
        {
            oculto.Add(m.Groups[2].Value);
            return m.Groups[1].Value;
        });

        // Prefijos de bloque: cita/callout, encabezado, elemento de lista, tarea.
        l = CitaRegex().Replace(l, "");
        l = CalloutRegex().Replace(l, "");
        l = EncabezadoRegex().Replace(l, "");
        l = ListaRegex().Replace(l, "");

        // Celdas de tabla: los bordes se van, los separadores internos quedan como
        // un punto medio para que dos celdas no se lean como una frase.
        if (FilaTablaRegex().IsMatch(l))
        {
            var t = l.Trim();
            if (t.StartsWith('|')) t = t[1..];
            if (t.EndsWith('|')) t = t[..^1];
            l = string.Join(" · ", CeldaRegex().Split(t)
                .Select(c => c.Trim())
                .Where(c => c.Length > 0));
        }

        // Énfasis, tachado, resaltado y código en línea. Un `_` dentro de una
        // palabra (`snake_case`) no es énfasis: solo se quitan los que bordean una
        // palabra.
        l = EnfasisDobleRegex().Replace(l, "$2");
        l = EnfasisAsteriscoRegex().Replace(l, "$1$2");
        l = EnfasisGuionBajoRegex().Replace(l, "$1$2");
        l = CodigoEnLineaRegex().Replace(l, "$1");
        // Etiquetas HTML sueltas (`<br>`, `<span …>`): su texto queda, la marca no.
        l = EtiquetaHtmlRegex().Replace(l, " ");

        return l;
    }

    private static string? Texto(JsonElement obj, string prop) =>
        obj.TryGetProperty(prop, out var v) && v.ValueKind == JsonValueKind.String ? v.GetString() : null;

    /// <summary>Canvas: el texto de las tarjetas, las etiquetas de grupos y flechas.</summary>
    private static string? CanvasLegible(string json, List<string> oculto)
    {
        // Un archivo vacío es un canvas vacío (así se crea uno nuevo).
        if (json.Trim().Length == 0) return "";
        JsonDocument doc;
        try
        {
            doc = JsonDocument.Parse(json);
        }
        catch (JsonException)
        {
            return null;
        }
        using (doc)
        {
            var raiz = doc.RootElement;
            if (raiz.ValueKind != JsonValueKind.Object) return null;

            var partes = new List<string>();
            var ids = new HashSet<string>();
            if (raiz.TryGetProperty("nodes", out var nodos) && nodos.ValueKind == JsonValueKind.Array)
            {
                foreach (var n in nodos.EnumerateArray())
                {
                    if (n.ValueKind != JsonValueKind.Object) continue;
                    // Sin id no se puede referenciar ni dibujar: el lienzo lo descarta.
                    if (Texto(n, "id") is not { } id) continue;
                    ids.Add(id);
                    var tipo = Texto(n, "type") ?? "text";
                    if (tipo is not ("text" or "file" or "link" or "group")) tipo = "text";
                    switch (tipo)
                    {
                        case "text" when Texto(n, "text") is { Length: > 0 } texto:
                            partes.Add(MarkdownLegible(texto, oculto));
                            break;
                        case "group" when Texto(n, "label") is { Length: > 0 } etiqueta:
                            partes.Add(etiqueta);
                            break;
                        case "file" when Texto(n, "file") is { Length: > 0 } archivo:
                        {
                            // La tarjeta muestra el título de la nota; la ruta, a lo oculto.
                            var nombre = archivo[(archivo.LastIndexOf('/') + 1)..];
                            if (nombre.EndsWith(".md", StringComparison.OrdinalIgnoreCase)) nombre = nombre[..^3];
                            partes.Add(nombre);
                            oculto.Add(archivo);
                            break;
                        }
                        case "link" when Texto(n, "url") is { Length: > 0 } url:
                            oculto.Add(url);
                            break;
                    }
                }
            }
            if (raiz.TryGetProperty("edges", out var aristas) && aristas.ValueKind == JsonValueKind.Array)
            {
                foreach (var a in aristas.EnumerateArray())
                {
                    if (a.ValueKind != JsonValueKind.Object) continue;
                    // Una flecha a un nodo que no existe no se dibuja.
                    if (Texto(a, "id") is null
                        || Texto(a, "fromNode") is not { } desde || !ids.Contains(desde)
                        || Texto(a, "toNode") is not { } hasta || !ids.Contains(hasta))
                    {
                        continue;
                    }
                    if (Texto(a, "label") is { Length: > 0 } etiqueta) partes.Add(etiqueta);
                }
            }
            return string.Join('\n', partes.Where(p => p.Trim().Length > 0));
        }
    }

    /// <summary>Excalidraw: el texto de sus elementos de texto (sin las imágenes en base64).</summary>
    private static string? ExcalidrawLegible(string json, List<string> oculto)
    {
        JsonDocument doc;
        try
        {
            doc = JsonDocument.Parse(json);
        }
        catch (JsonException)
        {
            return null;
        }
        using (doc)
        {
            var raiz = doc.RootElement;
            if (raiz.ValueKind != JsonValueKind.Object
                || !raiz.TryGetProperty("elements", out var elementos)
                || elementos.ValueKind != JsonValueKind.Array)
            {
                return null;
            }
            var partes = new List<string>();
            foreach (var el in elementos.EnumerateArray())
            {
                if (el.ValueKind != JsonValueKind.Object) continue;
                if (el.TryGetProperty("isDeleted", out var borrado) && borrado.ValueKind == JsonValueKind.True) continue;
                var texto = Texto(el, "originalText") ?? Texto(el, "text");
                if (Texto(el, "type") == "text" && texto is not null && texto.Trim().Length > 0) partes.Add(texto);
                if (Texto(el, "link") is { Length: > 0 } link) oculto.Add(link);
            }
            return string.Join('\n', partes);
        }
    }

    /// <summary>
    /// El texto buscable de un archivo según su tipo. El frontmatter de una nota
    /// markdown NO pasa por acá: lo separa antes <see cref="Frontmatter.TextoIndexable"/>.
    ///
    /// Un formato que no se entiende (JSON roto) se indexa crudo, como antes: es
    /// mejor un fragmento feo que una nota que no se encuentra.
    /// </summary>
    public static Resultado De(string texto, string tipo)
    {
        var oculto = new List<string>();
        var visible = tipo switch
        {
            "markdown" => MarkdownLegible(texto, oculto),
            "canvas" => CanvasLegible(texto, oculto),
            "excalidraw" => ExcalidrawLegible(texto, oculto),
            // `.base`: es la definición de una consulta en YAML, corta y legible.
            _ => texto,
        };
        return visible is null ? new Resultado(texto, []) : new Resultado(visible, oculto);
    }
}
