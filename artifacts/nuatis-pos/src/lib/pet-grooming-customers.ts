import type { Customer, Pet } from "@/lib/customers";

export type { Pet };

export type PetCustomer = Customer & { pet: Pet };

// Compute vaccination expiries relative to module load time (epoch ms).
// This gives each browser session realistic "current" expiry dates.
const _now = Date.now();
const _day = 24 * 60 * 60 * 1000;

/**
 * 4 seed customers with deliberate vaccination mixes:
 *   1. Jamie / Biscuit  — rabies valid, bordetella valid       → CLEAR on all services
 *   2. Milo  / Luna     — rabies valid, bordetella missing     → BLOCKED on bordetella-required services
 *   3. Avery / Cheddar  — rabies expired 60 days ago          → BLOCKED on any rabies-required service
 *   4. Riley / Mochi    — rabies expiring in 14 days           → WARNING on any rabies-required service
 */
export let PET_GROOMING_CUSTOMERS: PetCustomer[] = [
  {
    id: "pet_cust_1",
    firstName: "Jamie",
    lastName: "Foster",
    phone: "5125550501",
    lastVisit: "Apr 28, 2026",
    pet: {
      petName: "Biscuit",
      species: "dog",
      breed: "Golden Retriever",
      vaccinations: {
        rabies:     { expiresAt: _now + 365 * _day },
        bordetella: { expiresAt: _now + 180 * _day },
      },
    },
  },
  {
    id: "pet_cust_2",
    firstName: "Milo",
    lastName: "Grant",
    phone: "5125550502",
    lastVisit: "Mar 12, 2026",
    pet: {
      petName: "Luna",
      species: "dog",
      breed: "Labrador Mix",
      vaccinations: {
        rabies: { expiresAt: _now + 200 * _day },
        // bordetella deliberately missing
      },
    },
  },
  {
    id: "pet_cust_3",
    firstName: "Avery",
    lastName: "Nash",
    phone: "5125550503",
    lastVisit: "Feb 03, 2026",
    pet: {
      petName: "Cheddar",
      species: "dog",
      breed: "Beagle",
      vaccinations: {
        rabies:     { expiresAt: _now - 60 * _day }, // expired 60 days ago
        bordetella: { expiresAt: _now + 120 * _day },
      },
    },
  },
  {
    id: "pet_cust_4",
    firstName: "Riley",
    lastName: "Dunn",
    phone: "5125550504",
    lastVisit: "Apr 15, 2026",
    pet: {
      petName: "Mochi",
      species: "cat",
      breed: "Domestic Shorthair",
      vaccinations: {
        rabies:     { expiresAt: _now + 14 * _day }, // expiring in 14 days → soft warning
        bordetella: { expiresAt: _now + 90 * _day },
      },
    },
  },
];

export function addPetCustomerInMemory(customer: PetCustomer): void {
  PET_GROOMING_CUSTOMERS = [...PET_GROOMING_CUSTOMERS, customer];
}
