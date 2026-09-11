import React, { useEffect, useState, useMemo } from 'react';
import {
  FlaskConical, AlertTriangle, CheckCircle, Info,
  Database, TrendingUp, TrendingDown, Minus,
  MapPin, Loader2, RefreshCw, Layers, Cpu, Tag
} from 'lucide-react';
import { fetchLulcChangeStats, fetchStructures, fetchLulcClusters } from '../services/api';
import { LulcChangeResponse, StructureSummary, LulcClusterItem } from '../types';

// ──────────────────────────────────────────────────────────────
//  AOI bounding box for the Srikakulam IWMP-24 Chinnagora AOI
//  [min_lon, min_lat, max_lon, max_lat]
// ──────────────────────────────────────────────────────────────
const AOI_BBOX = { minLon: 83.55, minLat: 18.62, maxLon: 83.68, maxLat: 18.75 };
const AOI_NAME = 'Srikakulam IWMP-24 Chinnagora';

/** Returns true if a structure's lat/lon falls within the AOI bbox (with a small buffer). */
function isInAOI(lat: number, lon: number, bufferDeg = 0.05): boolean {
  return (
    lat >= AOI_BBOX.minLat - bufferDeg &&
    lat <= AOI_BBOX.maxLat + bufferDeg &&
    lon >= AOI_BBOX.minLon - bufferDeg &&
    lon <= AOI_BBOX.maxLon + bufferDeg
  );
}

/**
 * Auto-generate a 3–5 sentence plain-language validation summary from the
 * top-4 LULC changes. Based strictly on API-returned numbers. Uses hedged
 * language ("consistent with", "may indicate") rather than causal claims.
 */
function generateValidationSummary(
  topChanges: LulcChangeResponse['changes'],
  t0Year: string,
  t1Year: string
): string {
  if (topChanges.length === 0) return 'No land-use change data available for summary.';

  const fmt = (n: number) => Math.abs(n).toFixed(2);
  const pct = (n: number) => `${Math.abs(n).toFixed(1)}%`;
  const dir = (n: number) => (n > 0 ? 'increased' : 'decreased');
  const t0 = t0Year.replace('_', '–');
  const t1 = t1Year.replace('_', '–');

  const gains = topChanges.filter(c => c.change_sqkm > 0).slice(0, 2);
  const losses = topChanges.filter(c => c.change_sqkm < 0).slice(0, 2);

  const sentences: string[] = [];

  // Sentence 1: Framing
  sentences.push(
    `Between ${t0} and ${t1}, the ${AOI_NAME} watershed shows notable land-use transitions across ${topChanges.length} observed classes, based on ISRO/NRSC Bhuvan LULC 250K data.`
  );

  // Sentence 2: Largest gain
  if (gains[0]) {
    sentences.push(
      `${gains[0].class} area ${dir(gains[0].change_sqkm)} by ${fmt(gains[0].change_sqkm)} km² (+${pct(gains[0].change_pct)}), which may indicate that more of the watershed area has been brought under ${gains[0].change_sqkm > 20 ? 'intensified or multi-season' : 'expanded'} cultivation during this period.`
    );
  }

  // Sentence 3: Largest loss
  if (losses[0]) {
    const note =
      losses[0].class === 'Current Fallow'
        ? 'consistent with a shift toward more continuous cultivation cycles'
        : losses[0].class === 'Kharif Crop'
        ? 'which may reflect a shift in cropping season preferences or water availability'
        : 'which may reflect land-use pressures or changes in agricultural practice';
    sentences.push(
      `${losses[0].class} area ${dir(losses[0].change_sqkm)} by ${fmt(losses[0].change_sqkm)} km² (−${pct(losses[0].change_pct)}), ${note}.`
    );
  }

  // Sentence 4: Secondary changes if they exist
  if (losses[1]) {
    sentences.push(
      `${losses[1].class} also showed a decline of ${fmt(losses[1].change_sqkm)} km² (−${pct(losses[1].change_pct)}), suggesting overall land-use intensification across the watershed may be underway.`
    );
  }

  // Sentence 5: Epistemic disclaimer
  sentences.push(
    `These observations are consistent with evolving agricultural land use in the watershed; they do not establish any direct causal link to specific watershed interventions or schemes without additional field corroboration.`
  );

  return sentences.join(' ');
}

// ──────────────────────────────────────────────────────────────
//  Source Badge Component
// ──────────────────────────────────────────────────────────────
const SourceBadge: React.FC<{ source: string }> = ({ source }) => (
  <span
    className={`text-[10px] px-2 py-0.5 font-mono font-semibold rounded-full ${
      source === 'live'
        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
        : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
    }`}
  >
    {source === 'live' ? '● live' : '◌ cached_fallback'}
  </span>
);

// ──────────────────────────────────────────────────────────────
//  Cluster Badge Component (Unsupervised ML)
// ──────────────────────────────────────────────────────────────
const ClusterBadge: React.FC<{ label: string }> = ({ label }) => {
  const norm = label.toLowerCase().trim();
  let colorClasses = 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-300';
  if (norm === 'expanding') {
    colorClasses = 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800';
  } else if (norm === 'stable') {
    colorClasses = 'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800';
  } else if (norm === 'declining') {
    colorClasses = 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800';
  }

  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${colorClasses}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
};

// ──────────────────────────────────────────────────────────────
//  Main Page
// ──────────────────────────────────────────────────────────────
export const WatershedValidationPage: React.FC = () => {
  const [lulcData, setLulcData] = useState<LulcChangeResponse | null>(null);
  const [clusters, setClusters] = useState<LulcClusterItem[] | null>(null);
  const [structures, setStructures] = useState<StructureSummary[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [lulc, allStructures, clusterRes] = await Promise.all([
        fetchLulcChangeStats(),
        fetchStructures(),
        fetchLulcClusters()
      ]);
      setLulcData(lulc);
      setStructures(allStructures);
      setClusters(clusterRes.clusters);
    } catch (err: any) {
      setError(err?.message || 'Failed to load watershed validation data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // Map class name -> cluster label from unsupervised ML endpoint
  const classClusterMap = useMemo(() => {
    const map = new Map<string, string>();
    if (clusters) {
      for (const c of clusters) {
        map.set(c.class.trim(), c.cluster_label);
      }
    }
    return map;
  }, [clusters]);

  // Top 4 LULC classes by absolute change
  const top4 = useMemo(() => {
    if (!lulcData) return [];
    return [...lulcData.changes]
      .sort((a, b) => Math.abs(b.change_sqkm) - Math.abs(a.change_sqkm))
      .slice(0, 4);
  }, [lulcData]);

  // Structures within or near the AOI bbox
  const aoiStructures = useMemo(() => {
    if (!structures) return [];
    return structures.filter(s => isInAOI(s.latitude, s.longitude));
  }, [structures]);

  // Auto-generated summary text
  const summaryText = useMemo(() => {
    if (!lulcData) return '';
    return generateValidationSummary(top4, lulcData.t0_year, lulcData.t1_year);
  }, [top4, lulcData]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-emerald-600" />
            Watershed Validation
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Land-use change analysis and field structure inventory for the{' '}
            <strong className="text-gray-700 dark:text-gray-200">{AOI_NAME}</strong> AOI,
            based on ISRO/NRSC Bhuvan data.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ── Loading / Error states ── */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <p className="text-sm text-gray-500">Loading LULC statistics and structure inventory…</p>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 flex items-start gap-2 text-sm text-red-700 dark:text-red-300">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!loading && lulcData && (
        <>
          {/* ── Data Provenance Banner ── */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <div>
                <p className="font-bold text-gray-800 dark:text-white">{lulcData.data_provenance}</p>
                <p className="text-gray-500 dark:text-gray-400">
                  Comparing {lulcData.t0_year.replace('_', '–')} → {lulcData.t1_year.replace('_', '–')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-gray-500 mb-0.5">
                  {lulcData.t0_year.replace('_', '–')} source
                </p>
                <SourceBadge source={lulcData.data_source[lulcData.t0_year]} />
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-gray-500 mb-0.5">
                  {lulcData.t1_year.replace('_', '–')} source
                </p>
                <SourceBadge source={lulcData.data_source[lulcData.t1_year]} />
              </div>
            </div>
          </div>

          {/* ── Top 4 Land-Use Classes ── */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                  Top Land-Use Changes by Absolute Area (km²)
                </h2>
              </div>
              <span className="text-xs text-gray-400 font-mono">
                {lulcData.t0_year.replace('_', '–')} vs {lulcData.t1_year.replace('_', '–')}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-gray-100 dark:bg-slate-700">
              {top4.map((item) => {
                const gain = item.change_sqkm > 0;
                const neutral = item.change_sqkm === 0;
                const clusterLabel = classClusterMap.get(item.class.trim());
                return (
                  <div
                    key={item.class}
                    className="bg-white dark:bg-slate-800 p-5 space-y-3"
                  >
                    {/* Class name + direction badge + cluster badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">{item.class}</h3>
                        {clusterLabel && (
                          <div className="mt-1">
                            <ClusterBadge label={clusterLabel} />
                          </div>
                        )}
                      </div>
                      <span
                        className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          gain
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : neutral
                            ? 'bg-gray-100 dark:bg-slate-700 text-gray-500'
                            : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                        }`}
                      >
                        {gain ? <TrendingUp className="w-3 h-3" /> : neutral ? <Minus className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {gain ? '+' : ''}{item.change_pct.toFixed(1)}%
                      </span>
                    </div>

                    {/* Area comparison row */}
                    <div className="flex items-end gap-4 text-xs">
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase font-semibold mb-0.5">
                          {lulcData.t0_year.replace('_', '–')}
                        </p>
                        <p className="text-lg font-extrabold text-gray-700 dark:text-gray-200 tabular-nums">
                          {item.t0_area_sqkm.toFixed(2)}
                          <span className="text-xs font-normal text-gray-400 ml-1">km²</span>
                        </p>
                      </div>
                      <div className="text-gray-300 dark:text-slate-600 text-lg font-light pb-1">→</div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase font-semibold mb-0.5">
                          {lulcData.t1_year.replace('_', '–')}
                        </p>
                        <p className="text-lg font-extrabold text-gray-700 dark:text-gray-200 tabular-nums">
                          {item.t1_area_sqkm.toFixed(2)}
                          <span className="text-xs font-normal text-gray-400 ml-1">km²</span>
                        </p>
                      </div>
                    </div>

                    {/* Visual change bar */}
                    <div className="h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          gain ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                        style={{
                          width: `${Math.min(100, Math.abs(item.change_pct))}%`
                        }}
                      />
                    </div>

                    <p className={`text-xs font-semibold tabular-nums ${
                      gain ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {gain ? '+' : ''}{item.change_sqkm.toFixed(2)} km² net change
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── ML Unsupervised Clustering Table (All 11 Classes) ── */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-600" />
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                  LULC Dynamics Classification (K-Means ML Clustering, k=3)
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-400 font-mono">
                  Sourced from <span className="font-semibold text-emerald-600">GET /thematic/lulc-clusters</span>
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 dark:bg-slate-900 text-gray-500 dark:text-gray-400 font-semibold uppercase border-b border-gray-100 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3">Land-Use Class</th>
                    <th className="px-4 py-3">ML Cluster Label</th>
                    <th className="px-4 py-3 text-right">2005–06 Area</th>
                    <th className="px-4 py-3 text-right">2018–19 Area</th>
                    <th className="px-4 py-3 text-right">Net Change (km²)</th>
                    <th className="px-4 py-3 text-right">Change %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {lulcData.changes.map((item) => {
                    const clusterLabel = classClusterMap.get(item.class.trim()) || 'unknown';
                    const gain = item.change_sqkm > 0;
                    return (
                      <tr key={item.class} className="hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors">
                        <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                          {item.class}
                        </td>
                        <td className="px-4 py-3">
                          <ClusterBadge label={clusterLabel} />
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-gray-600 dark:text-gray-300">
                          {item.t0_area_sqkm.toFixed(2)} km²
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-gray-600 dark:text-gray-300">
                          {item.t1_area_sqkm.toFixed(2)} km²
                        </td>
                        <td className={`px-4 py-3 text-right tabular-nums font-semibold ${
                          gain ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                        }`}>
                          {gain ? '+' : ''}{item.change_sqkm.toFixed(2)} km²
                        </td>
                        <td className={`px-4 py-3 text-right tabular-nums font-bold ${
                          gain ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                        }`}>
                          {gain ? '+' : ''}{item.change_pct.toFixed(2)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900/50 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between text-[11px] text-gray-500">
              <span>Unsupervised K-Means clustering trained on standardized features: [t0_area, t1_area, change_pct]</span>
              <span>11 classes partitioned into 3 dynamic clusters</span>
            </div>
          </div>

          {/* ── Auto-Generated Plain-Language Summary ── */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex items-center gap-2">
              <Info className="w-4 h-4 text-sky-500" />
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                Auto-Generated Validation Summary
              </h2>
              <span className="ml-auto text-[10px] font-mono text-gray-400 uppercase">
                rule-based · not LLM-generated
              </span>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {summaryText}
              </p>
              <p className="mt-3 text-[11px] text-gray-400 dark:text-gray-500 italic">
                Summary auto-generated from API-returned numeric data. Phrases such as "consistent with" and
                "may indicate" reflect observational interpretation only — not causal attribution to any specific scheme or intervention.
              </p>
            </div>
          </div>

          {/* ── Structures in AOI ── */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                Registered Structures in AOI
              </h2>
              <span className="ml-auto text-xs text-gray-400">
                BBOX: {AOI_BBOX.minLon}, {AOI_BBOX.minLat} → {AOI_BBOX.maxLon}, {AOI_BBOX.maxLat}
              </span>
            </div>

            {structures === null ? (
              <div className="px-6 py-8 text-center text-sm text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                Loading structure inventory…
              </div>
            ) : aoiStructures.length === 0 ? (
              <div className="px-6 py-8">
                <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-bold text-amber-900 dark:text-amber-300">
                      No structures registered within or near this AOI
                    </p>
                    <p className="text-amber-700 dark:text-amber-400 mt-1">
                      The {AOI_NAME} watershed boundary ({AOI_BBOX.minLon}–{AOI_BBOX.maxLon}°E,{' '}
                      {AOI_BBOX.minLat}–{AOI_BBOX.maxLat}°N) does not match any
                      structures currently in the database. To associate structures with this AOI,
                      ingest them via the Data Ingestion admin panel with appropriate latitude/longitude coordinates.
                    </p>
                    <p className="mt-2 text-[11px] font-mono text-amber-500 dark:text-amber-500">
                      Total structures in database: {structures.length} — none within search radius.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 dark:bg-slate-900 text-gray-500 dark:text-gray-400 font-semibold uppercase border-b border-gray-100 dark:border-slate-700">
                    <tr>
                      <th className="px-4 py-3">Code</th>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Score</th>
                      <th className="px-4 py-3">Priority</th>
                      <th className="px-4 py-3">Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                    {aoiStructures.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/40">
                        <td className="px-4 py-3 font-mono text-gray-500">{s.code}</td>
                        <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">{s.name}</td>
                        <td className="px-4 py-3 capitalize text-gray-600 dark:text-gray-300">
                          {s.structure_type.replace(/_/g, ' ')}
                        </td>
                        <td className="px-4 py-3 font-bold">{s.composite_score}/100</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded font-extrabold text-[10px] uppercase ${
                            s.priority_tier === 'Urgent' ? 'bg-red-100 text-red-700' :
                            s.priority_tier === 'Monitor' ? 'bg-amber-100 text-amber-700' :
                            'bg-emerald-100 text-emerald-700'
                          }`}>
                            {s.priority_tier}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {s.is_synthetic ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">
                              Demo Fallback
                            </span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                              Real GEE
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Data Source Footer ── */}
          <div className="flex items-center gap-2 text-[11px] text-gray-400 dark:text-gray-500 pb-2">
            <Database className="w-3.5 h-3.5 flex-shrink-0" />
            <span>
              <strong>Data provenance:</strong> {lulcData.data_provenance} ·{' '}
              <strong>Overall source:</strong> <SourceBadge source={lulcData.source} />
            </span>
          </div>
        </>
      )}
    </div>
  );
};

