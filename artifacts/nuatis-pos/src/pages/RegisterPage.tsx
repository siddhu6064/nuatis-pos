import { useState, useCallback, useRef } from "react";
import { SERVICES, type Service } from "@/lib/services";
import { ServiceTile } from "@/components/ServiceTile";
import { Header } from "@/components/Header";
import { Cart } from "@/components/Cart";
import { CheckoutOverlay } from "@/components/CheckoutOverlay";
import { useCart } from "@/hooks/useCart";
import { useCheckout } from "@/hooks/useCheckout";
import { calcSubtotal, calcTax, calcTotal } from "@/lib/cartMath";
import type { AuthUser } from "@workspace/replit-auth-web";

interface RegisterPageProps {
  user: AuthUser;
  onLogout: () => void;
}

export function RegisterPage({ user, onLogout }: RegisterPageProps) {
  const { lines, addItem, increment, decrement, remove, clear } = useCart();
  const [pulsingServiceId, setPulsingServiceId] = useState<string | null>(null);
  const pulseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkout = useCheckout(clear);

  const handleTileTap = useCallback(
    (service: Service) => {
      addItem(service.id, service.name, service.priceCents);

      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
      setPulsingServiceId(service.id);
      pulseTimerRef.current = setTimeout(() => {
        setPulsingServiceId(null);
      }, 200);
    },
    [addItem],
  );

  const handleConfirmCharge = useCallback(() => {
    const subtotalCents = calcSubtotal(lines);
    const taxCents = calcTax(subtotalCents);
    const totalCents = calcTotal(subtotalCents, taxCents, checkout.tipCents);
    checkout.confirmCheckout({
      lineItems: lines,
      subtotalCents,
      taxCents,
      tipCents: checkout.tipCents,
      totalCents,
    });
  }, [lines, checkout]);

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{ backgroundColor: "#F8F7F4" }}
    >
      <Header user={user} onLogout={onLogout} />

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
        onNewSale={checkout.completeSale}
      />
    </div>
  );
}
