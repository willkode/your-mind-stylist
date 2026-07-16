import React, { createContext, useContext, useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

const EditModeContext = createContext();

export function EditModeProvider({ children }) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) {
          setIsManager(false);
          return;
        }
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        const userRole = currentUser?.custom_role || currentUser?.role;
        setIsManager(userRole === "manager" || userRole === "admin");
      } catch (error) {
        setIsManager(false);
      }
    };
    checkAuth();
  }, []);

  return (
    <EditModeContext.Provider value={{ isEditMode, setIsEditMode, isManager, user }}>
      {children}
    </EditModeContext.Provider>
  );
}

export function useEditMode() {
  const context = useContext(EditModeContext);
  if (!context) {
    throw new Error("useEditMode must be used within EditModeProvider");
  }
  return context;
}