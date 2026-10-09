using System.Globalization;
using System.Text;

namespace Micelio.Api.Features.Vaults;

/// <summary>
/// Texto plegado para comparar como compara la búsqueda de texto (<c>DEF-144</c>):
/// sin tildes ni mayúsculas. Imita al tokenizador <c>unicode61</c> de
/// <c>notas_fts</c> (que por defecto quita los diacríticos y pliega mayúsculas),
/// así «pulgon» encuentra «Pulgón» tanto en el texto como en un filtro
/// <c>clave:valor</c>. La <c>ñ</c> también se pliega a <c>n</c>, igual que en el
/// FTS: si no, <c>piña</c> encontraría «pina» en el cuerpo y no en una propiedad.
/// </summary>
/// <remarks>
/// Se pliega en C#, no en SQL: <c>COLLATE NOCASE</c> y <c>lower()</c> de SQLite
/// solo entienden ASCII («Á» ≠ «á»), y en D1 no se pueden registrar funciones
/// propias. Por eso <c>propiedades</c> guarda la clave y el valor ya plegados
/// (<c>clave_plegada</c>, <c>valor_plegado</c>), <c>etiquetas</c> la etiqueta
/// (<c>tag_plegado</c>), y la consulta pliega con estas mismas funciones.
///
/// Equivale a <c>plegar</c> y <c>plegarEtiqueta</c> de <c>lib/db/fts.ts</c> en
/// desktop.
/// </remarks>
public static class Plegado
{
    /// <summary>NFD sin marcas combinantes, en minúsculas.</summary>
    public static string Plegar(string texto)
    {
        var nfd = texto.Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder(nfd.Length);
        foreach (var c in nfd)
        {
            var cat = CharUnicodeInfo.GetUnicodeCategory(c);
            if (cat is UnicodeCategory.NonSpacingMark
                or UnicodeCategory.SpacingCombiningMark
                or UnicodeCategory.EnclosingMark)
            {
                continue;
            }
            sb.Append(c);
        }
        return sb.ToString().ToLowerInvariant();
    }

    /// <summary>
    /// Una etiqueta como se compara (<c>DEF-152</c>): plegada como el texto, sin
    /// el <c>#</c> del principio (<c>tag:#x</c> y <c>tags: ["#x"]</c> son la
    /// etiqueta <c>x</c>) ni la barra del final (<c>tag:huerta/</c> es
    /// <c>huerta</c>). Es la misma función para la columna
    /// <c>etiquetas.tag_plegado</c> y para el valor de un <c>tag:x</c> de la
    /// búsqueda: si plegaran distinto, una etiqueta con tilde no se encontraría.
    /// </summary>
    public static string PlegarEtiqueta(string tag) =>
        Plegar(tag).TrimStart('#').TrimEnd('/');

    /// <summary>
    /// Lo que separa palabras dentro del valor de una propiedad, para la
    /// coincidencia por palabra de un filtro sin comillas (<c>DEF-145</c>). Imita a
    /// grandes rasgos al tokenizador del FTS, que también corta en la puntuación:
    /// así <c>luz:sombra</c> encuentra «semi-sombra» igual que la búsqueda de texto.
    ///
    /// Es una lista cerrada y no «todo lo que no sea letra» porque SQLite no sabe
    /// de clases Unicode: la misma lista se aplica en SQL (<see cref="SeparadoresSql"/>)
    /// y en C# (<see cref="APalabras"/>), y las dos tienen que dar lo mismo.
    /// </summary>
    private static readonly string[] Separadores = ["-", "_", "/", ".", ",", ";", ":", "(", ")", "[", "]"];

    /// <summary>El texto (ya plegado) con cada separador convertido en espacio.</summary>
    public static string APalabras(string texto)
    {
        var r = texto;
        foreach (var s in Separadores) r = r.Replace(s, " ");
        return r;
    }

    /// <summary>Lo mismo que <see cref="APalabras"/>, como expresión SQL sobre <paramref name="columna"/>.</summary>
    public static string SeparadoresSql(string columna) =>
        Separadores.Aggregate(columna, (sql, s) => $"replace({sql}, '{s}', ' ')");
}
