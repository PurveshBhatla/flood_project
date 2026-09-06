'use client';

import React, { useEffect, useState } from 'react';
import MapWrapper from '@/components/map/map-wrapper';

export default function FullMapPage() {
  const [stations, setStations] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/flood/stations')
      .then((res) => res.json())
      .then((d) => setStations(d.stations || []))
      .catch(() => {});

    fetch('/api/alerts')
      .then((res) => res.json())
      .then((d) => setAlerts(d.alerts || []))
      .catch(() => {});
  }, []);

  return (
    <div className="w-full h-[calc(100vh-4rem)] relative overflow-hidden">
      <MapWrapper
        initialCenter={[19.076, 72.8777]}
        initialZoom={6}
        stations={stations}
        alerts={alerts}
        interactive={true}
      />
    </div>
  );
}
