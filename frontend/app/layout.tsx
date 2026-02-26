import type { Metadata } from "next";
import TopNav from "@/components/layout/TopNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "DCO Threat Triage — Elastic Agent Builder",
  description:
    "Autonomous AI agent for security alert triage — built with Elastic Agent Builder for the Elasticsearch Hackathon",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        <TopNav />
        <main className="pt-20 px-6 md:px-12 lg:px-16 max-w-[1440px] mx-auto pb-24">
          {children}
        </main>
      </body>
    </html>
  );
}
