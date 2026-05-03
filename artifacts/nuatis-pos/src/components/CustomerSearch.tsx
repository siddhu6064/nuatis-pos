import { useState, useEffect, useRef } from "react";
import {
  CUSTOMERS,
  addCustomerInMemory,
  type Customer,
  type CartCustomer,
  type Pet,
} from "@/lib/customers";
import {
  PET_GROOMING_CUSTOMERS,
  addPetCustomerInMemory,
  type PetCustomer,
} from "@/lib/pet-grooming-customers";
import {
  TANNING_CUSTOMERS,
  addTanningCustomerInMemory,
} from "@/lib/tanning-customers";
import {
  LAUNDRY_CUSTOMERS,
  addLaundryCustomerInMemory,
} from "@/lib/laundry-customers";
import { normalizePhone, formatPhone } from "@/lib/phone";
import { getVaccinationStatus } from "@/lib/vaccinations";

interface CustomerSearchProps {
  onAttach: (customer: CartCustomer) => void;
  onClose: () => void;
  verticalId?: string;
}

function isPhoneQuery(query: string): boolean {
  return /^[\d\s\-()+.]+$/.test(query) && normalizePhone(query).length > 0;
}

// ── Standard create form (non-pet-grooming) ────────────────────────────────

interface CreateFormProps {
  prefillPhone: string;
  onSave: (customer: Customer) => void;
  onCancel: () => void;
}

function CreateForm({ prefillPhone, onSave, onCancel }: CreateFormProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState(prefillPhone);

  const phoneDigits = normalizePhone(phone);
  const canSave = firstName.trim().length > 0 && phoneDigits.length === 10;

  return (
    <div
      className="mt-3 p-3 rounded-xl border"
      style={{ borderColor: "#E5E7EB", backgroundColor: "#F9FAFB" }}
    >
      <p
        className="text-[13px] font-semibold text-gray-700 mb-2"
        style={{ fontFamily: "'Epilogue', sans-serif" }}
      >
        New Customer
      </p>
      <div className="flex flex-col gap-2">
        <input
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="First name *"
          className="w-full h-[40px] px-3 text-[14px] rounded-lg border outline-none"
          style={{ fontFamily: "'Epilogue', sans-serif", borderColor: "#D1D5DB", backgroundColor: "white" }}
          autoFocus
        />
        <input
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Last name"
          className="w-full h-[40px] px-3 text-[14px] rounded-lg border outline-none"
          style={{ fontFamily: "'Epilogue', sans-serif", borderColor: "#D1D5DB", backgroundColor: "white" }}
        />
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone (10 digits)"
          className="w-full h-[40px] px-3 text-[14px] rounded-lg border outline-none"
          style={{ fontFamily: "'JetBrains Mono', monospace", borderColor: "#D1D5DB", backgroundColor: "white" }}
        />
        <div className="flex gap-2 mt-1">
          <button
            onClick={onCancel}
            className="flex-1 h-[38px] rounded-lg text-[13px] font-medium text-gray-600"
            style={{ fontFamily: "'Epilogue', sans-serif", backgroundColor: "#F3F4F6" }}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (!canSave) return;
              const newCustomer: Customer = {
                id: crypto.randomUUID(),
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                phone: phoneDigits,
                lastVisit: "—",
              };
              onSave(newCustomer);
            }}
            disabled={!canSave}
            className="flex-1 h-[38px] rounded-lg text-[13px] font-semibold text-white"
            style={{
              fontFamily: "'Epilogue', sans-serif",
              backgroundColor: canSave ? "#E84A00" : "#D1D5DB",
              cursor: canSave ? "pointer" : "not-allowed",
            }}
          >
            Save & Attach
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Pet grooming create form ────────────────────────────────────────────────

interface PetGroomingCreateFormProps {
  prefillPhone: string;
  onSave: (customer: PetCustomer) => void;
  onCancel: () => void;
}

function PetGroomingCreateForm({ prefillPhone, onSave, onCancel }: PetGroomingCreateFormProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState(prefillPhone);
  const [petName, setPetName] = useState("");
  const [species, setSpecies] = useState<"dog" | "cat" | "other">("dog");
  const [breed, setBreed] = useState("");
  const [rabiesExp, setRabiesExp] = useState("");
  const [bordetellaExp, setBordetellaExp] = useState("");

  const phoneDigits = normalizePhone(phone);
  const canSave = firstName.trim().length > 0 && phoneDigits.length === 10 && petName.trim().length > 0;

  function parseLocalDateToMs(dateStr: string): number | undefined {
    if (!dateStr) return undefined;
    const d = new Date(dateStr + "T00:00:00");
    return isNaN(d.getTime()) ? undefined : d.getTime();
  }

  const speciesOptions: Array<{ value: "dog" | "cat" | "other"; label: string }> = [
    { value: "dog", label: "Dog" },
    { value: "cat", label: "Cat" },
    { value: "other", label: "Other" },
  ];

  const fieldStyle = { fontFamily: "'Epilogue', sans-serif", borderColor: "#D1D5DB", backgroundColor: "white" };

  return (
    <div
      className="mt-3 p-3 rounded-xl border"
      style={{ borderColor: "#D1FAE5", backgroundColor: "#F0FDF4" }}
    >
      <p className="text-[13px] font-semibold text-gray-700 mb-2" style={{ fontFamily: "'Epilogue', sans-serif" }}>
        New Pet Grooming Customer
      </p>
      <div className="flex flex-col gap-2">
        <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)}
          placeholder="Owner first name *" className="w-full h-[40px] px-3 text-[14px] rounded-lg border outline-none"
          style={fieldStyle} autoFocus />
        <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)}
          placeholder="Owner last name" className="w-full h-[40px] px-3 text-[14px] rounded-lg border outline-none"
          style={fieldStyle} />
        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone (10 digits)" className="w-full h-[40px] px-3 text-[14px] rounded-lg border outline-none"
          style={{ ...fieldStyle, fontFamily: "'JetBrains Mono', monospace" }} />
        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mt-1"
          style={{ fontFamily: "'Epilogue', sans-serif" }}>Pet Info</p>
        <input type="text" value={petName} onChange={(e) => setPetName(e.target.value)}
          placeholder="Pet name *" className="w-full h-[40px] px-3 text-[14px] rounded-lg border outline-none"
          style={fieldStyle} />
        <div className="flex gap-1.5">
          {speciesOptions.map((opt) => (
            <button key={opt.value} type="button" onClick={() => setSpecies(opt.value)}
              className="flex-1 h-[36px] rounded-lg text-[13px] font-medium transition-all duration-100"
              style={{
                fontFamily: "'Epilogue', sans-serif",
                backgroundColor: species === opt.value ? "#D1FAE5" : "#F3F4F6",
                color: species === opt.value ? "#065F46" : "#374151",
                border: species === opt.value ? "1.5px solid #059669" : "1.5px solid transparent",
              }}>
              {opt.label}
            </button>
          ))}
        </div>
        <input type="text" value={breed} onChange={(e) => setBreed(e.target.value)}
          placeholder="Breed (optional)" className="w-full h-[40px] px-3 text-[14px] rounded-lg border outline-none"
          style={fieldStyle} />
        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mt-1"
          style={{ fontFamily: "'Epilogue', sans-serif" }}>Vaccination Records</p>
        <div>
          <label className="text-[12px] text-gray-500 mb-0.5 block" style={{ fontFamily: "'Epilogue', sans-serif" }}>Rabies expiry</label>
          <input type="date" value={rabiesExp} onChange={(e) => setRabiesExp(e.target.value)}
            className="w-full h-[40px] px-3 text-[14px] rounded-lg border outline-none" style={fieldStyle} />
        </div>
        <div>
          <label className="text-[12px] text-gray-500 mb-0.5 block" style={{ fontFamily: "'Epilogue', sans-serif" }}>Bordetella expiry</label>
          <input type="date" value={bordetellaExp} onChange={(e) => setBordetellaExp(e.target.value)}
            className="w-full h-[40px] px-3 text-[14px] rounded-lg border outline-none" style={fieldStyle} />
        </div>
        <div className="flex gap-2 mt-1">
          <button onClick={onCancel} className="flex-1 h-[38px] rounded-lg text-[13px] font-medium text-gray-600"
            style={{ fontFamily: "'Epilogue', sans-serif", backgroundColor: "#F3F4F6" }}>Cancel</button>
          <button
            onClick={() => {
              if (!canSave) return;
              const rabiesMs = parseLocalDateToMs(rabiesExp);
              const bordetellaMs = parseLocalDateToMs(bordetellaExp);
              const newCustomer: PetCustomer = {
                id: crypto.randomUUID(),
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                phone: phoneDigits,
                lastVisit: "—",
                pet: {
                  petName: petName.trim(),
                  species,
                  breed: breed.trim(),
                  vaccinations: {
                    ...(rabiesMs !== undefined ? { rabies: { expiresAt: rabiesMs } } : {}),
                    ...(bordetellaMs !== undefined ? { bordetella: { expiresAt: bordetellaMs } } : {}),
                  },
                },
              };
              onSave(newCustomer);
            }}
            disabled={!canSave}
            className="flex-1 h-[38px] rounded-lg text-[13px] font-semibold text-white"
            style={{
              fontFamily: "'Epilogue', sans-serif",
              backgroundColor: canSave ? "#059669" : "#D1D5DB",
              cursor: canSave ? "pointer" : "not-allowed",
            }}>
            Save & Attach
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Pet info read-only card ─────────────────────────────────────────────────

function vaccStatus(expiresAt: number | undefined, nowMs: number): string {
  if (expiresAt === undefined) return "missing";
  return getVaccinationStatus({ expiresAt }, nowMs);
}

const VACC_COLOR: Record<string, string> = {
  valid: "#16A34A", expiring_soon: "#D97706", expired: "#DC2626", missing: "#9CA3AF",
};
const VACC_LABEL_COLOR: Record<string, string> = {
  valid: "#DCFCE7", expiring_soon: "#FEF3C7", expired: "#FEE2E2", missing: "#F3F4F6",
};
const VACC_ICON: Record<string, string> = {
  valid: "✓", expiring_soon: "⚠", expired: "✕", missing: "—",
};

function PetInfoCard({ pet }: { pet: Pet }) {
  const nowMs = Date.now();
  const rabiesStatus = vaccStatus(pet.vaccinations.rabies?.expiresAt, nowMs);
  const bordetellaStatus = vaccStatus(pet.vaccinations.bordetella?.expiresAt, nowMs);

  function fmtExpiry(expiresAt: number | undefined): string {
    if (!expiresAt) return "—";
    return new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(new Date(expiresAt));
  }

  const speciesEmoji = pet.species === "dog" ? "🐕" : pet.species === "cat" ? "🐈" : "🐾";

  return (
    <div className="mt-2 p-3 rounded-xl" style={{ backgroundColor: "#F0FDF4", border: "1.5px solid #BBF7D0" }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[18px]">{speciesEmoji}</span>
        <div>
          <p className="text-[14px] font-semibold text-gray-800" style={{ fontFamily: "'Epilogue', sans-serif" }}>
            {pet.petName}
          </p>
          {pet.breed && (
            <p className="text-[12px] text-gray-400" style={{ fontFamily: "'Epilogue', sans-serif" }}>{pet.breed}</p>
          )}
        </div>
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {(["rabies", "bordetella"] as const).map((vacc) => {
          const status = vacc === "rabies" ? rabiesStatus : bordetellaStatus;
          const expiry = vacc === "rabies" ? pet.vaccinations.rabies?.expiresAt : pet.vaccinations.bordetella?.expiresAt;
          return (
            <div key={vacc} className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ backgroundColor: VACC_LABEL_COLOR[status] }}>
              <span className="text-[11px] font-bold" style={{ color: VACC_COLOR[status] }}>{VACC_ICON[status]}</span>
              <span className="text-[11px] font-medium" style={{ fontFamily: "'Epilogue', sans-serif", color: VACC_COLOR[status] }}>
                {vacc === "rabies" ? "Rabies" : "Bordetella"}{expiry ? ` · ${fmtExpiry(expiry)}` : ""}
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-gray-400 mt-2" style={{ fontFamily: "'Epilogue', sans-serif" }}>
        (edit records in Settings)
      </p>
    </div>
  );
}

// ── Main CustomerSearch component ──────────────────────────────────────────

export function CustomerSearch({ onAttach, onClose, verticalId }: CustomerSearchProps) {
  const isPetGrooming = verticalId === "pet_grooming";
  const isTanning = verticalId === "tanning";
  const isLaundry = verticalId === "laundry";

  const [query, setQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedPetCustomerId, setSelectedPetCustomerId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Route customer source by vertical
  const customerSource: Customer[] = isPetGrooming
    ? PET_GROOMING_CUSTOMERS
    : isTanning
      ? TANNING_CUSTOMERS
      : isLaundry
        ? LAUNDRY_CUSTOMERS
        : CUSTOMERS;

  const normalizedQ = normalizePhone(query);
  const phoneMode = isPhoneQuery(query);

  const filtered =
    query.trim() === ""
      ? customerSource
      : phoneMode
        ? customerSource.filter((c) => c.phone.startsWith(normalizedQ))
        : customerSource.filter((c) =>
            `${c.firstName} ${c.lastName}`.toLowerCase().includes(query.toLowerCase()),
          );

  const showCreateForm =
    !showCreate && phoneMode && normalizedQ.length >= 10 && filtered.length === 0;

  function handleAttachDirect(c: Customer) {
    onAttach({ id: c.id, firstName: c.firstName, lastName: c.lastName, phone: c.phone });
    onClose();
  }

  const selectedPetCustomer = isPetGrooming
    ? (PET_GROOMING_CUSTOMERS.find((c) => c.id === selectedPetCustomerId) ?? null)
    : null;

  // Badge label for non-standard verticals
  const verticalBadgeLabel = isPetGrooming
    ? "Pet Grooming"
    : isTanning
      ? "Tanning"
      : isLaundry
        ? "Laundry"
        : null;
  const verticalBadgeStyle = isPetGrooming
    ? { backgroundColor: "#D1FAE5", color: "#065F46" }
    : isTanning
      ? { backgroundColor: "#FEF3C7", color: "#92400E" }
      : isLaundry
        ? { backgroundColor: "#DBEAFE", color: "#1E40AF" }
        : {};

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl shadow-xl w-[440px] max-h-[85vh] flex flex-col"
        style={{ backgroundColor: "white" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b" style={{ borderColor: "#E5E7EB" }}>
          <p className="text-[18px] font-bold text-gray-900 mb-3" style={{ fontFamily: "'Epilogue', sans-serif" }}>
            Attach Customer
            {verticalBadgeLabel && (
              <span
                className="ml-2 text-[12px] font-semibold px-1.5 py-0.5 rounded"
                style={{ fontFamily: "'Epilogue', sans-serif", ...verticalBadgeStyle }}
              >
                {verticalBadgeLabel}
              </span>
            )}
          </p>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowCreate(false);
              setSelectedPetCustomerId(null);
            }}
            placeholder={isPetGrooming ? "Owner phone or name" : "Phone or name"}
            className="w-full h-[44px] px-3 text-[15px] rounded-xl border outline-none"
            style={{ fontFamily: "'Epilogue', sans-serif", borderColor: "#D1D5DB", backgroundColor: "#F9FAFB" }}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {filtered.map((c) => {
            const isSelected = isPetGrooming && c.id === selectedPetCustomerId;
            const petCustomer = isPetGrooming ? (c as PetCustomer) : null;

            return (
              <div key={c.id}>
                <button
                  onClick={() => {
                    if (isPetGrooming) {
                      setSelectedPetCustomerId(isSelected ? null : c.id);
                    } else {
                      handleAttachDirect(c);
                    }
                  }}
                  className="w-full px-3 py-3 rounded-xl text-left transition-colors duration-100"
                  style={{ backgroundColor: isSelected ? "#F0FDF4" : undefined }}
                >
                  <p className="text-[15px] font-medium text-gray-900" style={{ fontFamily: "'Epilogue', sans-serif" }}>
                    {c.firstName} {c.lastName}
                    {isPetGrooming && petCustomer?.pet && (
                      <span className="ml-1.5 text-[13px] font-normal text-gray-500" style={{ fontFamily: "'Epilogue', sans-serif" }}>
                        · {petCustomer.pet.petName}
                      </span>
                    )}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[13px] text-gray-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {formatPhone(c.phone)}
                    </span>
                    {c.lastVisit !== "—" && (
                      <span className="text-[12px] text-gray-400" style={{ fontFamily: "'Epilogue', sans-serif" }}>
                        Last: {c.lastVisit}
                      </span>
                    )}
                  </div>
                </button>

                {/* Pet info card + attach button (pet grooming only) */}
                {isSelected && petCustomer?.pet && (
                  <div className="px-3 pb-2">
                    <PetInfoCard pet={petCustomer.pet} />
                    <button
                      onClick={() => handleAttachDirect(c)}
                      className="mt-2 w-full h-[40px] rounded-xl text-[14px] font-semibold text-white transition-all duration-100 active:scale-[0.98]"
                      style={{ fontFamily: "'Epilogue', sans-serif", backgroundColor: "#059669" }}
                    >
                      Attach {petCustomer.pet.petName}&apos;s owner
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {query.trim() === "" && (
            <button
              onClick={() => setShowCreate(true)}
              className="w-full px-3 py-3 rounded-xl text-left hover:bg-gray-50 transition-colors"
            >
              <p
                className="text-[14px] font-medium"
                style={{
                  color: isPetGrooming ? "#059669" : isTanning ? "#B45309" : "#E84A00",
                  fontFamily: "'Epilogue', sans-serif",
                }}
              >
                + New {isPetGrooming ? "Pet Grooming " : ""}Customer
              </p>
            </button>
          )}

          {/* Auto-create on phone match failure */}
          {showCreateForm && !isPetGrooming && (
            <CreateForm
              prefillPhone={normalizedQ}
              onSave={(c) => {
                if (isTanning) addTanningCustomerInMemory(c);
                else if (isLaundry) addLaundryCustomerInMemory(c);
                else addCustomerInMemory(c);
                handleAttachDirect(c);
              }}
              onCancel={() => setShowCreate(false)}
            />
          )}
          {showCreateForm && isPetGrooming && (
            <PetGroomingCreateForm
              prefillPhone={normalizedQ}
              onSave={(c) => { addPetCustomerInMemory(c); handleAttachDirect(c); }}
              onCancel={() => setShowCreate(false)}
            />
          )}

          {/* Manual create form */}
          {showCreate && !isPetGrooming && (
            <CreateForm
              prefillPhone=""
              onSave={(c) => {
                if (isTanning) addTanningCustomerInMemory(c);
                else if (isLaundry) addLaundryCustomerInMemory(c);
                else addCustomerInMemory(c);
                handleAttachDirect(c);
              }}
              onCancel={() => setShowCreate(false)}
            />
          )}
          {showCreate && isPetGrooming && (
            <PetGroomingCreateForm
              prefillPhone=""
              onSave={(c) => { addPetCustomerInMemory(c); handleAttachDirect(c); }}
              onCancel={() => setShowCreate(false)}
            />
          )}

          {!showCreateForm && !showCreate && filtered.length === 0 && query.trim() !== "" && (
            <p className="text-center text-[14px] text-gray-400 py-6" style={{ fontFamily: "'Epilogue', sans-serif" }}>
              No customers found
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
