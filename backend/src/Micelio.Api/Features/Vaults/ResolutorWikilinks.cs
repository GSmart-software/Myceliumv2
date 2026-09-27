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
/// La regla:
/// - La referencia es el destino ya sin alias, con su ruta si la traía
///   (`Carpeta/Sub/título`). El título se compara sin distinguir mayúsculas.
/// - Si ningún título coincide, se prueba sin la extensión de nota
///   (`Lienzo.canvas` → `Lienzo`), la misma lista que `lib/extensionesDeTipo.ts`.
/// - Entre homónimas, la pista de carpeta (la ruta debe TERMINAR con esos
///   segmentos) elige; una pista que no calza no impide resolver.
/// - Empate: la de ruta más corta (más cerca de la raíz), y después por id en
///   orden ordinal, como la comparación de ids del cliente. En web el id es un
///   UUID, así que el segundo criterio no es «por ruta» como en desktop, pero es
///   el mismo en las dos puntas, que es lo que importa.
/// </summary>
public sealed class ResolutorWikilinks
{
    /// <summary>Extensiones de nota, sin punto (`EXTENSIONES_DE_NOTA` del cliente).</summary>
    private static readonly string[] ExtensionesDeNota = ["md", "excalidraw", "base", "canvas"];

    private readonly Dictionary<string, List<(string Id, string? CarpetaId)>> porTitulo = new();
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
            lista.Add((n.GetString("id"), n.GetStringOrNull("carpeta_id")));
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

    /// <summary>Quita la extensión de nota del final, si la tiene (`sinExtensionDeNota`).</summary>
    private static string SinExtensionDeNota(string nombre)
    {
        var i = nombre.LastIndexOf('.');
        if (i <= 0) return nombre;
        var ext = nombre[(i + 1)..].ToLowerInvariant();
        return ExtensionesDeNota.Contains(ext) ? nombre[..i] : nombre;
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

        if (!porTitulo.TryGetValue(titulo, out var candidatas))
        {
            var sinExt = SinExtensionDeNota(titulo);
            if (sinExt == titulo || !porTitulo.TryGetValue(sinExt, out candidatas)) return null;
        }
        if (candidatas.Count == 1) return candidatas[0].Id;

        var pool = candidatas;
        if (pista.Length > 0)
        {
            var conPista = candidatas.Where(n =>
            {
                var segs = Segmentos(n.CarpetaId);
                if (pista.Length > segs.Length) return false;
                for (var i = 0; i < pista.Length; i++)
                {
                    if (segs[segs.Length - pista.Length + i].ToLowerInvariant() != pista[i]) return false;
                }
                return true;
            }).ToList();
            if (conPista.Count > 0) pool = conPista;
        }

        // Ruta más corta primero; a igual altura, por id (orden ordinal).
        var orden = new List<(string Id, string? CarpetaId)>(pool);
        orden.Sort((a, b) =>
        {
            var d = Segmentos(a.CarpetaId).Length - Segmentos(b.CarpetaId).Length;
            return d != 0 ? d : string.CompareOrdinal(a.Id, b.Id);
        });
        return orden[0].Id;
    }
}
