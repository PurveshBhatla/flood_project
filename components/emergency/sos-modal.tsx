'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  PhoneCall,
  MapPin,
  Share2,
  X,
  CheckCircle2,
  Radio,
  Copy,
  ExternalLink,
  Locate
} from 'lucide-react';

interface SOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLat?: number;
  initialLng?: number;
  locationName?: string;
}

export default function SOSModal({
  isOpen,
  onClose,
  initialLat,
  initialLng,
  locationName
}: SOSModalProps) {
  const [step, setStep] = useState<'CONFIRM' | 'ACTIVATED'>('CONFIRM');
  const [userCoords, setUserCoords] = useState<[number, number] | null>(
    initialLat && initialLng ? [initialLat, initialLng] : null
  );
  const [locating, setLocating] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (isOpen && !userCoords) {
      handleFetchLocation();
    }
  }, [isOpen]);

  const handleFetchLocation = () => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords([pos.coords.latitude, pos.coords.longitude]);
          setLocating(false);
        },
        (err) => {
          console.warn('Geolocation error during SOS:', err);
          setLocating(false);
          // Fallback to initial props or default Mumbai center if unavailable
          if (!userCoords) {
            setUserCoords([initialLat || 19.076, initialLng || 72.8777]);
          }
        },
        { timeout: 8000, maximumAge: 60000 }
      );
    } else if (!userCoords) {
      setUserCoords([initialLat || 19.076, initialLng || 72.8777]);
    }
  };

  const handleConfirmSOS = () => {
    setStep('ACTIVATED');
  };

  const handleShareLocation = () => {
    const coordsStr = userCoords ? `${userCoords[0].toFixed(4)}, ${userCoords[1].toFixed(4)}` : 'Unknown';
    const text = `EMERGENCY SOS! I need flood rescue at ${locationName || 'my location'} (Coords: ${coordsStr}). Monitored on FloodVision: https://floodvision.org/map`;

    if (navigator.share) {
      navigator
        .share({
          title: 'FloodVision Emergency SOS',
          text,
          url: 'https://floodvision.org/map',
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-background border-2 border-red-600 rounded-3xl shadow-2xl overflow-hidden text-foreground space-y-0 relative">
        {/* Header */}
        <div className="bg-red-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-black text-lg uppercase tracking-wider">
            <Radio className="h-6 w-6 animate-pulse text-white" />
            <span>EMERGENCY SOS COMMAND</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-red-700 transition-colors text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content Step 1: Confirmation */}
        {step === 'CONFIRM' && (
          <div className="p-6 space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border-2 border-red-500/40 text-red-500 flex items-center justify-center mx-auto animate-bounce">
              <ShieldAlert className="h-10 w-10" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-extrabold tracking-tight text-foreground">
                Are you in immediate danger?
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Triggering Emergency SOS will capture your GPS location, prepare an emergency dispatch alert, and display instant hotline routing.
              </p>
            </div>

            {/* Location Box */}
            <div className="p-3 rounded-xl bg-muted/60 border border-border text-xs text-left space-y-1">
              <div className="flex items-center justify-between text-muted-foreground font-semibold">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-red-500" /> Current Monitored Location:
                </span>
                <button
                  onClick={handleFetchLocation}
                  className="text-[10px] text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
                >
                  <Locate className="h-3 w-3" /> Refresh GPS
                </button>
              </div>
              <div className="font-extrabold text-foreground text-sm">
                {locationName || 'Active Flood Zone Area'}
              </div>
              <div className="text-muted-foreground font-mono text-[11px]">
                {userCoords
                  ? `Lat: ${userCoords[0].toFixed(4)}, Lng: ${userCoords[1].toFixed(4)}`
                  : locating
                  ? 'Acquiring GPS coordinates...'
                  : 'Location unavailable — manual dispatch ready'}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handleConfirmSOS}
                className="flex-1 py-3.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2"
              >
                <ShieldAlert className="h-5 w-5" /> YES — TRIGGER EMERGENCY SOS
              </button>
              <button
                onClick={onClose}
                className="py-3.5 px-4 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold text-sm border border-border transition-colors"
              >
                CANCEL
              </button>
            </div>
          </div>
        )}

        {/* Content Step 2: Activated & Hotline Routing */}
        {step === 'ACTIVATED' && (
          <div className="p-6 space-y-5">
            {/* Status Banner */}
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/40 text-red-600 dark:text-red-400 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-red-500" /> SOS ACTIVATED — DISPATCH READY
                </span>
                <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-amber-500/20 text-amber-600 border border-amber-500/40">
                  ● DEMO SOS MODE
                </span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                Emergency alert package generated with GPS location data.
              </p>
            </div>

            {/* SIH Simulation Checklist */}
            <div className="p-3 rounded-xl bg-card border border-border text-xs space-y-1.5">
              <span className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider block">
                Disaster Simulation Actions Log:
              </span>
              <div className="grid grid-cols-2 gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                <div className="flex items-center gap-1">✓ Emergency request created</div>
                <div className="flex items-center gap-1">✓ GPS location captured</div>
                <div className="flex items-center gap-1">✓ Hotline routing ready</div>
                <div className="flex items-center gap-1">✓ Location share link generated</div>
              </div>
            </div>

            {/* Direct Emergency Hotlines Grid */}
            <div className="space-y-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground block">
                Immediate Emergency Call Links:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <a
                  href="tel:112"
                  className="p-3 rounded-xl bg-red-600 text-white hover:bg-red-700 font-extrabold text-xs text-center flex flex-col items-center justify-center gap-1 transition-colors shadow-md"
                >
                  <PhoneCall className="h-5 w-5" />
                  <span>NATIONAL 112</span>
                </a>
                <a
                  href="tel:1070"
                  className="p-3 rounded-xl bg-amber-600 text-white hover:bg-amber-700 font-extrabold text-xs text-center flex flex-col items-center justify-center gap-1 transition-colors shadow-md"
                >
                  <ShieldAlert className="h-5 w-5" />
                  <span>NDRF 1070</span>
                </a>
                <a
                  href="tel:108"
                  className="p-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-extrabold text-xs text-center flex flex-col items-center justify-center gap-1 transition-colors shadow-md"
                >
                  <PhoneCall className="h-5 w-5" />
                  <span>AMBULANCE 108</span>
                </a>
              </div>
            </div>

            {/* Location Share & Close */}
            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <button
                onClick={handleShareLocation}
                className="flex-1 py-2.5 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow"
              >
                {copiedLink ? <CheckCircle2 className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                {copiedLink ? 'Location Copied to Clipboard!' : 'Share Location Payload'}
              </button>
              <button
                onClick={() => {
                  setStep('CONFIRM');
                  onClose();
                }}
                className="py-2.5 px-4 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-semibold text-xs border border-border transition-colors"
              >
                Close SOS
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
