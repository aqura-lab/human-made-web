import type { Metadata } from "next";
import { Anton, Courier_Prime } from "next/font/google";
import "./globals.css";
import { SelectionPaint } from "@/components/craft/SelectionPaint";
import { CursorPaint } from "@/components/craft/CursorPaint";

const display = Anton({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

const typewriter = Courier_Prime({
  variable: "--font-type",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Human Made — Prove how your work was written",
  description:
    "A privacy-preserving authorship certificate for writers. Capture the process behind your words and let skeptics verify it. Not an AI detector.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${typewriter.variable}`}>
      <body>
        <SelectionPaint />
        <CursorPaint />
        {children}
      </body>
    </html>
  );
}
