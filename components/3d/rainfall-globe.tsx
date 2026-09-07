'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { classifyRainfallIntensity, formatDate } from '@/lib/utils';
import { Play, Pause, Compass, MapPin, CloudRain, ExternalLink, Flame, Info, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

interface Hotspot {
  id: string;
  name: string;
  state: string;
  lat: number;
  lng: number;
  rainfallMmPerHour: number;
  category: 'LOW' | 'MODERATE' | 'HEAVY' | 'EXTREME';
  color: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
  severity?: 'HEAVY' | 'EXTREME';
  locationName?: string;
  timestamp?: string;
}

interface RainfallGlobeProps {
  rainfallData?: {
    mode: 'live' | 'demo';
    updatedAt: string;
    cells: any[];
    hotspots: Hotspot[];
  };
  onSelectHotspot?: (hotspot: Hotspot) => void;
}

export default function RainfallGlobe({ rainfallData, onSelectHotspot }: RainfallGlobeProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isRotating, setIsRotating] = useState(true);
  const isRotatingRef = useRef(isRotating);

  // Sync ref with state without re-creating Three.js scene
  useEffect(() => {
    isRotatingRef.current = isRotating;
  }, [isRotating]);

  const [webglSupported, setWebglSupported] = useState(true);
  const [hoveredHotspot, setHoveredHotspot] = useState<Hotspot | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);

  // References for Three.js state
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const globeGroupRef = useRef<THREE.Group | null>(null);
  const markersGroupRef = useRef<THREE.Group | null>(null);
  const targetRotationRef = useRef<{ x: number; y: number } | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());

  // Check WebGL availability
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setWebglSupported(false);
      }
    } catch (e) {
      setWebglSupported(false);
    }
  }, []);

  // Convert (Lat, Lng) to 3D position vector on sphere of radius R
  const latLngToVector3 = (lat: number, lng: number, radius: number = 2.0) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);

    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);

    return new THREE.Vector3(x, y, z);
  };

  // Initialize Three.js 3D Globe - Runs ONCE on mount
  useEffect(() => {
    if (!mountRef.current || !webglSupported) return;

    const width = mountRef.current.clientWidth || 800;
    const height = mountRef.current.clientHeight || 480;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 5.2;
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Main Globe Group
    const globeGroup = new THREE.Group();
    // Default initial rotation centered around India (lat ~20, lng ~78)
    globeGroup.rotation.y = -Math.PI / 2.3;
    globeGroup.rotation.x = 0.35;
    scene.add(globeGroup);
    globeGroupRef.current = globeGroup;

    // 5. Earth Sphere Base Mesh
    const sphereGeometry = new THREE.SphereGeometry(2, 64, 64);
    
    // High-contrast Earth Texture Canvas
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    // Ocean Base Color
    ctx.fillStyle = '#08182b'; // Dark Navy Ocean
    ctx.fillRect(0, 0, 1024, 512);

    // Draw Continents with High-Contrast Blue-Slate Color
    ctx.fillStyle = '#16436e'; // Bright Slate Continent
    // Asia / India Subcontinent
    ctx.beginPath();
    ctx.ellipse(730, 200, 160, 100, 0, 0, Math.PI * 2);
    ctx.fill();

    // India Peninsular Projection
    ctx.beginPath();
    ctx.moveTo(710, 200);
    ctx.lineTo(740, 270);
    ctx.lineTo(760, 210);
    ctx.closePath();
    ctx.fill();

    // Europe
    ctx.beginPath();
    ctx.ellipse(550, 150, 80, 60, 0, 0, Math.PI * 2);
    ctx.fill();

    // Africa
    ctx.beginPath();
    ctx.ellipse(540, 290, 90, 120, 0, 0, Math.PI * 2);
    ctx.fill();

    // Americas
    ctx.beginPath();
    ctx.ellipse(280, 220, 100, 160, 0, 0, Math.PI * 2);
    ctx.fill();

    // Australia
    ctx.beginPath();
    ctx.ellipse(830, 360, 70, 50, 0, 0, Math.PI * 2);
    ctx.fill();

    // Grid Latitude / Longitude lines
    ctx.strokeStyle = '#1e5a96';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 512; i += 40) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(1024, i);
      ctx.stroke();
    }
    for (let j = 0; j <= 1024; j += 60) {
      ctx.beginPath();
      ctx.moveTo(j, 0);
      ctx.lineTo(j, 512);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    
    // Lambert/Standard Material with Emissive Glow ensuring visibility
    const globeMaterial = new THREE.MeshLambertMaterial({
      map: texture,
      emissive: new THREE.Color('#0a203a'),
      emissiveIntensity: 0.6,
    });
    const globeMesh = new THREE.Mesh(sphereGeometry, globeMaterial);
    globeGroup.add(globeMesh);

    // 6. Atmospheric Glow Outer Shell
    const atmosphereGeometry = new THREE.SphereGeometry(2.12, 48, 48);
    const atmosphereMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#00e5ff'),
      transparent: true,
      opacity: 0.18,
      side: THREE.BackSide,
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    globeGroup.add(atmosphereMesh);

    // 7. Low-Intensity Stars Field Background
    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 500;
    const starPositions = new Float32Array(starsCount * 3);
    for (let i = 0; i < starsCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 45;
      starPositions[i + 1] = (Math.random() - 0.5) * 45;
      starPositions[i + 2] = (Math.random() - 0.5) * 45;
    }
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starsMaterial = new THREE.PointsMaterial({
      color: 0x88d6ff,
      size: 0.05,
      transparent: true,
      opacity: 0.65,
    });
    const starField = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(starField);

    // 8. Strong Ambient & Directional Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0x00e5ff, 1.5);
    directionalLight1.position.set(5, 3, 5);
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight2.position.set(-5, -3, -5);
    scene.add(directionalLight2);

    // 9. Group for Hotspot 3D Markers
    const markersGroup = new THREE.Group();
    globeGroup.add(markersGroup);
    markersGroupRef.current = markersGroup;

    // Resize Observer for robust dynamic responsiveness
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const w = entry.contentRect.width;
        const h = entry.contentRect.height;
        if (w > 0 && h > 0 && camera && renderer) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
      }
    });

    if (mountRef.current) {
      resizeObserver.observe(mountRef.current);
    }

    // 10. Animation Loop
    let pulseTime = 0;
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      pulseTime += 0.04;

      // Automatic slow Globe rotation
      if (isRotatingRef.current && globeGroupRef.current && !targetRotationRef.current) {
        globeGroupRef.current.rotation.y += 0.0015;
      }

      // Smooth interpolation when target rotation is set
      if (globeGroupRef.current && targetRotationRef.current) {
        const target = targetRotationRef.current;
        globeGroupRef.current.rotation.y += (target.y - globeGroupRef.current.rotation.y) * 0.05;
        globeGroupRef.current.rotation.x += (target.x - globeGroupRef.current.rotation.x) * 0.05;

        if (
          Math.abs(target.y - globeGroupRef.current.rotation.y) < 0.005 &&
          Math.abs(target.x - globeGroupRef.current.rotation.x) < 0.005
        ) {
          targetRotationRef.current = null;
        }
      }

      // Animate pulsing rings on heavy/extreme rainfall markers
      if (markersGroupRef.current) {
        markersGroupRef.current.children.forEach((child) => {
          if (child.userData?.isPulseRing) {
            const scale = 1.0 + Math.sin(pulseTime * 2) * 0.3;
            child.scale.set(scale, scale, scale);
          }
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (mountRef.current) {
        resizeObserver.unobserve(mountRef.current);
      }
      resizeObserver.disconnect();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (renderer.domElement && mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [webglSupported]); // Explicitly run ONCE on mount!

  // Update 3D Hotspot Markers whenever rainfallData changes
  useEffect(() => {
    if (!markersGroupRef.current || !rainfallData) return;

    // Clear existing markers
    while (markersGroupRef.current.children.length > 0) {
      const obj = markersGroupRef.current.children[0];
      markersGroupRef.current.remove(obj);
    }

    const cellsToRender = rainfallData.cells && rainfallData.cells.length > 0
      ? rainfallData.cells
      : rainfallData.hotspots || [];

    cellsToRender.forEach((spot) => {
      const pos = latLngToVector3(spot.lat, spot.lng, 2.02);
      const classification = classifyRainfallIntensity(spot.rainfallMmPerHour);

      const colorHex = classification.hex;
      const isHeavy = spot.rainfallMmPerHour >= 25.0;

      // 1. Core 3D Mesh Dot
      const dotRadius = isHeavy ? 0.07 : 0.045;
      const dotGeo = new THREE.SphereGeometry(dotRadius, 16, 16);
      const dotMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(colorHex) });
      const dotMesh = new THREE.Mesh(dotGeo, dotMat);
      dotMesh.position.copy(pos);
      dotMesh.userData = { spot };
      markersGroupRef.current?.add(dotMesh);

      // 2. Pulsing Glow Ring for Heavy/Extreme Rainfall
      if (isHeavy) {
        const ringGeo = new THREE.RingGeometry(0.08, 0.16, 24);
        const ringMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color(colorHex),
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.7,
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.position.copy(pos);
        ringMesh.lookAt(new THREE.Vector3(0, 0, 0)); // Orient flat to surface
        ringMesh.userData = { isPulseRing: true, spot };
        markersGroupRef.current?.add(ringMesh);
      }
    });
  }, [rainfallData]);

  // Raycasting for Mouse Hover Tooltips and Clicks on 3D Globe Markers
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mountRef.current || !cameraRef.current || !markersGroupRef.current) return;
    const rect = mountRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    mouseRef.current.set(x, y);
    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

    const intersects = raycasterRef.current.intersectObjects(markersGroupRef.current.children);
    const hit = intersects.find((i) => i.object.userData?.spot);

    if (hit) {
      setHoveredHotspot(hit.object.userData.spot);
      setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    } else {
      setHoveredHotspot(null);
    }
  };

  const handleClickGlobe = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mountRef.current || !cameraRef.current || !markersGroupRef.current) return;
    const rect = mountRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    mouseRef.current.set(x, y);
    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

    const intersects = raycasterRef.current.intersectObjects(markersGroupRef.current.children);
    const hit = intersects.find((i) => i.object.userData?.spot);

    if (hit) {
      const spot = hit.object.userData.spot;
      setSelectedHotspot(spot);
      rotateGlobeToLatLng(spot.lat, spot.lng);
      if (onSelectHotspot) onSelectHotspot(spot);
    }
  };

  // Smoothly rotate 3D Globe to target (lat, lng)
  const rotateGlobeToLatLng = (lat: number, lng: number) => {
    if (!globeGroupRef.current) return;
    const targetY = -(lng * (Math.PI / 180)) - Math.PI / 2;
    const targetX = lat * (Math.PI / 180);
    targetRotationRef.current = { x: targetX, y: targetY };
  };

  // Top rainfall hotspot
  const topHotspot = rainfallData?.hotspots && rainfallData.hotspots.length > 0
    ? rainfallData.hotspots[0]
    : null;

  const handleFocusHighestRainfall = () => {
    if (topHotspot) {
      rotateGlobeToLatLng(topHotspot.lat, topHotspot.lng);
      setSelectedHotspot(topHotspot);
      if (onSelectHotspot) onSelectHotspot(topHotspot);
    }
  };

  return (
    <div className="relative w-full h-[400px] sm:h-[460px] md:h-[520px] rounded-3xl overflow-hidden border border-cyan-900/50 bg-[#040e1a] shadow-2xl">
      {/* Background 3D Canvas / WebGL Fallback */}
      {webglSupported ? (
        <div
          ref={mountRef}
          onMouseMove={handleMouseMove}
          onClick={handleClickGlobe}
          className="w-full h-full cursor-grab active:cursor-grabbing"
        />
      ) : (
        /* Static WebGL Fallback Graphic */
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#061426] via-[#092240] to-[#040e1b] p-6 text-center space-y-3">
          <GlobeFallbackGraphic hotspots={rainfallData?.hotspots || []} />
          <p className="text-xs text-muted-foreground max-w-sm">
            WebGL 3D Earth hardware acceleration is disabled. Showing static global rainfall hotspot distribution.
          </p>
        </div>
      )}

      {/* Floating Dark Gradient Overlay for Dashboard Readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#040e1a]/95 via-[#040e1a]/65 to-transparent pointer-events-none" />

      {/* Hover Tooltip Popup near Cursor */}
      {hoveredHotspot && (
        <div
          style={{ top: tooltipPos.y + 12, left: tooltipPos.x + 12 }}
          className="absolute z-30 p-2.5 rounded-xl bg-slate-900/95 border border-slate-700 shadow-2xl text-xs space-y-1 pointer-events-none min-w-[185px]"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-1">
            <span className="font-extrabold text-white text-xs flex items-center gap-1">
              <MapPin className="h-3 w-3 text-cyan-400" /> {hoveredHotspot.name || hoveredHotspot.locationName}
            </span>
            <span className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold ${classifyRainfallIntensity(hoveredHotspot.rainfallMmPerHour).badgeClass}`}>
              {classifyRainfallIntensity(hoveredHotspot.rainfallMmPerHour).category}
            </span>
          </div>
          <div className="text-[11px] text-slate-300">
            Rainfall Rate: <strong className="text-white">{hoveredHotspot.rainfallMmPerHour} mm/hr</strong>
          </div>
          <div className="text-[10px] text-slate-400">
            Status: {hoveredHotspot.rainfallMmPerHour >= 25 ? '🔴 HEAVY RAINFALL' : '🟢 MODERATE / LIGHT'}
          </div>
        </div>
      )}

      {/* Hero Content Overlay (Top-Left) */}
      <div className="absolute top-6 left-6 z-10 space-y-3 max-w-md pointer-events-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-wider">
          <CloudRain className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
          Global & Regional Live Rainfall Monitor
        </div>

        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            3D Dynamic Live Rainfall Earth
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed mt-1">
            Real-time satellite & radar rainfall intensity grid projected onto interactive 3D globe.
          </p>
        </div>

        {/* Global vs India Coverage Badge */}
        <div className="flex items-center gap-2 text-[11px] text-slate-300">
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold uppercase tracking-wide">
            {rainfallData?.mode === 'live' ? '● LIVE RAINFALL' : '● DEMO DATA'}
          </span>
          <span className="text-slate-400">Live rainfall coverage: India</span>
        </div>

        {/* Quick Hotspot Focus Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {topHotspot && (
            <button
              onClick={handleFocusHighestRainfall}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-lg transition-all"
            >
              <Compass className="h-3.5 w-3.5" />
              Focus Highest Rainfall ({topHotspot.name}: {topHotspot.rainfallMmPerHour} mm/h)
            </button>
          )}

          <button
            onClick={() => setIsRotating(!isRotating)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            {isRotating ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {isRotating ? 'Pause Rotation' : 'Resume Rotation'}
          </button>
        </div>
      </div>

      {/* Floating 🔴 LIVE RAINFALL MONITOR Summary Card (Top-Right Overlay) */}
      <div className="absolute top-6 right-6 z-10 w-72 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-4 shadow-2xl space-y-3 hidden sm:block pointer-events-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Flame className="h-4 w-4 text-red-500 animate-pulse" /> Live Rainfall Monitor
          </span>
          <span className="text-[10px] text-slate-400 font-medium">
            {formatDate(rainfallData?.updatedAt || new Date())}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-[10px] text-slate-400 block uppercase">Heavy Areas</span>
            <strong className="text-base text-orange-400 font-extrabold">
              {rainfallData?.hotspots?.filter((h) => h.rainfallMmPerHour >= 25 && h.rainfallMmPerHour < 50).length || 0}
            </strong>
          </div>
          <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-[10px] text-slate-400 block uppercase">Extreme Areas</span>
            <strong className="text-base text-red-400 font-extrabold">
              {rainfallData?.hotspots?.filter((h) => h.rainfallMmPerHour >= 50).length || 0}
            </strong>
          </div>
        </div>

        {topHotspot ? (
          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-300 font-semibold">Highest Rainfall:</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-red-500 text-white">
                {topHotspot.rainfallMmPerHour} mm/hr
              </span>
            </div>
            <div className="text-xs font-extrabold text-white">
              📍 {topHotspot.name}, {topHotspot.state}
            </div>
          </div>
        ) : (
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-400 text-center">
            🟢 No extreme rainfall detected currently
          </div>
        )}

        <Link
          href="/map"
          className="w-full py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl text-center flex items-center justify-center gap-1.5 transition-colors shadow"
        >
          View on Interactive GIS Map <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Selected Hotspot Detail Card (Bottom Center Overlay) */}
      {selectedHotspot && (
        <div className="absolute bottom-6 left-6 right-6 md:left-auto md:right-6 z-20 max-w-md bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-2xl p-4 shadow-2xl space-y-2 text-xs pointer-events-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="font-extrabold text-white text-sm flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-red-500" /> {selectedHotspot.name}, {selectedHotspot.state}
            </span>
            <button onClick={() => setSelectedHotspot(null)} className="text-slate-400 hover:text-white p-1">
              ✕
            </button>
          </div>

          {(() => {
            const classification = classifyRainfallIntensity(selectedHotspot.rainfallMmPerHour);
            return (
              <div className="flex items-center justify-between bg-slate-800/80 p-2 rounded-xl">
                <span className="text-slate-300">
                  Current Intensity: <strong className={classification.textClass}>{classification.label}</strong>
                </span>
                <span className={`px-2.5 py-0.5 rounded text-xs font-extrabold ${classification.badgeClass}`}>
                  {selectedHotspot.rainfallMmPerHour} mm/hr
                </span>
              </div>
            );
          })()}

          <p className="text-[11px] text-slate-400 leading-snug">
            This rainfall rate is contributing to effective runoff calculations and 0–3 hour street inundation nowcasts.
          </p>
        </div>
      )}
    </div>
  );
}

// Fallback Graphic Component for devices without WebGL
function GlobeFallbackGraphic({ hotspots }: { hotspots: Hotspot[] }) {
  return (
    <div className="relative w-48 h-48 rounded-full bg-gradient-to-br from-[#0c2847] to-[#04101e] border-2 border-cyan-500/40 shadow-inner flex items-center justify-center">
      <div className="absolute inset-0 rounded-full border border-cyan-400/20 animate-ping" />
      <GlobeIcon className="h-24 w-24 text-cyan-500/30" />
      <span className="absolute font-extrabold text-xs text-cyan-400 uppercase tracking-widest">
        India 3D Grid
      </span>
    </div>
  );
}

function GlobeIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  );
}
