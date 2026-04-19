import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import "./globals.css";

import AuthSync from "@/components/AuthSync";

export const metadata: Metadata = {
  title: "FlashCard Engine — AI-Powered Spaced Repetition",
  description: "Transform any PDF into smart flashcards with AI. Spaced repetition helps you remember forever.",
  icons: { icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚡</text></svg>" }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange={false}>
          <AuthSync />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
