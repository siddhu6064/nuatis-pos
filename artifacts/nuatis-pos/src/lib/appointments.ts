import { appointmentsKey } from "@/lib/storage";

export type AppointmentStatus = "scheduled" | "started" | "no_show";
export type DepositStatus = "pending" | "taken";

export interface Appointment {
  id: string;
  customerName: string;
  customerPhone: string;
  serviceId: string;
  serviceName: string;
  servicePriceCents: number;
  staffId: string;
  staffName: string;
  scheduledAt: number;
  status: AppointmentStatus;
  startedAt?: number;
  noShowAt?: number;
  // Deposit fields — absent on non-deposit appointments (defaults to not required)
  depositRequired?: boolean;
  depositAmountCents?: number;
  depositStatus?: DepositStatus;
  depositTakenAt?: number;
  depositTransactionId?: string;
}

type AppointmentSeed = Omit<Appointment, "id" | "status">;

// ─── Seed generators (now: epoch ms for testability) ──────────────────────────

function salonSeeds(now: number): AppointmentSeed[] {
  const h = 3600000;
  return [
    { customerName: "Emma Johnson",  customerPhone: "5125550101", serviceId: "womens-cut",      serviceName: "Women's Cut",        servicePriceCents: 5500,  staffId: "staff_1", staffName: "Maria", scheduledAt: now + 1.5 * h },
    { customerName: "Carlos Rivera", customerPhone: "5125550102", serviceId: "color-root",      serviceName: "Color Root",         servicePriceCents: 9500,  staffId: "staff_2", staffName: "James", scheduledAt: now + 3   * h },
    { customerName: "Priya Patel",   customerPhone: "5125550103", serviceId: "blowout",         serviceName: "Blowout",            servicePriceCents: 4500,  staffId: "staff_3", staffName: "Lisa",  scheduledAt: now + 5   * h },
    { customerName: "Sarah Chen",    customerPhone: "5125550104", serviceId: "highlights-full", serviceName: "Highlights Full",    servicePriceCents: 18500, staffId: "staff_2", staffName: "James", scheduledAt: now + 26  * h },
    { customerName: "Mia Turner",    customerPhone: "5125550105", serviceId: "olaplex",         serviceName: "Olaplex Treatment",  servicePriceCents: 4500,  staffId: "staff_1", staffName: "Maria", scheduledAt: now + 51  * h },
    { customerName: "Jake Morris",   customerPhone: "5125550106", serviceId: "mens-cut",        serviceName: "Men's Cut",          servicePriceCents: 3500,  staffId: "staff_3", staffName: "Lisa",  scheduledAt: now + 77  * h },
  ];
}

function spaSeeds(now: number): AppointmentSeed[] {
  const h = 3600000;
  return [
    { customerName: "Natalie Brooks", customerPhone: "5125550201", serviceId: "spa_swedish_60",      serviceName: "Swedish Massage",     servicePriceCents: 9000,  staffId: "staff_1", staffName: "Maria", scheduledAt: now + 1   * h },
    { customerName: "Daniel Kim",     customerPhone: "5125550202", serviceId: "spa_classic_facial",  serviceName: "Classic Facial",      servicePriceCents: 8500,  staffId: "staff_3", staffName: "Lisa",  scheduledAt: now + 3   * h },
    { customerName: "Rachel Wong",    customerPhone: "5125550203", serviceId: "spa_deep_tissue_60",  serviceName: "Deep Tissue Massage", servicePriceCents: 11000, staffId: "staff_2", staffName: "James", scheduledAt: now + 5.5 * h },
    { customerName: "Lisa Park",      customerPhone: "5125550204", serviceId: "spa_hot_stone_60",    serviceName: "Hot Stone Massage",   servicePriceCents: 13000, staffId: "staff_1", staffName: "Maria", scheduledAt: now + 25  * h },
    { customerName: "Tyler Ross",     customerPhone: "5125550205", serviceId: "spa_body_scrub",      serviceName: "Body Scrub",          servicePriceCents: 7500,  staffId: "staff_3", staffName: "Lisa",  scheduledAt: now + 52  * h },
    { customerName: "Anna Bell",      customerPhone: "5125550206", serviceId: "spa_antiaging_facial",serviceName: "Anti-Aging Facial",   servicePriceCents: 12500, staffId: "staff_2", staffName: "James", scheduledAt: now + 99  * h },
  ];
}

function nailBarSeeds(now: number): AppointmentSeed[] {
  const h = 3600000;
  return [
    { customerName: "Jess Lee",      customerPhone: "5125550301", serviceId: "nail_gel_mani",     serviceName: "Gel Manicure",     servicePriceCents: 4500,  staffId: "staff_2", staffName: "James", scheduledAt: now + 2.5 * h },
    { customerName: "Maya Santos",   customerPhone: "5125550302", serviceId: "nail_spa_pedi",     serviceName: "Spa Pedicure",     servicePriceCents: 5500,  staffId: "staff_1", staffName: "Maria", scheduledAt: now + 4   * h },
    { customerName: "Olivia Hart",   customerPhone: "5125550303", serviceId: "nail_acrylic_full", serviceName: "Acrylic Full Set", servicePriceCents: 6500,  staffId: "staff_3", staffName: "Lisa",  scheduledAt: now + 6.5 * h },
    { customerName: "Beth Collins",  customerPhone: "5125550304", serviceId: "nail_basic_mani",   serviceName: "Basic Manicure",   servicePriceCents: 2500,  staffId: "staff_1", staffName: "Maria", scheduledAt: now + 27  * h },
    { customerName: "Chloe Adams",   customerPhone: "5125550305", serviceId: "nail_dip_powder",   serviceName: "Dip Powder",       servicePriceCents: 5000,  staffId: "staff_2", staffName: "James", scheduledAt: now + 75  * h },
    { customerName: "Amber Scott",   customerPhone: "5125550306", serviceId: "nail_gel_pedi",     serviceName: "Gel Pedicure",     servicePriceCents: 6000,  staffId: "staff_3", staffName: "Lisa",  scheduledAt: now + 125 * h },
  ];
}

function tattooSeeds(now: number): AppointmentSeed[] {
  const h = 3600000;
  return [
    { customerName: "Marcus Webb",  customerPhone: "5125550401", serviceId: "tattoo_large",      serviceName: "Large Tattoo (6–8\")",         servicePriceCents: 50000, staffId: "staff_1", staffName: "Maria", scheduledAt: now + 2  * h, depositRequired: true,  depositAmountCents: 15000, depositStatus: "pending" },
    { customerName: "Zara Bishop",  customerPhone: "5125550402", serviceId: "tattoo_coverup",    serviceName: "Cover-Up",                     servicePriceCents: 40000, staffId: "staff_2", staffName: "James", scheduledAt: now + 4  * h, depositRequired: true,  depositAmountCents: 10000, depositStatus: "pending" },
    { customerName: "Nolan Fox",    customerPhone: "5125550403", serviceId: "tattoo_medium",     serviceName: "Medium Tattoo (3–5\")",        servicePriceCents: 30000, staffId: "staff_3", staffName: "Lisa",  scheduledAt: now + 6  * h, depositRequired: false },
    { customerName: "Hazel Stone",  customerPhone: "5125550404", serviceId: "tattoo_color_lg",   serviceName: "Color Fill (Large)",           servicePriceCents: 45000, staffId: "staff_1", staffName: "Maria", scheduledAt: now + 26 * h, depositRequired: true,  depositAmountCents: 20000, depositStatus: "pending" },
    { customerName: "Riley Crane",  customerPhone: "5125550405", serviceId: "tattoo_fine_line",  serviceName: "Fine Line",                    servicePriceCents: 18000, staffId: "staff_2", staffName: "James", scheduledAt: now + 51 * h, depositRequired: false },
    { customerName: "Sam Cole",     customerPhone: "5125550406", serviceId: "tattoo_shading_lg", serviceName: "Black & Grey Shading (Large)", servicePriceCents: 40000, staffId: "staff_3", staffName: "Lisa",  scheduledAt: now + 75 * h, depositRequired: true,  depositAmountCents: 10000, depositStatus: "pending" },
  ];
}

function generateSeeds(verticalId: string, now: number): AppointmentSeed[] {
  if (verticalId === "salon")    return salonSeeds(now);
  if (verticalId === "spa")      return spaSeeds(now);
  if (verticalId === "nail_bar") return nailBarSeeds(now);
  if (verticalId === "tattoo")   return tattooSeeds(now);
  return [];
}

// ─── Validation ───────────────────────────────────────────────────────────────

function isValidAppointment(a: unknown): a is Appointment {
  if (typeof a !== "object" || a === null) return false;
  const o = a as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.customerName === "string" &&
    typeof o.customerPhone === "string" &&
    typeof o.serviceId === "string" &&
    typeof o.serviceName === "string" &&
    typeof o.servicePriceCents === "number" &&
    typeof o.staffId === "string" &&
    typeof o.staffName === "string" &&
    typeof o.scheduledAt === "number" &&
    (o.status === "scheduled" || o.status === "started" || o.status === "no_show")
    // Deposit fields are optional — absence is valid (legacy records)
  );
}

// ─── Persistence helpers ──────────────────────────────────────────────────────

function saveAppointments(verticalId: string, list: Appointment[]): void {
  try {
    localStorage.setItem(appointmentsKey(verticalId), JSON.stringify(list));
  } catch {
    // silent fail
  }
}

function sorted(list: Appointment[]): Appointment[] {
  return [...list].sort((a, b) => a.scheduledAt - b.scheduledAt);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function getAppointments(verticalId: string): Appointment[] {
  try {
    const key = appointmentsKey(verticalId);
    const raw = localStorage.getItem(key);
    if (raw === null) {
      const seeds = generateSeeds(verticalId, Date.now());
      const list: Appointment[] = seeds.map((s) => ({
        ...s,
        id: crypto.randomUUID(),
        status: "scheduled",
      }));
      saveAppointments(verticalId, list);
      return sorted(list);
    }
    const parsed: unknown = JSON.parse(raw);
    const arr: unknown[] = Array.isArray(parsed) ? parsed : [];
    const valid = arr.filter(isValidAppointment);
    if (valid.length !== arr.length) {
      saveAppointments(verticalId, valid);
    }
    return sorted(valid);
  } catch {
    return [];
  }
}

export function markAppointmentStarted(verticalId: string, id: string): Appointment[] {
  const current = getAppointments(verticalId);
  const now = Date.now();
  const updated = current.map((a): Appointment =>
    a.id === id
      ? { ...a, status: "started", startedAt: now, noShowAt: undefined }
      : a,
  );
  saveAppointments(verticalId, updated);
  return sorted(updated);
}

export function markAppointmentNoShow(verticalId: string, id: string): Appointment[] {
  const current = getAppointments(verticalId);
  const now = Date.now();
  const updated = current.map((a): Appointment =>
    a.id === id
      ? { ...a, status: "no_show", noShowAt: now, startedAt: undefined }
      : a,
  );
  saveAppointments(verticalId, updated);
  return sorted(updated);
}

export function resetAppointmentStatus(verticalId: string, id: string): Appointment[] {
  const current = getAppointments(verticalId);
  const updated = current.map((a): Appointment => {
    if (a.id !== id) return a;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { startedAt: _s, noShowAt: _n, ...rest } = a;
    return { ...rest, status: "scheduled" };
  });
  saveAppointments(verticalId, updated);
  return sorted(updated);
}

export function takeAppointmentDeposit(
  verticalId: string,
  id: string,
  txId: string,
): Appointment[] {
  const current = getAppointments(verticalId);
  const now = Date.now();
  const updated = current.map((a): Appointment =>
    a.id === id
      ? { ...a, depositStatus: "taken", depositTakenAt: now, depositTransactionId: txId }
      : a,
  );
  saveAppointments(verticalId, updated);
  return sorted(updated);
}

// ─── Pure display helper ──────────────────────────────────────────────────────

export function formatAppointmentTime(scheduledAt: number): string {
  const d = new Date(scheduledAt);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const tomorrowStart = todayStart + 86400000;
  const apptDayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

  const timeStr = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);

  if (apptDayStart === todayStart) {
    return `Today ${timeStr}`;
  } else if (apptDayStart === tomorrowStart) {
    return `Tomorrow ${timeStr}`;
  } else {
    const dayName = new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(d);
    return `${dayName} ${timeStr}`;
  }
}
