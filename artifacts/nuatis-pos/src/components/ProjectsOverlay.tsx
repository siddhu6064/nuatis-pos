import { useState } from "react";
import { formatCurrency } from "@/lib/currency";
import {
  getFirstUnpaidStage,
  isProjectComplete,
  calcProjectPaidCents,
  type Project,
  type ProjectStage,
} from "@/lib/projects";

interface ProjectsOverlayProps {
  projects: Project[];
  onChargeStage: (project: Project, stage: ProjectStage) => void;
  onClose: () => void;
}

function StageBadge({ stage, isCurrent }: { stage: ProjectStage; isCurrent: boolean }) {
  const paid = !!stage.paidAt;
  return (
    <span
      className="inline-flex items-center h-[20px] px-2 rounded-full text-[10px] font-bold"
      style={{
        fontFamily: "'Epilogue', sans-serif",
        backgroundColor: paid ? "#DCFCE7" : isCurrent ? "#F5ECD7" : "#F3F4F6",
        color: paid ? "#15803D" : isCurrent ? "#4A3120" : "#9CA3AF",
        border: isCurrent && !paid ? "1.5px solid #C4A882" : "1.5px solid transparent",
      }}
    >
      {paid ? "✓" : isCurrent ? "→" : "·"} {stage.label}
    </span>
  );
}

function ProjectRow({
  project,
  onChargeStage,
}: {
  project: Project;
  onChargeStage: (project: Project, stage: ProjectStage) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const complete = isProjectComplete(project);
  const paidCents = calcProjectPaidCents(project);
  const nextStage = getFirstUnpaidStage(project);

  const createdAt = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(project.createdAt));

  return (
    <div
      className="rounded-2xl overflow-hidden border"
      style={{
        borderColor: complete ? "#BBF7D0" : "#EDE3D0",
        backgroundColor: complete ? "#F0FDF4" : "#FAF6F0",
      }}
    >
      <button
        className="w-full text-left px-4 py-3 flex items-start justify-between gap-3"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span
              className="text-[15px] font-bold text-gray-900 truncate"
              style={{ fontFamily: "'Epilogue', sans-serif" }}
            >
              {project.customerName}
            </span>
            {complete && (
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                style={{
                  fontFamily: "'Epilogue', sans-serif",
                  backgroundColor: "#DCFCE7",
                  color: "#15803D",
                }}
              >
                COMPLETE
              </span>
            )}
          </div>
          <p
            className="text-[13px] text-gray-600 truncate"
            style={{ fontFamily: "'Epilogue', sans-serif" }}
          >
            {project.serviceName}
          </p>
          <p
            className="text-[11px] text-gray-400 mt-0.5"
            style={{ fontFamily: "'Epilogue', sans-serif" }}
          >
            Created {createdAt}
          </p>
        </div>
        <div className="flex flex-col items-end flex-shrink-0">
          <span
            className="text-[16px] font-bold tabular-nums"
            style={{ fontFamily: "'JetBrains Mono', monospace", color: "#4A3120" }}
          >
            {formatCurrency(project.totalCents)}
          </span>
          <span
            className="text-[12px] tabular-nums"
            style={{ fontFamily: "'JetBrains Mono', monospace", color: "#9B7F5E" }}
          >
            {formatCurrency(paidCents)} paid
          </span>
          <span
            className="text-[12px] mt-1"
            style={{ fontFamily: "'Epilogue', sans-serif", color: "#9CA3AF" }}
          >
            {expanded ? "▲" : "▼"}
          </span>
        </div>
      </button>

      {/* Stage badges (always visible) */}
      <div className="px-4 pb-3 flex items-center gap-1.5 flex-wrap">
        {project.stages.map((stage) => (
          <StageBadge
            key={stage.id}
            stage={stage}
            isCurrent={!complete && nextStage?.id === stage.id}
          />
        ))}
      </div>

      {/* Expanded: stage detail + charge button */}
      {expanded && (
        <div
          className="border-t px-4 py-3"
          style={{ borderColor: "#EDE3D0" }}
        >
          <p
            className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-2"
            style={{ fontFamily: "'Epilogue', sans-serif" }}
          >
            Stage Detail
          </p>
          <div className="flex flex-col gap-2 mb-3">
            {project.stages.map((stage) => {
              const paid = !!stage.paidAt;
              const isCurrent = !complete && nextStage?.id === stage.id;
              const paidDate = stage.paidAt
                ? new Intl.DateTimeFormat("en-US", {
                    month: "short",
                    day: "2-digit",
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  }).format(new Date(stage.paidAt))
                : null;

              return (
                <div
                  key={stage.id}
                  className="flex items-center justify-between px-3 py-2 rounded-xl"
                  style={{
                    backgroundColor: paid ? "#F0FDF4" : isCurrent ? "#F5ECD7" : "#F3F4F6",
                    border: isCurrent ? "1.5px solid #C4A882" : "1.5px solid transparent",
                  }}
                >
                  <div>
                    <span
                      className="text-[13px] font-semibold"
                      style={{ fontFamily: "'Epilogue', sans-serif", color: paid ? "#15803D" : isCurrent ? "#4A3120" : "#6B7280" }}
                    >
                      {stage.label} · {stage.allocationPct}%
                    </span>
                    {paid && paidDate && (
                      <p
                        className="text-[11px] text-gray-400"
                        style={{ fontFamily: "'Epilogue', sans-serif" }}
                      >
                        Paid {paidDate}
                      </p>
                    )}
                  </div>
                  <span
                    className="text-[14px] font-bold tabular-nums"
                    style={{ fontFamily: "'JetBrains Mono', monospace", color: paid ? "#15803D" : "#4A3120" }}
                  >
                    {formatCurrency(stage.allocationCents)}
                  </span>
                </div>
              );
            })}
          </div>

          {!complete && nextStage && (
            <button
              onClick={() => onChargeStage(project, nextStage)}
              className="w-full h-[44px] rounded-xl text-[14px] font-bold text-white transition-all duration-100 active:scale-[0.98]"
              style={{ fontFamily: "'Epilogue', sans-serif", backgroundColor: "#9B7F5E" }}
            >
              Charge {nextStage.label} · {formatCurrency(nextStage.allocationCents)}
            </button>
          )}

          {complete && (
            <div
              className="text-center py-2 rounded-xl text-[13px] font-semibold"
              style={{
                fontFamily: "'Epilogue', sans-serif",
                backgroundColor: "#DCFCE7",
                color: "#15803D",
              }}
            >
              All stages paid — project complete
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ProjectsOverlay({ projects, onChargeStage, onClose }: ProjectsOverlayProps) {
  const active = projects.filter((p) => !isProjectComplete(p));
  const done = projects.filter((p) => isProjectComplete(p));
  const sorted = [...active, ...done];

  return (
    <div
      className="fixed inset-0 z-40 flex"
      onClick={onClose}
    >
      <div
        className="ml-auto h-full w-[560px] flex flex-col shadow-2xl"
        style={{ backgroundColor: "#F8F7F4" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-5 py-4 border-b flex items-center justify-between flex-shrink-0"
          style={{ borderColor: "#E5E7EB", backgroundColor: "#FAF6F0" }}
        >
          <div>
            <p
              className="text-[22px] font-bold text-gray-900"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              Projects
            </p>
            <p
              className="text-[13px] text-gray-500"
              style={{ fontFamily: "'Epilogue', sans-serif" }}
            >
              {active.length} active · {done.length} complete
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[16px] text-gray-400 hover:text-gray-600 transition-colors px-2 py-1 rounded-lg hover:bg-black/5"
            style={{ fontFamily: "'Epilogue', sans-serif" }}
          >
            ✕
          </button>
        </div>

        {/* Project list */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p
                className="text-[18px] text-gray-400"
                style={{ fontFamily: "'Fraunces', serif", fontStyle: "italic" }}
              >
                No projects yet
              </p>
              <p
                className="text-[13px] text-gray-400 mt-1"
                style={{ fontFamily: "'Epilogue', sans-serif" }}
              >
                Tap a project package tile to create one
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {sorted.map((project) => (
                <ProjectRow
                  key={project.id}
                  project={project}
                  onChargeStage={onChargeStage}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
