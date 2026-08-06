import type { Metadata } from "next";
import "./globals.css";

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
  return <html lang="en"><body>{children}</body></html>;
}
