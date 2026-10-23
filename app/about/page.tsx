import React from 'react';
import Link from 'next/link';
import {
  Waves,
  Shield,
  Layers,
  MapPin,
  TrendingUp,
  Car,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  ArrowRight,
  Database,
  Calculator,
  Compass,
  Building2
} from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="py-12 space-y-16">
      {/* Hero Header */}
      <div className="container mx-auto px-4 md:px-8 max-w-4xl text-center space-y-4">
        <span className="text-xs font-black text-brand-600 dark:text-brand-400 uppercase tracking-widest">
          Methodology & System Architecture
        </span>
        <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">
          About FloodWatch
        </h1>
        <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          FloodWatch is a community-powered waterlogging intelligence system designed to capture street-level flood telemetry, eliminate duplicate noise, identify emerging hotspots, and assign transparent dispatch priority scores.
        </p>
      </div>

      {/* 1. THE PROBLEM FLOODWATCH ADDRESSES */}
      <section className="container mx-auto px-4 md:px-8 max-w-5xl space-y-6">
        <div className="p-8 rounded-3xl bg-card border border-border space-y-4 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-black text-red-500 uppercase tracking-wider">
            <AlertTriangle className="h-4 w-4" />
            <span>Problem Statement</span>
          </div>
          <h2 className="text-2xl font-black text-foreground">
            The Critical Gap in Urban Drainage Awareness
          </h2>
          <div className="space-y-3 text-xs md:text-sm text-muted-foreground leading-relaxed">
            <p>
              During intense monsoon spells and localized cloudbursts, urban infrastructure suffers from sudden, extreme waterlogging. Low-lying arterial corridors, railway underpasses, and market junctions submerge within minutes.
            </p>
            <p>
              Traditional hydrological forecasting relies on major river gauges and regional weather satellites. While effective for river basin flooding, <strong>they cannot observe localized stormwater drain failures, choked culverts, or stranded vehicles on a specific neighborhood road.</strong>
            </p>
            <p>
              This information vacuum leads to stranded commuters, waterlogged engines, fatal open manhole hazards, and delayed municipal pump deployments. FloodWatch crowdsources ground-truth reports directly from people navigating the streets.
            </p>
          </div>
        </div>
      </section>

      {/* 2. HOW COMMUNITY REPORTING WORKS */}
      <section className="container mx-auto px-4 md:px-8 max-w-5xl space-y-6">
        <div className="text-left space-y-1">
          <span className="text-xs font-black text-brand-600 uppercase tracking-wider">
            Citizen Telemetry
          </span>
          <h2 className="text-2xl font-black text-foreground">
            How Community Reporting Operates
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-card border border-border space-y-3 shadow-xs">
            <div className="h-10 w-10 rounded-2xl bg-brand-600/10 text-brand-600 flex items-center justify-center font-black">
              1
            </div>
            <h3 className="font-extrabold text-sm text-foreground">Location & GPS</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              With user permission, the HTML5 Geolocation API logs high-precision latitude and longitude coordinates, paired with road names and landmark descriptions.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-card border border-border space-y-3 shadow-xs">
            <div className="h-10 w-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-black">
              2
            </div>
            <h3 className="font-extrabold text-sm text-foreground">Standardized Severity & Trend</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Citizens categorize depth into intuitive brackets: Ankle (&lt;15cm), Knee (15-45cm), Waist (45-90cm), or Submerged (&gt;90cm), accompanied by water-level trend and road passability.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-card border border-border space-y-3 shadow-xs">
            <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black">
              3
            </div>
            <h3 className="font-extrabold text-sm text-foreground">Corroboration & Verification</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Submissions appear immediately on the Live Map as unverified reports. Fellow citizens can upvote or confirm the report, while municipal operators review and verify field conditions.
            </p>
          </div>
        </div>
      </section>

      {/* 3. CORE LOGIC: DUPLICATE DETECTION & HOTSPOTS */}
      <section className="container mx-auto px-4 md:px-8 max-w-5xl space-y-6">
        <div className="p-8 rounded-3xl bg-muted/40 border border-border space-y-6 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-black text-cyan-600 uppercase tracking-wider">
            <Layers className="h-4 w-4" />
            <span>Spatial Algorithms</span>
          </div>

          <h2 className="text-2xl font-black text-foreground">
            Duplicate Detection & Potential Hotspot Clustering
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed">
            <div className="p-5 rounded-2xl bg-card border border-border space-y-2.5">
              <h3 className="font-extrabold text-sm text-foreground flex items-center gap-1.5">
                <Compass className="h-4 w-4 text-brand-600" />
                A. Duplicate Detection (150m Threshold)
              </h3>
              <p className="text-muted-foreground">
                Multiple users often report the same waterlogged underpass within minutes. FloodWatch uses the <strong>Haversine great-circle distance formula</strong> with a configurable threshold of <strong>150 metres</strong> and a 4-hour time window.
              </p>
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 font-semibold">
                <strong>Crucial Rule:</strong> Reports are NEVER deleted automatically. Redundant reports are flagged as linked duplicates (<code>isDuplicate: true</code>), preserving data integrity while boosting incident priority rather than scattering pins.
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-border space-y-2.5">
              <h3 className="font-extrabold text-sm text-foreground flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-cyan-600" />
                B. Potential Hotspot Identification (300m Threshold)
              </h3>
              <p className="text-muted-foreground">
                Nearby reports within a configurable <strong>300-metre proximity</strong> are spatially clustered using centroid calculation. This identifies emerging localized waterlogging clusters.
              </p>
              <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-800 dark:text-cyan-300 font-semibold">
                <strong>Terminology Notice:</strong> These groups are transparently labeled as <em>Potential Waterlogging Hotspots</em>, NOT confirmed flood inundation zones.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. MATHEMATICAL INCIDENT PRIORITY SCORE (0 - 100) */}
      <section className="container mx-auto px-4 md:px-8 max-w-5xl space-y-6">
        <div className="p-8 rounded-3xl bg-card border border-border space-y-6 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-black text-brand-600 uppercase tracking-wider">
            <Calculator className="h-4 w-4" />
            <span>Mathematical Scoring</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-foreground">
              Incident Priority Score Formula (0 – 100)
            </h2>
            <p className="text-xs text-muted-foreground">
              The priority score helps civic dispatchers allocate emergency dewatering pumps to the most hazardous locations first.
            </p>
          </div>

          {/* Formula Breakdown */}
          <div className="p-5 rounded-2xl bg-slate-900 text-slate-100 font-mono text-xs space-y-2 shadow-inner">
            <div className="text-brand-400 font-bold">
              PriorityScore = clamp0_100( (BaseSeverity + TrendAdj + RoadImpact + ClusterDensity) × RecencyDecay )
            </div>
            <div className="text-[11px] text-slate-400">
              Where all components are normalized transparently according to civic impact.
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-muted/50 border border-border space-y-1">
              <strong className="text-foreground block">1. Depth Severity</strong>
              <ul className="text-[11px] text-muted-foreground space-y-0.5">
                <li>• Ankle: 20 pts</li>
                <li>• Knee: 40 pts</li>
                <li>• Waist: 65 pts</li>
                <li>• Submerged: 85 pts</li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-muted/50 border border-border space-y-1">
              <strong className="text-foreground block">2. Water Trend</strong>
              <ul className="text-[11px] text-muted-foreground space-y-0.5">
                <li>• Rising: +10 pts</li>
                <li>• Stable: 0 pts</li>
                <li>• Falling: -10 pts</li>
                <li>• Unknown: 0 pts</li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-muted/50 border border-border space-y-1">
              <strong className="text-foreground block">3. Road Status</strong>
              <ul className="text-[11px] text-muted-foreground space-y-0.5">
                <li>• Blocked: +15 pts</li>
                <li>• Difficult: +8 pts</li>
                <li>• Passable: 0 pts</li>
                <li>• Unknown: 0 pts</li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-muted/50 border border-border space-y-1">
              <strong className="text-foreground block">4. Recency Decay</strong>
              <ul className="text-[11px] text-muted-foreground space-y-0.5">
                <li>• &lt; 1 hour: 1.0x</li>
                <li>• 1–3 hours: 0.9x</li>
                <li>• 3–6 hours: 0.75x</li>
                <li>• &gt; 6h (Stale): 0.5x</li>
              </ul>
            </div>
          </div>

          {/* Crucial Scientific Disclaimer */}
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 text-xs font-semibold leading-relaxed">
            <strong>Mandatory Clarification:</strong> This score represents <em>Incident Operational Dispatch Priority</em> for civic rescue teams and pumps. It is NOT flood probability, predicted water depth, or a scientifically validated hydrology model.
          </div>
        </div>
      </section>

      {/* 5. FRESHNESS, STALENESS & SAFETY DISCLAIMERS */}
      <section className="container mx-auto px-4 md:px-8 max-w-5xl space-y-6">
        <div className="p-8 rounded-3xl bg-card border border-border space-y-4 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-black text-amber-600 uppercase tracking-wider">
            <Clock className="h-4 w-4" />
            <span>Telemetry Freshness</span>
          </div>

          <h2 className="text-2xl font-black text-foreground">
            Report Verification & Freshness Philosophy
          </h2>

          <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
            <p>
              Urban flood waters can recede in 30 minutes once a drain unclogs or tide subsides. Presenting 12-hour-old reports as active hazards misinforms the public.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Reports exceeding <strong>6 hours without corroboration</strong> are marked as <code>STALE</code> and their priority score decays by 50%.</li>
              <li>When civic drainage teams clear a location, an authorized operator marks it <code>RESOLVED</code>, logging an immutable audit action.</li>
              <li><strong>Critical Safety Principle:</strong> The absence of reports in an area does NOT mean the area is safe. It only signifies no citizen has submitted telemetry from that sector.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 6. LIMITATIONS & FUTURE IMPROVEMENTS */}
      <section className="container mx-auto px-4 md:px-8 max-w-5xl space-y-6 pb-8">
        <div className="p-8 rounded-3xl bg-muted/40 border border-border space-y-4 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-black text-foreground uppercase tracking-wider">
            <Building2 className="h-4 w-4" />
            <span>Honest Evaluation</span>
          </div>

          <h2 className="text-2xl font-black text-foreground">
            Current Limitations & Future Roadmap
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground leading-relaxed">
            <div className="space-y-2">
              <strong className="text-foreground block font-bold">Current System Limitations:</strong>
              <ul className="list-disc pl-4 space-y-1">
                <li>Relies on active citizen participation and mobile connectivity.</li>
                <li>SQLite database is configured for zero-setup local hackathon demonstration (easily migrating to PostgreSQL in production).</li>
                <li>Image verification is currently manual via operator review.</li>
              </ul>
            </div>

            <div className="space-y-2">
              <strong className="text-foreground block font-bold">Planned Enhancements:</strong>
              <ul className="list-disc pl-4 space-y-1">
                <li>SMS and WhatsApp bot gateway for reporting in low-bandwidth zones.</li>
                <li>Integration with municipal IoT pump SCADA systems.</li>
                <li>Edge AI on-device photograph water level estimation with reference landmark calibration.</li>
              </ul>
            </div>
          </div>

          <div className="pt-4 border-t border-border flex justify-end">
            <Link
              href="/map"
              className="px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-black text-xs flex items-center gap-2 transition-all shadow"
            >
              <span>Explore Live Map</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
