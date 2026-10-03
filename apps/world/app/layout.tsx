import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { SolanaProvider } from "../lib/solana-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "OSA Crypto World — Web4 Alpha",
  description: "A living agentic Web3 world for chains, DeFi, agents, nodes and verifiable execution."
};

export const viewport: Viewport = {
  themeColor: "#05050a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <SolanaProvider>{children}</SolanaProvider>
      </body>
    </html>
  );
}
