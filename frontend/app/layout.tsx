import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import Footer from '@/components/Footer'
import ChatWidget from '@/components/Chatbot/ChatWidget'
import ContactPopupTrigger from '@/components/ContactPopupTrigger'
import { Toaster } from 'sonner'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://workspa.in';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl || 'https://workspa.in'),

  title: {
    default: 'Female Spa Therapist Jobs in Mumbai, Navi Mumbai & Thane | Workspa',
    template: '%s | Female Spa Therapist Jobs in Mumbai, Navi Mumbai & Thane | Workspa'
  },

  description:
    'Find female spa therapist, spa receptionist, beautician, and spa manager jobs in Mumbai, Navi Mumbai, and Thane. Apply to spa job vacancies near you without login. Explore latest spa hiring in all Mumbai areas.',

  keywords: [
    // Primary job roles
    'female spa therapist jobs Mumbai',
    'female spa therapist jobs Navi Mumbai',
    'female spa therapist jobs Thane',

    'spa receptionist jobs Mumbai',
    'female spa receptionist jobs Mumbai',

    'beautician jobs Mumbai',
    'beautician jobs Navi Mumbai',
    'beautician jobs Thane',

    'spa manager jobs Mumbai',
    'male spa manager jobs Mumbai',

    // Location specific
    'spa jobs Mumbai',
    'spa jobs Navi Mumbai',
    'spa jobs Thane',

    'spa jobs near me Mumbai',
    'spa jobs near me Navi Mumbai',
    'spa jobs near me Thane',

    // Area based intent
    'spa job vacancy Mumbai',
    'spa job vacancy Navi Mumbai',
    'spa job vacancy Thane',

    'spa therapist jobs near me',
    'spa hiring Mumbai',
    'spa hiring Navi Mumbai',
    'spa hiring Thane',

    // Industry keywords
    'wellness jobs Mumbai',
    'spa careers Mumbai',
    'massage therapist jobs Mumbai',

    // Brand
    'Workspa jobs',
    'Workspa Mumbai',
    'Workspa Navi Mumbai',
    'Workspa Thane'
  ],

  authors: [{ name: 'Workspa - Spa Job Portal Mumbai' }],
  creator: 'Workspa',
  publisher: 'Workspa',

  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },

  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: siteUrl,
    siteName: 'Workspa - Spa Jobs Mumbai',

    title:
      'Female Spa Therapist, Receptionist & Beautician Jobs in Mumbai | Workspa',

    description:
      'Apply for female spa therapist, spa receptionist, beautician, and spa manager jobs in Mumbai, Navi Mumbai, and Thane. Find spa jobs near you and apply instantly.',

    images: [
      {
        url: `${siteUrl}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'Workspa - Spa Jobs in Mumbai',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',

    title:
      'Spa Therapist & Beautician Jobs in Mumbai, Navi Mumbai & Thane | Workspa',

    description:
      'Find female spa therapist, receptionist, beautician, and spa manager jobs in Mumbai, Navi Mumbai, and Thane. Apply to latest spa job vacancies near you.',

    images: [`${siteUrl}/og-image.jpg`],
    creator: '@workspa',
  },

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

  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
  },

  alternates: {
    canonical: siteUrl,
  },

  category: 'Spa Job Portal Mumbai',

  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png' },
      { url: '/favicon.png', type: 'image/png', sizes: '32x32' },
      { url: '/favicon.png', type: 'image/png', sizes: '16x16' },
    ],
    apple: [{ url: '/favicon.png', type: 'image/png' }],
    shortcut: '/favicon.png',
  },
}


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en-IN">
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="shortcut icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        <meta name="theme-color" content="#115e59" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </head>
      <body>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-TRM88503RP"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-TRM88503RP');
          `}
        </Script>
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
          <ChatWidget />
          <ContactPopupTrigger />
          <Toaster
            position="top-right"
            richColors
            closeButton
            toastOptions={{
              style: {
                background: 'white',
                border: '1px solid #e5e7eb',
              },
              classNames: {
                success: 'bg-green-50 border-green-200',
                error: 'bg-red-50 border-red-200',
                warning: 'bg-yellow-50 border-yellow-200',
                info: 'bg-blue-50 border-blue-200',
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  )
}

