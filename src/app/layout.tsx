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
  title: "Holistia - Plataforma de Salud Integral",
  description: "Conecta con expertos certificados. Consultas presenciales y en línea para tu bienestar integral.",
  keywords: ["salud", "bienestar", "profesionales", "consultas", "terapia", "psicología", "medicina"],
  authors: [{ name: "Holistia" }],
  creator: "Holistia",
  publisher: "Holistia",
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "https://holistia.io",
    title: "Holistia - Plataforma de Salud Integral",
    description: "Conecta con expertos certificados. Consultas presenciales y en línea para tu bienestar integral.",
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
    description: "Conecta con expertos certificados. Consultas presenciales y en línea para tu bienestar integral.",
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
