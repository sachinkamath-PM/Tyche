import type { Metadata } from "next";
import { DM_Sans, Manrope } from "next/font/google";
import "./globals.css";

const body = DM_Sans({ variable: "--font-body", subsets: ["latin"] });
const display = Manrope({ variable: "--font-display", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: "Tyche — Every application, your best one",
  description: "Create ATS-ready resumes tailored to every opportunity.",
  openGraph: {
    title: "Tyche — Every application, your best one",
    description: "Create ATS-ready resumes tailored to every opportunity.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Tyche resume workspace" }],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${body.variable} ${display.variable}`}>{children}</body></html>;
}
