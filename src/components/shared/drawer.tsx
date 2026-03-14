"use client";

import type { ReactNode } from "react";

export function Drawer({
  open,
  title,
  children,
  onClose
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className={`fixed inset-0 z-50 ${open ? "pointer-events-auto" : "pointer-events-none"}`}>
      <div
        className={`absolute inset-0 bg-slate-900/25 transition ${open ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      <div
        className={`absolute right-0 top-0 h-full w-full max-w-md bg-white p-6 shadow-premium transition-transform ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <h3 className="text-xl font-bold text-ink">{title}</h3>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
