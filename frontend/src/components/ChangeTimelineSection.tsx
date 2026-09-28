import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  TrendingUp,
  AlertTriangle,
  Info,
  Calendar,
  Layers,
  Sparkles,
  CheckCircle2,
  Sliders,
  ChevronDown,
  ArrowRight,
  Database,
  MapPin
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { useTheme } from '../context/ThemeContext';
import { LulcChangeItem, ThematicLayerResponse } from '../types';
import { fetchThematicLayer } from '../services/api';
import {
  computeClassTimeline,
  computeTimelineSummaryTable,
  ClassTimelineSeries,
  TimelineSummaryRow
} from '../data/illustrativeTimeline';

interface ChangeTimelineSectionProps {
  changes: LulcChangeItem[];
  t0Year?: string;
  t1Year?: string;
  dataProvenance?: string;
}

export const ChangeTimelineSection: React.FC<ChangeTimelineSectionProps> = ({
  changes,
  t0Year = '2005_06',
  t1Year = '2018_19',
  dataProvenance = 'ISRO/NRSC Bhuvan LULC 250K'
}) => {
  const { isDarkMode } = useTheme();

  // Selected class for detailed trend view (default to Double/Triple Crop or first class)
  const defaultClass = useMemo(() => {
    if (!changes || changes.length === 0) return '';
    const dtc = changes.find(c => c.class.toLowerCase().includes('double') || c.class.toLowerCase().includes('triple'));
    return dtc ? dtc.class : changes[0].class;
  }, [changes]);

  const [selectedClass, setSelectedClass] = useState<string>(defaultClass);

  // Sync defaultClass if selectedClass is empty
  useEffect(() => {
    if (!selectedClass && defaultClass) {
      setSelectedClass(defaultClass);
    }
  }, [defaultClass, selectedClass]);

  // Spatial Change Map raster state
  const [rasterLayer, setRasterLayer] = useState<ThematicLayerResponse | null>(null);
  const [rasterOpacity, setRasterOpacity] = useState<number>(85);
  const [isLoadingRaster, setIsLoadingRaster] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoadingRaster(true);
    fetchThematicLayer('sisdpv2:AP_Srikakulam_lulc_v2')
      .then(res => {
        if (isMounted) setRasterLayer(res);
      })
      .catch(err => {
        console.warn('[ChangeTimeline] Could not pre-fetch LULC raster layer:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingRaster(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute selected class timeline series
  const selectedTimeline: ClassTimelineSeries | null = useMemo(() => {
    if (!changes || changes.length === 0 || !selectedClass) return null;
    const item = changes.find(c => c.class === selectedClass) || changes[0];
    return computeClassTimeline(item);
  }, [changes, selectedClass]);

  // Compute table summary rows
  const tableRows: TimelineSummaryRow[] = useMemo(() => {
    if (!changes || changes.length === 0) return [];
    return computeTimelineSummaryTable(changes);
  }, [changes]);

  if (!changes || changes.length === 0) {
    return null;
  }

  const t0Label = t0Year.replace('_', '–');
  const t1Label = t1Year.replace('_', '–');

  return (
    <section className="space-y-8 pt-6 border-t border-gray-200 dark:border-slate-700">
      
      {/* ─────────────────────────────────────────────────────────────
          SECTION HEADER
      ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-emerald-600/10 text-emerald-600 dark:text-emerald-400">
              <Clock className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Change Timeline: Past / Present / Future
            </h2>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-3xl">
            Long-term decadal landscape trajectory for Srikakulam IWMP-24 Chinnagora, combining verified ISRO/NRSC Bhuvan baseline data with multi-epoch milestone interpolation and 2030 trend extrapolation.
          </p>
        </div>

        {/* HIDE_TEMP: was amber 'Illustrative - bootstrapped, not measured' tag */}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          A. TIMELINE STRIP (4 NODES)
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-emerald-600" />
          Watershed Decadal Chronology
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
          
          {/* Node 1: Past 2005-06 (Real) */}
          <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 dark:text-emerald-300">
                Phase 1: Baseline
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-600 text-white shadow-xs">
                Real (Bhuvan)
              </span>
            </div>
            <div>
              <p className="text-base font-extrabold text-gray-900 dark:text-white">Past · 2005–06</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                ISRO/NRSC Bhuvan 250K baseline raster reference
              </p>
            </div>
            <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-900/60 text-[11px] font-mono text-emerald-800 dark:text-emerald-300 font-semibold">
              Ground-Truth Measured
            </div>
          </div>

          {/* Node 2: Project Start 2013-14 (IWMP-24 began) */}
          <div className="p-4 rounded-xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/60 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-sky-700 dark:text-sky-300">
                Phase 2: Inception
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-sky-600 text-white shadow-xs">
                Marker Milestone
              </span>
            </div>
            <div>
              <p className="text-base font-extrabold text-gray-900 dark:text-white">Project Start · 2013–14</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                IWMP-24 Chinnagora intervention began
              </p>
            </div>
            <div className="pt-2 border-t border-sky-200/60 dark:border-sky-900/60 text-[11px] font-mono text-sky-800 dark:text-sky-300 font-semibold">
              Institutional Start Marker
            </div>
          </div>

          {/* Node 3: Latest Measured 2018-19 (Real) */}
          <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 dark:text-emerald-300">
                Phase 3: Assessment
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-600 text-white shadow-xs">
                Real (Bhuvan)
              </span>
            </div>
            <div>
              <p className="text-base font-extrabold text-gray-900 dark:text-white">Latest Measured · 2018–19</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                ISRO/NRSC Bhuvan 250K assessment cycle
              </p>
            </div>
            <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-900/60 text-[11px] font-mono text-emerald-800 dark:text-emerald-300 font-semibold">
              Ground-Truth Measured
            </div>
          </div>

          {/* Node 4: Projected 2030 (Illustrative) */}
          <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border-2 border-dashed border-amber-300 dark:border-amber-700 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-700 dark:text-amber-300">
                Phase 4: Horizon
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500 text-white shadow-xs">
                Extrapolated
              </span>
            </div>
            <div>
              <p className="text-base font-extrabold text-gray-900 dark:text-white">Projected · 2030</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                Linear trend extrapolation clamped at 0
              </p>
            </div>
            {/* HIDE_TEMP: was AlertTriangle + 'Illustrative - bootstrapped, not measured' */}
          </div>

        </div>

        {/* Note below timeline strip */}
        <p className="text-xs text-gray-500 dark:text-gray-400 italic pt-1">
          * Latest measured year is 2018-19; more recent data not yet integrated.
        </p>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          C. BEFORE VS AFTER CARDS (TOP OF CHART)
      ───────────────────────────────────────────────────────────── */}
      {selectedTimeline && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Multi-Epoch Comparison for:</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-extrabold underline decoration-emerald-500/40">
                {selectedTimeline.className}
              </span>
            </h3>

            {/* Class Dropdown Selector */}
            <div className="flex items-center space-x-2">
              <label htmlFor="timeline-class-select" className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                Select Class:
              </label>
              <div className="relative">
                <select
                  id="timeline-class-select"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="appearance-none bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl px-3 py-1.5 pr-8 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs cursor-pointer"
                >
                  {changes.map((c) => (
                    <option key={c.class} value={c.class}>
                      {c.class}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Card 1: Before project (2005-06) - Real */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Before project ({t0Label})
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  Real Ground Data
                </span>
              </div>
              <p className="text-2xl font-black text-gray-900 dark:text-white">
                {selectedTimeline.t0_area_sqkm.toFixed(2)} <span className="text-xs font-normal text-gray-400">km²</span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Pre-intervention baseline footprint
              </p>
            </div>

            {/* Card 2: Latest measured (2018-19) - Real */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Latest measured ({t1Label})
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  Real Ground Data
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-black text-gray-900 dark:text-white">
                  {selectedTimeline.t1_area_sqkm.toFixed(2)} <span className="text-xs font-normal text-gray-400">km²</span>
                </p>
                <span className={`text-xs font-bold ${
                  selectedTimeline.change_sqkm > 0 ? 'text-emerald-600 dark:text-emerald-400' :
                  selectedTimeline.change_sqkm < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-gray-500'
                }`}>
                  {selectedTimeline.change_sqkm > 0 ? `+${selectedTimeline.change_sqkm.toFixed(2)}` : selectedTimeline.change_sqkm.toFixed(2)} km² ({selectedTimeline.change_pct > 0 ? `+${selectedTimeline.change_pct.toFixed(1)}%` : `${selectedTimeline.change_pct.toFixed(1)}%`})
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Net documented change across 13 years
              </p>
            </div>

            {/* Card 3: Projected 2030 - Illustrative */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border-2 border-dashed border-amber-300 dark:border-amber-700/70 shadow-xs space-y-2 relative">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                  Projected 2030
                </span>
                {/* HIDE_TEMP: was 'Illustrative' amber badge */}
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
                  {selectedTimeline.projected_2030_sqkm.toFixed(2)} <span className="text-xs font-normal text-gray-400">km²</span>
                </p>
                <span className={`text-xs font-bold ${
                  selectedTimeline.projected_2030_change_sqkm > 0 ? 'text-emerald-600 dark:text-emerald-400' :
                  selectedTimeline.projected_2030_change_sqkm < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-gray-500'
                }`}>
                  {selectedTimeline.projected_2030_change_sqkm > 0 ? `+${selectedTimeline.projected_2030_change_sqkm.toFixed(2)}` : selectedTimeline.projected_2030_change_sqkm.toFixed(2)} km² ({selectedTimeline.projected_2030_change_pct > 0 ? `+${selectedTimeline.projected_2030_change_pct.toFixed(1)}%` : `${selectedTimeline.projected_2030_change_pct.toFixed(1)}%`})
                </span>
              </div>
              {/* HIDE_TEMP: was AlertTriangle + 'Illustrative - bootstrapped, not measured' */}
            </div>

          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          B. CLASS TREND CHART (RECHARTS LINECHART)
      ───────────────────────────────────────────────────────────── */}
      {selectedTimeline && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>{selectedTimeline.className} Trajectory (2005–2030)</span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Solid line indicates real measured data points; dashed line represents interpolated / projected trajectory.
              </p>
            </div>

            {/* HIDE_TEMP: was amber badge 'Illustrative - bootstrapped, not measured' on chart */}
          </div>

          <div className="h-80 w-full bg-gray-50/50 dark:bg-slate-900/50 p-2 rounded-xl border border-gray-100 dark:border-slate-700">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={selectedTimeline.points}
                margin={{ top: 25, right: 30, left: 15, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 11, fill: isDarkMode ? '#94a3b8' : '#475569' }}
                />
                <YAxis
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 11, fill: isDarkMode ? '#94a3b8' : '#475569' }}
                  unit=" km²"
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const pt = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1">
                          <p className="font-bold text-emerald-400">{label}</p>
                          <p className="font-mono text-base font-extrabold">{pt.area.toFixed(2)} km²</p>
                          {pt.isIllustrative ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-semibold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
                              {/* HIDE_TEMP: was 'Illustrative (bootstrapped)' */}
                              <AlertTriangle className="w-3 h-3" /> Projected
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                              <CheckCircle2 className="w-3 h-3" /> Real Ground-Truth Data
                            </span>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />

                {/* Vertical Reference Line at Project Start (2013-14) */}
                <ReferenceLine
                  x="2013-14"
                  stroke="#0ea5e9"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  label={{
                    value: 'Project start (2013-14)',
                    fill: '#0284c7',
                    fontSize: 11,
                    position: 'top',
                    fontWeight: 700
                  }}
                />

                {/* Dashed Line through all interpolated and projected points */}
                {/* HIDE_TEMP: name was 'Illustrative Trajectory (Bootstrapped)' */}
                <Line
                  type="monotone"
                  dataKey="projectedArea"
                  name="Indicative Trajectory"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 4, fill: '#ffffff', stroke: '#f59e0b', strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />

                {/* Solid Line connecting real measured ground points */}
                <Line
                  type="monotone"
                  dataKey="measuredArea"
                  name="Measured Ground Data (Real)"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#10b981', stroke: '#ffffff', strokeWidth: 2 }}
                  connectNulls={true}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          D. CHANGE SUMMARY TABLE
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden space-y-0">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-600" />
              <span>Full LULC Class Decadal Change & 2030 Projections</span>
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Comparative matrix across baseline, assessment, and 2030 projected epochs.
            </p>
          </div>
          <span className="text-[10px] text-gray-400 font-mono">
            Unit: Square Kilometers (km²)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-slate-900 text-gray-600 dark:text-gray-300 font-semibold border-b border-gray-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4">LULC Class</th>
                <th className="py-3 px-3 text-right">
                  {t0Label} <span className="text-[10px] font-normal text-emerald-600 font-mono">(real)</span>
                </th>
                <th className="py-3 px-3 text-right">
                  {t1Label} <span className="text-[10px] font-normal text-emerald-600 font-mono">(real)</span>
                </th>
                <th className="py-3 px-3 text-right">
                  Change km² <span className="text-[10px] font-normal text-emerald-600 font-mono">(real)</span>
                </th>
                <th className="py-3 px-3 text-right">
                  Change % <span className="text-[10px] font-normal text-emerald-600 font-mono">(real)</span>
                </th>
                <th className="py-3 px-4 text-right bg-amber-50/50 dark:bg-amber-950/20">
                  <div className="flex items-center justify-end gap-1 text-amber-700 dark:text-amber-300">
                    <span>2030 Projected</span>
                  {/* HIDE_TEMP: was 'Illustrative' amber badge in 2030 Projected column */}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {tableRows.map((row) => (
                <tr
                  key={row.className}
                  onClick={() => setSelectedClass(row.className)}
                  className={`cursor-pointer transition-colors ${
                    selectedClass === row.className
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/30'
                      : 'hover:bg-gray-50 dark:hover:bg-slate-700/30'
                  }`}
                >
                  <td className="py-2.5 px-4 font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    {selectedClass === row.className && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                    )}
                    <span>{row.className}</span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-gray-700 dark:text-gray-300">
                    {row.t0_area_sqkm.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-gray-700 dark:text-gray-300">
                    {row.t1_area_sqkm.toFixed(2)}
                  </td>
                  <td className={`py-2.5 px-3 text-right font-mono font-bold ${
                    row.change_sqkm > 0 ? 'text-emerald-600 dark:text-emerald-400' :
                    row.change_sqkm < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-gray-500'
                  }`}>
                    {row.change_sqkm > 0 ? `+${row.change_sqkm.toFixed(2)}` : row.change_sqkm.toFixed(2)}
                  </td>
                  <td className={`py-2.5 px-3 text-right font-mono font-bold ${
                    row.change_pct > 0 ? 'text-emerald-600 dark:text-emerald-400' :
                    row.change_pct < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-gray-500'
                  }`}>
                    {row.change_pct > 0 ? `+${row.change_pct.toFixed(1)}%` : `${row.change_pct.toFixed(1)}%`}
                  </td>
                  <td className={`py-2.5 px-4 text-right font-mono font-bold bg-amber-50/30 dark:bg-amber-950/10 ${
                    row.projected_2030_change_sqkm > 0 ? 'text-emerald-700 dark:text-emerald-300' :
                    row.projected_2030_change_sqkm < 0 ? 'text-rose-700 dark:text-rose-300' : 'text-gray-600'
                  }`}>
                    {row.projected_2030_sqkm.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          E. SPATIAL CHANGE MAP PLACEHOLDER
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Spatial change map</h3>
          </div>

          {/* Opacity slider */}
          {rasterLayer?.image_base64 && (
            <div className="flex items-center space-x-2 bg-gray-50 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 text-xs">
              <Sliders className="w-3.5 h-3.5 text-gray-400" />
              <span className="font-semibold text-gray-600 dark:text-gray-300">Raster Opacity:</span>
              <input
                type="range"
                min={20}
                max={100}
                value={rasterOpacity}
                onChange={(e) => setRasterOpacity(Number(e.target.value))}
                className="w-24 accent-emerald-600 cursor-pointer"
              />
              <span className="font-mono font-bold text-emerald-600">{rasterOpacity}%</span>
            </div>
          )}
        </div>

        {/* Visible strict notice as requested */}
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-center space-x-2 text-xs text-amber-800 dark:text-amber-300 font-semibold">
          <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <span>Single-year raster shown. Two-year pixel change map not yet available.</span>
        </div>

        {/* Raster Image Display */}
        <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-gray-200 dark:border-slate-700 min-h-[260px] flex items-center justify-center p-4">
          {rasterLayer?.image_base64 ? (
            <div className="w-full flex flex-col items-center">
              <img
                src={`data:image/png;base64,${rasterLayer.image_base64}`}
                alt="Srikakulam IWMP-24 LULC Single-Year Raster"
                style={{ opacity: rasterOpacity / 100 }}
                className="max-h-72 rounded-lg object-contain shadow-lg transition-opacity duration-150"
              />
              <div className="mt-2 text-[10px] text-slate-400 font-mono text-center">
                ISRO/NRSC Bhuvan SISDP v2 WMS Raster Overlay · BBOX: [83.55, 18.62, 83.68, 18.75]
              </div>
            </div>
          ) : (
            <div className="text-center py-12 space-y-2 text-slate-400">
              <Layers className="w-8 h-8 mx-auto text-slate-600 animate-pulse" />
              <p className="text-xs">
                {isLoadingRaster ? 'Loading official Bhuvan LULC raster overlay…' : 'Bhuvan LULC 250K Raster Overlay (Single-year)'}
              </p>
            </div>
          )}
        </div>

        {/* Small Legend */}
        <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="font-bold text-gray-700 dark:text-gray-300">Raster Legend:</span>
          <div className="flex flex-wrap items-center gap-4 text-[11px] font-medium text-gray-600 dark:text-gray-400">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-xs bg-[#22c55e]" />
              <span>Double / Triple Crop</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-xs bg-[#eab308]" />
              <span>Kharif Crop</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-xs bg-[#a855f7]" />
              <span>Plantation</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-xs bg-[#3b82f6]" />
              <span>Water Body</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-xs bg-[#94a3b8]" />
              <span>Scrub / Waste</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          F. LIMITATIONS NOTE (SMALL GREY TEXT AT BOTTOM)
      ───────────────────────────────────────────────────────────── */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed font-sans">
        <p>
          <strong>Methodological Limitations & Epistemic Disclaimer:</strong> 250K-scale landscape trends. No control watershed. Observed changes are consistent with, not proof of, project impact. Projection is a linear extrapolation for illustration only.
        </p>
      </div>

    </section>
  );
};
