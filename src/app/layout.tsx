import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "../styles/toast.css";
import { Analytics } from '@vercel/analytics/next';
import { GoogleAnalytics, GoogleSearchConsole } from '@/components/seo/google-analytics';
import { Toaster } from 'sonner';
import { FaviconManager } from '@/components/layout/FaviconManager';
import { SpeedInsights } from "@vercel/speed-insights/next";
import { BASE_URL, getGlobalStructuredData } from '@/lib/seo';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    template: '%s | Holistia',
    default: 'Holistia - Plataforma de Salud Integral y Bienestar en México',
  },
  description: "Plataforma líder de salud integral en México. Conecta con psicólogos certificados, terapeutas, coaches y nutriólogos. Consultas presenciales y online. Reserva tu cita hoy y transforma tu bienestar.",
  keywords: [
    "salud mental México",
    "psicólogos certificados México",
    "terapeutas México",
    "consultas psicológicas online",
    "terapia online México",
    "coaching México",
    "nutriólogos certificados",
    "bienestar integral",
    "salud emocional",
    "terapia psicológica",
    "consultas presenciales",
    "consultas virtuales",
    "eventos de bienestar",
    "talleres de salud mental",
    "workshops bienestar",
    "meditación guiada",
    "mindfulness México",
    "productos digitales bienestar",
    "programas de meditación",
    "workbooks salud mental",
    "cursos online bienestar",
    "recursos digitales salud",
    "retos de bienestar",
    "desafíos personales",
    "transformación personal",
    "hábitos saludables",
    "crecimiento personal",
    "desarrollo personal",
    "terapia cognitivo conductual",
    "psicoterapia México",
    "ansiedad y depresión",
    "estrés laboral",
    "autoestima",
    "relaciones interpersonales",
    "bienestar corporativo",
    "salud mental empresarial"
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
    url: BASE_URL,
    title: "Holistia - Plataforma de Salud Integral y Bienestar en México",
    description: "Plataforma líder de salud integral en México. Conecta con psicólogos certificados, terapeutas, coaches y nutriólogos. Consultas presenciales y online.",
    siteName: "Holistia",
    images: [
      {
        url: "/logos/holistia-og.png",
        width: 1200,
        height: 630,
        alt: "Holistia - Plataforma de Salud Integral y Bienestar en México",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@holistia_mx",
    creator: "@holistia_mx",
    title: "Holistia - Plataforma de Salud Integral y Bienestar en México",
    description: "Plataforma líder de salud integral. Conecta con psicólogos certificados, terapeutas, coaches y nutriólogos. Consultas presenciales y online.",
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
      { url: "/logos/holistia-logo-square-black.png", sizes: "32x32", type: "image/png" },
      { url: "/logos/holistia-logo-square-black.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/logos/holistia-logo-square-black.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/logos/holistia-logo-square-black.png",
  },
  manifest: "/manifest.json",
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
  },
  alternates: {
    canonical: BASE_URL,
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: getGlobalStructuredData() }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <FaviconManager />
        {children}
        <SpeedInsights />
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
