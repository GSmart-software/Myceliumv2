using System.Security.Claims;
using System.Text;
using Micelio.Api.Features.Common;
using Micelio.Api.Ports;

namespace Micelio.Api.Features.Vaults;

/// <summary>
/// Los dos diccionarios personales del corrector ortográfico (FUN-L-12): el
/// <b>del vault</b> y el <b>de Mycelium</b> (del usuario).
/// </summary>
/// <remarks>
/// En desktop son archivos de texto —<c>.mycelium/diccionario.txt</c> dentro del
/// vault y <c>diccionario-personal.txt</c> en la configuración de la app—. Acá se
/// guarda ese mismo texto (una palabra por renglón) en
/// <c>diccionario_vault</c> y <c>diccionario_usuario</c>. El servidor <b>no lo
/// interpreta</b>: lo lee y lo escribe <c>lib/ortografia/palabras.ts</c>, igual en
/// las dos versiones.
///
/// Cuerpo y respuesta: <c>{ "palabras": "texto" }</c>. Sin nada guardado, el GET
/// devuelve <c>{ "palabras": null }</c> (en desktop, «no hay archivo»).
///
/// Concurrencia: <b>última escritura gana</b>, como los recordatorios. El cliente
/// relee antes de cada «Agregar», así que solo se pisan dos escrituras simultáneas.
/// </remarks>
public static class DiccionarioEndpoints
{
    /// <summary>
    /// Tope del texto. 256 KB son decenas de miles de palabras: más de lo que un
    /// usuario agrega a mano, y corta un cliente roto antes de que llene la base.
    /// </summary>
    private const int MaxBytes = 256 * 1024;

    public static void MapDiccionarioEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("").RequireAuthorization();

        // ── Diccionario del vault ─────────────────────────────────
        // Leer: alcanza con acceso de lectura al vault (el corrector de un
        // lector también usa las palabras del vault).
        group.MapGet("/vaults/{vaultId}/diccionario", async (
            string vaultId,
            ClaimsPrincipal user,
            VaultRepository repo,
            ID1Client d1,
            CancellationToken ct) =>
        {
            if (await Prohibido(repo, user, vaultId, requireEditor: false, ct) is { } error) return error;

            var filas = await d1.QueryAsync(
                "SELECT palabras FROM diccionario_vault WHERE vault_id = ?", [vaultId], ct);
            var palabras = filas.Results.Count > 0 ? filas.Results[0].GetString("palabras") : null;
            return Results.Ok(new { palabras });
        });

        // Escribir: reemplaza el texto entero. Editor o propietario.
        group.MapPut("/vaults/{vaultId}/diccionario", async (
            string vaultId,
            DiccionarioRequest request,
            ClaimsPrincipal user,
            VaultRepository repo,
            ID1Client d1,
            CancellationToken ct) =>
        {
            if (await Prohibido(repo, user, vaultId, requireEditor: true, ct) is { } error) return error;
            if (Invalido(request) is { } invalido) return invalido;

            await d1.QueryAsync(
                """
                INSERT INTO diccionario_vault (vault_id, palabras, actualizado_en) VALUES (?, ?, ?)
                ON CONFLICT(vault_id) DO UPDATE SET palabras = excluded.palabras, actualizado_en = excluded.actualizado_en
                """,
                [vaultId, request.Palabras!, DateTime.UtcNow.ToString("O")], ct);
            return Results.Ok(new { ok = true });
        });

        // ── Diccionario de Mycelium (del usuario) ─────────────────
        // Junto a las preferencias del usuario (`/auth/...`): lo sigue en
        // cualquier navegador y en todos sus vaults.
        group.MapGet("/auth/diccionario", async (
            ClaimsPrincipal user,
            ID1Client d1,
            CancellationToken ct) =>
        {
            var userId = UsuarioDe(user);
            if (userId is null) return Results.Json(new { error = "No autenticado." }, statusCode: 401);

            var filas = await d1.QueryAsync(
                "SELECT palabras FROM diccionario_usuario WHERE usuario_id = ?", [userId], ct);
            var palabras = filas.Results.Count > 0 ? filas.Results[0].GetString("palabras") : null;
            return Results.Ok(new { palabras });
        });

        group.MapPut("/auth/diccionario", async (
            DiccionarioRequest request,
            ClaimsPrincipal user,
            ID1Client d1,
            CancellationToken ct) =>
        {
            var userId = UsuarioDe(user);
            if (userId is null) return Results.Json(new { error = "No autenticado." }, statusCode: 401);
            if (Invalido(request) is { } invalido) return invalido;

            await d1.QueryAsync(
                """
                INSERT INTO diccionario_usuario (usuario_id, palabras, actualizado_en) VALUES (?, ?, ?)
                ON CONFLICT(usuario_id) DO UPDATE SET palabras = excluded.palabras, actualizado_en = excluded.actualizado_en
                """,
                [userId, request.Palabras!, DateTime.UtcNow.ToString("O")], ct);
            return Results.Ok(new { ok = true });
        });
    }

    /// <summary>400/413 si el cuerpo no trae el texto o se pasa del tope; null si sirve.</summary>
    private static IResult? Invalido(DiccionarioRequest request)
    {
        if (request.Palabras is null)
        {
            return Results.BadRequest(new { error = "Falta «palabras»." });
        }
        if (Encoding.UTF8.GetByteCount(request.Palabras) > MaxBytes)
        {
            return Results.Json(new { error = "El diccionario supera el límite de 256 KB." }, statusCode: 413);
        }
        return null;
    }

    private static string? UsuarioDe(ClaimsPrincipal user) =>
        user.FindFirstValue(ClaimTypes.NameIdentifier) ?? user.FindFirstValue("sub");

    /// <summary>401/403 si el usuario no tiene acceso (o rol suficiente) al vault; null si puede.</summary>
    private static async Task<IResult?> Prohibido(
        VaultRepository repo, ClaimsPrincipal user, string vaultId, bool requireEditor, CancellationToken ct)
    {
        var userId = UsuarioDe(user);
        if (userId is null) return Results.Json(new { error = "No autenticado." }, statusCode: 401);

        var rol = await repo.GetVaultRoleAsync(userId, vaultId, ct);
        if (rol is null) return Results.Json(new { error = "Sin acceso a este vault." }, statusCode: 403);
        if (requireEditor && rol == "lector")
        {
            return Results.Json(new { error = "Tu rol no permite editar." }, statusCode: 403);
        }
        return null;
    }

    public sealed record DiccionarioRequest(string? Palabras);
}
