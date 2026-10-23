import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/providers/auth-provider';
import { FloodSimulationProvider } from '@/lib/context/flood-simulation-context';
import { CitizenReportProvider } from '@/lib/context/citizen-report-context';
import CitizenReportModal from '@/components/dashboard/citizen-report-modal';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FloodWatch — Community-Powered Waterlogging Intelligence System',
  description:
    'Citizen-powered street-level waterlogging reporting, spatial duplicate detection, potential hotspot identification, and municipal response prioritization.',
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


