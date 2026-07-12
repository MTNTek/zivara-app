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

        {/*
          Outer shell: full browser viewport, background shows as the 2.5% gap.
          Inner wrapper: 95vw × 95vh, centred, rounded, clipped.
          This gives the "floating card inside the browser" effect.
        */}
        <div
          style={{
            width: '100vw',
            minHeight: '100vh',
            backgroundColor: '#E2E8F0',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            padding: '2.5vh 2.5vw',
            boxSizing: 'border-box',
          }}
        >
          <div
            id="main"
            style={{
              width: '95vw',
              minHeight: '95vh',
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 4px 32px rgba(0,0,0,0.10)',
            }}
          >
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
