/**
 * Utilidades para el sistema de días programados de retos.
 * Convención de días: 0=Domingo, 1=Lunes, ..., 6=Sábado (igual que Date.getDay())
 */

export const DAY_LABELS: Record<number, string> = {
  0: "Dom",
  1: "Lun",
  2: "Mar",
  3: "Mié",
  4: "Jue",
  5: "Vie",
  6: "Sáb",
};

export const DAY_LABELS_FULL: Record<number, string> = {
  0: "Domingo",
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
};

/** Días ordenados de lunes a domingo para mostrar en la UI */
export const ORDERED_DAYS = [1, 2, 3, 4, 5, 6, 0];

/**
 * Normaliza una fecha a medianoche UTC para comparaciones de solo-fecha.
 */
function toDateOnly(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/**
 * Parsea una cadena de fecha YYYY-MM-DD a un Date UTC (medianoche).
 * Nunca usa new Date(string) directamente para evitar el bug de UTC shift.
 */
function parseCheckinDate(dateStr: string): Date {
  const [y, m, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, day));
}

/**
 * Genera todas las fechas programadas desde startedAt hasta hoy (inclusive).
 * Una fecha es "programada" si su día de la semana está en scheduleDays.
 */
function getScheduledDatesUpToToday(scheduleDays: number[], startedAt: Date): Date[] {
  const result: Date[] = [];
  const start = toDateOnly(startedAt);
  const today = toDateOnly(new Date());

  const current = new Date(start);
  while (current <= today) {
    if (scheduleDays.includes(current.getUTCDay())) {
      result.push(new Date(current));
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return result;
}

/**
 * Calcula la racha de check-ins basada en días programados consecutivos.
 * Retorna null si no hay scheduleDays configurados (usar valor del trigger de BD).
 *
 * Lógica:
 * 1. Genera todas las fechas programadas desde el inicio hasta hoy.
 * 2. Recorre de más reciente a más antigua.
 * 3. Si la fecha está en el futuro: la salta.
 * 4. Si la fecha tiene check-in: streak++.
 * 5. Si la fecha es pasada sin check-in: rompe la racha.
 */
export function calculateScheduleAwareStreak(
  scheduleDays: number[] | null | undefined,
  startedAt: string | Date,
  checkins: Array<{ checkin_date: string }>
): number | null {
  if (!scheduleDays || scheduleDays.length === 0) return null;

  const start = typeof startedAt === "string" ? new Date(startedAt) : startedAt;
  const scheduledDates = getScheduledDatesUpToToday(scheduleDays, start);

  // Set de fechas con al menos un check-in (formato YYYY-MM-DD)
  const checkinDateSet = new Set<string>(
    checkins.map((c) => {
      // Normalizar la fecha del check-in a YYYY-MM-DD
      return c.checkin_date.slice(0, 10);
    })
  );

  const today = toDateOnly(new Date());

  let streak = 0;
  // Recorrer de más reciente a más antigua
  for (let i = scheduledDates.length - 1; i >= 0; i--) {
    const scheduledDate = scheduledDates[i];
    const dateKey = scheduledDate.toISOString().split("T")[0];

    // Fecha futura → no es requerida todavía, saltar
    if (scheduledDate > today) continue;

    if (checkinDateSet.has(dateKey)) {
      streak++;
    } else {
      // Fecha pasada sin check-in → racha rota
      break;
    }
  }

  return streak;
}

/**
 * Retorna la próxima fecha programada (hoy si hoy es un día programado,
 * o la siguiente ocurrencia futura).
 */
export function getNextScheduledDate(
  scheduleDays: number[] | null | undefined
): Date | null {
  if (!scheduleDays || scheduleDays.length === 0) return null;

  const today = new Date();
  const todayDay = today.getDay();

  // Buscar en los próximos 7 días (incluyendo hoy)
  for (let offset = 0; offset <= 7; offset++) {
    const candidate = new Date(today);
    candidate.setDate(today.getDate() + offset);
    if (scheduleDays.includes(candidate.getDay())) {
      return candidate;
    }
  }
  return null;
}

/**
 * Retorna true si el día de hoy está en los días programados.
 */
export function isScheduledToday(
  scheduleDays: number[] | null | undefined
): boolean {
  if (!scheduleDays || scheduleDays.length === 0) return false;
  return scheduleDays.includes(new Date().getDay());
}

/**
 * Formatea un array de días a texto legible.
 * Ej: [1, 3, 5] → "Lun, Mié, Vie"
 */
export function formatScheduleDays(scheduleDays: number[] | null | undefined): string {
  if (!scheduleDays || scheduleDays.length === 0) return "Sin días programados";
  return [...scheduleDays]
    .sort((a, b) => {
      // Ordenar: Lun(1) primero, Dom(0) último
      const order = [1, 2, 3, 4, 5, 6, 0];
      return order.indexOf(a) - order.indexOf(b);
    })
    .map((d) => DAY_LABELS[d])
    .join(", ");
}

/**
 * Formatea la próxima fecha programada a texto legible.
 */
export function formatNextScheduledDate(
  scheduleDays: number[] | null | undefined
): string | null {
  const next = getNextScheduledDate(scheduleDays);
  if (!next) return null;

  const today = new Date();
  const todayNorm = toDateOnly(today);
  const nextNorm = toDateOnly(next);

  if (nextNorm.getTime() === todayNorm.getTime()) return "Hoy";

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowNorm = toDateOnly(tomorrow);
  if (nextNorm.getTime() === tomorrowNorm.getTime()) return "Mañana";

  return `${DAY_LABELS_FULL[next.getDay()]} ${next.getDate()} ${next.toLocaleString("es-MX", { month: "short" })}`;
}
