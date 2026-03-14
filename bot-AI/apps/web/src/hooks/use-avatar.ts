'use client';

import { useState, useEffect, useCallback } from 'react';

const AVATAR_KEY = 'bot-avatar';

export function useAvatar() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(AVATAR_KEY);
      if (stored) setAvatarUrl(stored);
    } catch {}
  }, []);

  const saveAvatar = useCallback((dataUrl: string) => {
    try {
      localStorage.setItem(AVATAR_KEY, dataUrl);
    } catch {}
    setAvatarUrl(dataUrl);
  }, []);

  const clearAvatar = useCallback(() => {
    try {
      localStorage.removeItem(AVATAR_KEY);
    } catch {}
    setAvatarUrl(null);
  }, []);

  return { avatarUrl, saveAvatar, clearAvatar };
}
