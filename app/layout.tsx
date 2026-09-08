import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/providers/auth-provider';
import { FloodSimulationProvider } from '@/lib/context/flood-simulation-context';
import { CitizenReportProvider } from '@/lib/context/citizen-report-context';
import FloatingSimulationSwitch from '@/components/dashboard/floating-simulation-switch';
import CitizenReportModal from '@/components/dashboard/citizen-report-modal';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FloodVision - AI Flood Monitoring, Risk Prediction & Alert Platform',
  description:
    'Real-time AI-powered flood monitoring, early warning alerts, hydrological predictions, and interactive satellite flood maps.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} min-h-screen flex flex-col antialiased bg-background text-foreground`}>
        <AuthProvider>
          <FloodSimulationProvider>
            <CitizenReportProvider>
              <FloatingSimulationSwitch />
              <CitizenReportModal />
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
            </CitizenReportProvider>
          </FloodSimulationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}


