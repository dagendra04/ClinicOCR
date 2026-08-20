import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import Sidebar from '@/components/layout/Sidebar';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default:  'ClinicOCR — AI Prescription Digitization',
    template: '%s | ClinicOCR',
  },
  description:
    'AI-powered medical document digitization platform. Convert handwritten prescriptions into structured digital records instantly.',
  keywords: ['medical OCR', 'prescription digitization', 'clinic management', 'AI healthcare'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="flex min-h-screen bg-surface">
        <Sidebar />
        <main className="flex-1 flex flex-col min-h-screen ml-64">
          <div className="flex-1 p-8">
            {children}
          </div>
        </main>
        <Toaster
          position="top-right"
          richColors
          toastOptions={{
            style: {
              fontFamily: 'Inter, sans-serif',
              borderRadius: '12px',
            },
          }}
        />
      </body>
    </html>
  );
}
