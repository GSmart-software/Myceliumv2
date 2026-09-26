using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Micelio.Api.Features.Common;
using Micelio.Api.Ports;

namespace Micelio.Api.Features.Vaults;

/// <summary>
/// Recordatorios del calendario (FUN-L-22): un documento JSON por vault.
/// </summary>
/// <remarks>
/// En desktop el documento es <c>.mycelium/recordatorios.json</c>, dentro de la
/// carpeta del vault. Acá no hay carpeta, así que el mismo documento —con la
/// misma forma, <c>{version, recordatorios, ocurrencias}</c>— se guarda entero en
/// <c>recordatorios_vault</c>. El servidor <b>no lo interpreta</b>: el modelo
/// (repetición, ocurrencias, qué avisa) vive en <c>lib/recordatorios.ts</c> y es
/// el mismo en las dos versiones. Reescribirlo en C# sería mantener dos
/// intérpretes sincronizados, lo que ya salió caro con el frontmatter.
///
/// Concurrencia: <b>última escritura gana</b>. Dos dispositivos con el mismo
/// vault abierto pueden pisarse si editan a la vez; es una limitación aceptada.
/// </remarks>
public static class RecordatoriosEndpoints
{
    /// <summary>
    /// Tope del documento. Un recordatorio con un detalle largo ronda el KB;
    /// 1 MB son cientos de recordatorios, y corta un cliente roto o malicioso
    /// antes de que llene la base.
    /// </summary>
    private const int MaxBytes = 1024 * 1024;

    /// <summary>Lo que se devuelve si el vault todavía no tiene recordatorios.</summary>
    private const string DocumentoVacio = """{"version":1,"recordatorios":[],"ocurrencias":{}}""";

    public static void MapRecordatoriosEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("").RequireAuthorization();

        // Leer: alcanza con acceso de lectura al vault.
        group.MapGet("/vaults/{vaultId}/recordatorios", async (
            string vaultId,
            ClaimsPrincipal user,
            VaultRepository repo,
            ID1Client d1,
            CancellationToken ct) =>
        {
            if (await Prohibido(repo, user, vaultId, requireEditor: false, ct) is { } error) return error;

            var filas = await d1.QueryAsync(
                "SELECT datos FROM recordatorios_vault WHERE vault_id = ?", [vaultId], ct);
            var datos = filas.Results.Count > 0 ? filas.Results[0].GetString("datos") : DocumentoVacio;

            // Se devuelve el texto tal cual se guardó: ya se validó como JSON al
            // escribirlo, y así no se reserializa (ni se reordena) nada.
            return Results.Text(datos, "application/json", Encoding.UTF8);
        });

        // Escribir: reemplaza el documento entero. Editor o propietario.
        group.MapPut("/vaults/{vaultId}/recordatorios", async (
            string vaultId,
            HttpRequest request,
            ClaimsPrincipal user,
            VaultRepository repo,
            ID1Client d1,
            CancellationToken ct) =>
        {
            if (await Prohibido(repo, user, vaultId, requireEditor: true, ct) is { } error) return error;

            if (request.ContentLength is > MaxBytes)
            {
                return Results.Json(new { error = "Los recordatorios superan el límite de 1 MB." }, statusCode: 413);
            }

            // Se lee con tope aunque no venga Content-Length (cuerpo en chunks).
            string cuerpo;
            using (var reader = new StreamReader(request.Body, Encoding.UTF8))
            {
                var buffer = new char[MaxBytes + 1];
                var sb = new StringBuilder();
                int leidos;
                while ((leidos = await reader.ReadAsync(buffer.AsMemory(), ct)) > 0)
                {
                    sb.Append(buffer, 0, leidos);
                    if (sb.Length > MaxBytes)
                    {
                        return Results.Json(new { error = "Los recordatorios superan el límite de 1 MB." }, statusCode: 413);
                    }
                }
                cuerpo = sb.ToString();
            }
            if (Encoding.UTF8.GetByteCount(cuerpo) > MaxBytes)
            {
                return Results.Json(new { error = "Los recordatorios superan el límite de 1 MB." }, statusCode: 413);
            }

            // Solo se exige que sea un objeto JSON: la forma interna la valida el
            // cliente al leerlo (`leerArchivo` de lib/recordatorios.ts descarta lo
            // que no entiende sin romper).
            try
            {
                using var doc = JsonDocument.Parse(cuerpo);
                if (doc.RootElement.ValueKind != JsonValueKind.Object)
                {
                    return Results.BadRequest(new { error = "Se esperaba un objeto JSON." });
                }
            }
            catch (JsonException)
            {
                return Results.BadRequest(new { error = "El cuerpo no es JSON válido." });
            }

            await d1.QueryAsync(
                """
                INSERT INTO recordatorios_vault (vault_id, datos, actualizado_en) VALUES (?, ?, ?)
                ON CONFLICT(vault_id) DO UPDATE SET datos = excluded.datos, actualizado_en = excluded.actualizado_en
                """,
                [vaultId, cuerpo, DateTime.UtcNow.ToString("O")], ct);

            return Results.Ok(new { ok = true });
        });
    }

    /// <summary>401/403 si el usuario no tiene acceso (o rol suficiente) al vault; null si puede.</summary>
    private static async Task<IResult?> Prohibido(
        VaultRepository repo, ClaimsPrincipal user, string vaultId, bool requireEditor, CancellationToken ct)
    {
        var userId = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? user.FindFirstValue("sub");
        if (userId is null) return Results.Json(new { error = "No autenticado." }, statusCode: 401);

        var rol = await repo.GetVaultRoleAsync(userId, vaultId, ct);
        if (rol is null) return Results.Json(new { error = "Sin acceso a este vault." }, statusCode: 403);
        if (requireEditor && rol == "lector")
        {
            return Results.Json(new { error = "Tu rol no permite editar." }, statusCode: 403);
        }
        return null;
    }
}
