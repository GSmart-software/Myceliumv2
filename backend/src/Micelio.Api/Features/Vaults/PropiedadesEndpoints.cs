using System.Security.Claims;
using System.Text;
using Micelio.Api.Features.Common;
using Micelio.Api.Ports;

namespace Micelio.Api.Features.Vaults;

/// <summary>
/// Propiedades del frontmatter como datos consultables (FUN-M-04). El panel de
/// la nota las lee para autocompletar claves, y son la base de FUN-L-03
/// (archivos tabla): sin una tabla filtrable, los metadatos quedarían guardados
/// y no servirían para nada.
/// </summary>
/// <remarks>
/// La tabla la escribe <see cref="VaultRepository.TouchNotaContenidoAsync"/> al
/// guardar contenido: acá solo se lee.
/// </remarks>
public static class PropiedadesEndpoints
{
    public static void MapPropiedadesEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("").RequireAuthorization();

        // Claves usadas en el vault, ordenadas por frecuencia. Alimenta el
        // autocompletado del panel: es lo que evita que el mismo atributo
        // termine como `estado`, `Estado` y `status`.
        group.MapGet("/vaults/{vaultId}/propiedades/claves", async (
            string vaultId,
            ClaimsPrincipal user,
            VaultRepository repo,
            ID1Client d1,
            CancellationToken ct) =>
        {
            if (await SinAcceso(user, vaultId, repo, ct)) return Prohibido();

            var filas = await d1.QueryAsync(
                """
                SELECT p.clave AS clave, COUNT(*) AS usos
                FROM propiedades p JOIN notas n ON n.id = p.nota_id
                WHERE n.vault_id = ?
                  AND n.id NOT IN (SELECT nota_id FROM papelera)
                GROUP BY p.clave
                ORDER BY usos DESC, p.clave ASC
                """,
                [vaultId], ct);

            return Results.Ok(new { claves = filas.Results.Select(r => r.GetString("clave")) });
        });

        // Notas que tienen una propiedad, opcionalmente con un valor concreto.
        group.MapGet("/vaults/{vaultId}/propiedades", async (
            string vaultId,
            string? clave,
            string? valor,
            ClaimsPrincipal user,
            VaultRepository repo,
            ID1Client d1,
            CancellationToken ct) =>
        {
            if (await SinAcceso(user, vaultId, repo, ct)) return Prohibido();
            if (string.IsNullOrWhiteSpace(clave))
            {
                return Results.Ok(new { notas = Array.Empty<object>() });
            }

            var filtroValor = string.IsNullOrEmpty(valor) ? "" : " AND p.valor = ? COLLATE NOCASE";
            var parametros = string.IsNullOrEmpty(valor)
                ? new object?[] { vaultId, clave }
                : [vaultId, clave, valor];

            var filas = await d1.QueryAsync(
                $"""
                SELECT DISTINCT n.id, n.titulo, p.valor
                FROM propiedades p JOIN notas n ON n.id = p.nota_id
                WHERE n.vault_id = ? AND p.clave = ? COLLATE NOCASE{filtroValor}
                  AND n.id NOT IN (SELECT nota_id FROM papelera)
                ORDER BY n.titulo
                """,
                parametros, ct);

            var notas = filas.Results.Select(r => new
            {
                id = r.GetString("id"),
                titulo = r.GetString("titulo"),
                valor = r.GetString("valor"),
            });
            return Results.Ok(new { notas });
        });

        // Lo indexado para una nota (el panel lo usa como respaldo cuando el
        // editor de esa nota no está montado).
        group.MapGet("/notas/{id}/propiedades", async (
            string id,
            ClaimsPrincipal user,
            VaultRepository repo,
            ID1Client d1,
            CancellationToken ct) =>
        {
            var vaultId = await repo.GetVaultIdOfNotaAsync(id, ct);
            if (vaultId is null) return Results.NotFound();
            if (await SinAcceso(user, vaultId, repo, ct)) return Prohibido();

            var filas = await d1.QueryAsync(
                "SELECT clave, valor, tipo, orden FROM propiedades WHERE nota_id = ? ORDER BY rowid",
                [id], ct);

            return Results.Ok(filas.Results.Select(r => new
            {
                clave = r.GetString("clave"),
                valor = r.GetString("valor"),
                tipo = r.GetString("tipo"),
                orden = r.GetInt64("orden"),
            }));
        });

        // Reconstruye el índice de TODAS las notas del vault: relee los blobs y
        // reescribe FTS y propiedades. Hace falta una vez, al estrenar FUN-M-04:
        // las notas guardadas antes tienen el YAML crudo dentro del índice de
        // texto y ninguna fila en `propiedades`, así que ni el filtro
        // `clave:valor` ni el autocompletado del panel las ven. Después solo se
        // necesita si el índice se corrompe — guardar una nota ya la reindexa.
        group.MapPost("/vaults/{vaultId}/reindexar", async (
            string vaultId,
            ClaimsPrincipal user,
            VaultRepository repo,
            IBlobStorage blobs,
            CancellationToken ct) =>
        {
            if (await SinAcceso(user, vaultId, repo, ct)) return Prohibido();

            var (_, notas) = await repo.GetTreeAsync(vaultId, ct);
            var reindexadas = 0;
            foreach (var n in notas)
            {
                var id = n.GetString("id");
                // Secuencial a propósito: es mantenimiento que se corre una vez,
                // y así no compite con el tráfico normal por conexiones ni por E/S.
                await using var stream = await blobs.GetAsync($"vaults/{vaultId}/notas/{id}.md", ct);
                if (stream is null) continue;
                using var reader = new StreamReader(stream, Encoding.UTF8);
                var contenido = await reader.ReadToEndAsync(ct);
                await repo.TouchNotaContenidoAsync(
                    id, n.GetString("titulo"), contenido, Encoding.UTF8.GetByteCount(contenido), ct);
                reindexadas++;
            }

            return Results.Ok(new { reindexadas });
        });
    }

    private static async Task<bool> SinAcceso(
        ClaimsPrincipal user, string vaultId, VaultRepository repo, CancellationToken ct)
    {
        var userId = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? user.FindFirstValue("sub");
        return userId is null || await repo.GetVaultRoleAsync(userId, vaultId, ct) is null;
    }

    private static IResult Prohibido() =>
        Results.Json(new { error = "Sin acceso a este vault." }, statusCode: 403);
}
