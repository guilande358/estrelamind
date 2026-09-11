import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { guestClear } from "@/lib/guestStore";

const FLAG = "mf_guest_mode";

interface GuestContextType {
  /** Visitor mode: no account, data lives only in this session. */
  isGuest: boolean;
  startGuest: () => void;
  endGuest: () => void;
}

const GuestContext = createContext<GuestContextType>({
  isGuest: false,
  startGuest: () => {},
  endGuest: () => {},
});

export const useGuest = () => useContext(GuestContext);

export const GuestProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [flag, setFlag] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(FLAG) === "1";
  });

  // A real account always wins over visitor mode.
  useEffect(() => {
    if (user && flag) {
      sessionStorage.removeItem(FLAG);
      guestClear();
      setFlag(false);
    }
  }, [user, flag]);

  const startGuest = useCallback(() => {
    sessionStorage.setItem(FLAG, "1");
    setFlag(true);
  }, []);

  const endGuest = useCallback(() => {
    sessionStorage.removeItem(FLAG);
    guestClear();
    setFlag(false);
  }, []);

  return (
    <GuestContext.Provider value={{ isGuest: flag && !user, startGuest, endGuest }}>
      {children}
    </GuestContext.Provider>
  );
};
