import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    template: '%s | Zivara',
    default: 'Zivara — Find Trusted Work. Hire Trusted People.',
  },
  description:
    "The GCC's most transparent workforce marketplace. Verified employers, live hiring progress, and fair pay.",
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
        <a href="#scroll-container" className="skip-link">Skip to main content</a>
        {/*
          #scroll-container: the single scrollable element.
          100vw × 100vh, hidden scrollbar, scroll-snap-type: y mandatory.
          Each .full-screen child snaps to fill the viewport exactly.
        */}
        <div id="scroll-container">
          {children}
        </div>
      </body>
    </html>
  );
}
