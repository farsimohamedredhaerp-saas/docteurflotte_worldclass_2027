'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AuthClient, NavbarSession } from '../lib/api-auth';

interface DemoModeContextType {
  /** Vrai si l'utilisateur est en mode démonstration (données virtuelles) */
  isDemoMode: boolean;
  /** Vrai si le visiteur n'a aucune session active (prospect sans connexion) */
  isGuest: boolean;
  /** Permet de basculer entre mode démo et mode réel (uniquement possible si connecté) */
  toggleDemoMode: (forceState?: boolean) => void;
  /** Session utilisateur connectée (ou null) */
  session: NavbarSession;
  /** Rafraîchit les données de session */
  refreshSession: () => void;
}

const DemoModeContext = createContext<DemoModeContextType | undefined>(undefined);

const DEMO_STORAGE_KEY = 'df_demo_mode_active';

export function DemoModeProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<NavbarSession>({ token: null, user: null, tenant: null });
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true); // Démarre en démo tant que session non résolue
  const [isGuest, setIsGuest] = useState<boolean>(true);
  const [mounted, setMounted] = useState(false);

  const resolveSessionAndMode = useCallback(() => {
    const currentSession = AuthClient.getSession();
    const guestState = !currentSession.token;
    setSession(currentSession);
    setIsGuest(guestState);

    if (guestState) {
      // Les visiteurs sans connexion sont toujours en Mode Démonstration
      setIsDemoMode(true);
    } else {
      // Pour les clients connectés, mode réel par défaut sauf s'ils ont explicitement activé le toggle démo
      if (typeof window !== 'undefined') {
        const savedPref = localStorage.getItem(DEMO_STORAGE_KEY);
        if (currentSession.tenant?.dataOrigin === 'USER_ENTRY' && savedPref !== 'true') {
          setIsDemoMode(false);
        } else {
          setIsDemoMode(savedPref === 'true');
        }
      } else {
        setIsDemoMode(false);
      }
    }
  }, []);

  useEffect(() => {
    resolveSessionAndMode();
    setMounted(true);

    const handleStorageChange = () => {
      resolveSessionAndMode();
    };
    const handleAuthChange = () => {
      resolveSessionAndMode();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth:session-changed', handleAuthChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth:session-changed', handleAuthChange);
    };
  }, [resolveSessionAndMode]);

  const toggleDemoMode = useCallback((forceState?: boolean) => {
    if (isGuest) {
      // Un visiteur sans compte reste en mode démo
      setIsDemoMode(true);
      return;
    }

    setIsDemoMode((prev) => {
      const nextState = typeof forceState === 'boolean' ? forceState : !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem(DEMO_STORAGE_KEY, nextState ? 'true' : 'false');
      }
      return nextState;
    });
  }, [isGuest]);

  return (
    <DemoModeContext.Provider
      value={{
        isDemoMode: mounted ? isDemoMode : true,
        isGuest: mounted ? isGuest : true,
        toggleDemoMode,
        session,
        refreshSession: resolveSessionAndMode,
      }}
    >
      {children}
    </DemoModeContext.Provider>
  );
}

export function useDemoMode(): DemoModeContextType {
  const context = useContext(DemoModeContext);
  if (!context) {
    throw new Error('useDemoMode doit être utilisé à l\'intérieur d\'un DemoModeProvider');
  }
  return context;
}

