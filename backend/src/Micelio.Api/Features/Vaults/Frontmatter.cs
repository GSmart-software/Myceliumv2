using System.Text.RegularExpressions;

namespace Micelio.Api.Features.Vaults;

/// <summary>
/// Propiedades del frontmatter YAML de una nota (FUN-M-04), del lado del
/// servidor. Ver <c>docs/features/metadata-yaml.md</c>.
/// </summary>
/// <remarks>
/// Es un port del subconjunto de <c>frontend/lib/frontmatter.ts</c> que hace
/// falta para <b>indexar</b>: separar el bloque del cuerpo, leer el mapa plano
/// de <c>clave: valor</c> y resolver las etiquetas. La edición quirúrgica
/// (escribir de vuelta el bloque conservando comentarios y CRLF) NO se porta:
/// eso pasa entero en el cliente, que manda el archivo completo por
/// <c>PUT /notas/{id}/contenido</c>.
///
/// Las reglas tienen que coincidir con las del cliente hasta en los casos raros:
/// si acá se leyera una propiedad que allá no, la nota aparecería en un filtro
/// que el usuario no puede ver en el panel. Por eso el orden de inferencia de
/// tipos, el trato de las comillas y los motivos de "no soportado" son los
/// mismos, y en el mismo orden.
/// </remarks>
public static partial class Frontmatter
{
    /// <summary>Clave con comportamiento propio: sus valores SON las etiquetas.</summary>
    private const string ClaveTags = "tags";

    /// <summary>
    /// <c>clave: valor</c> en una línea. La clave es perezosa para cortar en el
    /// PRIMER <c>:</c>, así <c>url: https://x</c> deja el valor entero.
    /// </summary>
    [GeneratedRegex(@"^([^:#\s][^:]*?)[ \t]*:[ \t]*(.*)$")]
    private static partial Regex ClaveRegex();

    /// <summary>Elemento de una lista en bloque: <c>- valor</c>.</summary>
    [GeneratedRegex(@"^[ \t]*-(?:[ \t]+(.*))?$")]
    private static partial Regex ItemRegex();

    [GeneratedRegex(@"^\d{4}-\d{2}-\d{2}$")]
    private static partial Regex FechaRegex();

    [GeneratedRegex(@"^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(?::\d{2})?$")]
    private static partial Regex FechaHoraRegex();

    [GeneratedRegex(@"^-?\d+(?:\.\d+)?$")]
    private static partial Regex NumeroRegex();

    [GeneratedRegex(@"^(?:true|false)$", RegexOptions.IgnoreCase)]
    private static partial Regex BoolRegex();

    /// <summary>Etiquetas <c>#tag</c> del cuerpo (mismo patrón que el cliente).</summary>
    [GeneratedRegex(@"(?:^|[\s(])#([\p{L}\p{N}_/-]+)")]
    private static partial Regex TagRegex();

    [GeneratedRegex(@"^[|>][-+]?\d*$")]
    private static partial Regex EscalarMultilineaRegex();

    /// <summary>Una lista de mapas (<c>- clave: valor</c>) no está soportada.</summary>
    [GeneratedRegex(@"^[^:]+:(?:\s|$)")]
    private static partial Regex ItemDeMapaRegex();

    /// <summary>Una propiedad leída del bloque, ya normalizada para indexar.</summary>
    /// <param name="Clave">Tal como la escribió el usuario (el filtro compara sin distinguir mayúsculas).</param>
    /// <param name="Tipo">texto | numero | casilla | fecha | fechaHora | lista.</param>
    /// <param name="Valores">Un elemento por valor: las listas dan varios, los escalares uno.</param>
    public sealed record Propiedad(string Clave, string Tipo, IReadOnlyList<string> Valores);

    /// <summary>Resultado de separar el bloque del cuerpo.</summary>
    /// <param name="Hay">Si el archivo empieza con un bloque cerrado.</param>
    /// <param name="Soportado">Si además cae dentro del subconjunto que Mycelium interpreta.</param>
    /// <param name="Props">Vacío salvo que <paramref name="Soportado"/>.</param>
    /// <param name="CuerpoDesde">Índice (0-based) de la primera línea del cuerpo.</param>
    public sealed record Resultado(
        bool Hay,
        bool Soportado,
        IReadOnlyList<Propiedad> Props,
        int CuerpoDesde);

    private static readonly Resultado SinFrontmatter =
        new(false, false, Array.Empty<Propiedad>(), 0);

    private static string SinCr(string linea) =>
        linea.EndsWith('\r') ? linea[..^1] : linea;

    private static bool EsComentario(string linea) =>
        linea.TrimStart().StartsWith('#');

    private static bool EsTags(string clave) =>
        string.Equals(clave, ClaveTags, StringComparison.OrdinalIgnoreCase);

    private static bool EsEntrecomillado(string s) =>
        s.Length >= 2 && (s[0] == '"' || s[0] == '\'') && s[^1] == s[0];

    private static string QuitarComillas(string s)
    {
        if (!EsEntrecomillado(s)) return s;
        var cuerpo = s[1..^1];
        return s[0] == '"'
            ? Regex.Replace(cuerpo, @"\\([""\\])", "$1")
            : cuerpo.Replace("''", "'");
    }

    /// <summary>
    /// Quita el comentario final del valor. Un <c>#</c> solo abre comentario si
    /// va precedido de espacio y fuera de comillas o corchetes; uno al principio
    /// del valor se toma literal (<c>tags: #idea</c>).
    /// </summary>
    private static string PartirComentario(string valor)
    {
        char? comilla = null;
        var anidado = 0;
        for (var i = 0; i < valor.Length; i++)
        {
            var c = valor[i];
            if (comilla is not null)
            {
                if (c == comilla) comilla = null;
                continue;
            }
            if (c is '"' or '\'') comilla = c;
            else if (c is '[' or '{') anidado++;
            else if (c is ']' or '}') anidado--;
            else if (c == '#' && anidado == 0 && i > 0 && char.IsWhiteSpace(valor[i - 1]))
            {
                return valor[..i].TrimEnd();
            }
        }
        return valor.TrimEnd();
    }

    /// <summary>Elementos de una lista en línea (<c>[a, "b, c"]</c>), respetando las comillas.</summary>
    private static List<string> PartirLista(string interior)
    {
        var crudos = new List<string>();
        var actual = new System.Text.StringBuilder();
        char? comilla = null;
        foreach (var c in interior)
        {
            if (comilla is not null)
            {
                actual.Append(c);
                if (c == comilla) comilla = null;
                continue;
            }
            if (c is '"' or '\'') comilla = c;
            if (c == ',')
            {
                crudos.Add(actual.ToString());
                actual.Clear();
                continue;
            }
            actual.Append(c);
        }
        crudos.Add(actual.ToString());
        return crudos
            .Select(s => QuitarComillas(s.Trim()))
            .Where(s => s.Length > 0)
            .ToList();
    }

    /// <summary>
    /// Tipo de un literal, en el orden de la spec: casilla, número, fecha y
    /// hora, fecha, lista, texto. Un escalar entrecomillado es siempre texto.
    /// </summary>
    private static (string Tipo, List<string> Valores) Inferir(string bruto)
    {
        var s = bruto.Trim();
        if (EsEntrecomillado(s)) return ("texto", [QuitarComillas(s)]);
        if (BoolRegex().IsMatch(s)) return ("casilla", [s.ToLowerInvariant()]);
        if (NumeroRegex().IsMatch(s)) return ("numero", [s]);
        if (FechaHoraRegex().IsMatch(s)) return ("fechaHora", [s]);
        if (FechaRegex().IsMatch(s)) return ("fecha", [s]);
        if (s.StartsWith('[') && s.EndsWith(']')) return ("lista", PartirLista(s[1..^1]));
        return ("texto", [s]);
    }

    /// <summary>¿El literal cae fuera del subconjunto soportado?</summary>
    private static bool NoSoportado(string bruto)
    {
        var s = bruto.Trim();
        return EscalarMultilineaRegex().IsMatch(s)
            || s.StartsWith('&') || s.StartsWith('*') || s.StartsWith('!') || s.StartsWith('{');
    }

    /// <summary><c>tags</c> es siempre lista de texto, con o sin <c>#</c>.</summary>
    private static List<string> NormalizarTags(IEnumerable<string> valores) =>
        valores
            .Select(t => t.Trim().TrimStart('#'))
            .Where(t => t.Length > 0)
            .ToList();

    /// <summary>
    /// Separa el frontmatter del cuerpo. El archivo debe EMPEZAR con una línea
    /// que sea exactamente <c>---</c>; el bloque cierra en la primera línea
    /// posterior que sea <c>---</c> o <c>...</c>; sin cierre no hay frontmatter.
    /// </summary>
    public static Resultado Separar(string texto)
    {
        var lineas = texto.Split('\n');
        if (lineas.Length < 2 || SinCr(lineas[0]) != "---") return SinFrontmatter;

        var cierre = -1;
        for (var i = 1; i < lineas.Length; i++)
        {
            var t = SinCr(lineas[i]);
            if (t is "---" or "...") { cierre = i; break; }
        }
        if (cierre == -1) return SinFrontmatter;

        var cuerpoDesde = cierre + 1;
        var noSoportado = new Resultado(true, false, Array.Empty<Propiedad>(), cuerpoDesde);

        var props = new List<Propiedad>();
        var vistas = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var i2 = 1;

        while (i2 < cierre)
        {
            var cruda = SinCr(lineas[i2]);
            if (cruda.Trim().Length == 0 || EsComentario(cruda)) { i2++; continue; }

            // Indentación (o un `- `) a este nivel = el bloque no es un mapa plano.
            if (cruda.Length > 0 && (cruda[0] == ' ' || cruda[0] == '\t')) return noSoportado;
            if (ItemRegex().IsMatch(cruda)) return noSoportado;

            var m = ClaveRegex().Match(cruda);
            if (!m.Success) return noSoportado;

            var clave = QuitarComillas(m.Groups[1].Value.Trim());
            if (!vistas.Add(clave)) return noSoportado; // clave repetida

            var bruto = PartirComentario(m.Groups[2].Value);

            if (bruto.Length == 0)
            {
                // Sin valor en la línea: puede venir una lista en bloque debajo,
                // un mapa anidado (no soportado) o ser un valor vacío.
                var j = i2 + 1;
                while (j < cierre && (SinCr(lineas[j]).Trim().Length == 0 || EsComentario(SinCr(lineas[j])))) j++;
                var sig = j < cierre ? SinCr(lineas[j]) : null;

                if (sig is not null && ItemRegex().IsMatch(sig))
                {
                    var items = new List<string>();
                    var hasta = i2;
                    while (j < cierre)
                    {
                        var l = SinCr(lineas[j]);
                        if (l.Trim().Length == 0) break;
                        if (EsComentario(l)) { j++; continue; }
                        var mi = ItemRegex().Match(l);
                        if (!mi.Success) break;
                        var item = PartirComentario(mi.Groups[1].Value).Trim();
                        if (ItemDeMapaRegex().IsMatch(item) || item.StartsWith('{')) return noSoportado;
                        if (NoSoportado(item)) return noSoportado;
                        if (item.Length > 0) items.Add(QuitarComillas(item));
                        hasta = j;
                        j++;
                    }
                    props.Add(new Propiedad(
                        clave, "lista", EsTags(clave) ? NormalizarTags(items) : items));
                    i2 = hasta + 1;
                    continue;
                }

                if (sig is not null && sig.Length > 0 && (sig[0] == ' ' || sig[0] == '\t')) return noSoportado;

                props.Add(new Propiedad(
                    clave,
                    EsTags(clave) ? "lista" : "texto",
                    EsTags(clave) ? [] : [""]));
                i2++;
                continue;
            }

            if (NoSoportado(bruto)) return noSoportado;

            var (tipo, valores) = Inferir(bruto);
            props.Add(new Propiedad(
                clave,
                EsTags(clave) ? "lista" : tipo,
                EsTags(clave) ? NormalizarTags(valores) : valores));
            i2++;
        }

        return new Resultado(true, true, props, cuerpoDesde);
    }

    /// <summary>El markdown de la nota SIN el bloque de frontmatter.</summary>
    public static string Cuerpo(string texto, Resultado? fm = null)
    {
        fm ??= Separar(texto);
        if (!fm.Hay) return texto;
        return string.Join('\n', texto.Split('\n').Skip(fm.CuerpoDesde));
    }

    /// <summary>
    /// Texto que va al índice FTS: el CUERPO más los VALORES de las propiedades,
    /// sin las claves ni la sintaxis YAML. Así buscar «activo» sigue encontrando
    /// la nota, pero buscar «tags» deja de devolver todas las que tienen esa
    /// clave — y los <c>snippet()</c> dejan de mostrar YAML.
    /// </summary>
    public static string TextoIndexable(string texto)
    {
        var fm = Separar(texto);
        var cuerpo = Cuerpo(texto, fm);
        if (!fm.Hay || !fm.Soportado || fm.Props.Count == 0) return cuerpo;
        var valores = fm.Props
            .SelectMany(p => p.Valores)
            .Where(v => v.Length > 0)
            .ToList();
        return valores.Count == 0 ? cuerpo : $"{string.Join(' ', valores)}\n{cuerpo}";
    }

    /// <summary>
    /// Etiquetas de la nota: las de <c>tags:</c> MÁS los <c>#tag</c> del cuerpo,
    /// sin distinguir de dónde salieron. Se buscan sobre el CUERPO para que los
    /// comentarios <c>#</c> del YAML no se cuelen como etiquetas.
    /// </summary>
    public static string[] Etiquetas(string texto)
    {
        var salida = new List<string>();
        var vistas = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        void Push(string t)
        {
            if (t.Length > 0 && vistas.Add(t)) salida.Add(t);
        }

        var fm = Separar(texto);
        if (fm.Hay && fm.Soportado)
        {
            var tags = fm.Props.FirstOrDefault(p => EsTags(p.Clave));
            if (tags is not null) foreach (var t in tags.Valores) Push(t);
        }
        foreach (Match m in TagRegex().Matches(Cuerpo(texto, fm))) Push(m.Groups[1].Value);
        return [.. salida];
    }
}
