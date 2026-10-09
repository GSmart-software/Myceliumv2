using System.Text.Json;
using Micelio.Api.Features.Common;
using Micelio.Api.Ports;

namespace Micelio.Api.Features.Vaults;

/// <summary>
/// Acceso a datos de carpetas, notas y papelera (HU-22/23/24) vía ID1Client.
/// </summary>
public sealed class VaultRepository(ID1Client d1)
{
    private static string Now() => DateTime.UtcNow.ToString("O");

    // ── Autorización ──────────────────────────────────────────────

    public async Task<string?> GetVaultRoleAsync(string userId, string vaultId, CancellationToken ct = default)
    {
        var result = await d1.QueryAsync(
            "SELECT rol FROM membresias WHERE usuario_id = ? AND recurso_tipo = 'vault' AND recurso_id = ?",
            [userId, vaultId], ct);
        return result.Results.Count > 0 ? result.Results[0].GetString("rol") : null;
    }

    public async Task<string?> GetVaultIdOfCarpetaAsync(string carpetaId, CancellationToken ct = default)
    {
        var result = await d1.QueryAsync(
            "SELECT vault_id FROM carpetas WHERE id = ?", [carpetaId], ct);
        return result.Results.Count > 0 ? result.Results[0].GetString("vault_id") : null;
    }

    public async Task<string?> GetVaultIdOfNotaAsync(string notaId, CancellationToken ct = default)
    {
        var result = await d1.QueryAsync(
            "SELECT vault_id FROM notas WHERE id = ?", [notaId], ct);
        return result.Results.Count > 0 ? result.Results[0].GetString("vault_id") : null;
    }

    // ── Árbol del explorer ────────────────────────────────────────

    public async Task<(IReadOnlyList<JsonElement> Carpetas, IReadOnlyList<JsonElement> Notas)> GetTreeAsync(
        string vaultId, CancellationToken ct = default)
    {
        var carpetas = await d1.QueryAsync(
            "SELECT id, padre_id, nombre FROM carpetas WHERE vault_id = ? ORDER BY nombre COLLATE NOCASE",
            [vaultId], ct);
        var notas = await d1.QueryAsync(
            """
            SELECT id, carpeta_id, titulo, tipo, creado_en, actualizado_en FROM notas
            WHERE vault_id = ? AND id NOT IN (SELECT nota_id FROM papelera)
            ORDER BY titulo COLLATE NOCASE
            """,
            [vaultId], ct);
        return (carpetas.Results, notas.Results);
    }

    // ── Carpetas (HU-22) ──────────────────────────────────────────

    public async Task<string> CreateCarpetaAsync(string vaultId, string? padreId, string nombre, CancellationToken ct = default)
    {
        var id = Guid.NewGuid().ToString();
        var now = Now();
        await d1.QueryAsync(
            "INSERT INTO carpetas (id, vault_id, padre_id, nombre, creado_en, actualizado_en) VALUES (?, ?, ?, ?, ?, ?)",
            [id, vaultId, padreId, nombre, now, now], ct);
        return id;
    }

    public Task RenameCarpetaAsync(string carpetaId, string nombre, CancellationToken ct = default) =>
        d1.QueryAsync(
            "UPDATE carpetas SET nombre = ?, actualizado_en = ? WHERE id = ?",
            [nombre, Now(), carpetaId], ct);

    /// <summary>IDs de la carpeta y todas sus descendientes.</summary>
    public async Task<IReadOnlyList<string>> GetCarpetaSubtreeIdsAsync(string carpetaId, CancellationToken ct = default)
    {
        var result = await d1.QueryAsync(
            """
            WITH RECURSIVE sub(id) AS (
              SELECT id FROM carpetas WHERE id = ?
              UNION ALL
              SELECT c.id FROM carpetas c JOIN sub s ON c.padre_id = s.id
            )
            SELECT id FROM sub
            """,
            [carpetaId], ct);
        return result.Results.Select(r => r.GetString("id")).ToList();
    }

    public async Task<IReadOnlyList<JsonElement>> GetNotasInCarpetasAsync(
        IReadOnlyList<string> carpetaIds, CancellationToken ct = default)
    {
        if (carpetaIds.Count == 0) return [];
        var placeholders = string.Join(", ", carpetaIds.Select(_ => "?"));
        var result = await d1.QueryAsync(
            $"SELECT id, titulo, carpeta_id FROM notas WHERE carpeta_id IN ({placeholders}) AND id NOT IN (SELECT nota_id FROM papelera)",
            [.. carpetaIds], ct);
        return result.Results;
    }

    /// <summary>
    /// Elimina una carpeta: sus notas (recursivas) van a la papelera y el
    /// subárbol de carpetas se borra en una única transacción.
    /// </summary>
    public async Task DeleteCarpetaAsync(
        string carpetaId,
        IReadOnlyList<(string NotaId, string RutaOriginal, string? CarpetaOriginalId)> notasAPapelera,
        CancellationToken ct = default)
    {
        var statements = new List<D1Statement>();
        var now = Now();
        foreach (var (notaId, ruta, carpetaOriginal) in notasAPapelera)
        {
            statements.Add(new D1Statement(
                "INSERT OR IGNORE INTO papelera (id, nota_id, ruta_original, carpeta_original_id, eliminado_en) VALUES (?, ?, ?, ?, ?)",
                [Guid.NewGuid().ToString(), notaId, ruta, carpetaOriginal, now]));
        }

        statements.Add(new D1Statement("DELETE FROM carpetas WHERE id = ?", [carpetaId]));
        await d1.BatchAsync(statements, ct);
    }

    public Task MoveCarpetaAsync(string carpetaId, string? nuevoPadreId, CancellationToken ct = default) =>
        d1.QueryAsync(
            "UPDATE carpetas SET padre_id = ?, actualizado_en = ? WHERE id = ?",
            [nuevoPadreId, Now(), carpetaId], ct);

    public async Task<JsonElement?> GetCarpetaAsync(string carpetaId, CancellationToken ct = default)
    {
        var result = await d1.QueryAsync(
            "SELECT * FROM carpetas WHERE id = ?", [carpetaId], ct);
        return result.Results.Count > 0 ? result.Results[0] : null;
    }

    public async Task<IReadOnlyList<JsonElement>> GetAllCarpetasAsync(string vaultId, CancellationToken ct = default)
    {
        var result = await d1.QueryAsync(
            "SELECT id, padre_id, nombre FROM carpetas WHERE vault_id = ?", [vaultId], ct);
        return result.Results;
    }

    // ── Notas (HU-23) ─────────────────────────────────────────────

    public async Task<string> CreateNotaAsync(
        string vaultId, string? carpetaId, string titulo, string tipo = "markdown", CancellationToken ct = default)
    {
        var id = Guid.NewGuid().ToString();
        var now = Now();
        // r2_key ID-based e invariante ante renombres (HU-23 CA3). La extensión
        // refleja el tipo: .md para notas, .excalidraw para dibujos (HU-16) y
        // .base para las tablas (FUN-L-03, la extensión de Obsidian).
        var ext = tipo switch
        {
            "excalidraw" => "excalidraw",
            "base" => "base",
            "canvas" => "canvas",
            _ => "md",
        };
        var r2Key = $"vaults/{vaultId}/notas/{id}.{ext}";
        await d1.QueryAsync(
            """
            INSERT INTO notas (id, vault_id, carpeta_id, titulo, tipo, r2_key, creado_en, actualizado_en)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            [id, vaultId, carpetaId, titulo, tipo, r2Key, now, now], ct);
        return id;
    }

    public async Task<JsonElement?> GetNotaAsync(string notaId, CancellationToken ct = default)
    {
        var result = await d1.QueryAsync("SELECT * FROM notas WHERE id = ?", [notaId], ct);
        return result.Results.Count > 0 ? result.Results[0] : null;
    }

    /// <summary>
    /// Renombra la nota y, en la misma transacción, el título de su fila de
    /// búsqueda: el orden de los resultados compara la consulta con
    /// <c>notas_fts.titulo</c> (<c>DEF-146</c>), y sin esto la nota renombrada se
    /// seguía encontrando —y ordenando— por el título viejo hasta el próximo
    /// guardado de su contenido.
    /// </summary>
    public Task RenameNotaAsync(string notaId, string titulo, CancellationToken ct = default) =>
        d1.BatchAsync(
        [
            new D1Statement(
                "UPDATE notas SET titulo = ?, actualizado_en = ? WHERE id = ?",
                [titulo, Now(), notaId]),
            new D1Statement("UPDATE notas_fts SET titulo = ? WHERE nota_id = ?", [titulo, notaId]),
        ], ct);

    public Task MoveNotaAsync(string notaId, string? carpetaId, CancellationToken ct = default) =>
        d1.QueryAsync(
            "UPDATE notas SET carpeta_id = ?, actualizado_en = ? WHERE id = ?",
            [carpetaId, Now(), notaId], ct);

    public async Task<IReadOnlyList<string>> GetTitulosInCarpetaAsync(
        string vaultId, string? carpetaId, CancellationToken ct = default)
    {
        var result = carpetaId is null
            ? await d1.QueryAsync(
                "SELECT titulo FROM notas WHERE vault_id = ? AND carpeta_id IS NULL AND id NOT IN (SELECT nota_id FROM papelera)",
                [vaultId], ct)
            : await d1.QueryAsync(
                "SELECT titulo FROM notas WHERE vault_id = ? AND carpeta_id = ? AND id NOT IN (SELECT nota_id FROM papelera)",
                [vaultId, carpetaId], ct);
        return result.Results.Select(r => r.GetString("titulo")).ToList();
    }

    /// <summary>
    /// Actualiza metadatos tras guardar contenido (HU-04) y refresca el índice
    /// FTS5 (HU-21 CA10) y las propiedades del frontmatter (FUN-M-04). Devuelve
    /// el nuevo actualizado_en.
    /// </summary>
    /// <remarks>
    /// Todo va en el MISMO batch (una transacción): el índice de una nota nunca
    /// puede quedar medio escrito, con las propiedades viejas y el texto nuevo.
    /// Qué se escribe, en <see cref="IndiceStatements"/>.
    /// </remarks>
    public async Task<string> TouchNotaContenidoAsync(
        string notaId, string titulo, string tipo, string contenido, long tamanoBytes, CancellationToken ct = default)
    {
        var now = Now();
        var statements = new List<D1Statement>
        {
            new("UPDATE notas SET tamano_bytes = ?, actualizado_en = ? WHERE id = ?",
                [tamanoBytes, now, notaId]),
        };
        statements.AddRange(IndiceStatements(notaId, titulo, tipo, contenido));
        await d1.BatchAsync(statements, ct);
        return now;
    }

    /// <summary>
    /// Reescribe solo el índice de una nota (búsqueda, propiedades y etiquetas),
    /// sin tocar su fecha de modificación: es mantenimiento, no una edición.
    /// </summary>
    public async Task ReindexarNotaAsync(
        string notaId, string titulo, string tipo, string contenido, CancellationToken ct = default) =>
        await d1.BatchAsync([.. IndiceStatements(notaId, titulo, tipo, contenido)], ct);

    /// <summary>
    /// Reescribe el índice (búsqueda, propiedades y etiquetas) de todas las notas
    /// de un vault —o de todos, con <paramref name="vaultId"/> nulo—, releyendo
    /// cada archivo por su <c>r2_key</c>. Incluye las de la papelera: si se
    /// restauran, vuelven a encontrarse. No toca la fecha de modificación de
    /// nada: es mantenimiento, no una edición. Devuelve cuántas reindexó.
    /// </summary>
    /// <remarks>
    /// Secuencial a propósito: es mantenimiento que se corre una vez (al
    /// migrar el índice), y así no compite con el tráfico normal por conexiones
    /// ni por E/S.
    /// </remarks>
    public async Task<int> ReindexarAsync(IBlobStorage blobs, string? vaultId, CancellationToken ct = default)
    {
        var notas = vaultId is null
            ? await d1.QueryAsync("SELECT id, titulo, tipo, r2_key FROM notas", ct: ct)
            : await d1.QueryAsync(
                "SELECT id, titulo, tipo, r2_key FROM notas WHERE vault_id = ?", [vaultId], ct);
        var reindexadas = 0;
        foreach (var n in notas.Results)
        {
            string contenido;
            await using (var stream = await blobs.GetAsync(n.GetString("r2_key"), ct))
            {
                if (stream is null) continue;
                using var reader = new StreamReader(stream, System.Text.Encoding.UTF8);
                contenido = await reader.ReadToEndAsync(ct);
            }
            await d1.BatchAsync(
                [.. IndiceStatements(
                    n.GetString("id"), n.GetString("titulo"), n.GetStringOrNull("tipo") ?? "markdown", contenido)],
                ct);
            reindexadas++;
        }
        return reindexadas;
    }

    /// <summary>
    /// Las sentencias que reescriben el índice de una nota: su fila de
    /// <c>notas_fts</c>, sus <c>propiedades</c> y sus <c>etiquetas</c>. Sin tocar
    /// <c>notas</c>, para que reindexar (al migrar el esquema o desde
    /// <c>/reindexar</c>) no cambie la fecha de modificación de nada.
    /// </summary>
    /// <remarks>
    /// Al FTS va <see cref="Frontmatter.TextoIndexable"/>, no el archivo crudo
    /// (<c>DEF-148</c>): en <c>contenido</c> el cuerpo como se lee —de donde sale
    /// el <c>snippet()</c> del resultado— y en <c>extra</c> los VALORES de las
    /// propiedades y los destinos ocultos de los enlaces, que se encuentran sin
    /// ensuciar el fragmento.
    /// </remarks>
    public static IEnumerable<D1Statement> IndiceStatements(
        string notaId, string titulo, string tipo, string contenido)
    {
        var (buscable, extra) = Frontmatter.TextoIndexable(contenido, tipo);
        yield return new("DELETE FROM notas_fts WHERE nota_id = ?", [notaId]);
        yield return new("INSERT INTO notas_fts (nota_id, titulo, contenido, extra) VALUES (?, ?, ?, ?)",
            [notaId, titulo, buscable, extra]);
        yield return new("DELETE FROM propiedades WHERE nota_id = ?", [notaId]);
        foreach (var s in PropiedadesStatements(notaId, contenido)) yield return s;
        yield return new("DELETE FROM etiquetas WHERE nota_id = ?", [notaId]);
        foreach (var s in EtiquetasStatements(notaId, tipo, contenido)) yield return s;
    }

    /// <summary>
    /// INSERTs de las propiedades de una nota: una fila por elemento de lista,
    /// para poder filtrar por valor sin mirar el resto de la lista. Un
    /// frontmatter ausente o fuera del subconjunto soportado no aporta ninguna
    /// (se muestra crudo y no se interpreta, igual que en el cliente).
    ///
    /// Cada fila lleva además la clave y el valor PLEGADOS (<c>DEF-144</c>, ver
    /// <see cref="Plegado"/>): son las columnas que compara el filtro
    /// <c>clave:valor</c> de la búsqueda.
    /// </summary>
    private static IEnumerable<D1Statement> PropiedadesStatements(string notaId, string contenido)
    {
        var fm = Frontmatter.Separar(contenido);
        if (!fm.Hay || !fm.Soportado) yield break;
        foreach (var p in fm.Props)
        {
            for (var i = 0; i < p.Valores.Count; i++)
            {
                yield return new D1Statement(
                    """
                    INSERT INTO propiedades (nota_id, clave, valor, tipo, orden, clave_plegada, valor_plegado)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    [notaId, p.Clave, p.Valores[i], p.Tipo, i, Plegado.Plegar(p.Clave), Plegado.Plegar(p.Valores[i])]);
            }
        }
    }

    /// <summary>
    /// INSERTs de las etiquetas de una nota (<c>DEF-152</c>): las de <c>tags:</c>
    /// del frontmatter más los <c>#tag</c> del cuerpo fuera del código
    /// (<see cref="Frontmatter.Etiquetas"/>, las mismas que colorean el grafo),
    /// con la etiqueta plegada en <c>tag_plegado</c> para el filtro <c>tag:x</c>.
    /// Un dibujo, un lienzo o una base no se escanean como prosa: no tienen.
    /// </summary>
    private static IEnumerable<D1Statement> EtiquetasStatements(string notaId, string tipo, string contenido)
    {
        if (tipo != "markdown") yield break;
        var vistas = new HashSet<string>();
        foreach (var tag in Frontmatter.Etiquetas(contenido))
        {
            var plegada = Plegado.PlegarEtiqueta(tag);
            if (plegada.Length == 0 || !vistas.Add(plegada)) continue;
            yield return new D1Statement(
                "INSERT INTO etiquetas (nota_id, tag, tag_plegado) VALUES (?, ?, ?)",
                [notaId, tag, plegada]);
        }
    }

    // ── Papelera (HU-23 CA6–10) ───────────────────────────────────

    public Task SendToPapeleraAsync(string notaId, string rutaOriginal, string? carpetaOriginalId, CancellationToken ct = default) =>
        d1.QueryAsync(
            "INSERT INTO papelera (id, nota_id, ruta_original, carpeta_original_id, eliminado_en) VALUES (?, ?, ?, ?, ?)",
            [Guid.NewGuid().ToString(), notaId, rutaOriginal, carpetaOriginalId, Now()], ct);

    public async Task<IReadOnlyList<JsonElement>> GetPapeleraAsync(string vaultId, CancellationToken ct = default)
    {
        var result = await d1.QueryAsync(
            """
            SELECT p.nota_id, n.titulo, p.ruta_original, p.carpeta_original_id, p.eliminado_en
            FROM papelera p JOIN notas n ON n.id = p.nota_id
            WHERE n.vault_id = ?
            ORDER BY p.eliminado_en DESC
            """,
            [vaultId], ct);
        return result.Results;
    }

    public async Task<JsonElement?> GetPapeleraEntryAsync(string notaId, CancellationToken ct = default)
    {
        var result = await d1.QueryAsync(
            "SELECT * FROM papelera WHERE nota_id = ?", [notaId], ct);
        return result.Results.Count > 0 ? result.Results[0] : null;
    }

    public Task RestoreFromPapeleraAsync(string notaId, string? carpetaId, CancellationToken ct = default) =>
        d1.BatchAsync(
        [
            new D1Statement("UPDATE notas SET carpeta_id = ?, actualizado_en = ? WHERE id = ?", [carpetaId, Now(), notaId]),
            new D1Statement("DELETE FROM papelera WHERE nota_id = ?", [notaId]),
        ], ct);

    public Task DeleteNotaPermanentlyAsync(string notaId, CancellationToken ct = default) =>
        // papelera, notas_fts, propiedades y etiquetas se limpian por separado; el
        // blob se borra vía IBlobStorage (HU-04). Las dos últimas tienen ON DELETE CASCADE,
        // pero se borra explícitamente: D1 no garantiza las claves foráneas.
        d1.BatchAsync(
        [
            new D1Statement("DELETE FROM papelera WHERE nota_id = ?", [notaId]),
            new D1Statement("DELETE FROM notas_fts WHERE nota_id = ?", [notaId]),
            new D1Statement("DELETE FROM propiedades WHERE nota_id = ?", [notaId]),
            new D1Statement("DELETE FROM etiquetas WHERE nota_id = ?", [notaId]),
            new D1Statement("DELETE FROM notas WHERE id = ?", [notaId]),
        ], ct);

    /// <summary>Purga permanente de notas con más de 30 días en la papelera (HU-23 CA7).</summary>
    public async Task<IReadOnlyList<string>> PurgeExpiredAsync(string vaultId, CancellationToken ct = default)
    {
        var cutoff = DateTime.UtcNow.AddDays(-30).ToString("O");
        var expired = await d1.QueryAsync(
            """
            SELECT p.nota_id FROM papelera p JOIN notas n ON n.id = p.nota_id
            WHERE n.vault_id = ? AND p.eliminado_en < ?
            """,
            [vaultId, cutoff], ct);
        var ids = expired.Results.Select(r => r.GetString("nota_id")).ToList();
        foreach (var id in ids)
        {
            await DeleteNotaPermanentlyAsync(id, ct);
        }

        return ids;
    }
}
