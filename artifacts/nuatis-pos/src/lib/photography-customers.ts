import type { CartCustomer } from "@/hooks/useCart";

export const PHOTOGRAPHY_CUSTOMERS: CartCustomer[] = [
  { id: "photo_client_1", firstName: "Sophia",  lastName: "Harrington", phone: "(512) 555-1001" },
  { id: "photo_client_2", firstName: "Marcus",  lastName: "Bellamy",    phone: "(512) 555-1002" },
  { id: "photo_client_3", firstName: "Elena",   lastName: "Voss",       phone: "(512) 555-1003" },
  { id: "photo_client_4", firstName: "James",   lastName: "Whitfield",  phone: "(512) 555-1004" },
];

let _clients = [...PHOTOGRAPHY_CUSTOMERS];

export function addPhotographyCustomerInMemory(c: CartCustomer): void {
  _clients = [c, ..._clients];
}

export function getPhotographyCustomers(): CartCustomer[] {
  return _clients;
}
