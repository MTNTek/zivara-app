import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    template: '%s | Zivara',
    default: 'Zivara — Find Trusted Work. Hire Trusted People.',
  },
  description:
    'The GCC\'s most trusted workforce marketplace. Find verified professionals in Construction, Solar Energy, Hospitality, Cleaning, Domestic Services, and more.',
  keywords: ['jobs UAE', 'GCC workforce', 'hire workers', 'construction jobs', 'hospitality jobs'],
  openGraph: {
    title: 'Zivara — Find Trusted Work. Hire Trusted People.',
    description: 'The GCC\'s most trusted workforce marketplace.',
    type: 'website',
    locale: 'en_US',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#14B8A6',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr" className="h-full w-full">
      <body className="min-h-full w-full antialiased">
        {/* Skip to main content — accessibility */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <div id="main-content" className="min-h-full w-full">
          {children}
        </div>
      </body>
    </html>
  );
}
