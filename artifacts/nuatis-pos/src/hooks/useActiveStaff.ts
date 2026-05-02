import { useState, useCallback } from "react";
import { STAFF, type Staff } from "@/lib/staff";
import { ACTIVE_STAFF_KEY } from "@/lib/storage";

function loadActiveStaff(): Staff {
  try {
    const id = localStorage.getItem(ACTIVE_STAFF_KEY);
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
      localStorage.setItem(ACTIVE_STAFF_KEY, staff.id);
    } catch {
      // silent fail
    }
    setActiveStaffState(staff);
  }, []);

  return { activeStaff, setActiveStaff };
}
