import type { Metadata, Viewport } from "next";
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
  title: "Partes Diarios App",
  description: "Aplicación PWA para gestión de partes diarios",
  generator: "Next.js",
  manifest: "/manifest.json",
  keywords: ["partes", "diarios", "app", "pwa", "nextjs"],
  authors: [
    {
      name: "Partes Diarios Team",
      url: "https://partesdiarios.com",
    }
  ],
  openGraph: {
    type: "website",
    siteName: "Partes Diarios App",
    title: "Partes Diarios App",
    description: "Aplicación PWA para gestión de partes diarios",
  },
  twitter: {
    card: "summary",
    title: "Partes Diarios App",
    description: "Aplicación PWA para gestión de partes diarios",
  },
  icons: {
    shortcut: "/favicon.svg",
    apple: [
      { url: "/icon-192x192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/icon-256x256.svg", sizes: "256x256", type: "image/svg+xml" },
      { url: "/icon-384x384.svg", sizes: "384x384", type: "image/svg+xml" },
      { url: "/icon-512x512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#3b82f6",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Partes Diarios" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
