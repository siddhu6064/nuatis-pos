import type { Service } from "@/lib/services";
import { formatPrice, formatDuration } from "@/lib/services";

interface ServiceTileProps {
  service: Service;
  color: string;
  onTap: (service: Service) => void;
}

export function ServiceTile({ service, color, onTap }: ServiceTileProps) {
  return (
    <button
      onClick={() => onTap(service)}
      style={{ backgroundColor: color }}
      className="
        relative flex flex-col justify-between
        min-h-[140px] w-full
        rounded-2xl p-4
        text-left cursor-pointer
        select-none
        transition-transform duration-100
        active:scale-[0.97]
        shadow-sm hover:shadow-md
        border border-black/5
      "
    >
      {service.isProject && (
        <span
          className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded"
          style={{
            fontFamily: "'Epilogue', sans-serif",
            backgroundColor: "#C4A882",
            color: "#4A3120",
            letterSpacing: "0.04em",
          }}
        >
          PROJECT
        </span>
      )}
      <span
        className="text-[18px] font-semibold leading-tight text-gray-900"
        style={{ fontFamily: "'Epilogue', sans-serif" }}
      >
        {service.name}
      </span>
      <div className="flex flex-col gap-0.5">
        <span
          className="text-[22px] font-bold text-gray-900 leading-none"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          {formatPrice(service.priceCents)}
        </span>
        <span
          className="text-[12px] font-medium text-gray-500 leading-none"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {formatDuration(service.durationMinutes)}
        </span>
      </div>
    </button>
  );
}
