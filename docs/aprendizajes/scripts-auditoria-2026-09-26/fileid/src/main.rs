// Mide `file_id::get_file_id` (lo que `FileIdMap::add_path` hace por cada ruta
// observable al arrancar el watcher) sobre las rutas que lista el walker.
use std::path::{Path, PathBuf};
use std::time::Instant;
fn recorrer(dir: &Path, out: &mut Vec<PathBuf>) {
    let Ok(entradas) = std::fs::read_dir(dir) else { return };
    for e in entradas.flatten() {
        let p = e.path();
        let nombre = e.file_name().to_string_lossy().to_string();
        let es_dir = e.file_type().map(|t| t.is_dir()).unwrap_or(false);
        if es_dir {
            if nombre.starts_with('.') || ["node_modules","target","dist","out","backend","frontend","scripts","installers"].contains(&nombre.as_str()) { continue; }
            out.push(p.clone()); recorrer(&p, out);
        } else if nombre.ends_with(".md") || nombre.ends_with(".excalidraw") || nombre.ends_with(".base") || nombre.ends_with(".canvas") || nombre.ends_with(".drawio") {
            out.push(p);
        }
    }
}
fn main() {
    for v in std::env::args().skip(1) {
        let base = PathBuf::from(&v);
        let mut rutas = Vec::new(); recorrer(&base, &mut rutas);
        let _ = rutas.iter().map(|r| file_id::get_file_id(r)).count(); // calentar
        let mut mejor = f64::MAX;
        for _ in 0..3 {
            let t = Instant::now();
            let ok = rutas.iter().filter(|r| file_id::get_file_id(r).is_ok()).count();
            let ms = t.elapsed().as_secs_f64() * 1000.0;
            if ms < mejor { mejor = ms; }
            if ok != rutas.len() { println!("  ({} fallidas)", rutas.len() - ok); }
        }
        println!("== {v}\n  get_file_id × {} rutas (sin ocultas): min {mejor:.1} ms → {:.0} µs por ruta", rutas.len(), mejor * 1000.0 / rutas.len() as f64);
    }
}
