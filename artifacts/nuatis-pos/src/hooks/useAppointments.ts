import { useState, useEffect } from "react";
import { useActiveVertical } from "@/hooks/useActiveVertical";
import {
  getAppointments,
  markAppointmentStarted,
  markAppointmentNoShow,
  resetAppointmentStatus,
  takeAppointmentDeposit,
  type Appointment,
} from "@/lib/appointments";

export function useAppointments() {
  const { activeVerticalId } = useActiveVertical();
  const [appointments, setAppointments] = useState<Appointment[]>(() =>
    getAppointments(activeVerticalId),
  );

  useEffect(() => {
    setAppointments(getAppointments(activeVerticalId));
  }, [activeVerticalId]);

  function startAppointment(id: string): void {
    setAppointments(markAppointmentStarted(activeVerticalId, id));
  }

  function markNoShow(id: string): void {
    setAppointments(markAppointmentNoShow(activeVerticalId, id));
  }

  function resetStatus(id: string): void {
    setAppointments(resetAppointmentStatus(activeVerticalId, id));
  }

  function takeDeposit(id: string, txId: string): void {
    setAppointments(takeAppointmentDeposit(activeVerticalId, id, txId));
  }

  return { appointments, startAppointment, markNoShow, resetStatus, takeDeposit };
}
