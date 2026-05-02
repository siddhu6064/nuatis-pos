import { useState, useCallback } from "react";
import { STAFF, type Staff } from "@/lib/staff";

const STORAGE_KEY = "nuatis-pos:activeStaffId";

function loadActiveStaff(): Staff {
  try {
    const id = localStorage.getItem(STORAGE_KEY);
    if (id) {
      const found = STAFF.find((s) => s.id === id);
      if (found) return found;
    }
  } catch {
    // silent fail
  }
  return STAFF[0];
}

export function useActiveStaff() {
  const [activeStaff, setActiveStaffState] = useState<Staff>(
    () => loadActiveStaff(),
  );

  const setActiveStaff = useCallback((staff: Staff) => {
    try {
      localStorage.setItem(STORAGE_KEY, staff.id);
    } catch {
      // silent fail
    }
    setActiveStaffState(staff);
  }, []);

  return { activeStaff, setActiveStaff };
}
