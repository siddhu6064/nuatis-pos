import { useState, useEffect, useRef } from "react";
import { useActiveVertical } from "@/hooks/useActiveVertical";
import { normalizePhone } from "@/lib/phone";
import type { WaitlistEntry } from "@/lib/waitlist";

type SubmitData = Omit<WaitlistEntry, "id" | "addedAt">;

interface AddWalkInModalProps {
  onSubmit: (data: SubmitData) => void;
  onCancel: () => void;
}

export function AddWalkInModal({ onSubmit, onCancel }: AddWalkInModalProps) {
  const { config } = useActiveVertical();
  const [name, setName] = useState("");
  const [phoneRaw, setPhoneRaw] = useState("");
  const [serviceId, setServiceId] = useState<string>("");
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const canSubmit = name.trim().length > 0;
  const phoneDigits = normalizePhone(phoneRaw);

  function handleSubmit() {
    if (!canSubmit) return;
    const selected = serviceId
      ? config.services.find((s) => s.id === serviceId) ?? null
      : null;
    onSubmit({
      name: name.trim(),
      phone: phoneDigits,
      serviceId: selected?.id ?? null,
      serviceName: selected?.name ?? null,
      servicePriceCents: selected?.priceCents ?? null,
    });
  }

  function handlePhoneInput(val: string) {
    setPhoneRaw(normalizePhone(val));
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      style={{ backgroundColor: "rgba(15,15,16,0.6)" }}
      onClick={onCancel}
    >
      <div
        className="rounded-2xl shadow-xl w-[400px] flex flex-col"
        style={{ backgroundColor: "white" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
          style={{ borderColor: "#E5E7EB" }}
        >
          <p
            className="text-[18px] font-bold text-gray-900"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            Add Walk-in
          </p>
          <button
            onClick={onCancel}
            className="text-[18px] text-gray-400 hover:text-gray-700 transition-colors leading-none"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <div className="p-5 flex flex-col gap-3">
          {/* Name */}
          <div>
            <label
              className="block text-[12px] font-semibold text-gray-500 mb-1"
              style={{ fontFamily: "'Epilogue', sans-serif" }}
            >
              Name <span style={{ color: "#E84A00" }}>*</span>
            </label>
            <input
              ref={nameRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canSubmit) handleSubmit();
              }}
              placeholder="Walk-in name"
              className="w-full h-[44px] px-3 text-[14px] rounded-xl border outline-none"
              style={{
                fontFamily: "'Epilogue', sans-serif",
                borderColor: "#D1D5DB",
                backgroundColor: "white",
              }}
            />
          </div>

          {/* Phone */}
          <div>
            <label
              className="block text-[12px] font-semibold text-gray-500 mb-1"
              style={{ fontFamily: "'Epilogue', sans-serif" }}
            >
              Phone{" "}
              <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <input
              type="tel"
              value={phoneRaw}
              onChange={(e) => handlePhoneInput(e.target.value)}
              placeholder="10 digits"
              maxLength={10}
              className="w-full h-[44px] px-3 text-[14px] rounded-xl border outline-none"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                borderColor: "#D1D5DB",
                backgroundColor: "white",
              }}
            />
          </div>

          {/* Service */}
          <div>
            <label
              className="block text-[12px] font-semibold text-gray-500 mb-1"
              style={{ fontFamily: "'Epilogue', sans-serif" }}
            >
              Service{" "}
              <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <select
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="w-full h-[44px] px-3 text-[14px] rounded-xl border outline-none appearance-none"
              style={{
                fontFamily: "'Epilogue', sans-serif",
                borderColor: "#D1D5DB",
                backgroundColor: "white",
                cursor: "pointer",
              }}
            >
              <option value="">No service yet</option>
              {config.services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center gap-3 px-5 pb-5"
        >
          <button
            onClick={onCancel}
            className="flex-1 h-[44px] rounded-xl text-[14px] font-medium text-gray-700 transition-colors"
            style={{
              fontFamily: "'Epilogue', sans-serif",
              backgroundColor: "#F3F4F6",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-1 h-[44px] rounded-xl text-[14px] font-semibold text-white transition-opacity"
            style={{
              fontFamily: "'Epilogue', sans-serif",
              backgroundColor: canSubmit ? "#E84A00" : "#D1D5DB",
              cursor: canSubmit ? "pointer" : "not-allowed",
            }}
          >
            Add to Waitlist
          </button>
        </div>
      </div>
    </div>
  );
}
