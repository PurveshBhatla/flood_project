'use client';

import React from 'react';
import MapWrapper from '@/components/map/map-wrapper';

export default function FullMapPage() {
  return (
    <div className="w-full h-[calc(100vh-4rem)] relative overflow-hidden p-4">
      <MapWrapper />
    </div>
  );
}
