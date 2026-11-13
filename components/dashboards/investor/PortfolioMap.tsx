import React, { useMemo, useState } from 'react';
import type { Property } from '../../../types';
import { MapPinIcon } from '@heroicons/react/24/outline';

interface PortfolioMapProps {
  ownedProperties: Property[];
  watchlistProperties: Property[];
}

const PortfolioMap: React.FC<PortfolioMapProps> = ({ ownedProperties, watchlistProperties }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const allPoints = useMemo(() => {
    return [
      ...ownedProperties.map((p) => ({
        id: `owned-${p.id}`,
        title: p.title,
        city: p.address.city,
        price: p.price,
        lat: p.coordinates?.lat ?? -33.9249,
        lng: p.coordinates?.lng ?? 18.4241,
        type: 'owned' as const,
      })),
      ...watchlistProperties.map((p) => ({
        id: `watch-${p.id}`,
        title: p.title,
        city: p.address.city,
        price: p.price,
        lat: p.coordinates?.lat ?? -26.2041,
        lng: p.coordinates?.lng ?? 28.0473,
        type: 'watchlist' as const,
      })),
    ];
  }, [ownedProperties, watchlistProperties]);

  const projectedPoints = useMemo(() => {
    if (allPoints.length === 0) return [];
    const latitudes = allPoints.map((p) => p.lat);
    const longitudes = allPoints.map((p) => p.lng);
    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);
    const latRange = maxLat - minLat;
    const lngRange = maxLng - minLng;
    const padding = 0.14;

    return allPoints.map((p) => {
      const y = latRange > 0 ? (1 - (p.lat - minLat) / latRange) * (1 - 2 * padding) + padding : 0.5;
      const x = lngRange > 0 ? ((p.lng - minLng) / lngRange) * (1 - 2 * padding) + padding : 0.5;
      return {
        ...p,
        x: x * 100,
        y: y * 100,
      };
    });
  }, [allPoints]);

  const selectedPoint = projectedPoints.find((p) => p.id === selectedId) || projectedPoints[0] || null;

  return (
    <div className="relative aspect-[2.2/1] min-h-[240px] bg-slate-900 rounded-lg overflow-hidden border border-slate-800">
      {/* Geometric topographic grid */}
      <svg viewBox="0 0 1000 450" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        <defs>
          <pattern id="investor-grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="1000" height="450" fill="url(#investor-grid)" />
        <ellipse cx="520" cy="225" rx="280" ry="150" fill="none" stroke="rgba(201,163,93,0.14)" strokeWidth="1" strokeDasharray="4 6" />
        <ellipse cx="520" cy="225" rx="180" ry="95" fill="none" stroke="rgba(16,185,129,0.18)" strokeWidth="1" />
      </svg>

      {/* Asset markers */}
      {projectedPoints.map((p) => {
        const isSelected = selectedPoint?.id === p.id;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => setSelectedId(p.id)}
            style={{ left: `${p.x}%`, top: `${p.y}%`, transform: 'translate(-50%, -50%)' }}
            className="absolute group focus:outline-none z-10"
            aria-label={`${p.title} in ${p.city}`}
          >
            <span
              className={`block w-3.5 h-3.5 rounded-full border-2 border-slate-900 transition-transform duration-150 ${
                isSelected ? 'scale-150 ring-4 ring-white/20' : 'group-hover:scale-125'
              } ${p.type === 'owned' ? 'bg-emerald-400' : 'bg-[#C9A35D]'}`}
            />
            <span className="pointer-events-none absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-950/95 text-white text-[11px] px-2.5 py-1 rounded border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {p.title} · {p.city}
            </span>
          </button>
        );
      })}

      {/* Active asset readout */}
      {selectedPoint && (
        <div className="absolute bottom-3 left-3 bg-slate-950/85 backdrop-blur-md border border-white/10 rounded-lg px-3.5 py-2.5 text-white max-w-xs z-10">
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-slate-400">
            <MapPinIcon className="w-3.5 h-3.5 text-[#C9A35D]" />
            <span>{selectedPoint.type === 'owned' ? 'Owned Asset' : 'Watchlist'} · {selectedPoint.city}</span>
          </div>
          <p className="text-xs font-semibold text-white truncate mt-0.5">{selectedPoint.title}</p>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-3 right-3 bg-slate-950/85 backdrop-blur-md border border-white/10 px-3 py-2 rounded-lg text-[11px] flex items-center gap-4 text-slate-200 z-10">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          Owned ({ownedProperties.length})
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#C9A35D]" />
          Watchlist ({watchlistProperties.length})
        </span>
      </div>
    </div>
  );
};

export default PortfolioMap;
