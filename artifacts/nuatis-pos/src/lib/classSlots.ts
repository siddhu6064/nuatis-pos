export interface ClassEnrollment {
  id: string;
  customerId: string;
  customerName: string;
  enrolledAt: number;
  transactionId?: string;
}

export interface ClassSlot {
  id: string;
  verticalId: string;
  serviceId: string;
  serviceName: string;
  scheduledAt: number;
  durationMin: number;
  instructorStaffId: string;
  instructorName: string;
  capacity: number;
  roster: ClassEnrollment[];
}

function todayAt(hour: number, minute: number = 0): number {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d.getTime();
}

function makeEnrollment(customerId: string, customerName: string, minsAgo: number): ClassEnrollment {
  return {
    id: `enroll_seed_${customerId}_${minsAgo}`,
    customerId,
    customerName,
    enrolledAt: Date.now() - minsAgo * 60_000,
  };
}

export function seedClassSlots(verticalId: string): ClassSlot[] {
  const hoursAgo = (h: number) => Date.now() - h * 3_600_000;
  return [
    {
      id: "slot_seed_001",
      verticalId,
      serviceId: "yoga_vinyasa",
      serviceName: "Vinyasa Flow",
      scheduledAt: todayAt(9, 0),
      durationMin: 60,
      instructorStaffId: "staff_1",
      instructorName: "Maria",
      capacity: 12,
      roster: [
        makeEnrollment("yoga_cust_001", "Amara Singh", 120),
        makeEnrollment("yoga_cust_002", "Carlos Mendez", 95),
        makeEnrollment("yoga_cust_003", "Yuki Tanaka", 60),
      ],
    },
    {
      id: "slot_seed_002",
      verticalId,
      serviceId: "yoga_yin",
      serviceName: "Yin Yoga",
      scheduledAt: todayAt(11, 0),
      durationMin: 75,
      instructorStaffId: "staff_3",
      instructorName: "Lisa",
      capacity: 10,
      roster: [
        makeEnrollment("yc_s02_1", "Sofia Reyes", 180),
        makeEnrollment("yc_s02_2", "Marcus Brown", 175),
        makeEnrollment("yc_s02_3", "Priya Patel", 160),
        makeEnrollment("yc_s02_4", "Lena Koch", 145),
        makeEnrollment("yc_s02_5", "Diego Vargas", 130),
        makeEnrollment("yc_s02_6", "Aisha Johnson", 115),
        makeEnrollment("yc_s02_7", "Tom Nguyen", 100),
        makeEnrollment("yc_s02_8", "Rachel Kim", 85),
      ],
    },
    {
      id: "slot_seed_003",
      verticalId,
      serviceId: "yoga_power",
      serviceName: "Power Yoga",
      scheduledAt: todayAt(12, 0),
      durationMin: 60,
      instructorStaffId: "staff_2",
      instructorName: "James",
      capacity: 15,
      roster: [],
    },
    {
      id: "slot_seed_004",
      verticalId,
      serviceId: "yoga_hot",
      serviceName: "Hot Yoga",
      scheduledAt: todayAt(16, 0),
      durationMin: 60,
      instructorStaffId: "staff_1",
      instructorName: "Maria",
      capacity: 12,
      roster: [
        makeEnrollment("yc_s04_1", "Jordan Lee", hoursAgo(5) / 60_000),
        makeEnrollment("yc_s04_2", "Nina Rossi", hoursAgo(5) / 60_000),
        makeEnrollment("yc_s04_3", "Omar Hassan", hoursAgo(5) / 60_000),
        makeEnrollment("yc_s04_4", "Chloe Dubois", hoursAgo(5) / 60_000),
        makeEnrollment("yc_s04_5", "Alex Park", hoursAgo(5) / 60_000),
        makeEnrollment("yc_s04_6", "Valentina Cruz", hoursAgo(5) / 60_000),
        makeEnrollment("yc_s04_7", "Ben Adler", hoursAgo(5) / 60_000),
        makeEnrollment("yc_s04_8", "Mei Lin", hoursAgo(5) / 60_000),
        makeEnrollment("yc_s04_9", "Felix Wagner", hoursAgo(5) / 60_000),
        makeEnrollment("yc_s04_10", "Amina Diallo", hoursAgo(5) / 60_000),
        makeEnrollment("yc_s04_11", "Ryo Tanaka", hoursAgo(5) / 60_000),
        makeEnrollment("yc_s04_12", "Sara Johansson", hoursAgo(5) / 60_000),
      ],
    },
    {
      id: "slot_seed_005",
      verticalId,
      serviceId: "yoga_vinyasa",
      serviceName: "Vinyasa Flow",
      scheduledAt: todayAt(18, 0),
      durationMin: 60,
      instructorStaffId: "staff_3",
      instructorName: "Lisa",
      capacity: 12,
      roster: [
        makeEnrollment("yc_s05_1", "Dana West", 240),
        makeEnrollment("yc_s05_2", "Kenji Mori", 220),
        makeEnrollment("yc_s05_3", "Fatima Al-Rashid", 200),
        makeEnrollment("yc_s05_4", "Ethan Brooks", 180),
        makeEnrollment("yc_s05_5", "Isla Mackenzie", 160),
      ],
    },
    {
      id: "slot_seed_006",
      verticalId,
      serviceId: "yoga_aerial",
      serviceName: "Aerial Yoga",
      scheduledAt: todayAt(19, 0),
      durationMin: 60,
      instructorStaffId: "staff_2",
      instructorName: "James",
      capacity: 6,
      roster: [
        makeEnrollment("yc_s06_1", "Nia Okafor", 300),
        makeEnrollment("yc_s06_2", "Leo Hartmann", 280),
        makeEnrollment("yc_s06_3", "Zara Ahmed", 260),
        makeEnrollment("yc_s06_4", "Noah Christensen", 240),
      ],
    },
  ];
}

const CLASS_SLOTS_KEY_PREFIX = "nuatis-pos";

function classSlotStorageKey(verticalId: string): string {
  return `${CLASS_SLOTS_KEY_PREFIX}:${verticalId}:classSlots`;
}

export function loadClassSlots(verticalId: string): ClassSlot[] {
  try {
    const raw = localStorage.getItem(classSlotStorageKey(verticalId));
    if (!raw) return [];
    return JSON.parse(raw) as ClassSlot[];
  } catch {
    return [];
  }
}

export function saveClassSlots(verticalId: string, slots: ClassSlot[]): void {
  try {
    localStorage.setItem(classSlotStorageKey(verticalId), JSON.stringify(slots));
  } catch {
    // silent
  }
}

export function isSlotFull(slots: ClassSlot[], slotId: string): boolean {
  const slot = slots.find((s) => s.id === slotId);
  if (!slot) return false;
  return slot.roster.length >= slot.capacity;
}

export function addEnrollmentToSlots(
  slots: ClassSlot[],
  slotId: string,
  enrollment: ClassEnrollment,
): ClassSlot[] {
  return slots.map((s) => {
    if (s.id !== slotId) return s;
    if (s.roster.length >= s.capacity) return s;
    return { ...s, roster: [...s.roster, enrollment] };
  });
}

export function removeEnrollmentFromSlots(
  slots: ClassSlot[],
  slotId: string,
  enrollmentId: string,
): ClassSlot[] {
  return slots.map((s) => {
    if (s.id !== slotId) return s;
    return { ...s, roster: s.roster.filter((e) => e.id !== enrollmentId) };
  });
}

export function markEnrollmentPaidInSlots(
  slots: ClassSlot[],
  slotId: string,
  enrollmentId: string,
  transactionId: string,
): ClassSlot[] {
  return slots.map((s) => {
    if (s.id !== slotId) return s;
    return {
      ...s,
      roster: s.roster.map((e) =>
        e.id === enrollmentId ? { ...e, transactionId } : e,
      ),
    };
  });
}
