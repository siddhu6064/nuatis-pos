export interface PetVaccination {
  expiresAt: number; // epoch ms
}

export interface Pet {
  petName: string;
  species: "dog" | "cat" | "other";
  breed: string;
  vaccinations: {
    rabies?: PetVaccination;
    bordetella?: PetVaccination;
  };
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  phone: string; // digits only, e.g. "5125550142"
  lastVisit: string;
  pet?: Pet; // present on pet_grooming customers; absent on all other verticals
}

export type CartCustomer = Pick<
  Customer,
  "id" | "firstName" | "lastName" | "phone"
>;

export let CUSTOMERS: Customer[] = [
  {
    id: "cust_1",
    firstName: "Sarah",
    lastName: "Chen",
    phone: "5125550142",
    lastVisit: "Apr 12, 2026",
  },
  {
    id: "cust_2",
    firstName: "Marcus",
    lastName: "Rodriguez",
    phone: "5125550177",
    lastVisit: "Mar 28, 2026",
  },
  {
    id: "cust_3",
    firstName: "Priya",
    lastName: "Patel",
    phone: "5125550118",
    lastVisit: "Apr 22, 2026",
  },
  {
    id: "cust_4",
    firstName: "David",
    lastName: "Kim",
    phone: "5125550193",
    lastVisit: "Feb 15, 2026",
  },
  {
    id: "cust_5",
    firstName: "Emma",
    lastName: "Thompson",
    phone: "5125550156",
    lastVisit: "Apr 30, 2026",
  },
  {
    id: "cust_6",
    firstName: "Jordan",
    lastName: "Williams",
    phone: "5125550124",
    lastVisit: "Mar 05, 2026",
  },
];

export function addCustomerInMemory(customer: Customer): void {
  CUSTOMERS = [...CUSTOMERS, customer];
}
