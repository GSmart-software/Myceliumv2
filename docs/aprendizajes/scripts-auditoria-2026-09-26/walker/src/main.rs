//! Réplica fiel del walker de `archivos.rs` (solo lectura) para medir fuera de Tauri.
mod mycignore;
use std::path::{Component, Path, PathBuf};
use std::time::Instant;
/// Archivo leído de una carpeta del SO, con su ruta relativa al origen.
#[derive(serde::Serialize)]
pub struct ArchivoLeido {
    pub ruta_relativa: String,
    pub contenido: String,
}

/// Archivo del vault con los metadatos que el índice derivado necesita para la
/// validación incremental por `mtime` (fase 2 del "vault en carpeta").
///
/// **Sin `contenido` a propósito** (FUN-M-12): el indexador compara `mtime` y
/// recién entonces pide el texto de lo que cambió, con `leer_archivos`. Antes
/// esta estructura llevaba el contenido de TODOS los archivos y se descartaba
/// casi entero en cada apertura (14 MB por IPC en un vault sobre un repo).
#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ArchivoMeta {
    pub ruta_relativa: String,
    /// Fecha de modificación en milisegundos epoch (de `metadata().modified()`).
    pub mtime: i64,
    /// `"excalidraw"` para `.excalidraw`, `"base"` para `.base`, `"canvas"` para
    /// `.canvas`, `"drawio"` para `.drawio`, `"markdown"` para el resto.
    pub tipo: String,
}

/// Tipo de nota según la extensión (espeja `notas.tipo` del índice/esquema).
fn tipo_de(path: &Path) -> String {
    match path.extension().and_then(|e| e.to_str()) {
        Some(ext) if ext.eq_ignore_ascii_case("excalidraw") => "excalidraw".to_string(),
        // Bases (`FUN-L-03`) y canvas (`FUN-L-18`): las extensiones son las de
        // Obsidian, para que el vault siga siendo intercambiable.
        Some(ext) if ext.eq_ignore_ascii_case("base") => "base".to_string(),
        Some(ext) if ext.eq_ignore_ascii_case("canvas") => "canvas".to_string(),
        // Diagramas de draw.io (`FUN-L-20`): XML de mxGraph. La extensión es la
        // nativa de la herramienta, para que el archivo se abra en cualquier
        // draw.io de afuera.
        Some(ext) if ext.eq_ignore_ascii_case("drawio") => "drawio".to_string(),
        _ => "markdown".to_string(),
    }
}

/// `mtime` en milisegundos epoch (0 si el SO no lo expone).
fn mtime_ms(metadata: &std::fs::Metadata) -> i64 {
    metadata
        .modified()
        .ok()
        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
        .map(|d| d.as_millis() as i64)
        .unwrap_or(0)
}

/// Extensiones que se importan como notas del vault.
pub(crate) fn es_importable(path: &Path) -> bool {
    match path.extension().and_then(|e| e.to_str()) {
        Some(ext) => {
            let ext = ext.to_ascii_lowercase();
            ext == "md"
                || ext == "excalidraw"
                || ext == "base"
                || ext == "canvas"
                || ext == "drawio"
        }
        None => false,
    }
}

/// Un directorio oculto (`.git`, `.obsidian`, …) no se recorre.
fn es_oculto(nombre: &str) -> bool {
    nombre.starts_with('.')
}

/// Resuelve `relativa` dentro de `base` rechazando cualquier intento de salirse
/// (`..`, rutas absolutas, prefijos de unidad en Windows). Es la defensa contra
/// path traversal: el frontend arma las rutas a partir de títulos del usuario.
/// `pub(crate)` para reutilizarla desde `vault_fs` (mutaciones a disco, fase 4).
pub(crate) fn ruta_segura(base: &Path, relativa: &str) -> Result<PathBuf, String> {
    let rel = Path::new(relativa);
    let mut destino = base.to_path_buf();

    for comp in rel.components() {
        match comp {
            Component::Normal(seg) => destino.push(seg),
            Component::CurDir => {}
            Component::ParentDir | Component::RootDir | Component::Prefix(_) => {
                return Err(format!("Ruta no permitida: {relativa}"));
            }
        }
    }

    if !destino.starts_with(base) {
        return Err(format!("Ruta fuera de la carpeta destino: {relativa}"));
    }
    Ok(destino)
}

/// Escribe los archivos del vault dentro de `destino`, creando los subdirectorios
/// necesarios. Devuelve cuántos archivos se escribieron. Los archivos existentes
/// con el mismo nombre se sobrescriben (la confirmación la pide la UI).
fn rel_posix(base: &Path, ruta: &Path) -> Result<String, String> {
    Ok(ruta
        .strip_prefix(base)
        .map_err(|_| format!("Ruta inesperada: {}", ruta.display()))?
        .components()
        .map(|c| c.as_os_str().to_string_lossy().to_string())
        .collect::<Vec<_>>()
        .join("/"))
}

/// Recorre `dir` recursivamente acumulando los archivos importables con sus
/// metadatos (`mtime`, `tipo`). Gemelo de `recorrer`, pero para el índice.
/// El filtrado lo deciden los patrones del `.mycignore` del vault (FUN-M-11);
/// `.mycelium` queda excluido siempre.
///
/// **No lee el contenido** (FUN-M-12): eso lo hace `leer_archivos`, y solo para
/// las rutas que el indexador decidió reindexar comparando `mtime`.
///
/// Micro-optimizaciones del walker (FUN-M-12): se usa `entrada.file_type()` en
/// vez de `ruta.is_dir()` —el tipo ya viene en la entrada del directorio, así que
/// se ahorra un `stat` por archivo, notorio en Windows— y `rel_posix` se calcula
/// UNA vez por entrada en lugar de dos. Contrapartida asumida: `file_type()` no
/// sigue enlaces simbólicos, así que un symlink a una carpeta ya no se recorre
/// (antes sí). Es lo deseable: evita ciclos y duplicados en el índice.
fn recorrer_meta(
    dir: &Path,
    base: &Path,
    patrones: &[crate::mycignore::Patron],
    incluir: &dyn Fn(&Path) -> bool,
    etiqueta: &dyn Fn(&Path) -> String,
    out: &mut Vec<ArchivoMeta>,
) -> Result<(), String> {
    let entradas =
        std::fs::read_dir(dir).map_err(|e| format!("No se pudo leer {}: {e}", dir.display()))?;

    for entrada in entradas {
        let entrada = entrada.map_err(|e| format!("No se pudo leer {}: {e}", dir.display()))?;
        let ruta = entrada.path();
        let es_dir = entrada.file_type().map(|t| t.is_dir()).unwrap_or(false);

        if es_dir {
            let relativa = rel_posix(base, &ruta)?;
            if crate::mycignore::ignorada(&relativa, true, patrones) {
                continue;
            }
            recorrer_meta(&ruta, base, patrones, incluir, etiqueta, out)?;
        } else if incluir(&ruta) {
            let relativa = rel_posix(base, &ruta)?;
            if crate::mycignore::ignorada(&relativa, false, patrones) {
                continue;
            }
            let mtime = entrada.metadata().map(|m| mtime_ms(&m)).unwrap_or(0);
            out.push(ArchivoMeta { ruta_relativa: relativa, mtime, tipo: etiqueta(&ruta) });
        }
    }
    Ok(())
}

/// Rutas ABSOLUTAS que el vault mira de verdad: las carpetas no ignoradas y los
/// archivos importables que hay dentro.
///
/// Existe para el watcher (`DEF-052`): su caché de ids de archivo se poblaba
/// recorriendo el árbol ENTERO —`node_modules/`, `target/`, `.git/`— porque el
/// recorrido del crate no conoce el `.mycignore`. Lo que el vault ignora no debe
/// costar nada en ningún sitio, así que el poblado usa este listado.
///
/// Best-effort a propósito: un directorio ilegible se salta en vez de abortar. El
/// watcher es best-effort y quedarse sin caché de ids solo degrada el seguimiento
/// de renombrados, mientras que fallar impediría abrir el vault.
pub(crate) fn rutas_observables(base: &Path) -> Vec<PathBuf> {
    let patrones = crate::mycignore::cargar(base);
    let mut out = Vec::new();
    recorrer_observables(base, base, &patrones, &mut out);
    out
}

fn recorrer_observables(
    dir: &Path,
    base: &Path,
    patrones: &[crate::mycignore::Patron],
    out: &mut Vec<PathBuf>,
) {
    let Ok(entradas) = std::fs::read_dir(dir) else {
        return;
    };
    for entrada in entradas.flatten() {
        let ruta = entrada.path();
        let es_dir = entrada.file_type().map(|t| t.is_dir()).unwrap_or(false);
        let Ok(relativa) = rel_posix(base, &ruta) else {
            continue;
        };
        if crate::mycignore::ignorada(&relativa, es_dir, patrones) {
            continue;
        }
        if es_dir {
            out.push(ruta.clone());
            recorrer_observables(&ruta, base, patrones, out);
        } else if es_importable(&ruta) {
            out.push(ruta);
        }
    }
}

/// Lee recursivamente `origen` y devuelve los `.md`/`.excalidraw`/`.base` con su ruta
fn extension_de(path: &Path) -> String {
    path.extension()
        .and_then(|e| e.to_str())
        .map(|e| e.to_ascii_lowercase())
        .unwrap_or_default()
}

/// Los archivos del vault que Mycelium **no** indexa: un PDF, una imagen, un
/// `.txt`, código.
///
/// Hasta ahora no existían para la app —no se indexaban y tampoco se listaban—,
fn recorrer_dirs(
    dir: &Path,
    base: &Path,
    patrones: &[crate::mycignore::Patron],
    out: &mut Vec<String>,
) -> Result<(), String> {
    let entradas =
        std::fs::read_dir(dir).map_err(|e| format!("No se pudo leer {}: {e}", dir.display()))?;

    for entrada in entradas {
        let entrada = entrada.map_err(|e| format!("No se pudo leer {}: {e}", dir.display()))?;
        // `file_type()` en vez de `is_dir()`: el tipo viene con la entrada del
        // directorio y evita un `stat` por archivo (FUN-M-12).
        if !entrada.file_type().map(|t| t.is_dir()).unwrap_or(false) {
            continue;
        }
        let ruta = entrada.path();
        let relativa = rel_posix(base, &ruta)?;
        if crate::mycignore::ignorada(&relativa, true, patrones) {
            continue;
        }
        out.push(relativa);
        recorrer_dirs(&ruta, base, patrones, out)?;
    }
    Ok(())
}

/// Lista las rutas relativas POSIX de TODOS los subdirectorios de `origen`
/// (incluidos los vacíos), según el `.mycignore` del vault. Es el complemento
/// de `listar_archivos_meta` para que el índice conserve las carpetas vacías.

fn listar_archivos_meta(base: &Path) -> Vec<ArchivoMeta> {
    let patrones = mycignore::cargar(base);
    let mut out = Vec::new();
    recorrer_meta(base, base, &patrones, &es_importable, &tipo_de, &mut out).unwrap();
    out
}
fn listar_otros_archivos(base: &Path) -> Vec<ArchivoMeta> {
    let patrones = mycignore::cargar(base);
    let mut out = Vec::new();
    recorrer_meta(base, base, &patrones, &|p| !es_importable(p), &extension_de, &mut out).unwrap();
    out
}
fn listar_directorios(base: &Path) -> Vec<String> {
    let patrones = mycignore::cargar(base);
    let mut out = Vec::new();
    recorrer_dirs(base, base, &patrones, &mut out).unwrap();
    out
}
fn leer_archivos(base: &Path, rutas: &[String]) -> Vec<ArchivoLeido> {
    let mut out = Vec::with_capacity(rutas.len());
    for relativa in rutas {
        let ruta = ruta_segura(base, relativa).unwrap();
        let Ok(contenido) = std::fs::read_to_string(&ruta) else { continue };
        out.push(ArchivoLeido { ruta_relativa: relativa.clone(), contenido });
    }
    out
}
/// Un walker fusionado (FUN-M-13): archivos + directorios en UNA pasada.
fn recorrer_fusion(dir: &Path, base: &Path, patrones: &[mycignore::Patron], archivos: &mut Vec<ArchivoMeta>, dirs: &mut Vec<String>) {
    let Ok(entradas) = std::fs::read_dir(dir) else { return };
    for entrada in entradas.flatten() {
        let ruta = entrada.path();
        let es_dir = entrada.file_type().map(|t| t.is_dir()).unwrap_or(false);
        let relativa = rel_posix(base, &ruta).unwrap();
        if mycignore::ignorada(&relativa, es_dir, patrones) { continue; }
        if es_dir {
            dirs.push(relativa);
            recorrer_fusion(&ruta, base, patrones, archivos, dirs);
        } else if es_importable(&ruta) {
            let mtime = entrada.metadata().map(|m| mtime_ms(&m)).unwrap_or(0);
            archivos.push(ArchivoMeta { ruta_relativa: relativa, mtime, tipo: tipo_de(&ruta) });
        }
    }
}

fn med<F: FnMut() -> R, R>(n: usize, mut f: F) -> (f64, f64, R) {
    let mut ts = Vec::new();
    let mut last = None;
    for _ in 0..n {
        let t = Instant::now();
        let r = f();
        ts.push(t.elapsed().as_secs_f64() * 1000.0);
        last = Some(r);
    }
    ts.sort_by(|a, b| a.partial_cmp(b).unwrap());
    (ts[0], ts[ts.len() / 2], last.unwrap())
}

fn main() {
    let args: Vec<String> = std::env::args().skip(1).collect();
    for v in &args {
        let base = PathBuf::from(v);
        println!("== {}", v);
        // calentar caché de FS
        let _ = listar_archivos_meta(&base);
        let (mn, md, meta) = med(7, || listar_archivos_meta(&base));
        let json = serde_json::to_string(&meta).unwrap();
        println!("listar_archivos_meta   : min {mn:.1} ms · med {md:.1} ms · {} archivos · JSON {} KB", meta.len(), json.len() / 1024);
        let (mn, md, dirs) = med(7, || listar_directorios(&base));
        println!("listar_directorios     : min {mn:.1} ms · med {md:.1} ms · {} dirs", dirs.len());
        let (mn, md, otros) = med(7, || listar_otros_archivos(&base));
        let json = serde_json::to_string(&otros).unwrap();
        println!("listar_otros_archivos  : min {mn:.1} ms · med {md:.1} ms · {} otros · JSON {} KB", otros.len(), json.len() / 1024);
        let (mn, md, obs) = med(7, || rutas_observables(&base));
        println!("rutas_observables      : min {mn:.1} ms · med {md:.1} ms · {} rutas", obs.len());
        let patrones = mycignore::cargar(&base);
        let (mn, md, (a, d)) = med(7, || { let mut a = Vec::new(); let mut d = Vec::new(); recorrer_fusion(&base, &base, &patrones, &mut a, &mut d); (a, d) });
        println!("walker FUSIONADO       : min {mn:.1} ms · med {md:.1} ms · {} archivos · {} dirs", a.len(), d.len());
        // costo de `ignorada` aislado: todas las rutas de meta+dirs, con los patrones del vault
        let rutas: Vec<(String, bool)> = meta.iter().map(|m| (m.ruta_relativa.clone(), false)).chain(dirs.iter().map(|d| (d.clone(), true))).collect();
        let (mn, md, n) = med(7, || rutas.iter().filter(|(r, d)| mycignore::ignorada(r, *d, &patrones)).count());
        println!("mycignore::ignorada    : min {mn:.3} ms · med {md:.3} ms para {} rutas ({} patrones, {} ignoradas)", rutas.len(), patrones.len(), n);
        let todas: Vec<String> = meta.iter().map(|m| m.ruta_relativa.clone()).collect();
        let (mn, md, leidos) = med(3, || leer_archivos(&base, &todas));
        let bytes: usize = leidos.iter().map(|l| l.contenido.len()).sum();
        let json = serde_json::to_string(&leidos).unwrap();
        println!("leer_archivos (todo)   : min {mn:.1} ms · med {md:.1} ms · {} archivos · {:.1} MB texto · JSON {:.1} MB", leidos.len(), bytes as f64 / 1e6, json.len() as f64 / 1e6);
        let (mn, md, _) = med(3, || serde_json::to_string(&leidos).unwrap());
        println!("serde_json de leer_todo: min {mn:.1} ms · med {md:.1} ms");
        // tandas de 250 como el indexador
        let t = Instant::now();
        let mut tandas = 0; let mut jb = 0usize;
        for ch in todas.chunks(250) { let l = leer_archivos(&base, ch); jb += serde_json::to_string(&l).unwrap().len(); tandas += 1; }
        println!("leer_archivos en tandas: {:.1} ms · {} tandas · JSON total {:.1} MB", t.elapsed().as_secs_f64()*1000.0, tandas, jb as f64/1e6);
        // Tamaños de nota
        let mut sizes: Vec<usize> = leidos.iter().map(|l| l.contenido.len()).collect();
        sizes.sort();
        if !sizes.is_empty() {
            println!("tamaño de nota         : mediana {} B · p90 {} B · max {} B", sizes[sizes.len()/2], sizes[sizes.len()*9/10], sizes[sizes.len()-1]);
        }
    }
}
