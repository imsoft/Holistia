import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from '@vercel/analytics/next';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://holistia.io'),
  title: "Holistia - Plataforma de Salud Integral",
  description: "Conecta con profesionales de la salud certificados. Consultas presenciales y en línea para tu bienestar integral.",
  keywords: ["salud", "bienestar", "profesionales", "consultas", "terapia", "psicología", "medicina"],
  authors: [{ name: "Holistia" }],
  creator: "Holistia",
  publisher: "Holistia",
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "https://holistia.io",
    title: "Holistia - Plataforma de Salud Integral",
    description: "Conecta con profesionales de la salud certificados. Consultas presenciales y en línea para tu bienestar integral.",
    siteName: "Holistia",
    images: [
      {
        url: "/logos/holistia-black.png",
        width: 1200,
        height: 630,
        alt: "Holistia - Plataforma de Salud Integral",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Holistia - Plataforma de Salud Integral",
    description: "Conecta con profesionales de la salud certificados. Consultas presenciales y en línea para tu bienestar integral.",
    images: ["/logos/holistia-black.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/logos/holistia-black.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
