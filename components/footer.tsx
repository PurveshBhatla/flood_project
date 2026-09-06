import React from 'react';
import Link from 'next/link';
import { Waves, ShieldCheck, PhoneCall, AlertTriangle, ExternalLink } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border bg-card text-card-foreground">
      <div className="container mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
                <Waves className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold">FloodVision</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              AI-powered flood monitoring, risk prediction, and early warning intelligence system for communities and disaster response agencies.
            </p>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full w-fit">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              All Telemetry Systems Operational
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Platform Features</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/map" className="hover:text-brand-600 transition-colors">Interactive Flood Map</Link></li>
              <li><Link href="/how-it-works" className="hover:text-brand-600 transition-colors">AI Hydrological Pipeline</Link></li>
              <li><Link href="/safety" className="hover:text-brand-600 transition-colors">Safety & Evacuation Guide</Link></li>
              <li><Link href="/dashboard" className="hover:text-brand-600 transition-colors">Personal Risk Dashboard</Link></li>
            </ul>
          </div>

          {/* Emergency Hotlines */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Emergency Resources</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <PhoneCall className="h-4 w-4 text-red-500" />
                <span>Disaster Helpline: <strong>108 / 911</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span>Flood Rescue Ops: <strong>112</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-500" />
                <span>National Emergency Response</span>
              </li>
            </ul>
          </div>

          {/* Legal / Disclaimer */}
          <div>
            <h4 className="text-sm font-semibold mb-3">About & Contact</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/about" className="hover:text-brand-600 transition-colors">About FloodVision</Link></li>
              <li><Link href="/contact" className="hover:text-brand-600 transition-colors">Contact Support Team</Link></li>
              <li><span className="text-xs text-muted-foreground block mt-2">Data sourced from Open-Meteo & River Telemetry Gauges.</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row justify-between items-center text-xs text-muted-foreground gap-4">
          <p>© {new Date().getFullYear()} FloodVision Platform. Production-Ready Environmental AI.</p>
          <div className="flex gap-4">
            <Link href="/safety" className="hover:underline">Evacuation Terms</Link>
            <Link href="/about" className="hover:underline">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
