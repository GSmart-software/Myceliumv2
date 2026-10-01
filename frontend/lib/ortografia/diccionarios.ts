/**
 * Dónde viven los diccionarios del corrector y los dos diccionarios personales
 * —el del vault y el de Mycelium— (`FUN-L-12`).
 *
 * **Diverge de desktop**: allá todo pasa por Rust (descarga con verificación en
 * `%LOCALAPPDATA%`, `.mycelium/diccionario.txt`, `diccionario-personal.txt`).
 * Acá:
 *
 *   - La **descarga** la hace el navegador: `fetch` a R2 (con CORS), el gzip se
 *     descomprime con `DecompressionStream`, se verifica el `sha256` de lo
 *     descomprimido con `crypto.subtle` y recién entonces se guarda en la
 *     **Cache API**, por la URL versionada de cada archivo. Los diccionarios son
 *     **de este navegador**, como en desktop son de la instalación.
 *   - La **configuración** (lenguas activas, propuesta hecha) va al
 *     `localStorage`: también es de este navegador.
 *   - El **diccionario del vault**, al backend (`GET/PUT /vaults/{id}/diccionario`),
 *     con los mismos permisos que el vault.
 *   - El **de Mycelium**, al backend junto a las preferencias del usuario
 *     (`GET/PUT /auth/diccionario`): lo sigue en cualquier navegador.
 *   - Los avisos entre pestañas (lo que en desktop son eventos de Tauri entre
 *     ventanas) van por `BroadcastChannel`.
 *
 * La API de este módulo es lo que las dos ramas comparten; lo demás del
 * corrector no sabe de dónde salen los bytes.
 */
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { parsearManifiesto, type Descargado, type Manifiesto, type Variante } from "./manifiesto";
import { escribirDiccionarioPersonal, leerDiccionarioPersonal } from "./palabras";

/** El mensaje con el que termina una descarga cancelada (no es un error que mostrar). */
export const DESCARGA_CANCELADA = "Descarga cancelada.";

/**
 * El manifiesto publicado en R2. `NEXT_PUBLIC_MYCELIUM_DICCIONARIOS` lo cambia
 * en el build (p. ej. un servidor local en desarrollo); `urlManifiesto` en la
 * configuración, en este navegador. Las URLs del manifiesto son relativas a él.
 */
const URL_MANIFIESTO =
  process.env.NEXT_PUBLIC_MYCELIUM_DICCIONARIOS ||
  "https://pub-4a4b6d7b99be4917a2fe0074be9dfa40.r2.dev/diccionarios/manifiesto.json";

/** Caché del navegador donde se guardan los diccionarios descargados. */
const CACHE = "mycelium-diccionarios-v1";

/**
 * Clave (sintética: nunca se pide a la red) del registro de un diccionario
 * descargado. Se escribe **última**, después de los archivos: si está, el
 * diccionario está completo y verificado.
 */
const claveRegistro = (id: string) => `${location.origin}/__mycelium/diccionarios/${encodeURIComponent(id)}.json`;
const PREFIJO_REGISTRO = "/__mycelium/diccionarios/";

/** Lo que se guarda de un diccionario descargado, además de sus archivos. */
type Registro = Descargado & { aff: string; dic: string; licencia: string };

const CANAL_DICCIONARIOS = "mycelium-diccionarios";
const CANAL_PERSONAL = "mycelium-diccionario-personal";

const mensaje = (e: unknown) => (e instanceof Error ? e.message : String(e));

// ── Avisos: en esta pestaña y en las demás ──────────────────────────────────

/**
 * Un aviso que llega a esta pestaña y a las otras del mismo navegador. En
 * desktop, Rust avisa a todas las ventanas, también a la que hizo el cambio:
 * acá se imita igual (oyentes locales + `BroadcastChannel`).
 */
function crearAviso(nombreCanal: string) {
  const oyentes = new Set<() => void>();
  let canal: BroadcastChannel | null = null;
  const abrir = () => {
    if (canal || typeof BroadcastChannel === "undefined") return;
    canal = new BroadcastChannel(nombreCanal);
    canal.onmessage = () => {
      for (const fn of oyentes) fn();
    };
  };
  return {
    emitir() {
      for (const fn of oyentes) fn();
      abrir();
      canal?.postMessage(null);
    },
    escuchar(fn: () => void): () => void {
      abrir();
      oyentes.add(fn);
      return () => oyentes.delete(fn);
    },
  };
}

const avisoDiccionarios = crearAviso(CANAL_DICCIONARIOS);
const avisoPersonal = crearAviso(CANAL_PERSONAL);

// ── Manifiesto y descargas ──────────────────────────────────────────────────

/**
 * El motivo de un `fetch` que no llegó a tener respuesta. El navegador no
 * distingue «sin conexión» de «el servidor no permite este origen» (CORS): los
 * dos son un `TypeError` sin detalle, así que se nombran los dos.
 */
function errorDeRed(que: string): Error {
  const sinConexion = typeof navigator !== "undefined" && navigator.onLine === false;
  return new Error(
    sinConexion
      ? `No hay conexión para ${que}.`
      : `No se pudo ${que}: sin conexión, o el servidor de los diccionarios no permite el acceso desde este sitio (CORS).`,
  );
}

function urlManifiesto(): string {
  const propia = leerConfigSincrona().urlManifiesto;
  return new URL(propia || URL_MANIFIESTO, location.href).href;
}

/** Trae y valida el manifiesto. Lanza sin conexión o si está mal formado. */
export async function consultarManifiesto(): Promise<Manifiesto> {
  const url = urlManifiesto();
  let r: Response;
  try {
    // `no-cache`: el manifiesto cambia cuando se publica algo; los archivos de
    // cada versión, no (sus rutas son inmutables).
    r = await fetch(url, { cache: "no-cache" });
  } catch {
    throw errorDeRed("consultar la lista de diccionarios");
  }
  if (!r.ok) throw new Error(`El servidor de los diccionarios respondió ${r.status}.`);
  return parsearManifiesto(await r.text(), r.url || url);
}

/** La caché de los diccionarios. Sin Cache API (sitio sin HTTPS), lanza con el motivo. */
async function abrirCache(): Promise<Cache> {
  if (typeof caches === "undefined") {
    throw new Error("Este navegador no permite guardar diccionarios en este sitio (hace falta HTTPS).");
  }
  return caches.open(CACHE);
}

async function registros(): Promise<Registro[]> {
  if (typeof caches === "undefined") return [];
  const cache = await abrirCache();
  const lista: Registro[] = [];
  for (const req of await cache.keys()) {
    if (!new URL(req.url).pathname.startsWith(PREFIJO_REGISTRO)) continue;
    try {
      const r = (await (await cache.match(req))?.json()) as Partial<Registro> | undefined;
      if (r && typeof r.id === "string" && typeof r.version === "string" && r.aff && r.dic && r.licencia) {
        lista.push(r as Registro);
      }
    } catch {
      // Un registro ilegible es como no tenerlo: se puede volver a descargar.
    }
  }
  return lista;
}

async function registroDe(id: string): Promise<Registro> {
  const r = (await registros()).find((x) => x.id === id);
  if (!r) throw new Error(`El diccionario ${id} no está descargado.`);
  return r;
}

export async function listarDescargados(): Promise<Descargado[]> {
  return (await registros()).map(({ id, version }) => ({ id, version }));
}

export type ProgresoDescarga = { id: string; descargado: number; total: number };

const oyentesProgreso = new Set<(p: ProgresoDescarga) => void>();
/** Descargas en curso, por variante: con qué cancelarlas. */
const enCurso = new Map<string, AbortController>();

/** Avance de las descargas (de esta pestaña). Devuelve con qué dejar de escuchar. */
export async function escucharProgreso(fn: (p: ProgresoDescarga) => void): Promise<() => void> {
  oyentesProgreso.add(fn);
  return () => oyentesProgreso.delete(fn);
}

function emitirProgreso(p: ProgresoDescarga) {
  for (const fn of oyentesProgreso) fn(p);
}

/** Baja un archivo entero, contando los bytes que llegan. */
async function bajar(url: string, senal: AbortSignal, contar: (n: number) => void): Promise<Uint8Array> {
  let r: Response;
  try {
    r = await fetch(url, { signal: senal });
  } catch {
    if (senal.aborted) throw new Error(DESCARGA_CANCELADA);
    throw errorDeRed("descargar el diccionario");
  }
  if (!r.ok) throw new Error(`El servidor de los diccionarios respondió ${r.status} (${url}).`);
  if (!r.body) return new Uint8Array(await r.arrayBuffer());
  const partes: Uint8Array[] = [];
  let total = 0;
  const lector = r.body.getReader();
  try {
    for (;;) {
      const { done, value } = await lector.read();
      if (done) break;
      partes.push(value);
      total += value.byteLength;
      contar(value.byteLength);
    }
  } catch (e) {
    if (senal.aborted) throw new Error(DESCARGA_CANCELADA);
    throw new Error(`La descarga se cortó: ${mensaje(e)}`);
  }
  const todo = new Uint8Array(total);
  let i = 0;
  for (const p of partes) {
    todo.set(p, i);
    i += p.byteLength;
  }
  return todo;
}

/**
 * Descomprime el gzip. Si lo que llegó ya no es gzip —el servidor lo sirvió con
 * `Content-Encoding: gzip` y el navegador lo descomprimió solo—, va tal cual: el
 * hash de abajo decide si es lo que tenía que ser.
 */
async function descomprimir(bytes: Uint8Array): Promise<ArrayBuffer> {
  const esGzip = bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b;
  if (!esGzip) return bytes.slice().buffer;
  if (typeof DecompressionStream === "undefined") {
    throw new Error("Este navegador no puede descomprimir los diccionarios (falta DecompressionStream).");
  }
  try {
    const flujo = new Blob([bytes as BlobPart]).stream().pipeThrough(new DecompressionStream("gzip"));
    return await new Response(flujo).arrayBuffer();
  } catch {
    throw new Error("El diccionario descargado está dañado (no se pudo descomprimir).");
  }
}

async function sha256(datos: ArrayBuffer): Promise<string> {
  const h = new Uint8Array(await crypto.subtle.digest("SHA-256", datos));
  return Array.from(h, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Descarga una variante. Resuelve al terminar (ya verificada y en uso), o lanza.
 *
 * Nada queda a medias: los archivos se bajan y se verifican **en memoria**, y
 * solo entonces se escriben en la caché, con el registro al final. Si algo
 * falla, se borra lo escrito y la versión anterior (si había) sigue en uso.
 */
export async function descargar(v: Variante): Promise<void> {
  if (enCurso.has(v.id)) throw new Error(`Ya se está descargando ${v.id}.`);
  const control = new AbortController();
  enCurso.set(v.id, control);
  try {
    const cache = await abrirCache();
    let descargado = 0;
    const total = v.bytes;
    const contar = (n: number) => {
      descargado += n;
      emitirProgreso({ id: v.id, descargado: Math.min(descargado, total), total });
    };
    emitirProgreso({ id: v.id, descargado: 0, total });
    // Si uno de los dos falla, el otro no sigue bajando para nada.
    const [affGz, dicGz] = await Promise.all([
      bajar(v.aff, control.signal, contar),
      bajar(v.dic, control.signal, contar),
    ]).catch((e) => {
      control.abort();
      throw e;
    });
    // La licencia acompaña al diccionario (lo exigen la GPL y la LGPL). Sin
    // ella no se activa, igual que en desktop.
    const licencia = await bajar(v.licencia, control.signal, () => {});
    const [aff, dic] = await Promise.all([descomprimir(affGz), descomprimir(dicGz)]);
    const [hAff, hDic] = await Promise.all([sha256(aff), sha256(dic)]);
    if (hAff !== v.sha256Aff || hDic !== v.sha256Dic) {
      throw new Error(`El diccionario ${v.id} descargado no coincide con el publicado (sha256): no se usa.`);
    }
    if (control.signal.aborted) throw new Error(DESCARGA_CANCELADA);

    const anterior = (await registros()).find((r) => r.id === v.id) ?? null;
    const registro: Registro = { id: v.id, version: v.version, aff: v.aff, dic: v.dic, licencia: v.licencia };
    const escritos: string[] = [];
    try {
      const guardar = async (url: string, cuerpo: BodyInit, tipo: string) => {
        await cache.put(url, new Response(cuerpo, { headers: { "Content-Type": tipo } }));
        escritos.push(url);
      };
      await guardar(v.aff, aff, "text/plain; charset=utf-8");
      await guardar(v.dic, dic, "text/plain; charset=utf-8");
      await guardar(v.licencia, new Blob([licencia as BlobPart]), "text/plain; charset=utf-8");
      await guardar(claveRegistro(v.id), JSON.stringify(registro), "application/json");
    } catch (e) {
      // Se borra lo escrito de esta versión, salvo que fuera la misma URL que la
      // anterior (no debería: las rutas llevan la versión). El registro va
      // último, así que el de la versión anterior sigue intacto y en uso.
      const deAntes = new Set(anterior ? [anterior.aff, anterior.dic, anterior.licencia] : []);
      for (const url of escritos) if (!deAntes.has(url)) await cache.delete(url).catch(() => false);
      throw new Error(`No se pudo guardar el diccionario en este navegador: ${mensaje(e)}`);
    }
    // La versión anterior ya no hace falta.
    if (anterior) {
      for (const url of [anterior.aff, anterior.dic, anterior.licencia]) {
        if (url !== v.aff && url !== v.dic && url !== v.licencia) await cache.delete(url).catch(() => false);
      }
    }
    emitirProgreso({ id: v.id, descargado: total, total });
    avisoDiccionarios.emitir();
  } finally {
    enCurso.delete(v.id);
  }
}

export async function cancelarDescarga(id: string): Promise<void> {
  enCurso.get(id)?.abort();
}

export async function borrarDescargado(id: string): Promise<void> {
  const r = (await registros()).find((x) => x.id === id);
  if (!r) return;
  const cache = await abrirCache();
  // Primero el registro: sin él, lo demás ya no cuenta como descargado.
  await cache.delete(claveRegistro(id));
  await Promise.all([r.aff, r.dic, r.licencia].map((url) => cache.delete(url)));
  avisoDiccionarios.emitir();
}

async function leerDeCache(url: string): Promise<ArrayBuffer> {
  const respuesta = await (await abrirCache()).match(url);
  if (!respuesta) throw new Error("El diccionario descargado está incompleto: quitalo y volvé a descargarlo.");
  return respuesta.arrayBuffer();
}

/** Los bytes del `.aff` y el `.dic` de un diccionario descargado. */
export async function leerDescargado(d: Descargado): Promise<{ aff: ArrayBuffer; dic: ArrayBuffer }> {
  const r = await registroDe(d.id);
  const [aff, dic] = await Promise.all([leerDeCache(r.aff), leerDeCache(r.dic)]);
  return { aff, dic };
}

/** El texto de la licencia que se bajó junto al diccionario. */
export async function leerLicencia(d: Descargado): Promise<string> {
  const r = await registroDe(d.id);
  return new TextDecoder().decode(await leerDeCache(r.licencia));
}

/**
 * Cambió lo descargado o la configuración, en esta pestaña o en otra: el
 * corrector de cada una se recarga.
 */
export async function escucharCambios(fn: () => void): Promise<() => void> {
  return avisoDiccionarios.escuchar(fn);
}

// ── Configuración de este navegador ─────────────────────────────────────────

/**
 * Qué está activo, en este navegador (no en el vault ni en la cuenta: los
 * diccionarios se descargan acá). En el `localStorage`.
 */
export type ConfigCorrector = {
  /** Lenguas activas (`es`, `en`, `it`): una palabra está bien si lo está en alguna. */
  activas: string[];
  /** Ya se propuso descargar el diccionario del idioma del sistema: no se insiste. */
  propuestaHecha: boolean;
  /** Otro manifiesto, para desarrollo (una URL). Se conserva al reescribir. */
  urlManifiesto?: string;
};

const CLAVE_CONFIG = "mycelium:corrector";
const CONFIG_DEFECTO: ConfigCorrector = { activas: [], propuestaHecha: false };

function leerConfigSincrona(): ConfigCorrector {
  let texto: string | null = null;
  try {
    texto = localStorage.getItem(CLAVE_CONFIG);
  } catch {
    // Sin almacenamiento (modo privado estricto): valores por defecto.
  }
  if (!texto) return { ...CONFIG_DEFECTO };
  try {
    const o = JSON.parse(texto) as Partial<ConfigCorrector>;
    return {
      activas: Array.isArray(o.activas) ? o.activas.filter((a): a is string => typeof a === "string") : [],
      propuestaHecha: o.propuestaHecha === true,
      ...(typeof o.urlManifiesto === "string" ? { urlManifiesto: o.urlManifiesto } : {}),
    };
  } catch {
    // Ilegible: se sigue con los valores por defecto y el próximo cambio lo reescribe.
    return { ...CONFIG_DEFECTO };
  }
}

export async function leerConfig(): Promise<ConfigCorrector> {
  return leerConfigSincrona();
}

export async function escribirConfig(config: ConfigCorrector): Promise<void> {
  try {
    localStorage.setItem(CLAVE_CONFIG, JSON.stringify(config));
  } catch (e) {
    throw new Error(`No se pudo guardar la configuración del corrector: ${mensaje(e)}`);
  }
  avisoDiccionarios.emitir();
}

// ── Diccionario del vault ───────────────────────────────────────────────────

const token = () => useAuthStore.getState().accessToken;

/** El vault abierto, o `null` (el corrector también funciona sin uno). */
export function vaultActual(): string | null {
  return useAuthStore.getState().vaults[0]?.id ?? null;
}

const rutaVault = (vault: string) => `/vaults/${encodeURIComponent(vault)}/diccionario`;

/** Las palabras del diccionario del vault. Sin vault o sin nada guardado, ninguna. */
export async function leerPalabrasDelVault(vault: string | null): Promise<string[]> {
  if (vault === null) return [];
  const r = await api<{ palabras: string | null }>(rutaVault(vault), { token: token() });
  return leerDiccionarioPersonal(r?.palabras ?? null);
}

export async function guardarPalabrasDelVault(vault: string, palabras: string[]): Promise<void> {
  await api(rutaVault(vault), {
    method: "PUT",
    token: token(),
    body: { palabras: escribirDiccionarioPersonal(palabras) },
  });
}

// ── Diccionario de Mycelium ─────────────────────────────────────────────────
//
// El que vale para todos los vaults: del **usuario**, en el backend junto a sus
// preferencias, así lo sigue en cualquier navegador. No depende de que haya un
// vault abierto.

/** Las palabras del diccionario de Mycelium. Sin nada guardado, ninguna. */
export async function leerPalabrasDeMycelium(): Promise<string[]> {
  const r = await api<{ palabras: string | null }>("/auth/diccionario", { token: token() });
  return leerDiccionarioPersonal(r?.palabras ?? null);
}

/** Lo reescribe entero y avisa a todas las pestañas (`escucharCambiosDeMycelium`). */
export async function guardarPalabrasDeMycelium(palabras: string[]): Promise<void> {
  await api("/auth/diccionario", {
    method: "PUT",
    token: token(),
    body: { palabras: escribirDiccionarioPersonal(palabras) },
  });
  avisoPersonal.emitir();
}

/**
 * Cambió el diccionario de Mycelium, en esta pestaña o en otra: cada una relee
 * sus palabras. Devuelve con qué dejar de escuchar. Otro navegador (u otra
 * computadora) no avisa: lo ve al recargar.
 */
export async function escucharCambiosDeMycelium(fn: () => void): Promise<() => void> {
  return avisoPersonal.escuchar(fn);
}
