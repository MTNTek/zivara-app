import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    template: '%s | Zivara',
    default: 'Zivara — Find Trusted Work. Hire Trusted People.',
  },
  description:
    "The GCC's most transparent workforce marketplace. Verified employers, live hiring progress, and fair pay.",
  openGraph: {
    title: 'Zivara — Find Trusted Work. Hire Trusted People.',
    description: "The GCC's most trusted workforce marketplace.",
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#14B8A6',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" dir="ltr">
      <body>
        <a href="#main" className="skip-link">Skip to main content</a>
        <div id="main" style={{ width: '100%', minHeight: '100vh' }}>
          {children}
        </div>
      </body>
    </html>
  );
}
