import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "../styles/toast.css";
import { Analytics } from '@vercel/analytics/next';
import { GoogleAnalytics, GoogleSearchConsole } from '@/components/seo/google-analytics';
import { Toaster } from 'sonner';

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
  title: {
    template: '%s | Holistia',
    default: 'Holistia - Plataforma de Salud Integral y Bienestar en México',
  },
  description: "Conecta con expertos certificados en México. Consultas presenciales y en línea para tu bienestar integral. Psicólogos, terapeutas, coaches, nutriólogos y más profesionales de la salud.",
  keywords: [
    "salud mental México",
    "bienestar integral",
    "psicólogos certificados",
    "terapeutas México",
    "consultas online",
    "consultas presenciales",
    "coaching",
    "nutrición",
    "terapia psicológica",
    "salud emocional",
    "mindfulness",
    "meditación",
    "eventos de bienestar",
    "talleres salud mental",
    "profesionales de la salud"
  ],
  authors: [{ name: "Holistia", url: "https://holistia.io" }],
  creator: "Holistia",
  publisher: "Holistia",
  applicationName: "Holistia",
  referrer: "origin-when-cross-origin",
  category: "Health & Wellness",
  classification: "Health Services Platform",
  openGraph: {
    type: "website",
    locale: "es_MX",
    url: "https://holistia.io",
    title: "Holistia - Plataforma de Salud Integral y Bienestar en México",
    description: "Conecta con expertos certificados en México. Consultas presenciales y en línea para tu bienestar integral. Psicólogos, terapeutas, coaches y más.",
    siteName: "Holistia",
    images: [
      {
        url: "/logos/holistia-og.png",
        width: 1200,
        height: 630,
        alt: "Holistia - Plataforma de Salud Integral",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@holistia_mx",
    creator: "@holistia_mx",
    title: "Holistia - Plataforma de Salud Integral y Bienestar",
    description: "Conecta con expertos certificados en México para tu bienestar integral.",
    images: ["/logos/holistia-og.png"],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/logos/holistia-black.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/logos/holistia-black.png" },
      { url: "/logos/holistia-black.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
  manifest: "/manifest.json",
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
  },
  alternates: {
    canonical: "https://holistia.io",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <GoogleSearchConsole />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Analytics />
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID} />
        <Toaster 
          position="top-center"
          expand={true}
          richColors={false}
          closeButton={true}
          toastOptions={{
            style: {
              background: 'hsl(var(--background))',
              color: 'hsl(var(--foreground))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '12px',
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
            },
            className: 'toast-custom',
            duration: 5000,
          }}
        />
      </body>
    </html>
  );
}
