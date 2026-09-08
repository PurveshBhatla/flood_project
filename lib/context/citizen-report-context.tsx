'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface CitizenReport {
  id: string;
  latitude: number;
  longitude: number;
  streetName: string;
  waterDepth: string; // e.g. "0.45m"
  waterDepthCategory: 'Ankle (<0.2m)' | 'Knee (0.2-0.5m)' | 'Waist (0.5-1.0m)' | 'Submerged (>1.0m)';
  aiEstimate: string;
  tags: string[];
  imageUrl?: string;
  timestamp: string;
  votes: number;
  status: string;
}

interface CitizenReportContextType {
  reports: CitizenReport[];
  addReport: (report: CitizenReport) => void;
  isReportModalOpen: boolean;
  openReportModal: () => void;
  closeReportModal: () => void;
  toggleReportModal: () => void;
}

// Initial pre-seeded citizen ground-truth reports for immediate demo visibility
const initialReports: CitizenReport[] = [
  {
    id: 'cit-rep-1',
    latitude: 19.0755,
    longitude: 72.8765,
    streetName: 'Central Market Main Underpass, Ward 4',
    waterDepth: '0.45m',
    waterDepthCategory: 'Knee (0.2-0.5m)',
    aiEstimate: 'AI Visual Estimate: ~0.45m (Knee-Deep / Moderate Risk)',
    tags: ['Drain Overflowing', 'Stagnant Water'],
    timestamp: '10 mins ago - 08 Sep 2026',
    votes: 3,
    status: 'Citizen Verified (3 Votes)',
  },
  {
    id: 'cit-rep-2',
    latitude: 19.0712,
    longitude: 72.8790,
    streetName: 'Station Junction Flyover Slip Road',
    waterDepth: '0.75m',
    waterDepthCategory: 'Waist (0.5-1.0m)',
    aiEstimate: 'AI Visual Estimate: ~0.75m (Waist-Deep / High Risk)',
    tags: ['Vehicle Trapped', 'Fast Current', 'Manhole Open'],
    timestamp: '25 mins ago - 08 Sep 2026',
    votes: 7,
    status: 'Citizen Verified (7 Votes)',
  },
];

const CitizenReportContext = createContext<CitizenReportContextType>({
  reports: [],
  addReport: () => {},
  isReportModalOpen: false,
  openReportModal: () => {},
  closeReportModal: () => {},
  toggleReportModal: () => {},
});

export function CitizenReportProvider({ children }: { children: ReactNode }) {
  const [reports, setReports] = useState<CitizenReport[]>(initialReports);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const addReport = useCallback((newReport: CitizenReport) => {
    setReports((prev) => [newReport, ...prev]);
  }, []);

  const openReportModal = useCallback(() => setIsReportModalOpen(true), []);
  const closeReportModal = useCallback(() => setIsReportModalOpen(false), []);
  const toggleReportModal = useCallback(() => setIsReportModalOpen((prev) => !prev), []);

  return (
    <CitizenReportContext.Provider
      value={{
        reports,
        addReport,
        isReportModalOpen,
        openReportModal,
        closeReportModal,
        toggleReportModal,
      }}
    >
      {children}
    </CitizenReportContext.Provider>
  );
}

export function useCitizenReports() {
  return useContext(CitizenReportContext);
}
