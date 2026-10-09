using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using Micelio.Api.Features.Common;
using Micelio.Api.Ports;

namespace Micelio.Api.Features.Vaults;

/// <summary>
/// La búsqueda full-text del vault (HU-21): de la consulta del usuario a los
/// resultados de <c>GET /vaults/{id}/buscar</c>.
/// </summary>
/// <remarks>
/// Por defecto la búsqueda es por coincidencia (prefijo); <c>exacto=true</c>
/// exige palabra completa (DEF-035). Acepta además filtros <c>clave:valor</c>
/// sobre las propiedades del frontmatter (FUN-M-04, ver
/// <see cref="CondicionValor"/>) y <c>tag:x</c> sobre las etiquetas
/// (<c>DEF-152</c>, ver <see cref="CondicionEtiqueta"/>), que se combinan con el
/// texto libre o se usan solos. <c>campo</c> elige dónde mirar —nombre,
/// contenido o los dos (FUN-M-20)— y se resuelve en la propia consulta FTS.
///
/// Es el equivalente de <c>lib/db/fts.ts</c> y <c>lib/db/buscar.ts</c> de
/// desktop, con los mismos arreglos: <c>DEF-144</c> (tildes en los filtros),
/// <c>DEF-145</c> (valores con espacios y coincidencia por palabra),
/// <c>DEF-146</c> (el título primero), <c>DEF-148</c> (fragmentos legibles) y
/// <c>DEF-152</c> (<c>tag:x</c> por la etiqueta).
/// </remarks>
public static partial class SearchEndpoints
{
    /// <summary>
    /// Un resultado de la búsqueda. Los nombres en JSON son los de siempre
    /// (<c>nota_id</c>, <c>carpeta_id</c>): el contrato con el cliente no cambia.
    /// El fragmento trae la coincidencia entre «» —marcadores no-HTML: el
    /// cliente escapa el texto y los convierte a &lt;mark&gt;—.
    /// </summary>
    internal sealed class ResultadoBusqueda
    {
        [JsonPropertyName("nota_id")] public required string NotaId { get; init; }
        [JsonPropertyName("titulo")] public required string Titulo { get; init; }
        [JsonPropertyName("carpeta_id")] public string? CarpetaId { get; init; }
        [JsonPropertyName("fragmento")] public string Fragmento { get; set; } = "";

        public static ResultadoBusqueda De(JsonElement fila) => new()
        {
            NotaId = fila.GetString("nota_id"),
            Titulo = fila.GetString("titulo"),
            CarpetaId = fila.GetStringOrNull("carpeta_id"),
            Fragmento = fila.GetStringOrNull("fragmento") ?? "",
        };
    }

    /// <summary>
    /// Un filtro <c>clave:valor</c> sobre la tabla <c>propiedades</c> (FUN-M-04).
    /// <c>Entero</c> dice si el valor vino <b>entre comillas</b>
    /// (<c>bancal:"Bancal 1"</c>, <c>DEF-145</c>): entonces tiene que ser el valor
    /// completo de la propiedad. Sin comillas alcanza con una palabra del valor.
    /// </summary>
    internal readonly record struct FiltroPropiedad(string Clave, string Valor, bool Entero);

    /// <summary>
    /// Los tokens de la consulta: un filtro con el valor entre comillas
    /// (<c>bancal:"Bancal 1"</c>, <c>DEF-145</c>), frases entre comillas o tiras
    /// sin espacios. La primera alternativa exige que lo de antes de <c>:</c> sea
    /// una clave, así que solo puede empezar al principio de un token: una URL o
    /// <c>a/b:"x y"</c> siguen cortándose por los espacios. <c>tag:"…"</c> queda
    /// afuera a propósito: una etiqueta no lleva espacios.
    /// </summary>
    [GeneratedRegex(@"(?![Tt][Aa][Gg]:)[\p{L}_][\p{L}\p{N}_-]*:""[^""]*""|""[^""]+""|\S+")]
    private static partial Regex TokenRegex();

    [GeneratedRegex(@"[\p{L}\p{N}]")]
    private static partial Regex LetraONumeroRegex();

    [GeneratedRegex(@"[^\p{L}\p{N}]+")]
    private static partial Regex NoPalabraRegex();

    [GeneratedRegex(@"[\p{L}\p{N}]+")]
    private static partial Regex PalabraRegex();

    [GeneratedRegex(@"[!%_]")]
    private static partial Regex ComodinLikeRegex();

    [GeneratedRegex(@"«[^»]*»")]
    private static partial Regex MarcaRegex();

    /// <summary>
    /// El ÚNICO lugar donde se corta la consulta, para que separar los filtros y
    /// armar la query FTS no puedan discrepar sobre qué es un token.
    /// </summary>
    internal static List<string> TokensDeConsulta(string raw) =>
        TokenRegex().Matches(raw).Select(m => m.Value).ToList();

    /// <summary>Quita UNA comilla al principio y UNA al final, si las hay.</summary>
    private static string SinComillasSueltas(string s)
    {
        if (s.StartsWith('"')) s = s[1..];
        if (s.EndsWith('"')) s = s[..^1];
        return s;
    }

    /// <summary>
    /// Separa los filtros de la consulta: los <c>clave:valor</c> sobre las
    /// propiedades y los <c>tag:x</c> sobre las etiquetas; lo que queda es el
    /// texto libre.
    /// </summary>
    /// <remarks>
    /// <c>tag:x</c> NO es un término de texto (<c>DEF-152</c>): se buscaba en el
    /// FTS como «#x», el tokenizador descartaba el <c>#</c> y terminaba siendo la
    /// palabra <c>x</c> en cualquier lado —<c>tag:solanaceas</c> traía la nota
    /// con <c>familia: solanáceas</c>, que no tiene esa etiqueta—. Ahora va a la
    /// tabla <c>etiquetas</c>, ya plegado. Un <c>tag:</c> vacío (lo que se está
    /// escribiendo todavía) no filtra nada y se descarta.
    /// </remarks>
    internal static (List<FiltroPropiedad> Filtros, List<string> Etiquetas, string Resto) SepararFiltros(string raw)
    {
        var filtros = new List<FiltroPropiedad>();
        var etiquetas = new List<string>();
        var resto = new List<string>();

        foreach (var texto in TokensDeConsulta(raw))
        {
            if (texto.StartsWith("tag:", StringComparison.OrdinalIgnoreCase))
            {
                // Las comillas no hacen falta (una etiqueta no lleva espacios),
                // pero tampoco estorban: `tag:"x"` es `tag:x`.
                var tag = Plegado.PlegarEtiqueta(SinComillasSueltas(texto[4..]));
                if (tag.Length > 0 && !etiquetas.Contains(tag)) etiquetas.Add(tag);
                continue;
            }
            if (texto.StartsWith('"'))
            {
                resto.Add(texto);
                continue;
            }
            var m = FiltroPropiedadRegex().Match(texto);
            if (!m.Success)
            {
                resto.Add(texto);
                continue;
            }
            // Entre comillas (`bancal:"Bancal 1"`), el valor es entero. Una comilla
            // suelta —la que se está escribiendo todavía— se descarta y el filtro
            // sigue siendo por palabra, para que la búsqueda en vivo no quede
            // vacía mientras se tipea.
            var crudo = m.Groups[2].Value;
            var entero = crudo.Length >= 2 && crudo.StartsWith('"') && crudo.EndsWith('"');
            filtros.Add(new FiltroPropiedad(
                m.Groups[1].Value,
                entero ? crudo[1..^1] : SinComillasSueltas(crudo),
                entero));
        }

        return (filtros, etiquetas, string.Join(" ", resto));
    }

    /// <summary>
    /// La columna de <c>notas_fts</c> que le toca a cada modo de búsqueda
    /// (FUN-M-20). «Contenido» son dos: el texto legible y <c>extra</c>, lo que
    /// se busca sin mostrarse (valores de propiedades, destinos de enlaces con
    /// alias: <c>DEF-148</c>). Cualquier otro valor —o ninguno— busca en todas.
    /// </summary>
    private static string? ColumnaDe(string? campo) => campo switch
    {
        "nombre" => "titulo",
        "contenido" => "{contenido extra}",
        _ => null,
    };

    /// <summary>
    /// Texto libre → expresión FTS5 segura (HU-21 CA5/CA6/CA7): AND implícito,
    /// frases entre comillas; cada término se entrecomilla para neutralizar
    /// operadores FTS.
    /// </summary>
    /// <remarks>
    /// <c>prefix</c> (búsqueda por coincidencia, por defecto): cada término se
    /// trata como prefijo (<c>"perr"*</c> encuentra "perro"). Si es false
    /// (búsqueda exacta), solo coincide la palabra completa.
    ///
    /// <c>campo</c> (FUN-M-20) restringe a una columna. El filtro se aplica a CADA
    /// término y no a la consulta entera: <c>titulo : "a"* "b"*</c> limitaría solo
    /// el primero —el operador de columna alcanza a la frase que le sigue— y el
    /// segundo se buscaría en todo el documento.
    /// </remarks>
    internal static string BuildFtsQuery(string raw, bool prefix = false, string? campo = null)
    {
        var parts = new List<string>();
        var star = prefix ? "*" : "";
        var columna = ColumnaDe(campo);
        var en = columna is null ? "" : $"{columna} : ";

        foreach (var text in TokensDeConsulta(raw))
        {
            if (text.StartsWith('"') && text.EndsWith('"') && text.Length > 2)
            {
                // Frase exacta (en modo coincidencia, el `*` aplica el prefijo al
                // último término de la frase).
                parts.Add($"{en}\"{text[1..^1].Replace("\"", "\"\"")}\"{star}");
                continue;
            }

            var sanitized = text.Replace("\"", "\"\"");
            if (sanitized.Length > 0) parts.Add($"{en}\"{sanitized}\"{star}");
        }

        return string.Join(" ", parts);
    }

    /// <summary>
    /// Las dos consultas FTS sobre el TÍTULO con las que se ordenan los
    /// resultados (<c>DEF-146</c>), a partir del texto libre de la consulta:
    /// <c>Empieza</c>, el título EMPIEZA con ese texto como frase (<c>^</c> de
    /// FTS5), y <c>Contiene</c>, el título tiene todas las palabras. Mismo
    /// tokenizador que la búsqueda —sin tildes ni mayúsculas— y prefijo según
    /// «Búsqueda exacta». Nulo si no hay texto libre con alguna letra o número
    /// (una frase vacía en FTS5 es un error).
    /// </summary>
    internal static (string Empieza, string Contiene)? ConsultasDeTitulo(string raw, bool prefix = false)
    {
        var libres = TokensDeConsulta(raw)
            .Select(t => t.Length > 2 && t.StartsWith('"') && t.EndsWith('"') ? t[1..^1] : t)
            // Una comilla suelta o un guion no son palabras para el tokenizador:
            // como frase quedarían vacíos.
            .Where(t => LetraONumeroRegex().IsMatch(t))
            .ToList();
        if (libres.Count == 0) return null;
        var star = prefix ? "*" : "";
        var texto = string.Join(" ", libres);
        return (
            $"titulo : ^\"{texto.Replace("\"", "\"\"")}\"{star}",
            string.Join(" ", libres.Select(t => $"titulo : \"{t.Replace("\"", "\"\"")}\"{star}")));
    }

    /// <summary>
    /// Las palabras del texto libre, plegadas (<c>DEF-148</c>): para saber en qué
    /// propiedad cayó una coincidencia y armar su fragmento «clave: valor».
    /// Cortadas como corta el tokenizador: en todo lo que no sea letra o número.
    /// </summary>
    internal static List<string> PalabrasDeConsulta(string raw) =>
        TokensDeConsulta(raw)
            .SelectMany(t => NoPalabraRegex().Split(Plegado.Plegar(t)))
            .Where(p => p.Length > 0)
            .ToList();

    /// <summary>
    /// La condición sobre una fila <c>p</c> de <c>propiedades</c> para un filtro
    /// (<c>DEF-145</c>), sobre las columnas PLEGADAS (<c>DEF-144</c>).
    /// </summary>
    /// <remarks>
    /// <list type="bullet">
    /// <item><b>Entre comillas</b> (<c>bancal:"Bancal 1"</c>): el valor completo.</item>
    /// <item><b>Sin comillas</b> (<c>bancal:bancal</c>, <c>estado:crec</c>): una
    /// <b>palabra</b> del valor que empiece así —o que sea esa palabra, con
    /// «Búsqueda exacta»—, la misma regla que el texto. No es un «contiene» a
    /// propósito: <c>estado:activo</c> no debe traer «inactivo».</item>
    /// </list>
    /// La clave va siempre por igualdad, así que <c>idx_propiedades_plegado</c>
    /// acota la búsqueda a las filas de ESA clave; el <c>LIKE</c> se evalúa solo
    /// sobre ellas, con un <c>instr</c> previo que descarta barato las que ni
    /// contienen la primera palabra.
    /// </remarks>
    internal static (string Sql, List<object?> Params) CondicionValor(FiltroPropiedad f, bool exacto = false)
    {
        var clave = Plegado.Plegar(f.Clave);
        var palabra = Plegado.APalabras(Plegado.Plegar(f.Valor)).Trim();
        // Un valor que es todo puntuación (`x:-`) no tiene palabras: se compara entero.
        if (f.Entero || palabra.Length == 0)
        {
            return ("p.clave_plegada = ? AND p.valor_plegado = ?", [clave, Plegado.Plegar(f.Valor)]);
        }
        // `%` y `_` del usuario son literales, no comodines del `LIKE`.
        var literal = ComodinLikeRegex().Replace(palabra, "!$0");
        var primera = palabra.Split(' ')[0];
        return (
            $"""
            p.clave_plegada = ? AND instr(p.valor_plegado, ?) > 0
              AND (' ' || {Plegado.SeparadoresSql("p.valor_plegado")} || ' ') LIKE ? ESCAPE '!'
            """,
            [clave, primera, $"% {literal}{(exacto ? " " : "")}%"]);
    }

    /// <summary>
    /// Una condición por filtro, encadenadas con AND. Va como
    /// <c>n.id IN (SELECT …)</c> y no como un <c>EXISTS</c> correlacionado: así la
    /// subconsulta se resuelve una vez por el índice en vez de recorrer las
    /// propiedades de cada nota del vault.
    /// </summary>
    private static (string Sql, List<object?> Params) CondicionFiltros(List<FiltroPropiedad> filtros, bool exacto)
    {
        var parametros = new List<object?>();
        var sql = string.Concat(filtros.Select(f =>
        {
            var (c, p) = CondicionValor(f, exacto);
            parametros.AddRange(p);
            return $" AND n.id IN (SELECT p.nota_id FROM propiedades p WHERE {c})";
        }));
        return (sql, parametros);
    }

    /// <summary>
    /// La condición sobre una fila <c>e</c> de <c>etiquetas</c> para un filtro
    /// <c>tag:x</c> (<c>DEF-152</c>), con <paramref name="tag"/> ya plegado: la
    /// etiqueta <c>x</c> o una anidada debajo (<c>x/lo-que-sea</c>), como en
    /// Obsidian —<c>tag:huerta</c> trae <c>#huerta/riego</c>;
    /// <c>tag:huerta/riego</c>, solo esa—. No es por prefijo de palabra:
    /// <c>tag:huer</c> no trae <c>#huerta</c>. La igualdad y el rango
    /// (<c>'x/' &lt; t &lt; 'x0'</c>: <c>0</c> es el carácter que sigue a <c>/</c>)
    /// van por <c>idx_etiquetas_plegado</c>.
    /// </summary>
    internal static (string Sql, List<object?> Params) CondicionEtiqueta(string tag) =>
        ("(e.tag_plegado = ? OR (e.tag_plegado > ? AND e.tag_plegado < ?))", [tag, $"{tag}/", $"{tag}0"]);

    /// <summary>Un <c>n.id IN (…)</c> por etiqueta, encadenados con AND.</summary>
    private static (string Sql, List<object?> Params) CondicionEtiquetas(List<string> etiquetas)
    {
        var parametros = new List<object?>();
        var sql = string.Concat(etiquetas.Select(t =>
        {
            var (c, p) = CondicionEtiqueta(t);
            parametros.AddRange(p);
            return $" AND n.id IN (SELECT e.nota_id FROM etiquetas e WHERE {c})";
        }));
        return (sql, parametros);
    }

    /// <summary>La búsqueda entera: filtros, texto, orden y fragmentos.</summary>
    internal static async Task<List<ResultadoBusqueda>> BuscarAsync(
        ID1Client d1, string vaultId, string q, bool exacto, string? campo, CancellationToken ct)
    {
        var (filtros, etiquetas, resto) = SepararFiltros(q);
        var match = BuildFtsQuery(resto, prefix: !exacto, campo: campo);
        if (match.Length == 0 && filtros.Count == 0 && etiquetas.Count == 0) return [];

        var (propsSql, propsParams) = CondicionFiltros(filtros, exacto);
        var (tagsSql, tagsParams) = CondicionEtiquetas(etiquetas);
        var filtroSql = propsSql + tagsSql;
        List<object?> filtroParams = [.. propsParams, .. tagsParams];

        // Solo filtros (`estado:activo` o `tag:x` a secas): no hay nada que buscar
        // en el FTS, así que se consulta por propiedad o por etiqueta y el
        // fragmento es la coincidencia —solo la propiedad que coincidió—.
        if (match.Length == 0)
        {
            (string Sql, List<object?> Params)? primero =
                filtros.Count > 0 ? CondicionValor(filtros[0], exacto) : null;
            var fragmentoSql = primero is { } pr
                ? $"""
                  (SELECT p.clave || ': «' || p.valor || '»' FROM propiedades p
                    WHERE p.nota_id = n.id AND {pr.Sql}
                    LIMIT 1)
                  """
                : "''";
            var soloFiltros = await d1.QueryAsync(
                $"""
                SELECT n.id AS nota_id, n.titulo, n.carpeta_id, {fragmentoSql} AS fragmento
                FROM notas n
                WHERE n.vault_id = ?
                  AND n.id NOT IN (SELECT nota_id FROM papelera){filtroSql}
                ORDER BY n.titulo
                LIMIT 50
                """,
                [.. primero?.Params ?? [], vaultId, .. filtroParams], ct);
            var porFiltro = soloFiltros.Results.Select(ResultadoBusqueda.De).ToList();
            if (primero is null) await FragmentosDeEtiquetaAsync(d1, porFiltro, etiquetas[0], ct);
            return porFiltro;
        }

        // Buscando SOLO por nombre no se devuelve fragmento: la coincidencia es el
        // título, que el cliente ya muestra encima. Un `snippet` del cuerpo ahí
        // sería el principio del documento sin nada marcado.
        var fragmento = campo == "nombre"
            ? "'' AS fragmento"
            : "snippet(notas_fts, 2, '«', '»', '…', 10) AS fragmento";
        var (ordenSql, ordenParams) = OrdenPorTitulo(resto, prefix: !exacto);

        var result = await d1.QueryAsync(
            $"""
            SELECT f.nota_id, n.titulo, n.carpeta_id,
                   {fragmento}
            FROM notas_fts f
            JOIN notas n ON n.id = f.nota_id
            WHERE notas_fts MATCH ?
              AND n.vault_id = ?
              AND n.id NOT IN (SELECT nota_id FROM papelera){filtroSql}
            ORDER BY {ordenSql}
            LIMIT 50
            """,
            [match, vaultId, .. filtroParams, .. ordenParams], ct);
        var resultados = result.Results.Select(ResultadoBusqueda.De).ToList();
        if (campo != "nombre") await CompletarFragmentosAsync(d1, resultados, resto, match, exacto, ct);
        return resultados;
    }

    /// <summary>
    /// El <c>ORDER BY</c> de la búsqueda con texto (<c>DEF-146</c>): primero el
    /// título, después la relevancia.
    /// </summary>
    /// <remarks>
    /// <list type="number">
    /// <item>Títulos que EMPIEZAN con el texto buscado, del más corto al más largo:
    /// el título idéntico a la consulta es el más corto posible.</item>
    /// <item>Títulos que contienen todas las palabras.</item>
    /// <item>El resto, por <c>rank</c> (bm25 del FTS), como antes.</item>
    /// </list>
    /// Solo <c>rank</c> no alcanzaba: bm25 mide la fila entera —título y cuerpo
    /// como una sola bolsa de palabras—, así que la nota «Tomate» con un cuerpo
    /// largo que no repite la palabra perdía contra cualquiera que la nombrara
    /// varias veces, y con más de 50 coincidencias podía quedar afuera del
    /// <c>LIMIT</c>. Por eso el orden se resuelve en la consulta. Las dos
    /// subconsultas no son correlacionadas: se resuelven una vez cada una.
    /// </remarks>
    private static (string Sql, List<object?> Params) OrdenPorTitulo(string resto, bool prefix)
    {
        if (ConsultasDeTitulo(resto, prefix) is not { } titulo) return ("rank", []);
        return (
            """
            CASE WHEN f.rowid IN (SELECT rowid FROM notas_fts WHERE notas_fts MATCH ?) THEN length(n.titulo)
                 WHEN f.rowid IN (SELECT rowid FROM notas_fts WHERE notas_fts MATCH ?) THEN 100000
                 ELSE 200000 END,
            rank
            """,
            [titulo.Empieza, titulo.Contiene]);
    }

    /// <summary>
    /// El fragmento de una búsqueda solo por etiquetas (<c>DEF-152</c>): dónde
    /// está la primera etiqueta de la consulta en cada nota. En <c>tags:</c> del
    /// frontmatter → <c>tags: «x»</c>; si no, el <c>snippet()</c> del contenido
    /// con la etiqueta marcada; si tampoco, <c>«#x»</c>. Dos consultas, sobre los
    /// 50 resultados de la página como mucho.
    /// </summary>
    private static async Task FragmentosDeEtiquetaAsync(
        ID1Client d1, List<ResultadoBusqueda> resultados, string tag, CancellationToken ct)
    {
        if (resultados.Count == 0) return;
        var porId = resultados.ToDictionary(r => r.NotaId);

        // El `+` saca a `clave_plegada` del índice: si no, SQLite puede elegir
        // `idx_propiedades_plegado` y recorrer las `tags` del vault entero en vez
        // de las de estas notas.
        var enTags = await d1.QueryAsync(
            """
            SELECT nota_id, clave, valor FROM propiedades
             WHERE nota_id IN (SELECT value FROM json_each(?)) AND +clave_plegada = 'tags'
             ORDER BY rowid
            """,
            [JsonSerializer.Serialize(porId.Keys)], ct);
        foreach (var p in enTags.Results)
        {
            var t = Plegado.PlegarEtiqueta(p.GetString("valor"));
            if (porId.TryGetValue(p.GetString("nota_id"), out var r) && r.Fragmento.Length == 0
                && (t == tag || t.StartsWith($"{tag}/", StringComparison.Ordinal)))
            {
                r.Fragmento = $"{p.GetString("clave")}: «{p.GetString("valor")}»";
            }
        }

        var sinFragmento = resultados.Where(r => r.Fragmento.Length == 0).Select(r => r.NotaId).ToList();
        var palabras = NoPalabraRegex().Split(tag).Where(p => p.Length > 0).ToList();
        if (sinFragmento.Count > 0 && palabras.Count > 0)
        {
            // La frase de la etiqueta, palabra por palabra: `tag:huerta` marca
            // también `#huerta/riego`, que el tokenizador lee «huerta riego». Qué
            // notas salen ya lo decidió la tabla de etiquetas; esto solo elige qué
            // resaltar.
            var filas = await d1.QueryAsync(
                """
                SELECT f.nota_id, snippet(notas_fts, 2, '«', '»', '…', 10) AS fragmento
                  FROM notas_fts f
                 WHERE notas_fts MATCH ?
                   AND f.nota_id IN (SELECT value FROM json_each(?))
                """,
                [$"contenido : \"{string.Join(" ", palabras)}\"", JsonSerializer.Serialize(sinFragmento)], ct);
            foreach (var f in filas.Results)
            {
                var frag = f.GetStringOrNull("fragmento");
                if (porId.TryGetValue(f.GetString("nota_id"), out var r) && frag is not null && frag.Contains('«'))
                {
                    r.Fragmento = frag;
                }
            }
        }
        foreach (var r in resultados.Where(r => r.Fragmento.Length == 0)) r.Fragmento = $"«#{tag}»";
    }

    /// <summary>
    /// Los resultados cuyo fragmento no marca nada (<c>DEF-148</c>): la
    /// coincidencia no está en el texto legible sino en una propiedad, en un
    /// destino de enlace con alias o solo en el título. En orden: 1) si es una
    /// <b>propiedad</b>, el fragmento es <c>clave: valor</c> con la palabra
    /// resaltada; 2) si no, lo que marca el <c>snippet()</c> de la columna
    /// <c>extra</c>; 3) si tampoco, queda el que había (la coincidencia es el
    /// título). A lo sumo dos consultas más, solo sobre los resultados sin marca.
    /// </summary>
    private static async Task CompletarFragmentosAsync(
        ID1Client d1, List<ResultadoBusqueda> resultados, string resto, string match, bool exacto, CancellationToken ct)
    {
        var sinMarca = resultados.Where(r => !r.Fragmento.Contains('«')).ToList();
        if (sinMarca.Count == 0) return;

        var palabras = PalabrasDeConsulta(resto);
        if (palabras.Count > 0)
        {
            var props = await d1.QueryAsync(
                """
                SELECT nota_id, clave, valor FROM propiedades
                 WHERE nota_id IN (SELECT value FROM json_each(?))
                 ORDER BY rowid
                """,
                [JsonSerializer.Serialize(sinMarca.Select(r => r.NotaId))], ct);
            var porNota = props.Results
                .GroupBy(p => p.GetString("nota_id"))
                .ToDictionary(g => g.Key, g => g.ToList());
            foreach (var r in sinMarca)
            {
                if (!porNota.TryGetValue(r.NotaId, out var lista)) continue;
                foreach (var p in lista)
                {
                    if (MarcarPalabras(p.GetString("valor"), palabras, exacto) is { } marcado)
                    {
                        r.Fragmento = $"{p.GetString("clave")}: {marcado}";
                        break;
                    }
                }
            }
            sinMarca = sinMarca.Where(r => !r.Fragmento.Contains('«')).ToList();
            if (sinMarca.Count == 0) return;
        }

        var extras = await d1.QueryAsync(
            """
            SELECT f.nota_id, snippet(notas_fts, 3, '«', '»', '…', 10) AS fragmento
              FROM notas_fts f
             WHERE notas_fts MATCH ?
               AND f.nota_id IN (SELECT value FROM json_each(?))
            """,
            [match, JsonSerializer.Serialize(sinMarca.Select(r => r.NotaId))], ct);
        var extraPorNota = new Dictionary<string, string>();
        foreach (var e in extras.Results)
        {
            extraPorNota[e.GetString("nota_id")] = e.GetStringOrNull("fragmento") ?? "";
        }
        // De `extra` se muestra solo lo marcado: alrededor hay valores de
        // propiedades y otros destinos sueltos, que como contexto no dicen nada.
        foreach (var r in sinMarca)
        {
            if (!extraPorNota.TryGetValue(r.NotaId, out var extra)) continue;
            var marcas = MarcaRegex().Matches(extra).Select(m => m.Value).Distinct().ToList();
            if (marcas.Count > 0) r.Fragmento = string.Join(" · ", marcas);
        }
    }

    /// <summary>
    /// <paramref name="valor"/> con «» alrededor de cada palabra que coincide con
    /// alguna de las de la consulta (ya plegadas): que empiece así o, con
    /// «Búsqueda exacta», que sea esa palabra —la regla del FTS—. Nulo si ninguna
    /// coincide.
    /// </summary>
    internal static string? MarcarPalabras(string valor, List<string> palabras, bool exacto)
    {
        var alguna = false;
        var marcado = PalabraRegex().Replace(valor, m =>
        {
            var p = Plegado.Plegar(m.Value);
            if (palabras.Any(q => exacto ? p == q : p.StartsWith(q, StringComparison.Ordinal)))
            {
                alguna = true;
                return $"«{m.Value}»";
            }
            return m.Value;
        });
        return alguna ? marcado : null;
    }
}
