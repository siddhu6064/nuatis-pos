import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  createElement,
  type ReactNode,
} from "react";
import { useActiveVertical } from "@/hooks/useActiveVertical";
import {
  getVerticalSettings,
  setVerticalSettings,
  resetSection as resetSectionLib,
  resetAll as resetAllLib,
  type VerticalSettings,
  type SettingsSection,
  type SettingsStaff,
} from "@/lib/verticalSettings";

interface VerticalSettingsContextValue {
  settings: VerticalSettings;
  updateBusiness: (business: VerticalSettings["business"]) => void;
  updateTaxRate: (percent: number) => void;
  updateTipPresets: (presets: number[]) => void;
  updateStaff: (staff: SettingsStaff[]) => void;
  resetSection: (section: SettingsSection) => void;
  resetAll: () => void;
}

const VerticalSettingsContext =
  createContext<VerticalSettingsContextValue | null>(null);

export function VerticalSettingsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { activeVerticalId } = useActiveVertical();
  const verticalIdRef = useRef(activeVerticalId);

  const [settings, setSettings] = useState<VerticalSettings>(() =>
    getVerticalSettings(activeVerticalId),
  );

  useEffect(() => {
    verticalIdRef.current = activeVerticalId;
    setSettings(getVerticalSettings(activeVerticalId));
  }, [activeVerticalId]);

  const updateBusiness = useCallback(
    (business: VerticalSettings["business"]) => {
      setSettings((prev) => {
        const updated = { ...prev, business };
        setVerticalSettings(verticalIdRef.current, updated);
        return updated;
      });
    },
    [],
  );

  const updateTaxRate = useCallback((percent: number) => {
    setSettings((prev) => {
      const updated = { ...prev, taxRatePercent: percent };
      setVerticalSettings(verticalIdRef.current, updated);
      return updated;
    });
  }, []);

  const updateTipPresets = useCallback((presets: number[]) => {
    setSettings((prev) => {
      const updated = { ...prev, tipPresets: presets };
      setVerticalSettings(verticalIdRef.current, updated);
      return updated;
    });
  }, []);

  const updateStaff = useCallback((staff: SettingsStaff[]) => {
    setSettings((prev) => {
      const updated = { ...prev, staff };
      setVerticalSettings(verticalIdRef.current, updated);
      return updated;
    });
  }, []);

  const resetSectionCb = useCallback((section: SettingsSection) => {
    const updated = resetSectionLib(verticalIdRef.current, section);
    setSettings(updated);
  }, []);

  const resetAllCb = useCallback(() => {
    const updated = resetAllLib(verticalIdRef.current);
    setSettings(updated);
  }, []);

  return createElement(VerticalSettingsContext.Provider, {
    value: {
      settings,
      updateBusiness,
      updateTaxRate,
      updateTipPresets,
      updateStaff,
      resetSection: resetSectionCb,
      resetAll: resetAllCb,
    },
    children,
  });
}

export function useVerticalSettings(): VerticalSettingsContextValue {
  const ctx = useContext(VerticalSettingsContext);
  if (!ctx) {
    throw new Error(
      "useVerticalSettings must be used within VerticalSettingsProvider",
    );
  }
  return ctx;
}
