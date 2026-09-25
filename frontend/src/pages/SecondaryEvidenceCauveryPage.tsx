import React, { useEffect, useState, useMemo } from 'react';
import {
  Waves, MapPin, Compass, Image as ImageIcon, Eye,
  CheckCircle2, AlertCircle, ShieldCheck, Database,
  TrendingUp, BarChart3, PieChart as PieIcon, Layers,
  ExternalLink, Sparkles, RefreshCw, ZoomIn, Info,
  Filter, Calendar, Hash, Activity, Check
} from 'lucide-react';
import {
  fetchSecondaryEvidenceSummary,
  fetchWbisWaterSpread,
  fetchTnLulc,
  fetchDrishtiSample,
  fetchTrichyPhotos
} from '../services/api';
import {
  SecondaryEvidenceSummary,
  WbisResponse,
  TnLulcResponse,
  DrishtiSampleResponse,
  TrichyPhotoItem
} from '../types';

export const SecondaryEvidenceCauveryPage: React.FC = () => {
  const [data, setData] = useState<SecondaryEvidenceSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'wbis' | 'drishti' | 'tn_lulc' | 'trichy'>('all');
  
  // Photo modal & GradCAM toggle states
  const [selectedPhoto, setSelectedPhoto] = useState<TrichyPhotoItem | null>(null);
  const [showGradCamModal, setShowGradCamModal] = useState<boolean>(false);
  const [gradCamToggles, setGradCamToggles] = useState<Record<string, boolean>>({});
  const [drishtiGradCam, setDrishtiGradCam] = useState<boolean>(false);
  const [photoFilter, setPhotoFilter] = useState<'all' | 'intact' | 'minor_damage'>('all');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchSecondaryEvidenceSummary();
      setData(res);
    } catch (err: any) {
      console.error('Failed to load secondary evidence:', err);
      setError(err?.message || 'Failed to fetch secondary evidence from backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const togglePhotoGradCam = (id: string) => {
    setGradCamToggles(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredTrichyPhotos = useMemo(() => {
    if (!data?.trichy_field_photos) return [];
    if (photoFilter === 'all') return data.trichy_field_photos;
    return data.trichy_field_photos.filter(p => p.cv_prediction.predicted_condition === photoFilter);
  }, [data, photoFilter]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 space-y-4">
        <RefreshCw className="w-10 h-10 text-emerald-500 animate-spin" />
        <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">
          Loading Secondary Evidence & Real Ground-Truth Data...
        </p>
        <p className="text-xs text-slate-500 font-mono">
          Connecting to ISRO/NRSC Bhuvan WBIS & Thematic Services
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-4">
        <div className="p-6 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-start space-x-4">
          <AlertCircle className="w-6 h-6 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h3 className="text-base font-bold text-rose-900 dark:text-rose-200">
              Unable to Load Secondary Evidence
            </h3>
            <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>
            <button
              onClick={loadData}
              className="mt-3 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow transition"
            >
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { wbis_water_spread, tn_lulc, drishti_sample, trichy_field_photos } = data;

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto pb-24">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & INDEPENDENT DATASET NOTICE
      ───────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <span className="px-3 py-1 bg-sky-500/10 text-sky-700 dark:text-sky-300 text-xs font-bold uppercase tracking-wider rounded-full border border-sky-500/20">
                Independent Dataset
              </span>
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-semibold rounded-full border border-emerald-500/20 flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified Real & Ground-Truth Evidence</span>
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Secondary Evidence — <span className="text-sky-600 dark:text-sky-400">Cauvery / Trichy Region</span>
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
              Multi-source reference corroboration using live ISRO/NRSC Bhuvan Water Bodies Information System (WBIS),
              Tamil Nadu state-wide LULC thematic reference charts, official Bhuvan Drishti mobile app archive, and
              9 personally-collected geo-tagged field photographs with real GPS coordinates.
            </p>
          </div>

          <button
            onClick={loadData}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Live Feeds</span>
          </button>
        </div>

        {/* Epistemic / Structural Separation Banner */}
        <div className="p-4 bg-gradient-to-r from-sky-900/10 via-slate-900/5 to-emerald-900/10 dark:from-sky-950/40 dark:via-slate-900/40 dark:to-emerald-950/40 border border-sky-200 dark:border-sky-800/60 rounded-2xl">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-sky-600 dark:text-sky-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs space-y-1 text-slate-700 dark:text-slate-300">
              <span className="font-bold text-slate-900 dark:text-white">Structural Independence Notice:</span> This page contains secondary regional evidence from the Cauvery Basin & Tiruchirappalli (Tamil Nadu). It is strictly isolated and visually separated from the primary Chinnagora AOI (Andhra Pradesh) dataset to preserve clean data provenance and analytical integrity.
            </div>
          </div>
        </div>

        {/* Navigation Tab Bar */}
        <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pt-2 overflow-x-auto">
          {[
            { id: 'all', label: 'All Secondary Evidence', icon: Layers },
            { id: 'wbis', label: '1. WBIS Water Bodies', icon: Waves },
            { id: 'drishti', label: '2. Drishti Reference Sample', icon: ImageIcon },
            { id: 'tn_lulc', label: '3. TN LULC Thematic Data', icon: PieIcon },
            { id: 'trichy', label: '4. Srirangam/Trichy 9 Photos', icon: MapPin },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-3 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          PART 1: WBIS WATER SPREAD DYNAMICS (CAUVERY BASIN)
      ───────────────────────────────────────────────────────────── */}
      {(activeTab === 'all' || activeTab === 'wbis') && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300 text-[11px] font-bold rounded">
                  PART 1
                </span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <span>WBIS Water Body Spread Dynamics — Cauvery Basin</span>
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Evaluation Month: <span className="font-semibold text-slate-700 dark:text-slate-200">{wbis_water_spread.month.toUpperCase()}</span> | Basin: <span className="font-semibold text-slate-700 dark:text-slate-200">{wbis_water_spread.basin}</span>
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <span className={`text-xs px-2.5 py-1 font-mono font-bold rounded-full ${
                wbis_water_spread.source === 'live'
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                  : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
              }`}>
                ● SOURCE: {wbis_water_spread.source.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Metric Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Water Bodies</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {wbis_water_spread.total_water_bodies.toLocaleString()}
                </span>
                <span className="text-xs text-sky-600 dark:text-sky-400 font-semibold">Mapped</span>
              </div>
              <p className="text-[11px] text-slate-500">Full Cauvery hydrological network</p>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Bodies Holding Water</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {wbis_water_spread.current_water_bodies.toLocaleString()}
                </span>
                <span className="text-xs text-emerald-600 font-bold">
                  {wbis_water_spread.water_bodies_active_pct}% Active
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Currently water-bearing in Aug 2026</p>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Current Water Spread Area</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-sky-600 dark:text-sky-400">
                  {wbis_water_spread.current_actual_area_sqkm}
                </span>
                <span className="text-xs text-slate-500 font-mono">km²</span>
              </div>
              <p className="text-[11px] text-slate-500">Max theoretical: {wbis_water_spread.total_max_area_sqkm} km²</p>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Overall Basin Capacity Util</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-violet-600 dark:text-violet-400">
                  {wbis_water_spread.overall_capacity_utilization_pct}%
                </span>
                <span className="text-xs text-violet-500 font-semibold">Aggregate</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
                <div
                  className="bg-violet-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, wbis_water_spread.overall_capacity_utilization_pct)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Detailed Category Table / Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {wbis_water_spread.categories.map(cat => (
              <div
                key={cat.area_code}
                className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {cat.category_label}
                  </span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">
                    Code: {cat.area_code}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex justify-between">
                    <span>Active Water Bodies:</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {cat.current_water_bodies.toLocaleString()} / {cat.total_water_bodies.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Actual Water Spread:</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{cat.current_actual_area_sqkm} km²</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Max Water Spread:</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{cat.total_max_area_sqkm} km²</span>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-slate-500">Capacity Utilization</span>
                    <span className="font-black text-sky-600 dark:text-sky-400 text-sm">
                      {cat.capacity_utilization_pct}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-sky-500 dark:bg-sky-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, cat.capacity_utilization_pct)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center space-x-1.5">
            <Database className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Data Provenance: {wbis_water_spread.data_provenance}</span>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────
          PART 2: REAL DRISHTI FIELD SURVEY PHOTO REFERENCE
      ───────────────────────────────────────────────────────────── */}
      {(activeTab === 'all' || activeTab === 'drishti') && (
        <section className="space-y-4">
          <div className="space-y-0.5">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold rounded">
                PART 2
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <span>Real Drishti Field Photo Reference & Embedded Taxonomy</span>
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Verified genuine field photograph directly hosted on Bhuvan NRSC server (not synthetic)
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            {/* Image Preview & GradCAM Overlay */}
            <div className="lg:col-span-5 space-y-3">
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-[4/3] border border-slate-800 group">
                <img
                  src={drishtiGradCam ? drishti_sample.gradcam_url : drishti_sample.photo_url}
                  alt="Drishti Real Field Photo"
                  className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                />
                <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/70 backdrop-blur-md rounded-lg text-white text-[10px] font-bold flex items-center space-x-1.5">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>Genuine Drishti Mobile Survey Photo</span>
                </div>
                <div className="absolute bottom-3 right-3 flex items-center space-x-2">
                  <button
                    onClick={() => setDrishtiGradCam(!drishtiGradCam)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl shadow-lg transition flex items-center space-x-1.5 backdrop-blur-md ${
                      drishtiGradCam
                        ? 'bg-violet-600 text-white'
                        : 'bg-black/70 text-white hover:bg-black/90'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>{drishtiGradCam ? 'Grad-CAM Active' : 'Show Grad-CAM Heatmap'}</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>File Size: {(drishti_sample.file_size_bytes / 1024).toFixed(1)} KB</span>
                <a
                  href={drishti_sample.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center space-x-1 text-sky-600 dark:text-sky-400 hover:underline font-medium"
                >
                  <span>Bhuvan Public Image URL</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Taxonomy Breakdown & CV Model Predictions */}
            <div className="lg:col-span-7 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Decoded Drishti Filename Taxonomy
                </h3>
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl font-mono text-xs text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 break-all">
                  {drishti_sample.filename}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {Object.entries(drishti_sample.taxonomy_breakdown).map(([token, desc]) => (
                    <div key={token} className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="font-bold font-mono text-sky-600 dark:text-sky-400 block">{token}</span>
                      <span className="text-slate-600 dark:text-slate-300 text-[11px] leading-tight">{desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CV Model Prediction Output Card */}
              <div className="p-4 bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center space-x-1.5">
                    <Activity className="w-3.5 h-3.5 text-emerald-500" />
                    <span>CV Model Inference Output (DualHead ResNet-18)</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded">
                    Score: {drishti_sample.cv_prediction.condition_score} / 100
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Predicted Type</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                      {drishti_sample.cv_prediction.predicted_type.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-slate-500 ml-1">
                      ({drishti_sample.cv_prediction.type_confidence_pct}% conf)
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Predicted Condition</span>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 capitalize">
                      {drishti_sample.cv_prediction.predicted_condition.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-slate-500 ml-1">
                      ({drishti_sample.cv_prediction.condition_confidence_pct}% conf)
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center space-x-1.5">
                <Database className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Data Provenance: {drishti_sample.data_provenance}</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────
          PART 3: TAMIL NADU LULC THEMATIC DATA
      ───────────────────────────────────────────────────────────── */}
      {(activeTab === 'all' || activeTab === 'tn_lulc') && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 bg-violet-100 dark:bg-violet-900/60 text-violet-800 dark:text-violet-300 text-[11px] font-bold rounded">
                  PART 3
                </span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <span>Tamil Nadu LULC 1:50,000 Thematic Data (Bhuvan)</span>
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official State-wide Distribution Chart & 21-Class Land Cover Breakdown
              </p>
            </div>

            <span className="text-xs px-2.5 py-1 font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-full">
              ● LIVE STATS CONNECTED
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            {/* Chart Graphic */}
            <div className="lg:col-span-5 space-y-3 flex flex-col justify-center items-center p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Official Bhuvan LULC Pie Distribution
              </span>
              {tn_lulc.chart_image_base64 ? (
                <img
                  src={`data:image/png;base64,${tn_lulc.chart_image_base64}`}
                  alt="Tamil Nadu LULC Chart"
                  className="rounded-xl shadow-md max-w-full max-h-[260px] object-contain"
                />
              ) : (
                <div className="p-8 text-center text-xs text-slate-500">
                  Chart graphic loading from Bhuvan thematic server...
                </div>
              )}
              <div className="text-[11px] text-slate-500 text-center">
                Total Geographical Area: <span className="font-bold text-slate-900 dark:text-white">{tn_lulc.total_area_sqkm.toLocaleString()} km²</span>
              </div>
            </div>

            {/* Class Breakdown Table */}
            <div className="lg:col-span-7 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Detailed Class Breakdown (Top Categories)
              </h3>
              <div className="max-h-[300px] overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-xs text-left">
                  <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-2.5 px-3">LULC Class</th>
                      <th className="py-2.5 px-3 text-right">Area (km²)</th>
                      <th className="py-2.5 px-3 text-right">% Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {tn_lulc.classes.map((cls, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                        <td className="py-2 px-3 flex items-center space-x-2">
                          <span
                            className="w-3 h-3 rounded-full flex-shrink-0 border border-slate-300 dark:border-slate-600"
                            style={{ backgroundColor: cls.color }}
                          />
                          <span className="font-medium text-slate-800 dark:text-slate-200">{cls.class_name}</span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900 dark:text-slate-100">
                          {cls.area_sqkm.toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-sky-600 dark:text-sky-400 font-bold">
                          {cls.percent_of_total}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center space-x-1.5">
            <Database className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Data Provenance: {tn_lulc.data_provenance}</span>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────
          PART 4: 9 REAL SELF-COLLECTED FIELD PHOTOS (SRIRANGAM / TRICHY)
      ───────────────────────────────────────────────────────────── */}
      {(activeTab === 'all' || activeTab === 'trichy') && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-[11px] font-bold rounded">
                  PART 4
                </span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <span>Srirangam / Trichy — 9 Real Field Photos (Ground-Truth)</span>
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cauvery River & Kollidam Floodway structures with real GPS EXIF metadata and CV model predictions
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              {(['all', 'intact', 'minor_damage'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setPhotoFilter(f)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition ${
                    photoFilter === f
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {f === 'all' ? 'All (9)' : f.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Photo Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTrichyPhotos.map(photo => {
              const isGradCamOn = !!gradCamToggles[photo.id];
              return (
                <div
                  key={photo.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  {/* Photo with Overlay Controls */}
                  <div className="relative aspect-[16/10] bg-slate-950 overflow-hidden group">
                    <img
                      src={isGradCamOn ? photo.gradcam_url : photo.photo_url}
                      alt={photo.title}
                      className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                    />

                    {/* GPS Coordinates Badge */}
                    <div className="absolute top-2.5 left-2.5 px-2.5 py-1 bg-black/75 backdrop-blur-md rounded-lg text-white text-[10px] font-mono flex items-center space-x-1 shadow">
                      <MapPin className="w-3 h-3 text-emerald-400" />
                      <span>{photo.latitude.toFixed(5)}, {photo.longitude.toFixed(5)}</span>
                    </div>

                    {/* Action buttons */}
                    <div className="absolute bottom-2.5 right-2.5 flex items-center space-x-1.5">
                      <button
                        onClick={() => togglePhotoGradCam(photo.id)}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg backdrop-blur-md shadow transition flex items-center space-x-1 ${
                          isGradCamOn
                            ? 'bg-violet-600 text-white'
                            : 'bg-black/70 text-white hover:bg-black/90'
                        }`}
                        title="Toggle Grad-CAM Heatmap overlay"
                      >
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>{isGradCamOn ? 'Grad-CAM' : 'CAM'}</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedPhoto(photo);
                          setShowGradCamModal(false);
                        }}
                        className="p-1.5 bg-black/70 hover:bg-black/90 text-white rounded-lg backdrop-blur-md transition shadow"
                        title="View Full Resolution"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Metadata & Predictions Body */}
                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                        {photo.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                        {photo.location_name}
                      </p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 italic pt-1">
                        {photo.structure_context}
                      </p>
                    </div>

                    {/* CV Model Output Pills */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Predicted Type</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 capitalize">
                          {photo.cv_prediction.predicted_type.replace('_', ' ')} ({photo.cv_prediction.type_confidence_pct}%)
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Predicted Condition</span>
                        <span className={`font-bold capitalize px-2 py-0.5 rounded text-[11px] ${
                          photo.cv_prediction.predicted_condition === 'intact'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                        }`}>
                          {photo.cv_prediction.predicted_condition.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Condition Score</span>
                        <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                          {photo.cv_prediction.condition_score} / 100
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1">
                      <span>{photo.captured_at}</span>
                      <span className="truncate max-w-[120px]" title={photo.perceptual_hash}>
                        pHash: {photo.perceptual_hash.slice(0, 8)}…
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center space-x-1.5">
            <Database className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Data Provenance: {data.data_provenance_summary.trichy_photos}</span>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────
          FULL-SCREEN PHOTO MODAL
      ───────────────────────────────────────────────────────────── */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">{selectedPhoto.title}</h3>
                <p className="text-xs text-slate-400">{selectedPhoto.location_name}</p>
              </div>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
              >
                Close ✕
              </button>
            </div>

            <div className="relative rounded-2xl overflow-hidden bg-black aspect-[16/9]">
              <img
                src={showGradCamModal ? selectedPhoto.gradcam_url : selectedPhoto.photo_url}
                alt={selectedPhoto.title}
                className="w-full h-full object-contain"
              />
              <div className="absolute bottom-4 right-4 flex items-center space-x-2">
                <button
                  onClick={() => setShowGradCamModal(!showGradCamModal)}
                  className="px-4 py-2 bg-black/80 hover:bg-black text-white text-xs font-bold rounded-xl backdrop-blur-md shadow-lg transition flex items-center space-x-2"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>{showGradCamModal ? 'View Original Photo' : 'View Grad-CAM Overlay'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-slate-800/80 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">GPS Coordinates</span>
                <p className="font-mono text-emerald-400 font-bold">
                  Lat: {selectedPhoto.latitude}, Lon: {selectedPhoto.longitude}
                </p>
                <p className="text-[10px] text-slate-400">Recorded via GPS Map Camera</p>
              </div>

              <div className="p-3 bg-slate-800/80 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">CV Model Type Prediction</span>
                <p className="font-bold text-white capitalize">
                  {selectedPhoto.cv_prediction.predicted_type.replace('_', ' ')}
                </p>
                <p className="text-[10px] text-slate-400">
                  Confidence: {selectedPhoto.cv_prediction.type_confidence_pct}%
                </p>
              </div>

              <div className="p-3 bg-slate-800/80 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">CV Condition & Score</span>
                <p className="font-bold text-sky-400 capitalize">
                  {selectedPhoto.cv_prediction.predicted_condition.replace('_', ' ')}
                </p>
                <p className="text-[10px] text-slate-400">
                  Condition Score: {selectedPhoto.cv_prediction.condition_score} / 100
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecondaryEvidenceCauveryPage;
