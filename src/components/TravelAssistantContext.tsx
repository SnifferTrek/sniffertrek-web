"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type TravelAssistantDemoId = "cote-dazur";

export type OpenAssistantOptions = {
  demo?: TravelAssistantDemoId;
};

type TravelAssistantContextValue = {
  open: boolean;
  pendingDemo: TravelAssistantDemoId | null;
  openAssistant: (opts?: OpenAssistantOptions) => void;
  closeAssistant: () => void;
  toggleAssistant: () => void;
  clearPendingDemo: () => void;
};

const TravelAssistantContext = createContext<TravelAssistantContextValue | null>(
  null
);

export function TravelAssistantProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [pendingDemo, setPendingDemo] = useState<TravelAssistantDemoId | null>(
    null
  );

  const openAssistant = useCallback((opts?: OpenAssistantOptions) => {
    setPendingDemo(opts?.demo ?? null);
    setOpen(true);
  }, []);
  const closeAssistant = useCallback(() => {
    setPendingDemo(null);
    setOpen(false);
  }, []);
  const toggleAssistant = useCallback(() => {
    setOpen((v) => {
      if (v) setPendingDemo(null);
      return !v;
    });
  }, []);
  const clearPendingDemo = useCallback(() => setPendingDemo(null), []);

  const value = useMemo(
    () => ({
      open,
      pendingDemo,
      openAssistant,
      closeAssistant,
      toggleAssistant,
      clearPendingDemo,
    }),
    [
      open,
      pendingDemo,
      openAssistant,
      closeAssistant,
      toggleAssistant,
      clearPendingDemo,
    ]
  );

  return (
    <TravelAssistantContext.Provider value={value}>
      {children}
    </TravelAssistantContext.Provider>
  );
}

export function useTravelAssistant() {
  const ctx = useContext(TravelAssistantContext);
  if (!ctx) {
    throw new Error("useTravelAssistant must be used within TravelAssistantProvider");
  }
  return ctx;
}
