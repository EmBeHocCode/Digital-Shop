'use client';

import { useState, useCallback, useEffect } from 'react';

const BOT_AVATAR_KEY = 'bot-avatar';
const ADMIN_AVATAR_KEY = 'admin-avatar';
const ADMIN_NAME_KEY = 'admin-display-name';

export function useProfileAvatars() {
  const [botAvatar, setBotAvatarState] = useState<string | null>(null);
  const [adminAvatar, setAdminAvatarState] = useState<string | null>(null);
  const [adminDisplayName, setAdminDisplayNameState] = useState<string>('');

  useEffect(() => {
    try { const v = localStorage.getItem(BOT_AVATAR_KEY); if (v) setBotAvatarState(v); } catch {}
    try { const v = localStorage.getItem(ADMIN_AVATAR_KEY); if (v) setAdminAvatarState(v); } catch {}
    try { const v = localStorage.getItem(ADMIN_NAME_KEY); if (v) setAdminDisplayNameState(v); } catch {}
  }, []);

  const saveBotAvatar = useCallback((dataUrl: string) => {
    try { localStorage.setItem(BOT_AVATAR_KEY, dataUrl); } catch {}
    setBotAvatarState(dataUrl);
  }, []);

  const clearBotAvatar = useCallback(() => {
    try { localStorage.removeItem(BOT_AVATAR_KEY); } catch {}
    setBotAvatarState(null);
  }, []);

  const saveAdminAvatar = useCallback((dataUrl: string) => {
    try { localStorage.setItem(ADMIN_AVATAR_KEY, dataUrl); } catch {}
    setAdminAvatarState(dataUrl);
  }, []);

  const clearAdminAvatar = useCallback(() => {
    try { localStorage.removeItem(ADMIN_AVATAR_KEY); } catch {}
    setAdminAvatarState(null);
  }, []);

  const saveAdminDisplayName = useCallback((name: string) => {
    try { localStorage.setItem(ADMIN_NAME_KEY, name); } catch {}
    setAdminDisplayNameState(name);
  }, []);

  return {
    botAvatar,
    adminAvatar,
    adminDisplayName,
    saveBotAvatar,
    clearBotAvatar,
    saveAdminAvatar,
    clearAdminAvatar,
    saveAdminDisplayName,
  };
}
