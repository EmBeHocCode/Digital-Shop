import type { ReactNode } from "react";
import { MainHeader } from "@/components/layout/main-header";
import { SiteFooter } from "@/components/layout/site-footer";

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <MainHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-8 lg:px-6">
        {children}
      </main>
      <div className="mx-auto w-full max-w-7xl px-4 lg:px-6">
        <SiteFooter />
      </div>
    </div>
  );
}
