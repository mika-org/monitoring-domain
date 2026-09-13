import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CertPulse — Monitoring Masa Aktif SSL Domain Realtime",
  description: "Aplikasi modern untuk memantau status validitas dan masa aktif sertifikat SSL/TLS domain secara realtime tanpa login.",
  keywords: ["monitoring domain", "ssl check", "masa aktif ssl", "cek sertifikat ssl", "tls expiry"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
