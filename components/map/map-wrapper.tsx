'use client';

import dynamic from 'next/dynamic';
import React from 'react';

const FloodMap = dynamic(() => import('./flood-map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[400px] rounded-2xl bg-muted animate-pulse flex items-center justify-center text-muted-foreground text-sm font-medium">
      Loading Interactive Flood Map Engine...
    </div>
  ),
});

export default function MapWrapper(props: React.ComponentProps<typeof FloodMap>) {
  return <FloodMap {...props} />;
}
