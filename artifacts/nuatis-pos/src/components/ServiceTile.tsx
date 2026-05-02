import type { Service } from "@/lib/services";
import { CATEGORY_COLORS, formatPrice, formatDuration } from "@/lib/services";

interface ServiceTileProps {
  service: Service;
  onTap: (service: Service) => void;
}

export function ServiceTile({ service, onTap }: ServiceTileProps) {
  const bgColor = CATEGORY_COLORS[service.category];

  return (
    <button
      onClick={() => onTap(service)}
      style={{ backgroundColor: bgColor }}
      className="
        flex flex-col justify-between
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
