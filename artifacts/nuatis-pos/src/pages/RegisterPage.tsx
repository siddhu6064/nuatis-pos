import { useState, useCallback, useRef } from "react";
import { SERVICES, type Service } from "@/lib/services";
import { ServiceTile } from "@/components/ServiceTile";
import { Header } from "@/components/Header";
import { Cart } from "@/components/Cart";
import { CheckoutOverlay } from "@/components/CheckoutOverlay";
import { StaffSwitcher } from "@/components/StaffSwitcher";
import { CustomerSearch } from "@/components/CustomerSearch";
import { ReportsOverlay } from "@/components/ReportsOverlay";
import { HeldTicketsModal } from "@/components/HeldTicketsModal";
import { Toast } from "@/components/Toast";
import { useCart } from "@/hooks/useCart";
import { useCheckout } from "@/hooks/useCheckout";
import { useActiveStaff } from "@/hooks/useActiveStaff";
import { calcSubtotal, calcTax, calcTotal } from "@/lib/cartMath";
import {
  getHeldTickets,
  holdTicket,
  resumeTicket,
  removeHeldTicket,
  type HeldTicket,
} from "@/lib/heldTickets";
import type { AuthUser } from "@workspace/replit-auth-web";

interface RegisterPageProps {
  user: AuthUser;
  onLogout: () => void;
}

export function RegisterPage({ user, onLogout }: RegisterPageProps) {
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
  const [heldTickets, setHeldTickets] = useState<HeldTicket[]>(() =>
    getHeldTickets(),
  );
  const [holdToast, setHoldToast] = useState(false);
  const pulseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshHeld = useCallback(() => {
    setHeldTickets(getHeldTickets());
  }, []);

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
    const taxCents = compApplied ? 0 : calcTax(subtotalCents);
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
  }, [lines, checkout, customer, compApplied, compReason]);

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
    holdTicket(ticket);
    refreshHeld();
    clear();
    if (holdToastTimerRef.current) clearTimeout(holdToastTimerRef.current);
    setHoldToast(true);
    holdToastTimerRef.current = setTimeout(() => setHoldToast(false), 1500);
  }, [lines, customer, compApplied, compReason, clear, refreshHeld]);

  const handleResume = useCallback(
    (ticket: HeldTicket) => {
      resumeTicket(ticket.id);
      loadHeld(
        ticket.lineItems,
        ticket.customer,
        ticket.compApplied ?? false,
        ticket.compReason ?? null,
      );
      refreshHeld();
      setShowHeldModal(false);
    },
    [loadHeld, refreshHeld],
  );

  const handleDiscard = useCallback(
    (id: string) => {
      removeHeldTicket(id);
      refreshHeld();
      if (heldTickets.length <= 1) setShowHeldModal(false);
    },
    [heldTickets.length, refreshHeld],
  );

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
      />

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto px-5 py-4 min-w-0">
          <div className="grid grid-cols-4 gap-3">
            {SERVICES.map((service) => (
              <ServiceTile
                key={service.id}
                service={service}
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
    </div>
  );
}
