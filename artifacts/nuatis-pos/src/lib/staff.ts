export interface Staff {
  id: string;
  firstName: string;
  role: string;
}

export const STAFF: Staff[] = [
  { id: "staff_1", firstName: "Maria", role: "Stylist" },
  { id: "staff_2", firstName: "James", role: "Colorist" },
  { id: "staff_3", firstName: "Lisa", role: "Stylist" },
];
