import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { SolanaProvider } from "../lib/solana-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "OSA Agent World — Control Plane",
  description: "Operacyjny widok agentów, łańcuchów, dowodów, rozliczeń i infrastruktury OSA."
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pl">
      <body>
        <SolanaProvider>{children}</SolanaProvider>
      </body>
    </html>
  );
}
