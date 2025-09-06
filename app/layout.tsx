import React from "react"
import type { Metadata } from "next"
import { Inter, Poppins, Roboto } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Header } from "@/components/header"
import { LoadingBar } from "@/components/loading-bar"
// import CacheInvalidator from "@/components/cache-invalidator"
// import { Toaster } from "@/components/ui/sonner"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
})

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-roboto",
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://wallpaperhub.com'),
  title: {
    default: 'WallpaperHub - Premium Mobile Wallpapers & HD Backgrounds',
    template: '%s | WallpaperHub'
  },
  description: 'Discover and download thousands of high-quality mobile wallpapers. Browse categories like nature, abstract, minimalist, anime, and more. Free HD wallpapers for iPhone, Android, and all mobile devices.',
  keywords: [
    'mobile wallpapers',
    'phone backgrounds',
    'HD wallpapers',
    'iPhone wallpapers',
    'Android wallpapers',
    'free wallpapers',
    'nature wallpapers',
    'abstract wallpapers',
    'minimalist wallpapers',
    'anime wallpapers',
    'cute wallpapers',
    'aesthetic wallpapers'
  ],
  authors: [{ name: 'WallpaperHub Team' }],
  creator: 'WallpaperHub',
  publisher: 'WallpaperHub',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  generator: 'Next.js',
  applicationName: 'WallpaperHub',
  referrer: 'origin-when-cross-origin',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://wallpaperhub.com',
    siteName: 'WallpaperHub',
    title: 'WallpaperHub - Premium Mobile Wallpapers & HD Backgrounds',
    description: 'Discover and download thousands of high-quality mobile wallpapers. Browse categories like nature, abstract, minimalist, anime, and more.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'WallpaperHub - Premium Mobile Wallpapers',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WallpaperHub - Premium Mobile Wallpapers & HD Backgrounds',
    description: 'Discover and download thousands of high-quality mobile wallpapers. Browse categories like nature, abstract, minimalist, anime, and more.',
    creator: '@wallpaperhub',
    site: '@wallpaperhub',
    images: ['/twitter-image.jpg'],
  },
  appleWebApp: {
    capable: true,
    title: 'WallpaperHub',
    statusBarStyle: 'default',
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    yandex: process.env.YANDEX_VERIFICATION,
    // bing: process.env.BING_VERIFICATION, // Not supported by Next.js metadata API
  },
  category: 'Entertainment',
  classification: 'Wallpapers and Backgrounds',
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'theme-color': '#000000',
    'color-scheme': 'light dark',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Structured Data for the website
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "WallpaperHub",
    "alternateName": "WallpaperHub - Premium Mobile Wallpapers",
    "url": process.env.NEXT_PUBLIC_SITE_URL || "https://wallpaperhub.com",
    "description": "Discover and download thousands of high-quality mobile wallpapers. Browse categories like nature, abstract, minimalist, anime, and more.",
    "publisher": {
      "@type": "Organization",
      "name": "WallpaperHub",
      "url": process.env.NEXT_PUBLIC_SITE_URL || "https://wallpaperhub.com",
      "logo": {
        "@type": "ImageObject",
        "url": `${process.env.NEXT_PUBLIC_SITE_URL || 'https://wallpaperhub.com'}/icon-512.png`,
        "width": 512,
        "height": 512
      }
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${process.env.NEXT_PUBLIC_SITE_URL || 'https://wallpaperhub.com'}/search?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    },
    "sameAs": [
      "https://twitter.com/wallpaperhub",
      "https://instagram.com/wallpaperhub",
      "https://facebook.com/wallpaperhub"
    ]
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#000000" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: dark)" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icon-32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icon-16.png" />
      </head>
      <body className={`${inter.variable} ${poppins.variable} ${roboto.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {/* <CacheInvalidator /> */}
          <LoadingBar />
          <Header />
          {children}
          {/* <Toaster /> */}
        </ThemeProvider>
      </body>
    </html>
  )
}
