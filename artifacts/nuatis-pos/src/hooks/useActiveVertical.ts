import {
  createContext,
  useContext,
  useState,
  useCallback,
  createElement,
  type ReactNode,
} from "react";
import { ACTIVE_VERTICAL_KEY } from "@/lib/storage";
import { VERTICALS, type VerticalId, type VerticalConfig } from "@/lib/verticals";

export interface ActiveVerticalContextValue {
  activeVerticalId: VerticalId;
  setActiveVerticalId: (id: VerticalId) => void;
  config: VerticalConfig;
}

const ActiveVerticalContext =
  createContext<ActiveVerticalContextValue | null>(null);

interface ActiveVerticalProviderProps {
  children: ReactNode;
}

export function ActiveVerticalProvider({
  children,
}: ActiveVerticalProviderProps) {
  const ALL_VERTICAL_IDS: VerticalId[] = ["salon", "spa", "nail_bar", "tattoo", "pet_grooming", "tanning", "laundry"];
  const [activeVerticalId, setActiveVerticalIdState] = useState<VerticalId>(
    () => {
      const saved = localStorage.getItem(ACTIVE_VERTICAL_KEY);
      return ALL_VERTICAL_IDS.includes(saved as VerticalId)
        ? (saved as VerticalId)
        : "salon";
    },
  );

  const setActiveVerticalId = useCallback((id: VerticalId) => {
    localStorage.setItem(ACTIVE_VERTICAL_KEY, id);
    setActiveVerticalIdState(id);
  }, []);

  const config = VERTICALS[activeVerticalId];

  return createElement(ActiveVerticalContext.Provider, {
    value: { activeVerticalId, setActiveVerticalId, config },
    children,
  });
}

export function useActiveVertical(): ActiveVerticalContextValue {
  const ctx = useContext(ActiveVerticalContext);
  if (!ctx) {
    throw new Error(
      "useActiveVertical must be used within ActiveVerticalProvider",
    );
  }
  return ctx;
}
