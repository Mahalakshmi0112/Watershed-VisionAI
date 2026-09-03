import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { StructureSummary } from '../types';
import { fetchStructures } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { AlertTriangle, Calendar, Layers, Sliders } from 'lucide-react';

// Custom Colored Leaflet Marker Icons
const createCustomMarker = (tier: string, isSynthetic: boolean) => {
  let color = '#22c55e'; // Green Healthy
  if (tier === 'Monitor') color = '#f59e0b'; // Amber
  if (tier === 'Urgent') color = '#ef4444'; // Red

  const svgHtml = `
    <div style="position: relative; width: 32px; height: 32px;">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="${color}" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
        <circle cx="12" cy="10" r="3" fill="#ffffff"></circle>
      </svg>
      ${isSynthetic ? '<span style="position: absolute; top:-4px; right:-4px; width:10px; height:10px; background:#f59e0b; border:1px solid #fff; border-radius:50%;"></span>' : ''}
    </div>
  `;

  return L.divIcon({
    html: svgHtml,
    className: 'custom-leaflet-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

export const MapViewPage: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [structures, setStructures] = useState<StructureSummary[]>([]);
  const [monthOffset, setMonthOffset] = useState<number>(0);  // Time-slider month offset 0 to 5

  useEffect(() => {
    fetchStructures()
      .then(data => setStructures(data))
      .catch(() => {});
  }, []);

  const monthLabels = ['March 2026', 'April 2026', 'May 2026', 'June 2026', 'July 2026', 'August 2026'];

  // OpenStreetMap tiles: 100% free, no API key required
  const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const tileAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  const defaultCenter: [number, number] = [19.1000, 73.2000];

  return (
    <div className="h-screen flex flex-col relative bg-gray-50 dark:bg-slate-900">
      
      {/* Top Map Control Bar */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-3.5 flex flex-wrap items-center justify-between z-10 shadow-sm gap-4">
        <div className="flex items-center space-x-3">
          <Layers className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Spatial Watershed Structure Map</h1>
          <span className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 font-mono">
            {structures.length} structures loaded
          </span>
        </div>

        {/* Time-Slider for Temporal Satellite Trend Visualization */}
        <div className="flex items-center space-x-3 bg-gray-50 dark:bg-slate-900 px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700">
          <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 w-24">
            {monthLabels[monthOffset]}
          </span>
          <input
            type="range"
            min={0}
            max={5}
            value={monthOffset}
            onChange={(e) => setMonthOffset(Number(e.target.value))}
            className="w-36 accent-emerald-600 cursor-pointer"
          />
          <Sliders className="w-4 h-4 text-gray-400" />
        </div>

        {/* Map Legend */}
        <div className="flex items-center space-x-4 text-xs font-medium text-gray-600 dark:text-gray-300">
          <div className="flex items-center space-x-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500"></span><span>Healthy</span></div>
          <div className="flex items-center space-x-1.5"><span className="w-3 h-3 rounded-full bg-amber-500"></span><span>Monitor</span></div>
          <div className="flex items-center space-x-1.5"><span className="w-3 h-3 rounded-full bg-red-500"></span><span>Urgent</span></div>
          <div className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-white"></span><span>Demo Fallback</span></div>
        </div>
      </div>

      {/* Fullscreen Interactive Leaflet Map */}
      <div className="flex-1 w-full relative">
        <MapContainer center={defaultCenter} zoom={9} style={{ width: '100%', height: '100%' }}>
          <TileLayer url={tileUrl} attribution={tileAttribution} />
          
          {structures.map((s) => (
            <Marker
              key={s.id}
              position={[s.latitude, s.longitude]}
              icon={createCustomMarker(s.priority_tier, s.is_synthetic)}
            >
              <Popup>
                <div className="p-1 space-y-2 max-w-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-gray-900 dark:text-white leading-tight">{s.name}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">{s.code}</p>
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                      s.priority_tier === 'Urgent' ? 'bg-red-100 text-red-800' :
                      s.priority_tier === 'Monitor' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {s.priority_tier}
                    </span>
                  </div>

                  {/* Synthetic Data Warning Badge directly from list endpoint property */}
                  {s.is_synthetic && (
                    <div className="flex items-center space-x-1 text-[11px] bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 p-1.5 rounded border border-amber-200 dark:border-amber-800">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-amber-600" />
                      <span>Demo data — GEE not connected</span>
                    </div>
                  )}

                  <div className="text-xs space-y-1 text-gray-600 dark:text-gray-300">
                    <p><strong>Watershed:</strong> {s.watershed_name}</p>
                    <p><strong>Type:</strong> {s.structure_type.replace('_', ' ')}</p>
                    <p><strong>Score:</strong> <span className="font-bold">{s.composite_score}/100</span></p>
                  </div>

                  <Link
                    to={`/structure/${s.id}`}
                    className="block text-center w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded transition-colors"
                  >
                    View Full Structure Details & Grad-CAM →
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

    </div>
  );
};
