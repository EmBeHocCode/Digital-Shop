'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

interface BotStatusState {
  running: boolean;   // bot process đang chạy (web API hoạt động)
  online: boolean;    // bot đang reply Zalo (maintenance=false)
  toggling: boolean;
}

interface BotStatusContextValue extends BotStatusState {
  toggle: () => Promise<void>;
  refetch: () => Promise<void>;
}

const BotStatusContext = createContext<BotStatusContextValue | null>(null);

export function BotStatusProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BotStatusState>({
    running: false,
    online: false,
    toggling: false,
  });

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/bot/status');
      const data = await res.json();
      setState((prev) => ({
        ...prev,
        running: data.running ?? false,
        online: data.online ?? false,
      }));
    } catch {
      setState((prev) => ({ ...prev, running: false, online: false }));
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const id = setInterval(fetchStatus, 5000);
    return () => clearInterval(id);
  }, [fetchStatus]);

  const toggle = useCallback(async () => {
    setState((prev) => ({ ...prev, toggling: true }));
    try {
      const action = state.online ? 'stop' : 'start';
      await fetch('/api/bot/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      await fetchStatus();
    } finally {
      setState((prev) => ({ ...prev, toggling: false }));
    }
  }, [state.online, fetchStatus]);

  return (
    <BotStatusContext.Provider value={{ ...state, toggle, refetch: fetchStatus }}>
      {children}
    </BotStatusContext.Provider>
  );
}

export function useBotStatusContext() {
  const ctx = useContext(BotStatusContext);
  if (!ctx) throw new Error('useBotStatusContext must be used within BotStatusProvider');
  return ctx;
}
