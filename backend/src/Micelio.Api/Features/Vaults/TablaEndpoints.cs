using System.Collections.Concurrent;
using System.Security.Claims;
using System.Text;
using Micelio.Api.Features.Common;
using Micelio.Api.Ports;

namespace Micelio.Api.Features.Vaults;

/// <summary>
/// Datos que consume una base (FUN-L-03): una fila por nota del vault con todo
/// lo que el evaluador necesita para decidir si entra en la tabla y qué mostrar.
/// </summary>
/// <remarks>
/// Es la <b>única</b> pieza de las bases que existe dos veces: acá contra D1 +
/// blobs, y en el escritorio contra SQLite local (<c>lib/db/tabla.ts</c>). El
/// parser del `.base` y el evaluador de filtros viven en <c>lib/bases.ts</c>,
/// que es puro y compartido por las dos versiones.
///
/// El filtrado <b>no baja acá</b> a propósito. Traducir las expresiones a SQL
/// obligaría a escribir el mismo intérprete otra vez en C# y a mantener los dos
/// sincronizados para siempre — que es exactamente lo que costó caro con el
/// parser de frontmatter (ver <c>docs/estado/Version 1.1.0 de web.md</c>).
/// </remarks>
public static class TablaEndpoints
{
    /// <summary>Lecturas de blob simultáneas, igual que el escaneo del grafo.</summary>
    private const int BlobReadConcurrency = 32;

    public static void MapTablaEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("").RequireAuthorization();

        group.MapGet("/vaults/{vaultId}/tabla", async (
            string vaultId,
            ClaimsPrincipal user,
            VaultRepository repo,
            IBlobStorage blobs,
            ID1Client d1,
            CancellationToken ct) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? user.FindFirstValue("sub");
            if (userId is null || await repo.GetVaultRoleAsync(userId, vaultId, ct) is null)
            {
                return Results.Json(new { error = "Sin acceso a este vault." }, statusCode: 403);
            }

            var (carpetas, notas) = await repo.GetTreeAsync(vaultId, ct);

            // Ruta de cada carpeta, para poder resolver `file.folder` y
            // `file.inFolder(...)`: acá el id de una carpeta es un UUID y no dice
            // nada del nombre (en desktop el id ES la ruta).
            var nombrePorId = carpetas.ToDictionary(c => c.GetString("id"), c => c.GetString("nombre"));
            var padrePorId = carpetas.ToDictionary(
                c => c.GetString("id"), c => c.GetStringOrNull("padre_id"));

            string RutaCarpeta(string? id)
            {
                var partes = new List<string>();
                var actual = id;
                // El tope corta un ciclo si el árbol viniera corrupto: preferimos
                // una ruta truncada a un bucle infinito sirviendo una petición.
                for (var i = 0; actual is not null && i < 64; i++)
                {
                    if (!nombrePorId.TryGetValue(actual, out var nombre)) break;
                    partes.Insert(0, nombre);
                    actual = padrePorId.GetValueOrDefault(actual);
                }
                return string.Join('/', partes);
            }

            // Solo notas markdown: una base que se agregara a sí misma sería,
            // además de inútil, confusa. Las de la papelera tampoco entran.
            var enPapelera = (await d1.QueryAsync(
                    "SELECT nota_id FROM papelera", null, ct))
                .Results.Select(r => r.GetString("nota_id"))
                .ToHashSet();

            var elegidas = notas
                .Where(n => (n.GetStringOrNull("tipo") ?? "markdown") == "markdown")
                .Where(n => !enPapelera.Contains(n.GetString("id")))
                .ToList();

            // Etiquetas: las de `tags:` del frontmatter más los `#tag` del cuerpo,
            // igual que el grafo. Hace falta leer los blobs, que es lo que
            // `/vaults/{id}/grafo` ya hace hoy; se acepta el mismo coste por
            // consistencia. Materializar las etiquetas en el índice mejoraría los
            // dos endpoints a la vez, y es trabajo aparte.
            var contenidos = new ConcurrentDictionary<string, string>();
            using var gate = new SemaphoreSlim(BlobReadConcurrency);
            await Task.WhenAll(elegidas.Select(async n =>
            {
                var id = n.GetString("id");
                await gate.WaitAsync(ct);
                try
                {
                    await using var stream = await blobs.GetAsync($"vaults/{vaultId}/notas/{id}.md", ct);
                    if (stream is null) return;
                    using var reader = new StreamReader(stream, Encoding.UTF8);
                    contenidos[id] = await reader.ReadToEndAsync(ct);
                }
                finally
                {
                    gate.Release();
                }
            }));

            var props = await d1.QueryAsync(
                """
                SELECT p.nota_id, p.clave, p.valor, p.tipo
                FROM propiedades p JOIN notas n ON n.id = p.nota_id
                WHERE n.vault_id = ?
                ORDER BY p.rowid
                """,
                [vaultId], ct);

            var propsPorNota = props.Results
                .GroupBy(r => r.GetString("nota_id"))
                .ToDictionary(
                    g => g.Key,
                    g => g.Select(r => new
                    {
                        clave = r.GetString("clave"),
                        valor = r.GetString("valor"),
                        tipo = r.GetString("tipo"),
                    }).ToArray());

            var filas = elegidas.Select(n =>
            {
                var id = n.GetString("id");
                var titulo = n.GetString("titulo");
                var carpeta = RutaCarpeta(n.GetStringOrNull("carpeta_id"));
                var contenido = contenidos.GetValueOrDefault(id, "");
                return new
                {
                    id,
                    nombre = titulo,
                    ruta = carpeta.Length > 0 ? $"{carpeta}/{titulo}" : titulo,
                    carpeta,
                    ext = "md",
                    ctime = n.GetString("creado_en"),
                    mtime = n.GetString("actualizado_en"),
                    size = n.GetInt64OrZero("tamano_bytes"),
                    tags = Frontmatter.Etiquetas(contenido),
                    props = propsPorNota.GetValueOrDefault(id, []),
                };
            });

            return Results.Ok(new { notas = filas });
        });
    }
}
