import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Baloo_2 } from "next/font/google";
import "@/lib/fontawesome";
import "@/app/globals.css";
import { siteConfig } from "@/config/site";
import { AppProviders } from "@/providers/app-providers";

const bodyFont = Plus_Jakarta_Sans({
  subsets: ["latin", "vietnamese"],
  variable: "--font-body"
});

const displayFont = Baloo_2({
  subsets: ["latin", "vietnamese"],
  variable: "--font-display",
  weight: ["600", "700", "800"]
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: siteConfig.title,
  description: siteConfig.description,
  icons: {
    icon: [
      { url: "/favicon.ico?v=3", type: "image/x-icon", sizes: "any" },
      { url: "/favicons/favicon.png?v=2", type: "image/png", sizes: "32x32" },
      { url: "/favicons/favicon.gif?v=2", type: "image/gif" }
    ],
    shortcut: ["/favicon.ico?v=3"],
    apple: ["/favicons/favicon.png?v=2"]
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={`${bodyFont.variable} ${displayFont.variable} motion-surface`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
