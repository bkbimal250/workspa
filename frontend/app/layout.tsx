import type { Metadata } from 'next'
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
    default: 'Apply for Spa Jobs in India | Apply Female spa therapist jobs | Apply spa manager jobs | Work Spa Portal',
    template: '%s | Apply for Spa Jobs in India | Apply Female spa therapist jobs | Apply spa manager jobs | Work Spa Portal'
  },
  description: 'Find the best Work Spa near you. Apply directly to spas without login. Browse thousands of Work Spa by location, salary, and experience. Search for therapist, masseuse, and spa manager positions.',
  keywords: [
    'Apply for Spa Jobs in India', 'Apply Female spa therapist jobs', 'Apply spa manager jobs', 'Work Spa in india', 'spa job vacancy', 'spa job near me',
    'spa therapist jobs', 'massage therapist jobs', 'spa manager jobs',
    'beauty Work Spa', 'wellness jobs india', 'luxury Work Spa',
    'female therapist jobs', 'male therapist jobs', 'spa hiring today',
    'spa receptionist jobs', 'spa housekeeping jobs', 'beauty therapist jobs',
    'Work Spa Mumbai', 'Work Spa Delhi', 'Work Spa Bangalore',
    'Work Spa near me', 'spa careers', 'spa employment', 'spa hiring'
  ],
  authors: [{ name: 'Workspa - Work Spa Portal' }],
  creator: 'Workspa - Work Spa Portal',
  publisher: 'Workspa - Work Spa Portal',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: siteUrl,
    siteName: 'Workspa - Work Spa Portal',
    title: 'Apply for Spa Jobs in India | Apply Female spa therapist jobs | Apply spa manager jobs | Work Spa Portal',
    description: 'Find the best Work Spa near you. Apply directly to spas without login. Browse thousands of Work Spa by location, salary, and experience.',
    images: [
      {
        url: `${siteUrl}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'Work Spa Portal - Find Your Dream Spa Job',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Apply for Spa Jobs in India | Apply Female spa therapist jobs | Apply spa manager jobs | Work Spa Portal',
    description: 'Apply for Spa Jobs in India. Apply directly to spas without login. Browse thousands of Work Spa by location, salary, and experience. Search for therapist, masseuse, and spa manager positions.',
    images: [`${siteUrl}/og-image.jpg`],
    creator: '@spajobs',
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
  category: 'Job Portal',
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png' },
      { url: '/favicon.png', type: 'image/png', sizes: '32x32' },
      { url: '/favicon.png', type: 'image/png', sizes: '16x16' },
    ],
    apple: [
      { url: '/favicon.png', type: 'image/png' },
    ],
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

