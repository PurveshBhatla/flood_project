'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useCitizenReports, CitizenReport } from '@/lib/context/citizen-report-context';
import {
  X,
  MapPin,
  Camera,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Clock,
  Tag,
  Megaphone
} from 'lucide-react';

const DEPTH_OPTIONS: Array<{
  category: 'Ankle (<0.2m)' | 'Knee (0.2-0.5m)' | 'Waist (0.5-1.0m)' | 'Submerged (>1.0m)';
  depthVal: string;
  label: string;
  badgeClass: string;
  aiEstimateText: string;
}> = [
  {
    category: 'Ankle (<0.2m)',
    depthVal: '0.15m',
    label: 'Ankle (<0.2m)',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
    aiEstimateText: 'AI Visual Estimate: ~0.15m (Ankle-Deep / Low Risk)',
  },
  {
    category: 'Knee (0.2-0.5m)',
    depthVal: '0.45m',
    label: 'Knee (0.2-0.5m)',
    badgeClass: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
    aiEstimateText: 'AI Visual Estimate: ~0.45m (Knee-Deep / Moderate Risk)',
  },
  {
    category: 'Waist (0.5-1.0m)',
    depthVal: '0.75m',
    label: 'Waist (0.5-1.0m)',
    badgeClass: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
    aiEstimateText: 'AI Visual Estimate: ~0.75m (Waist-Deep / High Risk)',
  },
  {
    category: 'Submerged (>1.0m)',
    depthVal: '1.20m',
    label: 'Submerged (>1.0m)',
    badgeClass: 'bg-red-500/10 text-red-600 border-red-500/30',
    aiEstimateText: 'AI Visual Estimate: ~1.20m (Submerged / Critical Risk)',
  },
];

const AVAILABLE_TAGS = [
  'Stagnant Water',
  'Drain Overflowing',
  'Vehicle Trapped',
  'Fast Current',
  'Manhole Open',
];

export default function CitizenReportModal() {
  const { isReportModalOpen, closeReportModal, addReport } = useCitizenReports();

  const [streetName, setStreetName] = useState('Ward 12, Main Market Road');
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 19.076, lng: 72.8777 });
  const [locating, setLocating] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [selectedDepthIndex, setSelectedDepthIndex] = useState<number>(1); // Default Knee-deep
  const [selectedTags, setSelectedTags] = useState<string[]>(['Drain Overflowing']);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-revoke local object URL on unmount or file change to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  if (!isReportModalOpen) return null;

  // Handle Geolocation API
  const handleDetectLocation = () => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setStreetName(`GPS Location (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`);
          setLocating(false);
        },
        () => {
          setLocating(false);
          setStreetName('Ward 12, Main Market Road (Fallback)');
        },
        { timeout: 8000 }
      );
    } else {
      setStreetName('Ward 12, Main Market Road (Fallback)');
    }
  };

  // Handle File Upload Change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      const activeOption = DEPTH_OPTIONS[selectedDepthIndex];
      const now = new Date();
      const timestampText = `Just now - ${now.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })}`;

      const newReport: CitizenReport = {
        id: `cit-rep-${Date.now()}`,
        latitude: coords.lat,
        longitude: coords.lng,
        streetName: streetName.trim() || 'Monitored Flood Zone',
        waterDepth: activeOption.depthVal,
        waterDepthCategory: activeOption.category,
        aiEstimate: activeOption.aiEstimateText,
        tags: selectedTags.length > 0 ? selectedTags : ['Stagnant Water'],
        imageUrl: previewUrl || undefined,
        timestamp: timestampText,
        votes: 1,
        status: 'Citizen Verified (1 Vote)',
      };

      addReport(newReport);
      setIsSubmitting(false);
      setShowSuccessToast(true);

      setTimeout(() => {
        setShowSuccessToast(false);
        closeReportModal();
        // Reset form
        setSelectedFile(null);
        setPreviewUrl(null);
        setSelectedTags(['Drain Overflowing']);
      }, 1200);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-background border border-border rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-4 bg-gradient-to-r from-brand-600 to-cyan-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-md">
              <Megaphone className="h-5 w-5 text-yellow-300" />
            </div>
            <div>
              <h2 className="font-extrabold text-base leading-tight">
                📢 Citizen Incident Desk (Jal-Bharo Report)
              </h2>
              <p className="text-[11px] text-white/90 font-medium">
                Ground-Truth Real-Time Telemetry & AI Estimator
              </p>
            </div>
          </div>
          <button
            onClick={closeReportModal}
            className="p-1.5 rounded-xl hover:bg-white/20 text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* STEP A: AUTO-LOCATION DETECTION */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-muted/50 border border-border">
            <div className="flex items-center justify-between">
              <label className="font-extrabold text-foreground flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                <MapPin className="h-4 w-4 text-brand-600" /> Step A: Incident Location
              </label>
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={locating}
                className="px-2.5 py-1 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-[10px] flex items-center gap-1 transition-colors shadow"
              >
                <RefreshCw className={`h-3 w-3 ${locating ? 'animate-spin' : ''}`} />
                {locating ? 'Detecting...' : '📍 Use My Current Location'}
              </button>
            </div>

            <input
              type="text"
              value={streetName}
              onChange={(e) => setStreetName(e.target.value)}
              placeholder="Enter street name, landmark, or ward number..."
              className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
              required
            />
            <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
              <span>Coordinates:</span>
              <strong className="text-foreground">{coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</strong>
            </div>
          </div>

          {/* STEP B: PHOTO/VIDEO UPLOAD WITH INSTANT AI ANALYSIS PREVIEW */}
          <div className="space-y-3 p-3.5 rounded-2xl bg-muted/50 border border-border">
            <label className="font-extrabold text-foreground flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
              <Camera className="h-4 w-4 text-brand-600" /> Step B: Photo / Video & AI Estimator
            </label>

            {/* Upload Drag & Drop Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border hover:border-brand-500 rounded-2xl p-4 text-center cursor-pointer bg-background/60 hover:bg-muted/40 transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="hidden"
              />
              {previewUrl ? (
                <div className="space-y-2">
                  <img
                    src={previewUrl}
                    alt="Upload Preview"
                    className="max-h-40 mx-auto rounded-xl object-cover shadow-md border border-border"
                  />
                  <span className="text-[11px] font-bold text-brand-600 block">
                    📸 Photo Attached (Click to change)
                  </span>
                </div>
              ) : (
                <div className="space-y-1.5 py-2">
                  <Upload className="h-7 w-7 text-muted-foreground mx-auto" />
                  <p className="font-extrabold text-xs text-foreground">
                    Upload Flood Photo or Short Video
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Supports JPG, PNG, MP4 (Instant Local AI Analysis)
                  </p>
                </div>
              )}
            </div>

            {/* SIMULATED VISUAL AI WATER ESTIMATOR BADGE */}
            <div className="p-3 rounded-xl bg-slate-900 text-white border border-slate-800 space-y-2">
              <div className="flex items-center gap-1.5 text-yellow-400 font-extrabold text-[11px]">
                <Sparkles className="h-4 w-4 text-yellow-400 animate-spin" />
                <span>{DEPTH_OPTIONS[selectedDepthIndex].aiEstimateText}</span>
              </div>

              {/* Segmented Picker / Slider */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
                  Verify / Adjust Estimated Depth:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {DEPTH_OPTIONS.map((opt, idx) => (
                    <button
                      key={opt.category}
                      type="button"
                      onClick={() => setSelectedDepthIndex(idx)}
                      className={`px-2 py-1.5 rounded-lg text-[10px] font-black transition-all border ${
                        selectedDepthIndex === idx
                          ? 'bg-brand-600 text-white border-brand-400 shadow-md ring-2 ring-brand-400/40'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* STEP C: INCIDENT TAGS & TIMESTAMP */}
          <div className="space-y-2.5 p-3.5 rounded-2xl bg-muted/50 border border-border">
            <label className="font-extrabold text-foreground flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
              <Tag className="h-4 w-4 text-brand-600" /> Step C: Incident Tags & Timestamp
            </label>

            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all border ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-sm'
                        : 'bg-background text-muted-foreground border-input hover:text-foreground'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {tag}
                  </button>
                );
              })}
            </div>

            <div className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1 pt-1 border-t border-border/40">
              <Clock className="h-3.5 w-3.5 text-brand-600" />
              <span>Timestamp: <strong>Just now - 08 Sep 2026</strong></span>
            </div>
          </div>

          {/* SUCCESS ALERT TOAST */}
          {showSuccessToast && (
            <div className="p-3 rounded-xl bg-emerald-600 text-white font-extrabold text-xs shadow-xl flex items-center gap-2 animate-bounce">
              <CheckCircle2 className="h-5 w-5 text-white" />
              <span>✅ Report Submitted! Citizen verification added to nowcast grid.</span>
            </div>
          )}

          {/* Submit Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border shrink-0">
            <button
              type="button"
              onClick={closeReportModal}
              className="px-4 py-2.5 rounded-xl border border-input bg-background hover:bg-muted text-foreground text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-black transition-all shadow-lg flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Verifying incident telemetry...
                </>
              ) : (
                '📢 Submit Citizen Report'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
