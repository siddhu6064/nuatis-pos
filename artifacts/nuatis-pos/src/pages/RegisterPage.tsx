import { useState, useCallback, useRef, useEffect } from "react";
import type { Service } from "@/lib/services";
import { ServiceTile } from "@/components/ServiceTile";
import { Header } from "@/components/Header";
import { Cart } from "@/components/Cart";
import { CheckoutOverlay } from "@/components/CheckoutOverlay";
import { StaffSwitcher } from "@/components/StaffSwitcher";
import { CustomerSearch } from "@/components/CustomerSearch";
import { ReportsOverlay } from "@/components/ReportsOverlay";
import { HeldTicketsModal } from "@/components/HeldTicketsModal";
import { VerticalSwitcher } from "@/components/VerticalSwitcher";
import { SettingsOverlay } from "@/components/SettingsOverlay";
import { WaitlistOverlay } from "@/components/WaitlistOverlay";
import { AppointmentsOverlay } from "@/components/AppointmentsOverlay";
import { CashTenderModal } from "@/components/CashTenderModal";
import { SplitTenderModal } from "@/components/SplitTenderModal";
import { VaccinationGateModal } from "@/components/VaccinationGateModal";
import { Toast } from "@/components/Toast";
import { StartShiftModal } from "@/components/StartShiftModal";
import { EndShiftModal } from "@/components/EndShiftModal";
import { DropOffSuccessOverlay } from "@/components/DropOffSuccessOverlay";
import { OpenTicketsOverlay } from "@/components/OpenTicketsOverlay";
import { ClassesOverlay } from "@/components/ClassesOverlay";
import { useOpenTickets } from "@/hooks/useOpenTickets";
import { useClassSlots } from "@/hooks/useClassSlots";
import type { OpenTicket } from "@/lib/openTickets";
import { useCart } from "@/hooks/useCart";
import type { CartCustomer } from "@/hooks/useCart";
import { useCheckout } from "@/hooks/useCheckout";
import type { SplitPayment } from "@/hooks/useCheckout";
import { useActiveStaff } from "@/hooks/useActiveStaff";
import { useActiveVertical } from "@/hooks/useActiveVertical";
import { useVerticalSettings } from "@/hooks/useVerticalSettings";
import { useWaitlist } from "@/hooks/useWaitlist";
import { useAppointments } from "@/hooks/useAppointments";
import { useElapsedTick } from "@/hooks/useElapsedTick";
import { useShift } from "@/hooks/useShift";
import { calcSubtotal, calcTaxWithRate, calcTotal } from "@/lib/cartMath";
import {
  getHeldTickets,
  holdTicket,
  resumeTicket,
  removeHeldTicket,
  type HeldTicket,
} from "@/lib/heldTickets";
import type { Appointment } from "@/lib/appointments";
import type { WaitlistEntry } from "@/lib/waitlist";
import type { VerticalId } from "@/lib/verticals";
import type { AuthUser } from "@workspace/replit-auth-web";
import {
  PET_GROOMING_CUSTOMERS,
  type PetCustomer,
} from "@/lib/pet-grooming-customers";
import type { Pet } from "@/lib/customers";
import { checkServiceRequirements } from "@/lib/vaccinations";
import type { VaccinationRequirement } from "@/lib/vaccinations";

interface RegisterPageProps {
  user: AuthUser;
  onLogout: () => void;
}

interface VaccinationGateState {
  service: Service;
  petInfo: Pet | undefined;
  requiresVaccinations: VaccinationRequirement[];
  customerVaccinations: PetCustomer["pet"]["vaccinations"] | undefined;
  blockers: string[];
  warnings: string[];
}

export function RegisterPage({ user, onLogout }: RegisterPageProps) {
  const { activeVerticalId, setActiveVerticalId, config } = useActiveVertical();
  const { settings } = useVerticalSettings();

  const {
    lines,
    customer,
    compApplied,
    compReason,
    appointmentRef,
    depositApplied,
    addItem,
    addSessionItem,
    stopSession,
    increment,
    decrement,
    remove,
    changeStaff,
    toggleModifier,
    setDiscount,
    applyComp,
    removeComp,
    attachCustomer,
    detachCustomer,
    setDepositContext,
    clearDepositContext,
    loadHeld,
    clear,
  } = useCart();

  const { activeStaff, setActiveStaff } = useActiveStaff();
  const checkout = useCheckout(clear);
  const { entries: waitlistEntries, addEntry, removeEntry } = useWaitlist();
  const {
    appointments,
    startAppointment,
    markNoShow,
    resetStatus,
    takeDeposit,
  } = useAppointments();

  // B26: shift-state (no provider — reads activeVerticalId internally)
  const { currentShift, isShiftOpen, openShift, closeShift } = useShift();

  // B27: open tickets (drop_off workflow)
  const openTicketsHook = useOpenTickets();

  // B29: class slots (yoga_pilates vertical)
  const classSlots = useClassSlots();

  // B23: useElapsedTick — ONLY setInterval in the codebase
  const hasActiveSessions = lines.some(
    (l) => l.sessionStartedAt !== undefined && l.sessionEndedAt === undefined,
  );
  const elapsedTick = useElapsedTick(hasActiveSessions);

  const [pulsingServiceId, setPulsingServiceId] = useState<string | null>(null);
  const [showStaffSwitcher, setShowStaffSwitcher] = useState(false);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [showHeldModal, setShowHeldModal] = useState(false);
  const [showVerticalSwitcher, setShowVerticalSwitcher] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [showAppointments, setShowAppointments] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  // B26: shift modal state
  const [showStartShift, setShowStartShift] = useState(false);
  const [showEndShift, setShowEndShift] = useState(false);
  const [heldTickets, setHeldTickets] = useState<HeldTicket[]>(() =>
    getHeldTickets(activeVerticalId),
  );
  const [holdToast, setHoldToast] = useState(false);
  const [cashDrawerToast, setCashDrawerToast] = useState(false);
  const [smsToast, setSmsToast] = useState<string | null>(null);
  const smsToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // B27: drop-off workflow state
  const [showOpenTickets, setShowOpenTickets] = useState(false);

  // B29: classes overlay state
  const [showClasses, setShowClasses] = useState(false);
  const [pendingBookSlotId, setPendingBookSlotId] = useState<string | null>(null);
  const [classBookingContext, setClassBookingContext] = useState<{
    slotId: string;
    enrollmentId: string;
    scheduledAt: number;
    serviceName: string;
  } | null>(null);
  const [dropOffSuccessTicket, setDropOffSuccessTicket] = useState<OpenTicket | null>(null);
  const [pickupTicketId, setPickupTicketId] = useState<string | null>(null);
  const [pickupTag, setPickupTag] = useState<string | null>(null);

  // B22: pet grooming gate
  const [pendingService, setPendingService] = useState<Service | null>(null);
  const [vaccinationGate, setVaccinationGate] =
    useState<VaccinationGateState | null>(null);

  const pulseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cashToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setHeldTickets(getHeldTickets(activeVerticalId));
  }, [activeVerticalId]);

  const activeStaffIds = settings.staff
    .filter((s) => s.active)
    .map((s) => s.id)
    .join(",");
  useEffect(() => {
    const activeList = settings.staff.filter((s) => s.active);
    const inList = activeList.find((s) => s.id === activeStaff.id);
    if (!inList && activeList.length > 0) {
      const first = activeList[0];
      setActiveStaff({ id: first.id, firstName: first.firstName, role: first.role });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStaffIds]);

  const refreshHeld = useCallback(() => {
    setHeldTickets(getHeldTickets(activeVerticalId));
  }, [activeVerticalId]);

  // ── B22: Vaccination gate ──────────────────────────────────────────────────

  const runVaccinationGateCheck = useCallback(
    (service: Service, attachedCustomer: CartCustomer) => {
      const fullCustomer = PET_GROOMING_CUSTOMERS.find(
        (c) => c.id === attachedCustomer.id,
      ) as PetCustomer | undefined;
      const pet = fullCustomer?.pet;
      const requirements =
        (service.requiresVaccinations as VaccinationRequirement[] | undefined) ?? [];
      const nowMs = Date.now();
      const result = checkServiceRequirements(
        { requiresVaccinations: requirements },
        { vaccinations: pet?.vaccinations },
        nowMs,
      );

      if (result.blockers.length === 0 && result.warnings.length === 0) {
        addItem(service.id, service.name, service.priceCents, activeStaff.id);
        if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
        setPulsingServiceId(service.id);
        pulseTimerRef.current = setTimeout(() => setPulsingServiceId(null), 200);
        return;
      }

      setVaccinationGate({
        service,
        petInfo: pet,
        requiresVaccinations: requirements,
        customerVaccinations: pet?.vaccinations,
        blockers: result.blockers,
        warnings: result.warnings,
      });
    },
    [addItem, activeStaff.id],
  );

  // ── Tile tap ───────────────────────────────────────────────────────────────

  const handleTileTap = useCallback(
    (service: Service) => {
      // Pet grooming: customer must be attached first
      if (activeVerticalId === "pet_grooming") {
        if (!customer) {
          setPendingService(service);
          setShowCustomerSearch(true);
          return;
        }
        runVaccinationGateCheck(service, customer);
        return;
      }

      // B23: Tanning — session-based vs fixed-price
      if (activeVerticalId === "tanning" && service.pricing) {
        addSessionItem(service.id, service.name, service.pricing, activeStaff.id);
        if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
        setPulsingServiceId(service.id);
        pulseTimerRef.current = setTimeout(() => setPulsingServiceId(null), 200);
        return;
      }

      // All other verticals (and fixed-price tanning services): add normally
      addItem(service.id, service.name, service.priceCents, activeStaff.id);
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
      setPulsingServiceId(service.id);
      pulseTimerRef.current = setTimeout(() => setPulsingServiceId(null), 200);
    },
    [activeVerticalId, customer, addItem, addSessionItem, activeStaff.id, runVaccinationGateCheck],
  );

  // ── Customer attach ────────────────────────────────────────────────────────

  const handleAttachCustomer = useCallback(
    (c: CartCustomer) => {
      // B29: yoga class booking flow — triggered when pendingBookSlotId is set
      if (pendingBookSlotId !== null) {
        const slotId = pendingBookSlotId;
        setPendingBookSlotId(null);
        setShowCustomerSearch(false);
        if (classSlots.checkSlotFull(slotId)) {
          if (smsToastTimerRef.current) clearTimeout(smsToastTimerRef.current);
          setSmsToast("Class is full — booking cancelled");
          smsToastTimerRef.current = setTimeout(() => setSmsToast(null), 2000);
          return;
        }
        const slot = classSlots.slots.find((s) => s.id === slotId);
        if (!slot) return;
        const customerName = `${c.firstName} ${c.lastName}`.trim();
        const enrollment = classSlots.enrollCustomer(slotId, c.id, customerName);
        if (!enrollment) return;
        const svcConfig = config.services.find((s) => s.id === slot.serviceId);
        const priceCents = svcConfig?.priceCents ?? 0;
        attachCustomer(c);
        addItem(slot.serviceId, slot.serviceName, priceCents, activeStaff.id);
        if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
        setPulsingServiceId(slot.serviceId);
        pulseTimerRef.current = setTimeout(() => setPulsingServiceId(null), 200);
        setClassBookingContext({
          slotId,
          enrollmentId: enrollment.id,
          scheduledAt: slot.scheduledAt,
          serviceName: slot.serviceName,
        });
        return;
      }
      // Normal flow
      attachCustomer(c);
      setShowCustomerSearch(false);
      if (pendingService !== null && activeVerticalId === "pet_grooming") {
        const svc = pendingService;
        setPendingService(null);
        runVaccinationGateCheck(svc, c);
      }
    },
    [attachCustomer, pendingService, activeVerticalId, runVaccinationGateCheck, pendingBookSlotId, classSlots, config.services, activeStaff.id, addItem],
  );

  // B29: book request from ClassesOverlay — opens CustomerSearch in yoga mode
  const handleBookRequest = useCallback((slotId: string) => {
    setPendingBookSlotId(slotId);
    setShowClasses(false);
    setShowCustomerSearch(true);
  }, []);

  // ── Vaccination gate callbacks ────────────────────────────────────────────

  const handleVaccinationAdd = useCallback(
    (override?: { overriddenAt: number; blockers: string[] }) => {
      if (!vaccinationGate) return;
      const { service } = vaccinationGate;
      addItem(service.id, service.name, service.priceCents, activeStaff.id, override);
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
      setPulsingServiceId(service.id);
      pulseTimerRef.current = setTimeout(() => setPulsingServiceId(null), 200);
      setVaccinationGate(null);
    },
    [vaccinationGate, addItem, activeStaff.id],
  );

  const handleVaccinationCancel = useCallback(() => {
    setVaccinationGate(null);
  }, []);

  // ── Cart totals ───────────────────────────────────────────────────────────

  const buildCartTotals = useCallback(() => {
    const subtotalCents = calcSubtotal(lines);
    const taxCents = compApplied
      ? 0
      : calcTaxWithRate(subtotalCents, settings.taxRatePercent);
    const tipCents = compApplied ? 0 : checkout.tipCents;
    const totalCents = compApplied
      ? 0
      : calcTotal(subtotalCents, taxCents, checkout.tipCents);
    return { subtotalCents, taxCents, tipCents, totalCents };
  }, [lines, compApplied, checkout.tipCents, settings.taxRatePercent]);

  const handleConfirmCard = useCallback(() => {
    const { subtotalCents, taxCents, tipCents, totalCents } = buildCartTotals();
    checkout.confirmCheckout({
      lineItems: lines,
      subtotalCents,
      taxCents,
      tipCents,
      totalCents,
      customer,
      compApplied,
      compReason,
      paymentMethod: "card",
      ...(depositApplied > 0 ? { depositApplied } : {}),
      ...(appointmentRef ? { appointmentRef } : {}),
      ...(currentShift ? { shiftId: currentShift.id } : {}),
      ...(pickupTicketId ? { openTicketId: pickupTicketId } : {}),
      ...(classBookingContext ? { classSlotId: classBookingContext.slotId } : {}),
    });
  }, [lines, checkout, customer, compApplied, compReason, buildCartTotals, depositApplied, appointmentRef, currentShift, pickupTicketId, classBookingContext]);

  const handleOpenCash = useCallback(() => {
    setShowCashModal(true);
  }, []);

  const handleConfirmCash = useCallback(
    (tenderedCents: number) => {
      const { subtotalCents, taxCents, tipCents, totalCents } = buildCartTotals();
      const balanceCents = compApplied ? 0 : Math.max(0, totalCents - depositApplied);
      const changeGiven = Math.max(0, tenderedCents - balanceCents);
      setShowCashModal(false);
      checkout.confirmCheckout({
        lineItems: lines,
        subtotalCents,
        taxCents,
        tipCents,
        totalCents,
        customer,
        compApplied,
        compReason,
        paymentMethod: "cash",
        amountTendered: tenderedCents,
        changeGiven,
        ...(depositApplied > 0 ? { depositApplied } : {}),
        ...(appointmentRef ? { appointmentRef } : {}),
        ...(currentShift ? { shiftId: currentShift.id } : {}),
        ...(pickupTicketId ? { openTicketId: pickupTicketId } : {}),
        ...(classBookingContext ? { classSlotId: classBookingContext.slotId } : {}),
      });
      if (cashToastTimerRef.current) clearTimeout(cashToastTimerRef.current);
      setCashDrawerToast(true);
      cashToastTimerRef.current = setTimeout(() => setCashDrawerToast(false), 1500);
    },
    [lines, checkout, customer, compApplied, compReason, buildCartTotals, depositApplied, appointmentRef, currentShift, pickupTicketId, classBookingContext],
  );

  const handleOpenSplit = useCallback(() => {
    setShowSplitModal(true);
  }, []);

  const handleConfirmSplit = useCallback(
    (payments: SplitPayment[]) => {
      const { subtotalCents, taxCents, tipCents, totalCents } = buildCartTotals();
      setShowSplitModal(false);
      checkout.confirmCheckout({
        lineItems: lines,
        subtotalCents,
        taxCents,
        tipCents,
        totalCents,
        customer,
        compApplied,
        compReason,
        paymentMethod: "split",
        splitPayments: payments,
        ...(depositApplied > 0 ? { depositApplied } : {}),
        ...(appointmentRef ? { appointmentRef } : {}),
        ...(currentShift ? { shiftId: currentShift.id } : {}),
        ...(pickupTicketId ? { openTicketId: pickupTicketId } : {}),
        ...(classBookingContext ? { classSlotId: classBookingContext.slotId } : {}),
      });
      if (payments.some((p) => p.method === "cash")) {
        if (cashToastTimerRef.current) clearTimeout(cashToastTimerRef.current);
        setCashDrawerToast(true);
        cashToastTimerRef.current = setTimeout(() => setCashDrawerToast(false), 1500);
      }
    },
    [lines, checkout, customer, compApplied, compReason, buildCartTotals, depositApplied, appointmentRef, currentShift, pickupTicketId, classBookingContext],
  );

  const handleHold = useCallback(() => {
    if (lines.length === 0) return;
    const ticket: HeldTicket = {
      id: crypto.randomUUID(),
      heldAt: new Date().toISOString(),
      customer,
      lineItems: lines,
      compApplied,
      compReason,
    };
    holdTicket(ticket, activeVerticalId);
    refreshHeld();
    clear();
    if (holdToastTimerRef.current) clearTimeout(holdToastTimerRef.current);
    setHoldToast(true);
    holdToastTimerRef.current = setTimeout(() => setHoldToast(false), 1500);
  }, [lines, customer, compApplied, compReason, activeVerticalId, clear, refreshHeld]);

  const handleResume = useCallback(
    (ticket: HeldTicket) => {
      resumeTicket(ticket.id, activeVerticalId);
      loadHeld(
        ticket.lineItems,
        ticket.customer,
        ticket.compApplied ?? false,
        ticket.compReason ?? null,
      );
      refreshHeld();
      setShowHeldModal(false);
    },
    [activeVerticalId, loadHeld, refreshHeld],
  );

  const handleDiscard = useCallback(
    (id: string) => {
      removeHeldTicket(id, activeVerticalId);
      refreshHeld();
      if (heldTickets.length <= 1) setShowHeldModal(false);
    },
    [activeVerticalId, heldTickets.length, refreshHeld],
  );

  const handleVerticalSwitch = useCallback(
    (id: VerticalId) => {
      setActiveVerticalId(id);
      setShowVerticalSwitcher(false);
      // Reset pickup state when switching verticals
      setPickupTicketId(null);
      setPickupTag(null);
    },
    [setActiveVerticalId],
  );

  // ── B27: Drop-off workflow handlers ─────────────────────────────────────

  const handleDropOff = useCallback(() => {
    if (!customer) return;
    const customerName = `${customer.firstName} ${customer.lastName}`.trim();
    const ticket = openTicketsHook.dropOff(customer.id, customerName, lines);
    setDropOffSuccessTicket(ticket);
    clear();
  }, [customer, lines, openTicketsHook, clear]);

  const handlePickupSelect = useCallback(
    (ticketId: string) => {
      const result = openTicketsHook.pickUp(ticketId);
      if (!result) return;
      const nameParts = result.customerName.trim().split(/\s+/);
      const firstName = nameParts[0] ?? result.customerName;
      const lastName = nameParts.slice(1).join(" ");
      const pickupCustomer: CartCustomer = {
        id: result.customerId,
        firstName,
        lastName,
        phone: "",
      };
      loadHeld(result.lines, pickupCustomer, false, null);
      setPickupTicketId(ticketId);
      setPickupTag(result.tag);
      setShowOpenTickets(false);
    },
    [openTicketsHook, loadHeld],
  );

  const handleReturnToInProgress = useCallback(() => {
    clear();
    setPickupTicketId(null);
    setPickupTag(null);
  }, [clear]);

  const handleMarkReady = useCallback(
    (ticketId: string) => {
      const customerName = openTicketsHook.markReady(ticketId);
      if (smsToastTimerRef.current) clearTimeout(smsToastTimerRef.current);
      setSmsToast(`Pickup notification sent to ${customerName}`);
      smsToastTimerRef.current = setTimeout(() => setSmsToast(null), 2000);
    },
    [openTicketsHook],
  );

  const handleCompleteSale = useCallback(() => {
    if (pickupTicketId && checkout.completedTx) {
      openTicketsHook.completePickup(pickupTicketId, checkout.completedTx.id);
      setPickupTicketId(null);
      setPickupTag(null);
    }
    // B29: mark class enrollment paid
    if (classBookingContext && checkout.completedTx) {
      classSlots.markEnrollmentPaid(
        classBookingContext.slotId,
        classBookingContext.enrollmentId,
        checkout.completedTx.id,
      );
      setClassBookingContext(null);
    }
    checkout.completeSale();
  }, [pickupTicketId, checkout, openTicketsHook, classBookingContext, classSlots]);

  const handleStartWalkIn = useCallback(
    (entry: WaitlistEntry) => {
      const nameParts = entry.name.trim().split(/\s+/);
      const firstName = nameParts[0] ?? entry.name.trim();
      const lastName = nameParts.slice(1).join(" ");
      attachCustomer({ id: entry.id, firstName, lastName, phone: entry.phone });
      if (
        entry.serviceId !== null &&
        entry.serviceName !== null &&
        entry.servicePriceCents !== null
      ) {
        addItem(entry.serviceId, entry.serviceName, entry.servicePriceCents, activeStaff.id);
      }
      removeEntry(entry.id);
      setShowWaitlist(false);
    },
    [attachCustomer, addItem, activeStaff.id, removeEntry],
  );

  const handleStartAppointment = useCallback(
    (appt: Appointment) => {
      const nameParts = appt.customerName.trim().split(/\s+/);
      const firstName = nameParts[0] ?? appt.customerName.trim();
      const lastName = nameParts.slice(1).join(" ");
      attachCustomer({ id: appt.id, firstName, lastName, phone: appt.customerPhone });
      addItem(appt.serviceId, appt.serviceName, appt.servicePriceCents, appt.staffId);

      const apptStaff = settings.staff.find((s) => s.active && s.id === appt.staffId);
      if (apptStaff) {
        setActiveStaff({ id: apptStaff.id, firstName: apptStaff.firstName, role: apptStaff.role });
      }

      if (
        (appt.depositRequired ?? false) &&
        appt.depositStatus === "taken" &&
        (appt.depositAmountCents ?? 0) > 0
      ) {
        setDepositContext(appt.id, appt.depositAmountCents!);
      } else {
        clearDepositContext();
      }

      startAppointment(appt.id);
      setShowAppointments(false);
    },
    [attachCustomer, addItem, settings.staff, setActiveStaff, startAppointment, setDepositContext, clearDepositContext],
  );

  // ── Derived values ────────────────────────────────────────────────────────

  const cashSubtotal = calcSubtotal(lines);
  const cashTax = compApplied ? 0 : calcTaxWithRate(cashSubtotal, settings.taxRatePercent);
  const cashTotalCents = compApplied ? 0 : calcTotal(cashSubtotal, cashTax, checkout.tipCents);
  const cashBalanceCents = compApplied ? 0 : Math.max(0, cashTotalCents - depositApplied);

  const appointmentsUrgentCount = appointments.filter(
    (a) => a.status === "scheduled" && a.scheduledAt <= Date.now() + 24 * 3600000,
  ).length;

  const switcherDisabled = lines.length > 0 || checkout.state !== "idle";
  const cartIsIdle = lines.length === 0 && checkout.state === "idle";
  const activeStaffList = settings.staff.filter((s) => s.active);

  const customerName = customer
    ? `${customer.firstName} ${customer.lastName}`.trim()
    : "";

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{ backgroundColor: "#F8F7F4" }}
    >
      {holdToast && <Toast message="Ticket held" />}
      {cashDrawerToast && <Toast message="💵 Cash drawer opened" />}
      {smsToast && <Toast message={smsToast} />}

      <Header
        user={user}
        onLogout={onLogout}
        activeStaff={activeStaff}
        onSwitchStaff={() => setShowStaffSwitcher(true)}
        checkoutState={checkout.state}
        onOpenReports={() => setReportsOpen(true)}
        heldCount={heldTickets.length}
        onOpenHeldTickets={() => setShowHeldModal(true)}
        waitlistCount={waitlistEntries.length}
        onOpenWaitlist={() => {
          setShowAppointments(false);
          setShowOpenTickets(false);
          setShowClasses(false);
          setShowWaitlist(true);
        }}
        appointmentsCount={appointmentsUrgentCount}
        onOpenAppointments={() => {
          setShowWaitlist(false);
          setShowOpenTickets(false);
          setShowClasses(false);
          setShowAppointments(true);
        }}
        openTicketsCount={openTicketsHook.activeCount}
        onOpenTickets={() => {
          setShowWaitlist(false);
          setShowAppointments(false);
          setShowClasses(false);
          setShowOpenTickets(true);
        }}
        classesCount={config.classEnabled ? classSlots.slots.filter(s => s.roster.length < s.capacity).length : undefined}
        onOpenClasses={() => {
          setShowWaitlist(false);
          setShowAppointments(false);
          setShowOpenTickets(false);
          setShowClasses(true);
        }}
        activeVerticalDisplayName={config.displayName}
        switcherDisabled={switcherDisabled}
        onOpenVerticalSwitcher={() => setShowVerticalSwitcher(true)}
        onOpenSettings={() => setShowSettings(true)}
        isShiftOpen={isShiftOpen}
        currentShiftStaffName={currentShift?.openedByStaffName}
        currentShiftStartedAt={currentShift?.startedAt}
        onStartShift={() => setShowStartShift(true)}
        onEndShift={() => setShowEndShift(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto px-5 py-4 min-w-0">
          <div className="grid grid-cols-4 gap-3">
            {config.services.map((service) => (
              <ServiceTile
                key={service.id}
                service={service}
                color={config.categoryColors[service.category] ?? "#F3F4F6"}
                onTap={handleTileTap}
              />
            ))}
          </div>
        </main>

        <aside className="w-[384px] flex-shrink-0 overflow-hidden">
          <Cart
            lines={lines}
            pulsingServiceId={pulsingServiceId}
            onIncrement={increment}
            onDecrement={decrement}
            onRemove={remove}
            onClear={clear}
            onHold={handleHold}
            onStaffChange={changeStaff}
            onToggleModifier={toggleModifier}
            onSetDiscount={setDiscount}
            compApplied={compApplied}
            compReason={compReason}
            onApplyComp={applyComp}
            onRemoveComp={removeComp}
            customer={customer}
            onOpenCustomerSearch={() => setShowCustomerSearch(true)}
            onDetachCustomer={detachCustomer}
            checkoutState={checkout.state}
            tipCents={checkout.tipCents}
            selectedPreset={checkout.selectedPreset}
            onStartCheckout={checkout.startCheckout}
            onCancelCheckout={checkout.cancelCheckout}
            onConfirmCard={handleConfirmCard}
            onOpenCash={handleOpenCash}
            onOpenSplit={handleOpenSplit}
            onTipPresetSelect={checkout.selectPreset}
            onCustomTipApply={checkout.applyCustomTip}
            depositApplied={depositApplied}
            elapsedTick={elapsedTick}
            stopSession={stopSession}
            isShiftOpen={isShiftOpen}
            workflow={config.workflow}
            openTicketId={pickupTicketId}
            openTicketTag={pickupTag}
            pickupCustomerName={pickupTicketId ? customerName : null}
            onDropOff={handleDropOff}
            onReturnToInProgress={handleReturnToInProgress}
            classBookingContext={classBookingContext}
          />
        </aside>
      </div>

      <CheckoutOverlay
        state={checkout.state}
        processingTotalCents={checkout.processingTotalCents}
        completedTx={checkout.completedTx}
        onCompleteDelivery={checkout.completeDelivery}
        onAttachCustomerPostSale={checkout.attachCustomerPostSale}
        onNewSale={handleCompleteSale}
      />

      {showCashModal && checkout.state === "tip" && (
        <CashTenderModal
          totalCents={cashBalanceCents}
          onConfirm={handleConfirmCash}
          onCancel={() => setShowCashModal(false)}
        />
      )}

      {showSplitModal && checkout.state === "tip" && (
        <SplitTenderModal
          totalCents={cashBalanceCents}
          onConfirmSplit={handleConfirmSplit}
          onClose={() => setShowSplitModal(false)}
        />
      )}

      {showStaffSwitcher && (
        <StaffSwitcher
          staff={activeStaffList}
          activeStaffId={activeStaff.id}
          onSelect={setActiveStaff}
          onClose={() => setShowStaffSwitcher(false)}
        />
      )}

      {showCustomerSearch && (
        <CustomerSearch
          onAttach={handleAttachCustomer}
          onClose={() => {
            setShowCustomerSearch(false);
            setPendingService(null);
          }}
          verticalId={activeVerticalId}
        />
      )}

      {/* B22: Vaccination gate modal */}
      {vaccinationGate && (
        <VaccinationGateModal
          serviceName={vaccinationGate.service.name}
          servicePriceCents={vaccinationGate.service.priceCents}
          customerName={customerName}
          petName={vaccinationGate.petInfo?.petName}
          petBreed={vaccinationGate.petInfo?.breed}
          petSpecies={vaccinationGate.petInfo?.species}
          requiresVaccinations={vaccinationGate.requiresVaccinations}
          customerVaccinations={vaccinationGate.customerVaccinations}
          blockers={vaccinationGate.blockers}
          warnings={vaccinationGate.warnings}
          onAdd={handleVaccinationAdd}
          onCancel={handleVaccinationCancel}
        />
      )}

      {reportsOpen && <ReportsOverlay onClose={() => setReportsOpen(false)} />}

      {showHeldModal && heldTickets.length > 0 && (
        <HeldTicketsModal
          tickets={heldTickets}
          currentCartHasItems={lines.length > 0}
          onResume={handleResume}
          onDiscard={handleDiscard}
          onClose={() => setShowHeldModal(false)}
        />
      )}

      {showVerticalSwitcher && (
        <VerticalSwitcher
          activeVerticalId={activeVerticalId}
          onSwitch={handleVerticalSwitch}
          onClose={() => setShowVerticalSwitcher(false)}
        />
      )}

      {showSettings && <SettingsOverlay onClose={() => setShowSettings(false)} />}

      {showWaitlist && (
        <WaitlistOverlay
          entries={waitlistEntries}
          onAdd={addEntry}
          onRemove={removeEntry}
          onStartService={handleStartWalkIn}
          cartIsIdle={cartIsIdle}
          onClose={() => setShowWaitlist(false)}
        />
      )}

      {showAppointments && (
        <AppointmentsOverlay
          appointments={appointments}
          onStartService={handleStartAppointment}
          onMarkNoShow={markNoShow}
          onResetStatus={resetStatus}
          onTakeDeposit={takeDeposit}
          cartIsIdle={cartIsIdle}
          onClose={() => setShowAppointments(false)}
          currentShiftId={currentShift?.id}
        />
      )}

      {/* B27: Drop-off success overlay */}
      {dropOffSuccessTicket && (
        <DropOffSuccessOverlay
          tag={dropOffSuccessTicket.tag}
          customerName={dropOffSuccessTicket.customerName}
          lines={dropOffSuccessTicket.lines}
          onDone={() => setDropOffSuccessTicket(null)}
        />
      )}

      {/* B27: Open tickets overlay */}
      {showOpenTickets && (
        <OpenTicketsOverlay
          tickets={openTicketsHook.openTickets}
          currentPickupTicketId={pickupTicketId}
          onMarkReady={handleMarkReady}
          onPickUp={handlePickupSelect}
          onClose={() => setShowOpenTickets(false)}
        />
      )}

      {/* B29: Classes overlay */}
      {showClasses && (
        <ClassesOverlay
          slots={classSlots.slots}
          onBookRequest={handleBookRequest}
          onCancelEnrollment={classSlots.cancelEnrollment}
          onClose={() => setShowClasses(false)}
        />
      )}

      {/* B26: Shift modals */}
      {showStartShift && (
        <StartShiftModal
          activeStaff={activeStaff}
          onConfirm={(staffId, staffName, startingCashCents) => {
            openShift(staffId, staffName, startingCashCents);
            setShowStartShift(false);
          }}
          onClose={() => setShowStartShift(false)}
        />
      )}

      {showEndShift && currentShift && (
        <EndShiftModal
          shift={currentShift}
          onConfirm={() => {
            closeShift();
            setShowEndShift(false);
          }}
          onCancel={() => setShowEndShift(false)}
        />
      )}
    </div>
  );
}
