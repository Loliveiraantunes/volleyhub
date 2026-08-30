import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Event } from '../types/api';

const STORAGE_KEY = 'volleyhub_selected_event';

interface SelectedEventContextValue {
  selectedEvent: Event | null;
  setSelectedEvent: (event: Event | null) => void;
}

const SelectedEventContext = createContext<SelectedEventContextValue | undefined>(undefined);

export function SelectedEventProvider({ children }: { children: ReactNode }) {
  const [selectedEvent, setSelectedEventState] = useState<Event | null>(() => {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Event) : null;
  });

  const setSelectedEvent = useCallback((event: Event | null) => {
    setSelectedEventState(event);
    if (event) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(event));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const value = useMemo(() => ({ selectedEvent, setSelectedEvent }), [selectedEvent, setSelectedEvent]);

  return <SelectedEventContext.Provider value={value}>{children}</SelectedEventContext.Provider>;
}

export function useSelectedEvent(): SelectedEventContextValue {
  const ctx = useContext(SelectedEventContext);
  if (!ctx) throw new Error('useSelectedEvent must be used within SelectedEventProvider');
  return ctx;
}
