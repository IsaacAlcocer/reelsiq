import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "ReelsIQ — Instagram Reel Analysis",
  description:
    "Bulk transcript analysis powered by Instagram growth theory. Extract hooks, structures, and strategies from top-performing Reels.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0a0a0a] text-[#ededed] min-h-screen font-[family-name:var(--font-geist-sans)]`}
      >
        {/* Help icon — fixed in top-right */}
        <a
          href="/guide"
          aria-label="Guide & Glossary"
          className="fixed top-4 right-4 z-50 flex h-8 w-8 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900/80 backdrop-blur text-zinc-500 hover:text-violet-400 hover:border-violet-500/40 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </a>
        {children}
      </body>
    </html>
  );
}
