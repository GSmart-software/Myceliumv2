using System.Text.Json;
using Micelio.Api.Features.Common;

namespace Micelio.Api.Features.Vaults;

/// <summary>
/// A qué nota apunta un `[[wikilink]]` (`FUN-M-40`, D8): la MISMA regla que usa el
/// editor del cliente, portada de `resolveWikilinkEnIndice` en
/// `frontend/lib/wikilinks.ts`.
///
/// Hasta el reflejo del 2026-09-27 el grafo de la web resolvía a «la primera nota
/// con ese título» en el orden de la consulta, sin pista de carpeta ni extensión.
/// Con dos notas homónimas el clic del editor iba a una y el grafo dibujaba la
/// arista a otra; `![[Dibujo.excalidraw]]` resolvía en el editor y no en el
/// grafo; y renombrar —que reescribe los enlaces entrantes a partir de
/// `/notas/{id}/conexiones`— podía reescribir la nota equivocada.
///
/// La referencia es el destino ya sin alias, con su ruta si la traía
/// (`Carpeta/Sub/título`). El título se compara sin distinguir mayúsculas. Las
/// reglas, en orden (`DEF-120`, las mismas cinco del cliente):
/// 1. **Con extensión de nota** (`x.excalidraw`, `x.canvas`, `x.base`, `x.md`):
///    candidatas = las notas **de ese tipo** con título `x`. Si no hay ninguna,
///    se prueba el título literal (una nota que se llame `x.excalidraw`).
/// 2. **Sin extensión**: candidatas = todo lo que se llame así.
/// 3. **Pista de carpeta**: si la hay, quedan solo las candidatas cuya ruta
///    TERMINA con esos segmentos; **si ninguna calza, no hay destino** —también
///    con una sola candidata—.
/// 4. **Sin extensión**, entre las que quedan gana la nota markdown.
/// 5. Empate: la de ruta más corta (más cerca de la raíz), y después por id en
///    orden ordinal, como la comparación de ids del cliente. En web el id es un
///    UUID, así que el segundo criterio no es «por ruta» como en desktop, pero es
///    el mismo en las dos puntas, que es lo que importa.
///
/// Antes de `DEF-120` el tipo no participaba: con `Devoluciones.md` en la raíz y
/// `Eval/Devoluciones.excalidraw`, `![[Devoluciones.excalidraw]]` dibujaba la
/// arista a la nota; una pista que no calzaba caía a todas las candidatas; y
/// `[[Pedido]]` podía apuntar a `Pedido.base` en vez de a `Pedido.md`.
/// </summary>
public sealed class ResolutorWikilinks
{
    /// <summary>
    /// Tipo de nota por extensión, sin punto (`EXTENSION_POR_TIPO` del cliente,
    /// al revés). El tipo es el valor de la columna `notas.tipo`.
    /// </summary>
    private static readonly Dictionary<string, string> TipoPorExtension = new()
    {
        ["md"] = "markdown",
        ["excalidraw"] = "excalidraw",
        ["base"] = "base",
        ["canvas"] = "canvas",
    };

    private readonly Dictionary<string, List<(string Id, string? CarpetaId, string Tipo)>> porTitulo = new();
    private readonly Dictionary<string, (string Nombre, string? PadreId)> carpetasPorId = new();
    private readonly Dictionary<string, string[]> segmentosCache = new();

    public ResolutorWikilinks(
        IReadOnlyList<JsonElement> notas,
        IReadOnlyList<JsonElement> carpetas)
    {
        foreach (var c in carpetas)
        {
            carpetasPorId[c.GetString("id")] = (c.GetString("nombre"), c.GetStringOrNull("padre_id"));
        }
        foreach (var n in notas)
        {
            var clave = n.GetString("titulo").ToLowerInvariant();
            if (!porTitulo.TryGetValue(clave, out var lista)) porTitulo[clave] = lista = [];
            // Sin `tipo` en la fila se trata como markdown, el tipo por defecto
            // de la columna.
            lista.Add((n.GetString("id"), n.GetStringOrNull("carpeta_id"), n.GetStringOrNull("tipo") ?? "markdown"));
        }
    }

    /// <summary>Segmentos de carpeta (raíz→hoja) que contienen a una nota.</summary>
    private string[] Segmentos(string? carpetaId)
    {
        if (carpetaId is null) return [];
        if (segmentosCache.TryGetValue(carpetaId, out var cache)) return cache;
        var segs = new List<string>();
        var vistos = new HashSet<string>();
        var id = carpetaId;
        while (id is not null && vistos.Add(id) && carpetasPorId.TryGetValue(id, out var c))
        {
            segs.Insert(0, c.Nombre);
            id = c.PadreId;
        }
        return segmentosCache[carpetaId] = [.. segs];
    }

    /// <summary>
    /// El tipo que nombra la extensión del final y el nombre sin ella
    /// (`tipoDeExtension` + `sinExtensionDeNota` del cliente), o null si no
    /// termina en una extensión de nota.
    /// </summary>
    private static (string Tipo, string SinExtension)? ExtensionDeNota(string nombre)
    {
        var i = nombre.LastIndexOf('.');
        if (i <= 0) return null;
        var ext = nombre[(i + 1)..].ToLowerInvariant();
        return TipoPorExtension.TryGetValue(ext, out var tipo) ? (tipo, nombre[..i]) : null;
    }

    /// <summary>El id de la nota a la que apunta <paramref name="referencia"/>, o null.</summary>
    public string? Resolver(string referencia)
    {
        var partes = referencia.Split('/')
            .Select(s => s.Trim())
            .Where(s => s.Length > 0)
            .ToArray();
        if (partes.Length == 0) return null;

        var titulo = partes[^1].ToLowerInvariant();
        var pista = partes[..^1].Select(s => s.ToLowerInvariant()).ToArray();

        // 1) Con extensión: solo las notas de ese tipo, buscadas por el título
        // sin la extensión (el título de una nota no la lleva).
        List<(string Id, string? CarpetaId, string Tipo)> candidatas = [];
        if (ExtensionDeNota(titulo) is { } ext && porTitulo.TryGetValue(ext.SinExtension, out var delTitulo))
        {
            candidatas = delTitulo.Where(n => n.Tipo == ext.Tipo).ToList();
        }
        var porExtension = candidatas.Count > 0;
        // 2) Sin extensión —o con una que ninguna nota de ese tipo tiene—: el
        // título tal cual.
        if (!porExtension && porTitulo.TryGetValue(titulo, out var literal)) candidatas = literal;
        if (candidatas.Count == 0) return null;

        // 3) La pista de carpeta: una que no calza con ninguna no resuelve, ni
        // siquiera con una única candidata.
        var pool = candidatas;
        if (pista.Length > 0)
        {
            pool = candidatas.Where(n =>
            {
                var segs = Segmentos(n.CarpetaId);
                if (pista.Length > segs.Length) return false;
                for (var i = 0; i < pista.Length; i++)
                {
                    if (segs[segs.Length - pista.Length + i].ToLowerInvariant() != pista[i]) return false;
                }
                return true;
            }).ToList();
            if (pool.Count == 0) return null;
        }

        // 4) Sin extensión, la nota markdown le gana a un dibujo, un lienzo o
        // una tabla con el mismo nombre.
        if (!porExtension && pool.Count > 1)
        {
            var notasMd = pool.Where(n => n.Tipo == "markdown").ToList();
            if (notasMd.Count > 0) pool = notasMd;
        }
        if (pool.Count == 1) return pool[0].Id;

        // 5) Ruta más corta primero; a igual altura, por id (orden ordinal).
        var orden = new List<(string Id, string? CarpetaId, string Tipo)>(pool);
        orden.Sort((a, b) =>
        {
            var d = Segmentos(a.CarpetaId).Length - Segmentos(b.CarpetaId).Length;
            return d != 0 ? d : string.CompareOrdinal(a.Id, b.Id);
        });
        return orden[0].Id;
    }
}
