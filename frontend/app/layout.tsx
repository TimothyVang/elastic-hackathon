import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import Sidebar from "@/components/layout/Sidebar";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-sans" });
const jetBrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "DCO Threat Triage Dashboard",
  description:
    "Security operations dashboard for the DCO Threat Triage Agent — Elasticsearch Agent Builder Hackathon",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${spaceGrotesk.variable} ${jetBrainsMono.variable} font-sans`}>
        <Sidebar />
        <main className="ml-[18rem] min-h-screen p-8 pr-12 w-[calc(100%-18rem)] relative z-10">{children}</main>
      </body>
    </html>
  );
}
