import {
  createContext,
  useContext,
  useState,
  useCallback,
  createElement,
  type ReactNode,
} from "react";
import { PinModal } from "@/components/PinModal";

interface ManagerOverrideContextValue {
  requestManagerOverride: (reason: string) => Promise<boolean>;
}

const ManagerOverrideContext =
  createContext<ManagerOverrideContextValue | null>(null);

interface PendingOverride {
  reason: string;
  resolve: (result: boolean) => void;
}

interface ManagerOverrideProviderProps {
  children: ReactNode;
}

export function ManagerOverrideProvider({
  children,
}: ManagerOverrideProviderProps) {
  const [pending, setPending] = useState<PendingOverride | null>(null);

  const requestManagerOverride = useCallback(
    (reason: string): Promise<boolean> => {
      return new Promise((resolve) => {
        setPending({ reason, resolve });
      });
    },
    [],
  );

  function handleApprove() {
    pending?.resolve(true);
    setPending(null);
  }

  function handleClose() {
    pending?.resolve(false);
    setPending(null);
  }

  return createElement(
    ManagerOverrideContext.Provider,
    { value: { requestManagerOverride } },
    children,
    pending
      ? createElement(PinModal, {
          reason: pending.reason,
          onApprove: handleApprove,
          onClose: handleClose,
        })
      : null,
  );
}

export function useManagerOverride(): ManagerOverrideContextValue {
  const ctx = useContext(ManagerOverrideContext);
  if (!ctx) {
    throw new Error(
      "useManagerOverride must be used within ManagerOverrideProvider",
    );
  }
  return ctx;
}
