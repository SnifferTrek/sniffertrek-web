"use client";

import {
 createContext,
 useCallback,
 useContext,
 useMemo,
 useState,
 type ReactNode,
} from "react";
import KontoPanelModal from "./KontoPanelModal";

type KontoPanelContextValue = {
 open: boolean;
 openKonto: () => void;
 closeKonto: () => void;
 toggleKonto: () => void;
};

const KontoPanelContext = createContext<KontoPanelContextValue | null>(null);

export function useKontoPanel(): KontoPanelContextValue {
 const ctx = useContext(KontoPanelContext);
 if (!ctx) {
 throw new Error("useKontoPanel must be used within KontoPanelProvider");
 }
 return ctx;
}

export function KontoPanelProvider({ children }: { children: ReactNode }) {
 const [open, setOpen] = useState(false);
 const openKonto = useCallback(() => setOpen(true), []);
 const closeKonto = useCallback(() => setOpen(false), []);
 const toggleKonto = useCallback(() => setOpen((o) => !o), []);

 const value = useMemo(
 () => ({ open, openKonto, closeKonto, toggleKonto }),
 [open, openKonto, closeKonto, toggleKonto]
 );

 return (
 <KontoPanelContext.Provider value={value}>
 {children}
 <KontoPanelModal />
 </KontoPanelContext.Provider>
 );
}
