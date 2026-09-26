/**
 * El programador de avisos de los recordatorios (`FUN-L-22`, § 5.1 de la spec)
 * y la notificación del navegador (§ 5.2).
 *
 * En desktop la notificación es un toast de Windows armado en Rust; en web es
 * la Notification API del navegador, con el permiso pedido al guardar el
 * primer recordatorio con hora (no al cargar la página).
 *
 * **Cuándo revisa.** Una vez por minuto, alineado al cambio de minuto —un
 * recordatorio «a las 10:00» avisa a las 10:00 y no a las 10:00:59—, y además:
 *
 *   - al volver de la suspensión del equipo. Con el equipo dormido los
 *     temporizadores no corren; al despertar, el tic siguiente llega con un
 *     salto grande y ese salto es la señal. También se revisa al volver la
 *     ventana a primer plano, que suele ser lo primero que pasa al despertar;
 *   - a medianoche no hace falta nada especial: es un minuto más, y ahí vencen
 *     los de «todo el día».
 *
 * No se busca más precisión: nadie espera un recordatorio al segundo.
 *
 * El módulo no conoce el store (lo recibe como función): así no hay ciclo entre
 * `recordatoriosStore` y el programador.
 */
import { primerRenglon, type Aviso } from "@/lib/recordatorios";

const MINUTO_MS = 60_000;
/** Un tic que llega con más atraso que esto es que el equipo estuvo suspendido. */
const SALTO_SUSPENSION_MS = 2 * MINUTO_MS;

let temporizador: ReturnType<typeof setTimeout> | null = null;
let ultimoTic = 0;
let revisarActual: (() => void) | null = null;

function programarSiguiente() {
  const ahora = Date.now();
  // Hasta el próximo cambio de minuto, con un respiro para caer ya adentro.
  const espera = MINUTO_MS - (ahora % MINUTO_MS) + 250;
  temporizador = setTimeout(tic, espera);
}

function tic() {
  const ahora = Date.now();
  const salto = ahora - ultimoTic;
  ultimoTic = ahora;
  if (salto > SALTO_SUSPENSION_MS) {
    console.info("[Mycelium] recordatorios · se revisa tras una pausa (¿suspensión?)");
  }
  revisarActual?.();
  programarSiguiente();
}

function alVolver() {
  if (document.visibilityState === "visible") revisarActual?.();
}

/** Arranca el programador. Idempotente: si ya corría, lo reemplaza. */
export function iniciarProgramador(revisar: () => void): void {
  detenerProgramador();
  revisarActual = revisar;
  ultimoTic = Date.now();
  programarSiguiente();
  document.addEventListener("visibilitychange", alVolver);
  window.addEventListener("focus", alVolver);
}

/** Lo detiene al salir del vault: los avisos de un vault cerrado no suenan. */
export function detenerProgramador(): void {
  if (temporizador !== null) clearTimeout(temporizador);
  temporizador = null;
  revisarActual = null;
  if (typeof document !== "undefined") {
    document.removeEventListener("visibilitychange", alVolver);
    window.removeEventListener("focus", alVolver);
  }
}

// ── Notificación del sistema ───────────────────────────────────────────────

/**
 * Qué avisos ya se notificaron en esta sesión: la clave de la ocurrencia y el
 * momento (uno pospuesto vuelve a notificar al llegar su nueva hora). Sin esto,
 * una tarjeta abierta mandaría una notificación por minuto.
 */
const notificados = new Set<string>();

export function olvidarNotificados(): void {
  notificados.clear();
}

/** Si la API de notificaciones existe en este navegador. */
function hayNotificaciones(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

/**
 * Pide permiso para las notificaciones del navegador, **una sola vez**: si ya
 * se concedió o se negó, no hace nada (y el navegador tampoco volvería a
 * preguntar). Se llama al guardar un recordatorio con hora, dentro del clic de
 * «Guardar», que es el gesto del usuario que el navegador exige. Si se niega,
 * la tarjeta dentro de la app alcanza.
 */
export function pedirPermisoNotificaciones(): void {
  if (!hayNotificaciones() || Notification.permission !== "default") return;
  try {
    void Notification.requestPermission().catch(() => {
      // Algunos navegadores lo rechazan fuera de un gesto: la tarjeta sigue.
    });
  } catch {
    // Safari viejo: `requestPermission` con callback y sin promesa. No vale la pena.
  }
}

/**
 * Si la pestaña se está viendo: visible y con foco. En web no se puede saber
 * si la ventana del navegador está tapada por otra, pero sí si la pestaña está
 * oculta (`document.hidden`: otra pestaña, ventana minimizada) o sin foco.
 */
function pestanaALaVista(): boolean {
  return !document.hidden && document.hasFocus();
}

/**
 * Manda una notificación del navegador por cada aviso nuevo, **solo** si la
 * pestaña no se ve —oculta o sin foco—. Con la pestaña al frente la tarjeta ya
 * está a la vista y la notificación sería un duplicado. Hacerle clic enfoca la
 * ventana, donde espera la tarjeta. Sin permiso no se manda nada: la tarjeta
 * se verá al volver.
 */
export function notificarNuevos(avisos: Aviso[]): void {
  const nuevos = avisos.filter((a) => !notificados.has(`${a.clave}|${a.momento.getTime()}`));
  if (nuevos.length === 0) return;
  for (const a of nuevos) notificados.add(`${a.clave}|${a.momento.getTime()}`);
  if (pestanaALaVista()) return;
  if (!hayNotificaciones() || Notification.permission !== "granted") return;
  for (const a of nuevos) {
    try {
      const n = new Notification(a.recordatorio.titulo, {
        body: primerRenglon(a.recordatorio.detalle),
        // Una por ocurrencia: si la misma vuelve a notificarse (pospuesta),
        // reemplaza a la anterior en vez de apilarse.
        tag: `mycelium-recordatorio-${a.clave}`,
      });
      n.onclick = () => {
        window.focus();
        n.close();
      };
    } catch (e) {
      // La tarjeta ya está en la página: se verá al volver. Solo queda constancia.
      console.error("[Mycelium] recordatorios · no se pudo mandar la notificación", e);
    }
  }
}
