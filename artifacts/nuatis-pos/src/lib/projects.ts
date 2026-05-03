const STORAGE_VERSION = "v1";

const DEFAULT_STAGE_LABELS = ["Deposit", "Progress", "Final"] as const;
const DEFAULT_ALLOCATION_PCTS = [25, 50, 25] as const;

export function projectsKey(verticalId: string): string {
  return `nuatis-pos:${STORAGE_VERSION}:${verticalId}:projects`;
}

export interface ProjectStage {
  id: string;
  label: string;
  allocationPct: number;
  allocationCents: number;
  dueAt?: number;
  transactionId?: string;
  paidAt?: number;
}

export interface Project {
  id: string;
  verticalId: string;
  customerId: string;
  customerName: string;
  serviceId: string;
  serviceName: string;
  totalCents: number;
  stages: ProjectStage[];
  createdAt: number;
  completedAt?: number;
}

/** Verifies that stage allocations sum to totalCents within ±1 cent. Logs error if violated. */
export function verifyStageAllocations(project: Project): void {
  const sum = project.stages.reduce((s, st) => s + st.allocationCents, 0);
  const diff = Math.abs(sum - project.totalCents);
  if (diff > 1) {
    console.error(
      `[projects] Allocation mismatch on project ${project.id}: stages sum to ${sum} but totalCents is ${project.totalCents}`,
    );
  }
}

/** Builds a default 3-stage project (25% / 50% / 25%). Rounding remainder goes to Final. */
export function buildDefaultProject(opts: {
  verticalId: string;
  customerId: string;
  customerName: string;
  serviceId: string;
  serviceName: string;
  totalCents: number;
}): Project {
  const alloc0 = Math.round(opts.totalCents * DEFAULT_ALLOCATION_PCTS[0] / 100);
  const alloc1 = Math.round(opts.totalCents * DEFAULT_ALLOCATION_PCTS[1] / 100);
  const alloc2 = opts.totalCents - alloc0 - alloc1;

  const stages: ProjectStage[] = [
    { id: crypto.randomUUID(), label: DEFAULT_STAGE_LABELS[0], allocationPct: DEFAULT_ALLOCATION_PCTS[0], allocationCents: alloc0 },
    { id: crypto.randomUUID(), label: DEFAULT_STAGE_LABELS[1], allocationPct: DEFAULT_ALLOCATION_PCTS[1], allocationCents: alloc1 },
    { id: crypto.randomUUID(), label: DEFAULT_STAGE_LABELS[2], allocationPct: DEFAULT_ALLOCATION_PCTS[2], allocationCents: alloc2 },
  ];

  const project: Project = {
    id: crypto.randomUUID(),
    verticalId: opts.verticalId,
    customerId: opts.customerId,
    customerName: opts.customerName,
    serviceId: opts.serviceId,
    serviceName: opts.serviceName,
    totalCents: opts.totalCents,
    stages,
    createdAt: Date.now(),
  };

  verifyStageAllocations(project);
  return project;
}

function loadProjects(verticalId: string): Project[] {
  try {
    const raw = localStorage.getItem(projectsKey(verticalId));
    if (!raw) return [];
    return JSON.parse(raw) as Project[];
  } catch {
    return [];
  }
}

function saveProjects(verticalId: string, projects: Project[]): void {
  try {
    localStorage.setItem(projectsKey(verticalId), JSON.stringify(projects));
  } catch {
  }
}

export function readProjects(verticalId: string): Project[] {
  return loadProjects(verticalId);
}

export function writeProject(verticalId: string, project: Project): void {
  const all = loadProjects(verticalId);
  const idx = all.findIndex((p) => p.id === project.id);
  if (idx >= 0) {
    all[idx] = project;
  } else {
    all.unshift(project);
  }
  saveProjects(verticalId, all);
}

export function getFirstUnpaidStage(project: Project): ProjectStage | null {
  return project.stages.find((s) => !s.paidAt) ?? null;
}

export function isProjectComplete(project: Project): boolean {
  return project.stages.every((s) => !!s.paidAt);
}

export function calcProjectPaidCents(project: Project): number {
  return project.stages.reduce((s, st) => s + (st.paidAt ? st.allocationCents : 0), 0);
}
