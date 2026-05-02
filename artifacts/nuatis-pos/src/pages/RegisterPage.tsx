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
import { Toast } from "@/components/Toast";
import { useCart } from "@/hooks/useCart";
import { useCheckout } from "@/hooks/useCheckout";
import { useActiveStaff } from "@/hooks/useActiveStaff";
import { useActiveVertical } from "@/hooks/useActiveVertical";
import { useVerticalSettings } from "@/hooks/useVerticalSettings";
import { calcSubtotal, calcTaxWithRate, calcTotal } from "@/lib/cartMath";
import {
  getHeldTickets,
  holdTicket,
  resumeTicket,
  removeHeldTicket,
  type HeldTicket,
} from "@/lib/heldTickets";
import type { VerticalId } from "@/lib/verticals";
import type { AuthUser } from "@workspace/replit-auth-web";

interface RegisterPageProps {
  user: AuthUser;
  onLogout: () => void;
}

export function RegisterPage({ user, onLogout }: RegisterPageProps) {
  const { activeVerticalId, setActiveVerticalId, config } = useActiveVertical();
  const { settings } = useVerticalSettings();

  const {
    lines,
    customer,
    compApplied,
    compReason,
    addItem,
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
    loadHeld,
    clear,
  } = useCart();

  const { activeStaff, setActiveStaff } = useActiveStaff();
  const checkout = useCheckout(clear);

  const [pulsingServiceId, setPulsingServiceId] = useState<string | null>(null);
  const [showStaffSwitcher, setShowStaffSwitcher] = useState(false);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [showHeldModal, setShowHeldModal] = useState(false);
  const [showVerticalSwitcher, setShowVerticalSwitcher] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [heldTickets, setHeldTickets] = useState<HeldTicket[]>(() =>
    getHeldTickets(activeVerticalId),
  );
  const [holdToast, setHoldToast] = useState(false);
  const pulseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reload held tickets when vertical changes
  useEffect(() => {
    setHeldTickets(getHeldTickets(activeVerticalId));
  }, [activeVerticalId]);

  // If active staff is no longer in the active staff list, fall back to first active
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

  const handleTileTap = useCallback(
    (service: Service) => {
      addItem(service.id, service.name, service.priceCents, activeStaff.id);
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
      setPulsingServiceId(service.id);
      pulseTimerRef.current = setTimeout(() => setPulsingServiceId(null), 200);
    },
    [addItem, activeStaff.id],
  );

  const handleConfirmCharge = useCallback(() => {
    const subtotalCents = calcSubtotal(lines);
    const taxCents = compApplied
      ? 0
      : calcTaxWithRate(subtotalCents, settings.taxRatePercent);
    const tipCents = compApplied ? 0 : checkout.tipCents;
    const totalCents = compApplied
      ? 0
      : calcTotal(subtotalCents, taxCents, checkout.tipCents);
    checkout.confirmCheckout({
      lineItems: lines,
      subtotalCents,
      taxCents,
      tipCents,
      totalCents,
      customer,
      compApplied,
      compReason,
    });
  }, [lines, checkout, customer, compApplied, compReason, settings.taxRatePercent]);

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
    },
    [setActiveVerticalId],
  );

  const switcherDisabled = lines.length > 0 || checkout.state !== "idle";
  const activeStaffList = settings.staff.filter((s) => s.active);

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{ backgroundColor: "#F8F7F4" }}
    >
      {holdToast && <Toast message="Ticket held" />}

      <Header
        user={user}
        onLogout={onLogout}
        activeStaff={activeStaff}
        onSwitchStaff={() => setShowStaffSwitcher(true)}
        checkoutState={checkout.state}
        onOpenReports={() => setReportsOpen(true)}
        heldCount={heldTickets.length}
        onOpenHeldTickets={() => setShowHeldModal(true)}
        activeVerticalDisplayName={config.displayName}
        switcherDisabled={switcherDisabled}
        onOpenVerticalSwitcher={() => setShowVerticalSwitcher(true)}
        onOpenSettings={() => setShowSettings(true)}
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
            onConfirmCharge={handleConfirmCharge}
            onTipPresetSelect={checkout.selectPreset}
            onCustomTipApply={checkout.applyCustomTip}
          />
        </aside>
      </div>

      <CheckoutOverlay
        state={checkout.state}
        processingTotalCents={checkout.processingTotalCents}
        completedTx={checkout.completedTx}
        onCompleteDelivery={checkout.completeDelivery}
        onAttachCustomerPostSale={checkout.attachCustomerPostSale}
        onNewSale={checkout.completeSale}
      />

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
          onAttach={(c) => {
            attachCustomer(c);
            setShowCustomerSearch(false);
          }}
          onClose={() => setShowCustomerSearch(false)}
        />
      )}

      {reportsOpen && (
        <ReportsOverlay onClose={() => setReportsOpen(false)} />
      )}

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

      {showSettings && (
        <SettingsOverlay onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}
