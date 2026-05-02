import { useState, useEffect, useRef } from "react";
import {
  CUSTOMERS,
  addCustomerInMemory,
  type Customer,
  type CartCustomer,
} from "@/lib/customers";
import { normalizePhone, formatPhone } from "@/lib/phone";

interface CustomerSearchProps {
  onAttach: (customer: CartCustomer) => void;
  onClose: () => void;
}

function isPhoneQuery(query: string): boolean {
  return /^[\d\s\-()+.]+$/.test(query) && normalizePhone(query).length > 0;
}

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
          style={{
            fontFamily: "'Epilogue', sans-serif",
            borderColor: "#D1D5DB",
            backgroundColor: "white",
          }}
          autoFocus
        />
        <input
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Last name"
          className="w-full h-[40px] px-3 text-[14px] rounded-lg border outline-none"
          style={{
            fontFamily: "'Epilogue', sans-serif",
            borderColor: "#D1D5DB",
            backgroundColor: "white",
          }}
        />
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone (10 digits)"
          className="w-full h-[40px] px-3 text-[14px] rounded-lg border outline-none"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            borderColor: "#D1D5DB",
            backgroundColor: "white",
          }}
        />
        <div className="flex gap-2 mt-1">
          <button
            onClick={onCancel}
            className="flex-1 h-[38px] rounded-lg text-[13px] font-medium text-gray-600"
            style={{
              fontFamily: "'Epilogue', sans-serif",
              backgroundColor: "#F3F4F6",
            }}
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
              addCustomerInMemory(newCustomer);
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

export function CustomerSearch({ onAttach, onClose }: CustomerSearchProps) {
  const [query, setQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
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

  const normalizedQ = normalizePhone(query);
  const phoneMode = isPhoneQuery(query);

  const filtered =
    query.trim() === ""
      ? CUSTOMERS
      : phoneMode
        ? CUSTOMERS.filter((c) => c.phone.startsWith(normalizedQ))
        : CUSTOMERS.filter((c) =>
            `${c.firstName} ${c.lastName}`
              .toLowerCase()
              .includes(query.toLowerCase()),
          );

  const showCreateForm =
    !showCreate &&
    phoneMode &&
    normalizedQ.length >= 10 &&
    filtered.length === 0;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl shadow-xl w-[420px] max-h-[80vh] flex flex-col"
        style={{ backgroundColor: "white" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b" style={{ borderColor: "#E5E7EB" }}>
          <p
            className="text-[18px] font-bold text-gray-900 mb-3"
            style={{ fontFamily: "'Epilogue', sans-serif" }}
          >
            Attach Customer
          </p>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowCreate(false);
            }}
            placeholder="Phone or name"
            className="w-full h-[44px] px-3 text-[15px] rounded-xl border outline-none"
            style={{
              fontFamily: "'Epilogue', sans-serif",
              borderColor: "#D1D5DB",
              backgroundColor: "#F9FAFB",
            }}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                onAttach({ id: c.id, firstName: c.firstName, lastName: c.lastName, phone: c.phone });
                onClose();
              }}
              className="w-full px-3 py-3 rounded-xl text-left hover:bg-gray-50 transition-colors duration-100"
            >
              <p
                className="text-[15px] font-medium text-gray-900"
                style={{ fontFamily: "'Epilogue', sans-serif" }}
              >
                {c.firstName} {c.lastName}
              </p>
              <div className="flex items-center gap-3 mt-0.5">
                <span
                  className="text-[13px] text-gray-400"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {formatPhone(c.phone)}
                </span>
                {c.lastVisit !== "—" && (
                  <span
                    className="text-[12px] text-gray-400"
                    style={{ fontFamily: "'Epilogue', sans-serif" }}
                  >
                    Last: {c.lastVisit}
                  </span>
                )}
              </div>
            </button>
          ))}

          {query.trim() === "" && (
            <button
              onClick={() => setShowCreate(true)}
              className="w-full px-3 py-3 rounded-xl text-left hover:bg-gray-50 transition-colors"
            >
              <p
                className="text-[14px] font-medium"
                style={{ color: "#E84A00", fontFamily: "'Epilogue', sans-serif" }}
              >
                + New Customer
              </p>
            </button>
          )}

          {showCreateForm && (
            <CreateForm
              prefillPhone={normalizedQ}
              onSave={(c) => {
                onAttach({ id: c.id, firstName: c.firstName, lastName: c.lastName, phone: c.phone });
                onClose();
              }}
              onCancel={() => setShowCreate(false)}
            />
          )}

          {showCreate && (
            <CreateForm
              prefillPhone=""
              onSave={(c) => {
                onAttach({ id: c.id, firstName: c.firstName, lastName: c.lastName, phone: c.phone });
                onClose();
              }}
              onCancel={() => setShowCreate(false)}
            />
          )}

          {!showCreateForm && !showCreate && filtered.length === 0 && query.trim() !== "" && (
            <p
              className="text-center text-[14px] text-gray-400 py-6"
              style={{ fontFamily: "'Epilogue', sans-serif" }}
            >
              No customers found
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
