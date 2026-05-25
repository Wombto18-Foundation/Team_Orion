import { createContext, useContext, useState, ReactNode } from "react";

interface AdminStateContextValue {
  selectedState: string | null;
  setSelectedState: (s: string | null) => void;
  isSuperAdmin: boolean;
  isStateAdmin: boolean;
  adminName: string;
  lockedState: string | null;
}

const AdminStateContext = createContext<AdminStateContextValue>({
  selectedState: null,
  setSelectedState: () => {},
  isSuperAdmin: false,
  isStateAdmin: false,
  adminName: "Admin",
  lockedState: null,
});

export function AdminStateProvider({
  children,
  isSuperAdmin,
  isStateAdmin,
  adminName,
  lockedState,
}: {
  children: ReactNode;
  isSuperAdmin: boolean;
  isStateAdmin: boolean;
  adminName: string;
  lockedState: string | null;
}) {
  const [selectedState, setSelectedState] = useState<string | null>(
    isStateAdmin ? lockedState : null,
  );

  return (
    <AdminStateContext.Provider
      value={{ selectedState, setSelectedState, isSuperAdmin, isStateAdmin, adminName, lockedState }}
    >
      {children}
    </AdminStateContext.Provider>
  );
}

export function useAdminState() {
  return useContext(AdminStateContext);
}

/** Returns a query-string segment like "?state=Maharashtra" or "" */
export function useStateParam(): string {
  const { selectedState } = useContext(AdminStateContext);
  return selectedState ? `?state=${encodeURIComponent(selectedState)}` : "";
}
