import React from 'react';
import Link from 'next/link';
import { Waves, PhoneCall, AlertTriangle, ShieldCheck, Info, CheckCircle2 } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border bg-card text-card-foreground">
      <div className="container mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-700 to-cyan-500 text-white shadow-sm">
                <Waves className="h-4 w-4" />
              </div>
              <span className="text-lg font-black tracking-tight">
                Flood<span className="text-brand-600">Watch</span>
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Community-Powered Waterlogging Intelligence System. Connecting citizens and civic authorities to identify, prioritize, and resolve localized urban waterlogging.
            </p>
            <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-lg w-fit">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Community Reporting Grid Active
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-foreground mb-3">Core Platform</h4>
            <ul className="space-y-2 text-xs text-muted-foreground font-semibold">
              <li><Link href="/map" className="hover:text-brand-600 transition-colors">Interactive Live Map</Link></li>
              <li><Link href="/incidents" className="hover:text-brand-600 transition-colors">Incident Feed & Priority Scores</Link></li>
              <li><Link href="/report" className="hover:text-brand-600 transition-colors">Report Waterlogging</Link></li>
              <li><Link href="/admin" className="hover:text-brand-600 transition-colors">Admin Verification Desk</Link></li>
              <li><Link href="/about" className="hover:text-brand-600 transition-colors">About & Scoring Methodology</Link></li>
            </ul>
          </div>

          {/* Emergency Hotlines */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-foreground mb-3">Emergency Helplines</h4>
            <ul className="space-y-2 text-xs text-muted-foreground font-semibold">
              <li className="flex items-center gap-2">
                <PhoneCall className="h-3.5 w-3.5 text-red-500" />
                <span>Disaster Management: <strong>108 / 112</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                <span>Civic Helplines: <strong>1916 (Municipal)</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-brand-600" />
                <span>Traffic Police Control Room</span>
              </li>
            </ul>
          </div>

          {/* Operational Disclaimer */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-foreground mb-3">Important Notice</h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Incident priority scores reflect community-reported water levels, road status, and spatial clustering to guide municipal response. <strong>The absence of reports does not indicate an area is safe.</strong>
            </p>
            <div className="mt-2 text-[10px] text-muted-foreground font-medium">
              Map tiles provided by OpenStreetMap. No paid third-party API keys required.
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row justify-between items-center text-[11px] text-muted-foreground gap-3">
          <p>© {new Date().getFullYear()} FloodWatch — Community-Powered Waterlogging Intelligence System.</p>
          <div className="flex gap-4">
            <Link href="/about" className="hover:underline font-semibold">Methodology</Link>
            <Link href="/contact" className="hover:underline font-semibold">Contact</Link>
            <Link href="/admin" className="hover:underline font-semibold text-amber-600">Admin Portal</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
