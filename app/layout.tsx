import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import "./globals.css";

import AuthSync from "@/components/AuthSync";

export const metadata: Metadata = {
  title: "FlashCard Engine — AI-Powered Spaced Repetition",
  description: "Transform any PDF into smart flashcards with AI. Spaced repetition helps you remember forever.",
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
