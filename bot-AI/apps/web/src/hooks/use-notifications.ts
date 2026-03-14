'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useNotificationSound } from '@/hooks/use-notification-sound';

export type NotifType = 'error' | 'backup_fail' | 'backup_ok' | 'restart' | 'warn';

export interface Notification {
  id: string;
  type: NotifType;
  title: string;
  msg: string;
  time: string; // ISO
  read: boolean;
}

const STORAGE_KEY = 'meow_notifications';
const MAX_NOTIFS = 50;

function load(): Notification[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch { return []; }
}

function save(notifs: Notification[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(notifs.slice(-MAX_NOTIFS))); } catch {}
}

export function useNotifications() {
  const [notifs, setNotifs] = useState<Notification[]>(() => load());
  const sseRef = useRef<EventSource | null>(null);
  const connectRef = useRef<(() => void) | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const { play: playSound } = useNotificationSound();

  const add = useCallback((n: Omit<Notification, 'read'>) => {
    let isNew = false;
    setNotifs(prev => {
      // deduplicate by id
      if (prev.some(p => p.id === n.id)) return prev;
      isNew = true;
      const next = [{ ...n, read: false }, ...prev].slice(0, MAX_NOTIFS);
      save(next);
      return next;
    });
    // Chỉ phát âm thanh khi thực sự có thông báo mới (không trùng id)
    if (isNew) playSound();
  }, [playSound]);

  const markAllRead = useCallback(() => {
    setNotifs(prev => {
      const next = prev.map(n => ({ ...n, read: true }));
      save(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setNotifs([]);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }, []);

  const connect = useCallback(() => {
    if (reconnectTimeoutRef.current !== null) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    sseRef.current?.close();
    const es = new EventSource('/api/notifications/stream');
    sseRef.current = es;
    es.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.type === 'notif' && payload.data) {
          add(payload.data);
        }
      } catch {}
    };
    es.onerror = () => {
      if (reconnectTimeoutRef.current !== null) {
        window.clearTimeout(reconnectTimeoutRef.current);
      }
      reconnectTimeoutRef.current = window.setTimeout(() => {
        connectRef.current?.();
      }, 5000);
    };
  }, [add]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current !== null) {
        window.clearTimeout(reconnectTimeoutRef.current);
      }
      sseRef.current?.close();
    };
  }, [connect]);

  const unread = notifs.filter(n => !n.read).length;
  return { notifs, unread, markAllRead, clear };
}
