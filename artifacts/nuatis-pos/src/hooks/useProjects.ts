import { useState, useCallback } from "react";
import {
  readProjects,
  writeProject,
  buildDefaultProject,
  getFirstUnpaidStage,
  isProjectComplete,
  calcProjectPaidCents,
  type Project,
  type ProjectStage,
} from "@/lib/projects";
import { useActiveVertical } from "@/hooks/useActiveVertical";

export type { Project, ProjectStage };

export function useProjects() {
  const { activeVerticalId } = useActiveVertical();

  const [projects, setProjects] = useState<Project[]>(() =>
    readProjects(activeVerticalId),
  );

  const refresh = useCallback(() => {
    setProjects(readProjects(activeVerticalId));
  }, [activeVerticalId]);

  const createProject = useCallback(
    (
      serviceId: string,
      serviceName: string,
      customerId: string,
      customerName: string,
      totalCents: number,
    ): Project => {
      const project = buildDefaultProject({
        verticalId: activeVerticalId,
        customerId,
        customerName,
        serviceId,
        serviceName,
        totalCents,
      });
      writeProject(activeVerticalId, project);
      setProjects((prev) => [project, ...prev]);
      return project;
    },
    [activeVerticalId],
  );

  const markStagePaid = useCallback(
    (projectId: string, stageId: string, transactionId: string): void => {
      setProjects((prev) => {
        const updated = prev.map((p) => {
          if (p.id !== projectId) return p;
          const stages = p.stages.map((s) => {
            if (s.id !== stageId) return s;
            return { ...s, transactionId, paidAt: Date.now() };
          });
          const complete = stages.every((s) => !!s.paidAt);
          const next: Project = {
            ...p,
            stages,
            ...(complete ? { completedAt: Date.now() } : {}),
          };
          writeProject(activeVerticalId, next);
          return next;
        });
        return updated;
      });
    },
    [activeVerticalId],
  );

  // Count of projects with at least one unpaid stage
  const activeProjectCount = projects.filter(
    (p) => !isProjectComplete(p),
  ).length;

  return {
    projects,
    activeProjectCount,
    refresh,
    createProject,
    markStagePaid,
    getFirstUnpaidStage,
    isProjectComplete,
    calcProjectPaidCents,
  };
}
