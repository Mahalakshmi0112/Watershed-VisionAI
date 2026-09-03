import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { StructureDetail } from '../types';
import { fetchStructureDetail } from '../services/api';
import { 
  ArrowLeft, Eye, Activity, CheckCircle, 
  Calendar, Layers, FileText, Image as ImageIcon, FlaskConical
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Placeholder SVG data URI shown when no real photo exists
const PHOTO_PLACEHOLDER = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <rect width="400" height="300" fill="#1e293b"/>
  <rect x="140" y="90" width="120" height="90" rx="8" fill="#334155"/>
  <circle cx="165" cy="115" r="12" fill="#22c55e" opacity="0.7"/>
  <polygon points="200,100 240,160 160,160" fill="#475569"/>
  <rect x="100" y="195" width="200" height="8" rx="4" fill="#334155"/>
  <rect x="130" y="213" width="140" height="6" rx="3" fill="#1e3a5f" opacity="0.5"/>
  <text x="200" y="255" text-anchor="middle" font-family="monospace" font-size="11" fill="#64748b">No field photo captured yet</text>
</svg>
`)}`;

// Gradient overlay placeholder for Grad-CAM when no real heatmap generated
const GRADCAM_PLACEHOLDER = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <defs>
    <radialGradient id="heatGrad" cx="50%" cy="50%" r="55%">
      <stop offset="0%" stop-color="#ef4444" stop-opacity="0.7"/>
      <stop offset="40%" stop-color="#f59e0b" stop-opacity="0.5"/>
      <stop offset="80%" stop-color="#22c55e" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#1e293b" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="400" height="300" fill="#1e293b"/>
  <rect x="140" y="90" width="120" height="90" rx="8" fill="#334155"/>
  <rect x="100" y="195" width="200" height="8" rx="4" fill="#334155"/>
  <ellipse cx="200" cy="145" rx="90" ry="70" fill="url(#heatGrad)"/>
  <text x="200" y="255" text-anchor="middle" font-family="monospace" font-size="11" fill="#64748b">Grad-CAM activation overlay</text>
  <text x="200" y="272" text-anchor="middle" font-family="monospace" font-size="10" fill="#475569">(Upload a real photo to generate)</text>
</svg>
`)}`;

export const StructureDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<StructureDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showGradCAM, setShowGradCAM] = useState<boolean>(false);

  useEffect(() => {
    if (id) {
      fetchStructureDetail(Number(id))
        .then(data => setDetail(data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-gray-500 dark:text-gray-400">
        Loading structure details...
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-lg font-bold text-gray-900 dark:text-white">Structure not found.</p>
        <Link to="/map" className="mt-4 inline-block text-emerald-600 font-semibold hover:underline">
          ← Back to Map View
        </Link>
      </div>
    );
  }

  const activePhoto = detail.photos[0];
  // Determine image URL: use API-provided paths if available, otherwise placeholder
  const hasRealPhoto = Boolean(activePhoto?.photo_url);
  const hasGradCam = Boolean(activePhoto?.gradcam_url);

  const photoUrl = hasRealPhoto
    ? activePhoto.photo_url
    : PHOTO_PLACEHOLDER;

  const gradcamUrl = hasGradCam
    ? activePhoto.gradcam_url
    : GRADCAM_PLACEHOLDER;

  const photoDisplayUrl = showGradCAM ? gradcamUrl : photoUrl;

  const tierColor =
    detail.scores.priority_tier === 'Urgent'
      ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
      : detail.scores.priority_tier === 'Monitor'
      ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
      : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Back Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start space-x-4">
          <Link to="/map" className="p-2 mt-1 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center flex-wrap gap-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{detail.name}</h1>
              <span className="px-2.5 py-0.5 rounded bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 font-mono text-xs font-semibold uppercase">
                {detail.code}
              </span>
              <span className={`px-3 py-0.5 text-xs font-extrabold rounded-full uppercase ${tierColor}`}>
                {detail.scores.priority_tier} Tier
              </span>
              {/* Synthetic data indicator — compact chip, not alarming banner */}
              {detail.is_synthetic && (
                <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-300">
                  <FlaskConical className="w-3 h-3" />
                  <span>Demo satellite data</span>
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Watershed: {detail.watershed_name} • Type: {detail.structure_type.replace('_', ' ')} • Constructed: {detail.construction_year}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700 text-right flex-shrink-0">
          <span className="text-xs text-gray-400 font-medium">Composite Priority Score</span>
          <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {detail.scores.composite_score}<span className="text-sm text-gray-400 font-normal">/100</span>
          </p>
        </div>
      </div>

      {/* Main Grid: Left = Photo & Grad-CAM, Right = Summary & Score Decomposition */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Card: Field Photo + Interactive Grad-CAM Overlay Toggle */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center space-x-2">
              <ImageIcon className="w-5 h-5 text-emerald-600" />
              <span>Field Photo & Grad-CAM Heatmap</span>
            </h2>

            {/* Toggle Button */}
            <button
              onClick={() => setShowGradCAM(!showGradCAM)}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                showGradCAM
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200'
              }`}
              title={showGradCAM ? 'Show original field photo' : 'Show Grad-CAM activation heatmap'}
            >
              <Eye className="w-4 h-4" />
              <span>{showGradCAM ? 'Grad-CAM ON' : 'Show Grad-CAM'}</span>
            </button>
          </div>

          <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-gray-200 dark:border-slate-700 h-72">
            <img
              src={photoDisplayUrl}
              alt={showGradCAM ? 'Grad-CAM activation heatmap overlay' : 'Structure field photo'}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to placeholder if the server URL 404s
                const target = e.currentTarget;
                if (showGradCAM && target.src !== GRADCAM_PLACEHOLDER) {
                  target.src = GRADCAM_PLACEHOLDER;
                } else if (!showGradCAM && target.src !== PHOTO_PLACEHOLDER) {
                  target.src = PHOTO_PLACEHOLDER;
                }
              }}
            />
            
            {showGradCAM && (
              <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur px-3 py-1.5 rounded-lg text-white text-xs font-mono border border-slate-700">
                ResNet18 Grad-CAM · layer4 activation
              </div>
            )}
            {!showGradCAM && !hasRealPhoto && (
              <div className="absolute bottom-3 right-3 bg-slate-950/80 backdrop-blur px-2 py-1 rounded text-slate-400 text-[10px] border border-slate-700">
                Upload a photo via Data Ingestion to see real imagery
              </div>
            )}
          </div>

          {activePhoto && (
            <div className="grid grid-cols-3 gap-3 text-xs bg-gray-50 dark:bg-slate-900 p-3.5 rounded-xl border border-gray-100 dark:border-slate-700">
              <div>
                <span className="text-gray-400 block">Predicted Class</span>
                <span className="font-semibold text-gray-900 dark:text-white uppercase">{activePhoto.predicted_type}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Condition</span>
                <span className="font-semibold text-gray-900 dark:text-white uppercase">{activePhoto.predicted_condition?.replace('_', ' ')}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Condition Score</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">{activePhoto.condition_score}/100</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Card: Officer Executive Summary & Composite Score Decomposition */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm space-y-6">
          
          {/* Executive Summary */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center space-x-2 mb-3">
              <FileText className="w-5 h-5 text-emerald-600" />
              <span>Field Officer Summary</span>
            </h2>
            <div className="bg-emerald-50/60 dark:bg-emerald-950/30 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/40 text-sm text-gray-800 dark:text-gray-200 leading-relaxed font-sans">
              {detail.summary_report}
            </div>
          </div>

          {/* Composite Score Decomposition Bar */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Multi-Criteria Score Decomposition</h3>
            <div className="space-y-3 text-xs">
              
              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span className="text-gray-600 dark:text-gray-300">CV Structural Damage (45% weight)</span>
                  <span className="text-gray-900 dark:text-white">{detail.scores.condition_score}/100</span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 transition-all" style={{ width: `${detail.scores.condition_score}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span className="text-gray-600 dark:text-gray-300">Satellite Trend Risk (25% weight)</span>
                  <span className="text-gray-900 dark:text-white">{detail.scores.satellite_trend_risk}/100</span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 transition-all" style={{ width: `${detail.scores.satellite_trend_risk}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span className="text-gray-600 dark:text-gray-300">XGBoost Forecast Failure Risk (30% weight)</span>
                  <span className="text-gray-900 dark:text-white">{detail.scores.forecast_risk}/100</span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 transition-all" style={{ width: `${detail.scores.forecast_risk}%` }}></div>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* Bottom Chart: Satellite NDVI / NDWI Time-Series Graph */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
          <Activity className="w-5 h-5 text-emerald-600" />
          <span>Rolling Satellite NDVI / NDWI Time-Series</span>
          {detail.is_synthetic && (
            <span className="ml-2 text-[10px] px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 font-medium">
              ⚗ Synthetic baseline
            </span>
          )}
        </h2>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={detail.satellite_series}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis dataKey="observation_date" tickFormatter={(str) => str.slice(5, 10)} />
              <YAxis domain={[-0.2, 1.0]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="ndvi" name="NDVI (Vegetation)" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="ndwi" name="NDWI (Water)" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};
