'use client';

import { useCallback, useEffect, useRef } from 'react';

type SoundOptions = {
  /** Volume 0.0 → 1.0, default 0.6 */
  volume?: number;
  /** Src path (relative to /public), default '/sounds/notification.mp3' */
  src?: string;
};

/**
 * Hook phát âm thanh thông báo.
 * - Lazy-load: chỉ tạo Audio object lần đầu khi gọi play()
 * - Tự reset về đầu nếu âm thanh chưa kết thúc
 * - Xử lý autoplay policy: cần tương tác người dùng trước
 */
export function useNotificationSound(options?: SoundOptions) {
  const { volume = 0.6, src = '/sounds/notification.mp3' } = options ?? {};
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Preload sau lần tương tác đầu tiên (click / keypress)
  useEffect(() => {
    const preload = () => {
      if (!audioRef.current) {
        const audio = new Audio(src);
        audio.volume = volume;
        audio.preload = 'auto';
        audioRef.current = audio;
      }
    };
    window.addEventListener('click', preload, { once: true });
    window.addEventListener('keydown', preload, { once: true });
    return () => {
      window.removeEventListener('click', preload);
      window.removeEventListener('keydown', preload);
    };
  }, [src, volume]);

  const play = useCallback(() => {
    try {
      if (!audioRef.current) {
        const audio = new Audio(src);
        audio.volume = volume;
        audioRef.current = audio;
      }
      const audio = audioRef.current;
      audio.currentTime = 0;
      audio.volume = volume;
      audio.play().catch(() => {
        // Autoplay blocked – browser requires user interaction first
      });
    } catch {
      // Ignore
    }
  }, [src, volume]);

  return { play };
}
