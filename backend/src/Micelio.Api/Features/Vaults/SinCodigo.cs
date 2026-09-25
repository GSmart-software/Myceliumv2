using System.Text;
using System.Text.RegularExpressions;

namespace Micelio.Api.Features.Vaults;

/// <summary>
/// Borra el código de un markdown para buscar enlaces y etiquetas (`DEF-102`).
///
/// Un `[[enlace]]` o un `#tag` escrito dentro de código se escribió para
/// MOSTRAR la sintaxis, no para usarla. El grafo y las etiquetas los buscaban con
/// una expresión regular sobre el texto crudo y los contaban igual: aristas hacia
/// notas que no existen y colores de CSS (`#0F6E56`) como etiquetas.
///
/// Devuelve el MISMO texto con el código reemplazado por espacios —los saltos de
/// línea se conservan—, así las posiciones no cambian. Es el mismo algoritmo que
/// `frontend/lib/sinCodigo.ts`, con las reglas de CommonMark:
///
/// - Bloques cercados: tres o más `` ` `` o `~` (hasta tres espacios delante)
///   abren, y otro renglón con el mismo carácter, al menos igual de largo y nada
///   más, cierra. Sin cierre, el bloque llega al final.
/// - Código en línea: N `` ` `` cierran con exactamente N, sin cruzar un renglón
///   en blanco.
///
/// El código indentado con cuatro espacios queda afuera a propósito: distinguirlo
/// de una lista anidada pide el parser entero.
/// </summary>
public static partial class SinCodigo
{
    [GeneratedRegex(@"^ {0,3}(`{3,}|~{3,})")]
    private static partial Regex AperturaRegex();

    [GeneratedRegex(@"^\n[ \t]*(\n|$)")]
    private static partial Regex FinDeParrafoRegex();

    public static string Aplicar(string texto)
    {
        if (!texto.Contains('`') && !texto.Contains("~~~")) return texto;
        return SinCodigoEnLinea(SinBloques(texto));
    }

    private static string Blanquear(string s)
    {
        var sb = new StringBuilder(s.Length);
        foreach (var c in s) sb.Append(c == '\n' ? '\n' : ' ');
        return sb.ToString();
    }

    private static string SinBloques(string texto)
    {
        var lineas = texto.Split('\n');
        string? cerco = null;
        for (var i = 0; i < lineas.Length; i++)
        {
            var l = lineas[i];
            if (cerco is null)
            {
                var m = AperturaRegex().Match(l);
                // Un cerco de backticks no puede tener backticks en su info: si
                // los tiene, es código en línea, no un bloque.
                if (m.Success && !(m.Groups[1].Value[0] == '`' && l[m.Length..].Contains('`')))
                {
                    cerco = m.Groups[1].Value;
                    lineas[i] = Blanquear(l);
                }
                continue;
            }
            var caracter = cerco[0] == '`' ? "`" : "~";
            if (Regex.IsMatch(l, $"^ {{0,3}}{caracter}{{{cerco.Length},}}\\s*$")) cerco = null;
            lineas[i] = Blanquear(l);
        }
        return string.Join('\n', lineas);
    }

    private static string SinCodigoEnLinea(string texto)
    {
        var salida = texto.ToCharArray();
        var i = 0;
        while (i < texto.Length)
        {
            if (texto[i] != '`')
            {
                i++;
                continue;
            }
            var n = 0;
            while (i + n < texto.Length && texto[i + n] == '`') n++;
            // Una tanda de EXACTAMENTE n backticks antes del fin del párrafo.
            var j = i + n;
            var cierre = -1;
            while (j < texto.Length)
            {
                if (texto[j] == '\n' && FinDeParrafoRegex().IsMatch(texto.AsSpan(j, Math.Min(80, texto.Length - j)).ToString())) break;
                if (texto[j] != '`')
                {
                    j++;
                    continue;
                }
                var m = 0;
                while (j + m < texto.Length && texto[j + m] == '`') m++;
                if (m == n)
                {
                    cierre = j;
                    break;
                }
                j += m;
            }
            if (cierre < 0)
            {
                i += n;
                continue;
            }
            for (var k = i; k < cierre + n; k++) if (salida[k] != '\n') salida[k] = ' ';
            i = cierre + n;
        }
        return new string(salida);
    }
}
