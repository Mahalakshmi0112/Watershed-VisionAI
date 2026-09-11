import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, ImageOverlay, useMap } from 'react-leaflet';
import L from 'leaflet';
import { StructureSummary, ThematicLayerResponse, LulcChangeResponse } from '../types';
import { fetchStructures, fetchThematicLayer, fetchLulcChangeStats } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import {
  AlertTriangle,
  Calendar,
  Layers,
  Sliders,
  BarChart2,
  X,
  Loader2,
  Eye,
  EyeOff,
  Compass,
  Database,
  TrendingUp,
  Info
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

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

// MapController component to smoothly fit map view to target bounds
const MapController: React.FC<{ targetBounds?: [[number, number], [number, number]] | null }> = ({ targetBounds }) => {
  const map = useMap();
  useEffect(() => {
    if (targetBounds) {
      map.fitBounds(targetBounds, { padding: [40, 40], maxZoom: 13, animate: true });
    }
  }, [targetBounds, map]);
  return null;
};

// Srikakulam IWMP-24 Chinnagora AOI bounds in Leaflet format [[South, West], [North, East]]
const SRIKAKULAM_BOUNDS: [[number, number], [number, number]] = [
  [18.62, 83.55],
  [18.75, 83.68]
];

const DEFAULT_STRUCTURES_BOUNDS: [[number, number], [number, number]] = [
  [18.8, 73.0],
  [19.3, 73.5]
];

export const MapViewPage: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [structures, setStructures] = useState<StructureSummary[]>([]);
  const [monthOffset, setMonthOffset] = useState<number>(0);

  // Thematic Layers State
  const [showDrainage, setShowDrainage] = useState<boolean>(false);
  const [drainageLayer, setDrainageLayer] = useState<ThematicLayerResponse | null>(null);
  const [isLoadingDrainage, setIsLoadingDrainage] = useState<boolean>(false);

  const [showLulc, setShowLulc] = useState<boolean>(false);
  const [lulcLayer, setLulcLayer] = useState<ThematicLayerResponse | null>(null);
  const [isLoadingLulc, setIsLoadingLulc] = useState<boolean>(false);

  // Target Bounds for map camera movement
  const [targetBounds, setTargetBounds] = useState<[[number, number], [number, number]] | null>(null);

  // LULC Change Side Panel State
  const [isLulcDrawerOpen, setIsLulcDrawerOpen] = useState<boolean>(false);
  const [lulcChangeData, setLulcChangeData] = useState<LulcChangeResponse | null>(null);
  const [isLoadingLulcChange, setIsLoadingLulcChange] = useState<boolean>(false);

  useEffect(() => {
    fetchStructures()
      .then(data => setStructures(data))
      .catch(() => {});
  }, []);

  // Handle Drainage checkbox toggle
  const handleToggleDrainage = async (checked: boolean) => {
    setShowDrainage(checked);
    if (checked) {
      setTargetBounds(SRIKAKULAM_BOUNDS);
      if (!drainageLayer) {
        setIsLoadingDrainage(true);
        try {
          const data = await fetchThematicLayer('BDRAIN');
          setDrainageLayer(data);
        } catch (err) {
          console.error('[Thematic Layer] Error loading drainage layer:', err);
        } finally {
          setIsLoadingDrainage(false);
        }
      }
    }
  };

  // Handle LULC checkbox toggle
  const handleToggleLulc = async (checked: boolean) => {
    setShowLulc(checked);
    if (checked) {
      setTargetBounds(SRIKAKULAM_BOUNDS);
      if (!lulcLayer) {
        setIsLoadingLulc(true);
        try {
          const data = await fetchThematicLayer('sisdpv2:AP_Srikakulam_lulc_v2');
          setLulcLayer(data);
        } catch (err) {
          console.error('[Thematic Layer] Error loading LULC layer:', err);
        } finally {
          setIsLoadingLulc(false);
        }
      }
    }
  };

  // Handle opening LULC change drawer
  const handleOpenLulcDrawer = async () => {
    setIsLulcDrawerOpen(true);
    if (!lulcChangeData) {
      setIsLoadingLulcChange(true);
      try {
        const data = await fetchLulcChangeStats();
        setLulcChangeData(data);
      } catch (err) {
        console.error('[Thematic] Error fetching LULC change data:', err);
      } finally {
        setIsLoadingLulcChange(false);
      }
    }
  };

  // Sort changes by |change_sqkm| descending for chart and table
  const sortedChanges = useMemo(() => {
    if (!lulcChangeData?.changes) return [];
    return [...lulcChangeData.changes].sort(
      (a, b) => Math.abs(b.change_sqkm) - Math.abs(a.change_sqkm)
    );
  }, [lulcChangeData]);

  // Transform sorted data for Recharts
  const chartData = useMemo(() => {
    return sortedChanges.map(item => ({
      class: item.class,
      t0_area: item.t0_area_sqkm,
      t1_area: item.t1_area_sqkm,
      change_sqkm: item.change_sqkm,
      change_pct: item.change_pct
    }));
  }, [sortedChanges]);

  // Leaflet bounds calculation helper
  const getLeafletBounds = (bbox?: [number, number, number, number]): [[number, number], [number, number]] => {
    if (!bbox || bbox.length !== 4) return SRIKAKULAM_BOUNDS;
    return [
      [bbox[1], bbox[0]],
      [bbox[3], bbox[2]]
    ];
  };

  const monthLabels = ['March 2026', 'April 2026', 'May 2026', 'June 2026', 'July 2026', 'August 2026'];
  const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const tileAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
  const defaultCenter: [number, number] = [19.1000, 73.2000];

  // Active provenance and source indicators
  const activeProvenance = drainageLayer?.data_provenance || lulcLayer?.data_provenance || lulcChangeData?.data_provenance || 'ISRO/NRSC Bhuvan, Srikakulam IWMP-24 Chinnagora AOI';

  return (
    <div className="h-screen flex flex-col relative bg-gray-50 dark:bg-slate-900 overflow-hidden">
      
      {/* Top Map Control Bar */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-3 flex flex-wrap items-center justify-between z-10 shadow-sm gap-4">
        <div className="flex items-center space-x-3">
          <Layers className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Spatial Watershed Structure Map</h1>
          <span className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 font-mono">
            {structures.length} structures loaded
          </span>
        </div>

        {/* Time-Slider for Temporal Satellite Trend Visualization */}
        <div className="flex items-center space-x-3 bg-gray-50 dark:bg-slate-900 px-4 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700">
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
            className="w-32 accent-emerald-600 cursor-pointer"
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

      {/* Map Body and Overlays */}
      <div className="flex-1 w-full relative">
        <MapContainer center={defaultCenter} zoom={9} style={{ width: '100%', height: '100%' }}>
          <TileLayer url={tileUrl} attribution={tileAttribution} />
          <MapController targetBounds={targetBounds} />

          {/* Land Use Raster (LULC) Image Overlay */}
          {showLulc && lulcLayer && (
            <ImageOverlay
              url={`data:image/png;base64,${lulcLayer.image_base64}`}
              bounds={getLeafletBounds(lulcLayer.bbox)}
              opacity={0.7}
              zIndex={90}
            />
          )}

          {/* Drainage Network Vector WMS Image Overlay */}
          {showDrainage && drainageLayer && (
            <ImageOverlay
              url={`data:image/png;base64,${drainageLayer.image_base64}`}
              bounds={getLeafletBounds(drainageLayer.bbox)}
              opacity={0.85}
              zIndex={100}
            />
          )}
          
          {/* Structure Markers */}
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

        {/* Floating "Thematic Layers" Panel on the Map */}
        <div className="absolute top-4 right-4 z-[500] w-80 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-xl shadow-xl border border-gray-200 dark:border-slate-700 p-4 space-y-3.5 text-gray-900 dark:text-white transition-all">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-700 pb-2.5">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-sm font-bold">Thematic Layers</h2>
            </div>
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Bhuvan WMS
            </span>
          </div>

          {/* Toggleable Layer Checkboxes */}
          <div className="space-y-2.5">
            {/* Drainage Checkbox */}
            <label className="flex items-start justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-slate-600 transition">
              <div className="flex items-center space-x-2.5">
                <input
                  type="checkbox"
                  id="checkbox-drainage"
                  checked={showDrainage}
                  onChange={(e) => handleToggleDrainage(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300 dark:border-slate-600 cursor-pointer"
                />
                <span className="text-xs font-semibold">Drainage Network</span>
              </div>
              <div className="flex items-center space-x-1.5">
                {isLoadingDrainage && <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />}
                {drainageLayer && (
                  <span
                    id="drainage-source-badge"
                    className={`text-[10px] px-1.5 py-0.5 font-mono font-medium rounded ${
                      drainageLayer.source === 'live'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    {drainageLayer.source}
                  </span>
                )}
              </div>
            </label>

            {/* Land Use (LULC) Checkbox */}
            <label className="flex items-start justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-slate-600 transition">
              <div className="flex items-center space-x-2.5">
                <input
                  type="checkbox"
                  id="checkbox-lulc"
                  checked={showLulc}
                  onChange={(e) => handleToggleLulc(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300 dark:border-slate-600 cursor-pointer"
                />
                <span className="text-xs font-semibold">Land Use (LULC)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                {isLoadingLulc && <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />}
                {lulcLayer && (
                  <span
                    id="lulc-source-badge"
                    className={`text-[10px] px-1.5 py-0.5 font-mono font-medium rounded ${
                      lulcLayer.source === 'live'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    {lulcLayer.source}
                  </span>
                )}
              </div>
            </label>
          </div>

          {/* Land Use Change Analysis Button */}
          <button
            id="btn-lulc-change"
            onClick={handleOpenLulcDrawer}
            className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            <BarChart2 className="w-4 h-4" />
            <span>Land Use Change (2005-06 vs 2018-19)</span>
          </button>

          {/* Camera Focus Controls */}
          <div className="pt-1 flex items-center justify-between gap-2">
            <button
              onClick={() => setTargetBounds(SRIKAKULAM_BOUNDS)}
              className="flex-1 text-[11px] py-1.5 px-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded text-gray-700 dark:text-gray-300 font-medium transition"
            >
              Focus Srikakulam AOI
            </button>
            <button
              onClick={() => setTargetBounds(DEFAULT_STRUCTURES_BOUNDS)}
              className="flex-1 text-[11px] py-1.5 px-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded text-gray-700 dark:text-gray-300 font-medium transition"
            >
              Reset Structures View
            </button>
          </div>

          {/* Dynamic Data Provenance Caption */}
          <div className="pt-2 border-t border-gray-100 dark:border-slate-700">
            <div className="flex items-start space-x-1.5 text-[10px] text-gray-500 dark:text-gray-400">
              <Info className="w-3.5 h-3.5 flex-shrink-0 text-gray-400 mt-0.5" />
              <div>
                <p className="font-medium leading-tight">{activeProvenance}</p>
                <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-0.5 font-mono">
                  BBOX: 83.55, 18.62, 83.68, 18.75
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* LULC Change Analysis Side Drawer / Panel */}
        {isLulcDrawerOpen && (
          <div className="absolute inset-y-0 right-0 z-[600] w-full max-w-xl md:w-[580px] bg-white dark:bg-slate-800 shadow-2xl border-l border-gray-200 dark:border-slate-700 flex flex-col text-gray-900 dark:text-white transition-all transform animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <BarChart2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <h3 className="text-base font-bold">Land Use Change (2005-06 vs 2018-19)</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Srikakulam IWMP-24 Chinnagora Watershed</p>
                </div>
              </div>
              <button
                id="btn-close-lulc-drawer"
                onClick={() => setIsLulcDrawerOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {isLoadingLulcChange ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                  <p className="text-xs text-gray-500">Fetching LULC change statistics from Bhuvan...</p>
                </div>
              ) : lulcChangeData ? (
                <>
                  {/* Provenance & Source Metadata Card */}
                  <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-700 dark:text-gray-300">Data Provenance:</span>
                      <span className="font-mono text-emerald-700 dark:text-emerald-400 font-medium">
                        {lulcChangeData.data_provenance}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-700 dark:text-gray-300">Source Indicators:</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-gray-200 dark:bg-slate-800 text-gray-700 dark:text-gray-300">
                          2005-06: <strong className="text-emerald-600 dark:text-emerald-400">{lulcChangeData.data_source['2005_06']}</strong>
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-gray-200 dark:bg-slate-800 text-gray-700 dark:text-gray-300">
                          2018-19: <strong className="text-emerald-600 dark:text-emerald-400">{lulcChangeData.data_source['2018_19']}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Summary Highlights */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                      <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                        Largest Expansion
                      </span>
                      <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">Double/Triple Crop</p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                        +34.42 km² (+93.15%)
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
                      <span className="text-[10px] font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider">
                        Largest Reduction
                      </span>
                      <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">Kharif Crop</p>
                      <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold mt-0.5">
                        -25.43 km² (-44.03%)
                      </p>
                    </div>
                  </div>

                  {/* Recharts Bar Chart Comparing 2005-06 vs 2018-19 */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Area Comparison by Class (Sorted by |Change|)
                      </h4>
                      <span className="text-[10px] text-gray-400">Unit: Sq. Km</span>
                    </div>

                    <div className="h-96 w-full bg-gray-50 dark:bg-slate-900/60 p-2 rounded-xl border border-gray-200 dark:border-slate-700">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          layout="vertical"
                          data={chartData}
                          margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" opacity={0.2} horizontal={false} />
                          <XAxis type="number" tick={{ fontSize: 10 }} />
                          <YAxis
                            type="category"
                            dataKey="class"
                            width={130}
                            tick={{ fontSize: 10, fill: isDarkMode ? '#cbd5e1' : '#334155' }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                              borderColor: isDarkMode ? '#334155' : '#e2e8f0',
                              borderRadius: '8px',
                              fontSize: '11px'
                            }}
                            formatter={(value: any) => [`${value} km²`]}
                          />
                          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                          <Bar dataKey="t0_area" name="2005-06 Area" fill="#38bdf8" radius={[0, 4, 4, 0]} />
                          <Bar dataKey="t1_area" name="2018-19 Area" fill="#10b981" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Detailed Comparison Table */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                      Class Breakdown & Statistics
                    </h4>
                    <div className="border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-gray-100 dark:bg-slate-700/70 text-gray-600 dark:text-gray-300 font-semibold">
                          <tr>
                            <th className="py-2.5 px-3">LULC Class</th>
                            <th className="py-2.5 px-2 text-right">2005-06</th>
                            <th className="py-2.5 px-2 text-right">2018-19</th>
                            <th className="py-2.5 px-2 text-right">Change</th>
                            <th className="py-2.5 px-3 text-right">% Chg</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                          {sortedChanges.map((row) => (
                            <tr key={row.class} className="hover:bg-gray-50 dark:hover:bg-slate-700/40">
                              <td className="py-2 px-3 font-medium text-gray-900 dark:text-white">{row.class}</td>
                              <td className="py-2 px-2 text-right font-mono">{row.t0_area_sqkm.toFixed(2)}</td>
                              <td className="py-2 px-2 text-right font-mono">{row.t1_area_sqkm.toFixed(2)}</td>
                              <td className={`py-2 px-2 text-right font-mono font-bold ${
                                row.change_sqkm > 0 ? 'text-emerald-600 dark:text-emerald-400' :
                                row.change_sqkm < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-gray-500'
                              }`}>
                                {row.change_sqkm > 0 ? `+${row.change_sqkm.toFixed(2)}` : row.change_sqkm.toFixed(2)}
                              </td>
                              <td className={`py-2 px-3 text-right font-mono text-[11px] ${
                                row.change_pct > 0 ? 'text-emerald-600 dark:text-emerald-400' :
                                row.change_pct < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-gray-500'
                              }`}>
                                {row.change_pct > 0 ? `+${row.change_pct.toFixed(1)}%` : `${row.change_pct.toFixed(1)}%`}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-4 rounded bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 text-xs">
                  Unable to load LULC change statistics. Please ensure the backend server is running.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
