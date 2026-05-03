import type { Customer } from "@/lib/customers";

export const YOGA_CUSTOMERS: Customer[] = [
  { id: "yoga_cust_001", firstName: "Amara", lastName: "Singh", phone: "5125558100", lastVisit: "May 1" },
  { id: "yoga_cust_002", firstName: "Carlos", lastName: "Mendez", phone: "5125558200", lastVisit: "Apr 29" },
  { id: "yoga_cust_003", firstName: "Yuki", lastName: "Tanaka", phone: "5125558300", lastVisit: "Apr 30" },
  { id: "yoga_cust_004", firstName: "Nia", lastName: "Okafor", phone: "5125558400", lastVisit: "May 2" },
];

export function addYogaCustomerInMemory(c: Customer): void {
  YOGA_CUSTOMERS.push(c);
}
