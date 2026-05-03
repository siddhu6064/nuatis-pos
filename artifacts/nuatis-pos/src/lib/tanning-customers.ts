import type { Customer } from "@/lib/customers";

// Mutable in-memory array for new tanning customer creation this session
const _TANNING_CUSTOMERS: Customer[] = [
  {
    id: "tan-cust-1",
    firstName: "Jordan",
    lastName: "Reyes",
    phone: "5125550601",
    lastVisit: "Apr 28",
  },
  {
    id: "tan-cust-2",
    firstName: "Morgan",
    lastName: "Kim",
    phone: "5125550602",
    lastVisit: "Apr 15",
  },
  {
    id: "tan-cust-3",
    firstName: "Casey",
    lastName: "Nguyen",
    phone: "5125550603",
    lastVisit: "Mar 30",
  },
  {
    id: "tan-cust-4",
    firstName: "Taylor",
    lastName: "Brooks",
    phone: "5125550604",
    lastVisit: "—",
  },
];

export const TANNING_CUSTOMERS: Customer[] = _TANNING_CUSTOMERS;

export function addTanningCustomerInMemory(c: Customer): void {
  _TANNING_CUSTOMERS.push(c);
}
