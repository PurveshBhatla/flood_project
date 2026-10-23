'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin,
  Camera,
  Upload,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Car,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Info
} from 'lucide-react';

const SEVERITY_OPTIONS = [
  {
    category: 'ANKLE',
    depthCm: 15,
    title: 'Mild / Ankle-Deep',
    range: '< 15 cm depth',
    description: 'Puddles forming, safe for all vehicles and pedestrians.',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  },
  {
    category: 'KNEE',
    depthCm: 35,
    title: 'Moderate / Knee-Deep',
    range: '15 – 45 cm depth',
    description: 'Water up to car exhausts and motorcycle engines. Pedestrian wading required.',
    badgeClass: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  },
  {
    category: 'WAIST',
    depthCm: 65,
    title: 'High / Waist-Deep',
    range: '45 – 90 cm depth',
    description: 'Cars and rickshaws risk stalling. High-clearance vehicles only.',
    badgeClass: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
  },
  {
    category: 'SUBMERGED',
    depthCm: 105,
    title: 'Severe / Submerged',
    range: '> 90 cm depth',
    description: 'Road completely impassable. Vehicles floating or abandoned. Urgent danger.',
    badgeClass: 'bg-red-500/10 text-red-600 border-red-500/30',
  },
];

const WATER_TRENDS = [
  { value: 'RISING', label: '📈 Rising rapidly', desc: 'Water level is visibly increasing' },
  { value: 'STABLE', label: '➡️ Stable / Holding', desc: 'Water level remains constant' },
  { value: 'FALLING', label: '📉 Falling / Receding', desc: 'Water is draining away' },
  { value: 'UNKNOWN', label: '❓ Unknown', desc: 'Trend not observed' },
];

const ROAD_CONDITIONS = [
  { value: 'PASSABLE', label: '✅ Passable', desc: 'Traffic can move cautiously' },
  { value: 'DIFFICULT', label: '⚠️ Difficult / Crawl', desc: 'Major slowdown, low vehicles at risk' },
  { value: 'BLOCKED', label: '⛔ Blocked / Impassable', desc: 'Traffic halted, stranded vehicles' },
  { value: 'UNKNOWN', label: '❓ Unknown', desc: 'Condition not confirmed' },
];

const HAZARD_TAG_OPTIONS = [
  'OPEN_MANHOLE',
  'STALLED_VEHICLE',
  'FAST_CURRENT',
  'DRAIN_OVERFLOW',
  'TREE_FALLEN',
  'ELECTRIC_POLE_RISK',
];

export default function ReportWaterloggingPage() {
  const router = useRouter();

  // Form State
  const [streetName, setStreetName] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('Mumbai');
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 19.076, lng: 72.8777 });
  const [locating, setLocating] = useState(false);
  const [locationDetected, setLocationDetected] = useState(false);

  const [selectedSeverity, setSelectedSeverity] = useState('KNEE');
  const [waterLevelTrend, setWaterLevelTrend] = useState('RISING');
  const [roadCondition, setRoadCondition] = useState('DIFFICULT');
  const [selectedTags, setSelectedTags] = useState<string[]>(['DRAIN_OVERFLOW']);
  const [description, setDescription] = useState('');
  const [reportedBy, setReportedBy] = useState('');

  // Image Upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Clean object URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Request HTML5 Geolocation with user permission
  const handleDetectLocation = () => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      setLocating(true);
      setErrorMessage('');
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setCoords({ lat, lng });
          setLocationDetected(true);
          setLocating(false);

          // Reverse geocode via Nominatim
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
            );
            if (res.ok) {
              const data = await res.json();
              if (data && data.display_name) {
                const parts = data.display_name.split(',');
                setStreetName(parts.slice(0, 2).join(',').trim());
                if (data.address?.city || data.address?.town) {
                  setCity(data.address.city || data.address.town);
                }
              }
            }
          } catch {
            setStreetName(`GPS Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
          }
        },
        (err) => {
          setLocating(false);
          setErrorMessage('Could not fetch GPS location. Please enter street name manually.');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setErrorMessage('Geolocation is not supported by your browser.');
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!streetName.trim()) {
      setErrorMessage('Please enter the street name or specific landmark.');
      return;
    }

    setSubmitting(true);

    try {
      const selectedOption = SEVERITY_OPTIONS.find((s) => s.category === selectedSeverity);

      const payload = {
        latitude: coords.lat,
        longitude: coords.lng,
        streetName: streetName.trim(),
        landmark: landmark.trim() || undefined,
        city: city.trim() || 'Mumbai',
        depthCategory: selectedSeverity,
        depthCm: selectedOption?.depthCm || 35,
        waterLevelTrend,
        roadCondition,
        hazardTags: selectedTags,
        description: description.trim() || undefined,
        photoUrl: previewUrl || undefined,
        reportedBy: reportedBy.trim() || 'Citizen Reporter',
      };

      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit report');
      }

      setSubmissionResult(data);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'An unexpected error occurred while saving your report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 md:px-8 py-10 max-w-4xl space-y-8">
      {/* Page Header */}
      <div className="space-y-2 border-b border-border pb-6">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-600 uppercase tracking-wider">
          <AlertTriangle className="h-4 w-4" />
          <span>Citizen Ground-Truth Telemetry</span>
        </div>
        <h1 className="text-3xl font-black text-foreground">
          Report Waterlogging Incident
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Submit hyper-local waterlogging observations to notify fellow commuters and alert municipal emergency response units.
        </p>
      </div>

      {/* Submission Success State */}
      {submissionResult ? (
        <div className="p-8 rounded-3xl bg-card border-2 border-emerald-500/40 shadow-xl space-y-6 animate-fade-in">
          <div className="flex items-center gap-3 text-emerald-600">
            <div className="p-2 rounded-2xl bg-emerald-500/10">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-black text-foreground">Report Successfully Registered & Saved</h2>
              <p className="text-xs text-muted-foreground">Persistently saved in the FloodWatch verified database.</p>
            </div>
          </div>

          {/* Duplicate Alert Notice */}
          {submissionResult.duplicateInfo?.isDuplicate && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs space-y-1">
              <strong className="font-extrabold flex items-center gap-1.5">
                <Info className="h-4 w-4" /> Proximity Duplicate Flagged (~{submissionResult.duplicateInfo.distanceMeters}m away)
              </strong>
              <p>
                A similar active report exists within 150m. Your report has been linked to parent incident #{submissionResult.duplicateInfo.parentReportId} to increase the civic dispatch priority score without creating redundant clutter.
              </p>
            </div>
          )}

          {/* Priority Score Breakdown Card */}
          <div className="p-5 rounded-2xl bg-muted/50 border border-border space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-foreground uppercase tracking-wider">
                Calculated Incident Priority Score
              </span>
              <span className="text-2xl font-black text-brand-600">
                {submissionResult.scoreBreakdown?.finalScore ?? submissionResult.report?.priorityScore}/100
              </span>
            </div>

            <p className="text-xs text-muted-foreground italic">
              {submissionResult.scoreBreakdown?.explanation}
            </p>

            <div className="text-[11px] text-muted-foreground border-t border-border pt-2">
              Note: This score represents response urgency for municipal pumps and rescue, not scientific flood forecasting.
            </div>
          </div>

          {/* Action Links */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href="/map"
              className="flex-1 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs text-center transition-all shadow flex items-center justify-center gap-2"
            >
              <MapPin className="h-4 w-4" />
              View on Live Map
            </Link>

            <Link
              href="/incidents"
              className="flex-1 py-3 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs text-center border border-border transition-all flex items-center justify-center gap-2"
            >
              Browse Incidents Register
            </Link>

            <button
              onClick={() => {
                setSubmissionResult(null);
                setStreetName('');
                setLandmark('');
                setDescription('');
                setSelectedFile(null);
                setPreviewUrl(null);
              }}
              className="py-3 px-5 rounded-xl border border-input text-xs font-bold hover:bg-muted text-muted-foreground"
            >
              Submit Another Report
            </button>
          </div>
        </div>
      ) : (
        /* The Report Form */
        <form onSubmit={handleSubmit} className="space-y-8">
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. LOCATION SELECTION & GPS */}
          <div className="p-6 rounded-3xl bg-card border border-border space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-wider text-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4 text-brand-600" />
                1. Incident Location & GPS
              </h2>
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={locating}
                className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-black text-xs flex items-center gap-1.5 transition-all shadow-xs"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${locating ? 'animate-spin' : ''}`} />
                {locating ? 'Detecting GPS...' : '📍 Auto-Detect GPS Location'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-bold text-foreground">Street Name / Corridor *</label>
                <input
                  type="text"
                  required
                  value={streetName}
                  onChange={(e) => setStreetName(e.target.value)}
                  placeholder="e.g. Kurla Station Subway, LBS Marg, Hindmata..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-input text-xs font-medium focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-input text-xs font-medium focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Landmark / Ward (Optional)</label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="e.g. Near Platform 1 exit, Opp. BEST Depot..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-input text-xs font-medium focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Coordinates</label>
                <div className="px-3.5 py-2.5 rounded-xl bg-muted/60 border border-input text-xs font-mono text-muted-foreground flex items-center justify-between">
                  <span>{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</span>
                  {locationDetected && <span className="text-emerald-600 font-bold text-[10px]">GPS Verified</span>}
                </div>
              </div>
            </div>
          </div>

          {/* 2. WATERLOGGING SEVERITY */}
          <div className="p-6 rounded-3xl bg-card border border-border space-y-4 shadow-xs">
            <h2 className="text-sm font-black uppercase tracking-wider text-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              2. Waterlogging Severity Level *
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SEVERITY_OPTIONS.map((opt) => {
                const isSelected = selectedSeverity === opt.category;
                return (
                  <div
                    key={opt.category}
                    onClick={() => setSelectedSeverity(opt.category)}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 shadow-sm ring-2 ring-brand-500/20'
                        : 'border-border bg-background hover:border-muted-foreground/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-xs text-foreground">{opt.title}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${opt.badgeClass}`}>
                        {opt.range}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug">
                      {opt.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. WATER LEVEL TREND & ROAD CONDITION */}
          <div className="p-6 rounded-3xl bg-card border border-border space-y-5 shadow-xs">
            <h2 className="text-sm font-black uppercase tracking-wider text-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-cyan-500" />
              3. Water-Level Trend & Road Condition *
            </h2>

            {/* Trend */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-foreground block">
                Water-Level Trend
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {WATER_TRENDS.map((trend) => (
                  <button
                    key={trend.value}
                    type="button"
                    onClick={() => setWaterLevelTrend(trend.value)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      waterLevelTrend === trend.value
                        ? 'bg-brand-600 text-white border-brand-500 font-extrabold shadow-xs'
                        : 'bg-background text-muted-foreground border-input hover:text-foreground'
                    }`}
                  >
                    <span className="text-xs block font-bold">{trend.label}</span>
                    <span className="text-[9.5px] opacity-80 block">{trend.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Road Condition */}
            <div className="space-y-2 pt-2 border-t border-border">
              <label className="text-xs font-extrabold text-foreground block">
                Road Condition / Vehicular Movement
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ROAD_CONDITIONS.map((cond) => (
                  <button
                    key={cond.value}
                    type="button"
                    onClick={() => setRoadCondition(cond.value)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      roadCondition === cond.value
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-xs'
                        : 'bg-background text-muted-foreground border-input hover:text-foreground'
                    }`}
                  >
                    <span className="text-xs block font-bold">{cond.label}</span>
                    <span className="text-[9.5px] opacity-80 block">{cond.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4. PHOTO UPLOAD (OPTIONAL) & HAZARD TAGS */}
          <div className="p-6 rounded-3xl bg-card border border-border space-y-5 shadow-xs">
            <h2 className="text-sm font-black uppercase tracking-wider text-foreground flex items-center gap-2">
              <Camera className="h-4 w-4 text-brand-600" />
              4. Evidence Photograph (Optional) & Hazard Tags
            </h2>

            {/* Photo Upload Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border hover:border-brand-500 rounded-2xl p-6 text-center cursor-pointer bg-background/60 hover:bg-muted/30 transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              {previewUrl ? (
                <div className="space-y-2">
                  <img
                    src={previewUrl}
                    alt="Uploaded Evidence"
                    className="max-h-52 mx-auto rounded-xl object-cover shadow-md border border-border"
                  />
                  <span className="text-xs font-bold text-brand-600 block">
                    📸 Photo Selected (Click to change)
                  </span>
                </div>
              ) : (
                <div className="space-y-2 py-2">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
                  <p className="font-extrabold text-xs text-foreground">
                    Click to attach street waterlogging photograph
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Supports JPG, PNG (Local preview & verification)
                  </p>
                </div>
              )}
            </div>

            {/* Hazard Tags */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-foreground block">
                Observed Hazards:
              </label>
              <div className="flex flex-wrap gap-2">
                {HAZARD_TAG_OPTIONS.map((tag) => {
                  const active = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        active
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-xs'
                          : 'bg-background text-muted-foreground border-input hover:text-foreground'
                      }`}
                    >
                      {active ? '✓ ' : '+ '}
                      {tag.replace(/_/g, ' ')}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description & Reporter Name */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-bold text-foreground">Short Description (Optional)</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detail visible water height, vehicles stalled, or flow speed..."
                  className="w-full px-3.5 py-2 rounded-xl bg-background border border-input text-xs font-medium focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Your Name / Identifier</label>
                <input
                  type="text"
                  value={reportedBy}
                  onChange={(e) => setReportedBy(e.target.value)}
                  placeholder="e.g. Local Resident, Commuter"
                  className="w-full px-3.5 py-2 rounded-xl bg-background border border-input text-xs font-medium focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex items-center justify-between">
            <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-brand-600" />
              <span>Timestamp will be logged automatically on submission.</span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="px-7 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-500/25 hover:scale-105 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Saving Incident...
                </>
              ) : (
                '📢 Submit Waterlogging Report'
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
