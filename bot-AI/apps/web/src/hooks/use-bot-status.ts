'use client';

import { useState, useEffect, useCallback } from 'react';

export interface BotStatus {
  running: boolean;
  pid: number | null;
  loading: boolean;
  error: string | null;
}

export function useBotStatus(pollInterval = 5000) {
  const [status, setStatus] = useState<BotStatus>({
    running: false,
    pid: null,
    loading: true,
    error: null,
  });

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/bot/status');
      const data = await res.json();
      setStatus((prev) => ({ ...prev, running: data.running, pid: data.pid, loading: false, error: null }));
    } catch {
      setStatus((prev) => ({ ...prev, loading: false, error: 'Không lấy được trạng thái' }));
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchStatus();
    const id = setInterval(() => void fetchStatus(), pollInterval);
    return () => clearInterval(id);
  }, [fetchStatus, pollInterval]);

  const toggle = useCallback(async () => {
    setStatus((prev) => ({ ...prev, loading: true }));
    try {
      const action = status.running ? 'stop' : 'start';
      const res = await fetch('/api/bot/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!data.success) {
        setStatus((prev) => ({ ...prev, loading: false, error: data.message }));
      } else {
        // Fetch lại sau 1s để bot có thời gian khởi động
        setTimeout(fetchStatus, 1000);
      }
    } catch {
      setStatus((prev) => ({ ...prev, loading: false, error: 'Lỗi kết nối' }));
    }
  }, [status.running, fetchStatus]);

  return { ...status, toggle, refetch: fetchStatus };
}
