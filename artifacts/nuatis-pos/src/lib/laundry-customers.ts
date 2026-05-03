import type { Customer } from "@/lib/customers";

const _LAUNDRY_CUSTOMERS: Customer[] = [
  {
    id: "lau_cust_001",
    firstName: "Marcus",
    lastName: "Webb",
    phone: "5125557100",
    lastVisit: "Apr 30",
  },
  {
    id: "lau_cust_002",
    firstName: "Diana",
    lastName: "Osei",
    phone: "5125557200",
    lastVisit: "Apr 25",
  },
  {
    id: "lau_cust_003",
    firstName: "Tomás",
    lastName: "Reyes",
    phone: "5125557300",
    lastVisit: "May 1",
  },
  {
    id: "lau_cust_004",
    firstName: "Priya",
    lastName: "Nair",
    phone: "5125557400",
    lastVisit: "Apr 18",
  },
];

export const LAUNDRY_CUSTOMERS: Customer[] = _LAUNDRY_CUSTOMERS;

export function addLaundryCustomerInMemory(c: Customer): void {
  _LAUNDRY_CUSTOMERS.push(c);
}
