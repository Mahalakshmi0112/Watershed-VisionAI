import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { uploadPhoto, triggerSatellitePull, importGisLayer } from '../services/api';
import { UploadCloud, Database, Satellite, Layers, CheckCircle, AlertTriangle, Shield, Play } from 'lucide-react';

export const IngestionAdminPage: React.FC = () => {
  const { role, username, token } = useAuth();

  // Photo Upload State
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [latInput, setLatInput] = useState<string>('19.1864');
  const [lonInput, setLonInput] = useState<string>('73.1919');
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [uploading, setUploading] = useState<boolean>(false);

  // Satellite Pull State
  const [satPullResult, setSatPullResult] = useState<any>(null);
  const [satPulling, setSatPulling] = useState<boolean>(false);
  const [satPullError, setSatPullError] = useState<string>('');

  // GIS Import State
  const [gisJson, setGisJson] = useState<string>('{\n  "type": "FeatureCollection",\n  "features": [\n    {\n      "type": "Feature",\n      "properties": { "name": "Pej Sub-Watershed" },\n      "geometry": { "type": "Polygon", "coordinates": [[[73.3, 18.9], [73.4, 18.9], [73.4, 19.0], [73.3, 19.0], [73.3, 18.9]]] }\n    }\n  ]\n}');
  const [gisResult, setGisResult] = useState<any>(null);

  const handlePhotoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoFile) return;
    setUploading(true);
    setUploadResult(null);
    try {
      const res = await uploadPhoto(photoFile, Number(latInput), Number(lonInput));
      setUploadResult(res);
    } catch (err) {
      alert('Photo upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSatelliteTrigger = async () => {
    setSatPulling(true);
    setSatPullError('');
    setSatPullResult(null);
    try {
      const res = await triggerSatellitePull(token || undefined);
      setSatPullResult(res);
    } catch (err: any) {
      setSatPullError(err.message || 'Satellite pull failed');
    } finally {
      setSatPulling(false);
    }
  };

  const handleGisImport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsed = JSON.parse(gisJson);
      const res = await importGisLayer(parsed, token || undefined);
      setGisResult(res);
    } catch (err: any) {
      alert(`GIS Import Error: ${err.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
            <UploadCloud className="w-6 h-6 text-emerald-600" />
            <span>Multi-Source Ingestion & Admin Center</span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Event-driven field photo upload, scheduled/manual satellite indices puller, and versioned GIS GeoJSON importer.
          </p>
        </div>

        {/* Active Role Indicator */}
        <div className="flex items-center space-x-2 bg-gray-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 text-xs">
          <Shield className="w-4 h-4 text-emerald-600" />
          <span>Current Role: <strong className="uppercase text-emerald-600 dark:text-emerald-400">{role}</strong> ({username})</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Source 1: Field Image Ingestion */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center space-x-2">
            <Database className="w-5 h-5 text-emerald-600" />
            <span>Source 1 — Field Image Upload & Spatial Matching</span>
          </h2>
          
          <form onSubmit={handlePhotoSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Select Field Photo</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">GPS Latitude (Optional)</label>
                <input
                  type="text"
                  value={latInput}
                  onChange={(e) => setLatInput(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">GPS Longitude (Optional)</label>
                <input
                  type="text"
                  value={lonInput}
                  onChange={(e) => setLonInput(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!photoFile || uploading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
            >
              {uploading ? 'Processing Image & Grad-CAM...' : 'Upload & Analyze Photo'}
            </button>
          </form>

          {uploadResult && (
            <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-xl text-xs space-y-2 border border-gray-200 dark:border-slate-700">
              <p className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                <CheckCircle className="w-4 h-4" />
                <span>Photo Processed Successfully</span>
              </p>
              <p>Matched Structure ID: <strong>{uploadResult.matched_structure_id || 'None (New Structure Flagged)'}</strong></p>
              <p>Suspicious Duplicate (pHash): <strong>{uploadResult.is_suspicious_duplicate ? 'YES (Fraud Flag)' : 'No'}</strong></p>
              <p>Predicted Type: <strong>{uploadResult.predicted_type}</strong></p>
              <p>Predicted Condition: <strong>{uploadResult.predicted_condition}</strong></p>
            </div>
          )}
        </div>

        {/* Source 2: Satellite Puller (Admin Protected) */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center space-x-2">
              <Satellite className="w-5 h-5 text-emerald-600" />
              <span>Source 2 — Satellite Puller (GEE)</span>
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-bold uppercase">
              Admin Only Route
            </span>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            Runs scheduled rolling Sentinel-2 / Landsat NDVI & NDWI pulls. If GEE credentials are not set, activates synthetic fallback and tags observations.
          </p>

          <button
            onClick={handleSatelliteTrigger}
            disabled={satPulling}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            <span>{satPulling ? 'Executing Satellite Pull...' : 'Trigger Manual Satellite Pull Cycle Now'}</span>
          </button>

          {satPullError && (
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-300 p-3 rounded-xl text-xs flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-0.5">GEE credentials not configured — Demo Mode Active</p>
                <p className="text-amber-600 dark:text-amber-400">{satPullError}. Observations will use synthetic baseline data tagged <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">data_source=synthetic</code>. Configure <code>EE_SERVICE_ACCOUNT</code> and <code>EE_PRIVATE_KEY_FILE</code> in <code>.env</code> to enable real satellite pulls.</p>
              </div>
            </div>
          )}

          {satPullResult && (
            <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-xl text-xs space-y-1 border border-gray-200 dark:border-slate-700 font-mono">
              <p className="font-bold text-emerald-600">Cycle Status: {satPullResult.status}</p>
              <p>Processed Structures: {satPullResult.summary.structures_processed}</p>
              <p>Records Added: {satPullResult.summary.records_added}</p>
              <p>Synthetic Records Tagged: {satPullResult.summary.synthetic_records}</p>
            </div>
          )}
        </div>

      </div>

      {/* Source 3: GIS Layer Import (Admin Protected) */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center space-x-2">
            <Layers className="w-5 h-5 text-emerald-600" />
            <span>Source 3 — Versioned GIS Layer Import (GeoJSON)</span>
          </h2>
          <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-bold uppercase">
            Admin Only Route
          </span>
        </div>

        <form onSubmit={handleGisImport} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">GeoJSON FeatureCollection Payload</label>
            <textarea
              rows={4}
              value={gisJson}
              onChange={(e) => setGisJson(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg font-mono text-xs"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white font-bold rounded-lg transition-colors text-xs"
          >
            Import GeoJSON Layer
          </button>
        </form>

        {gisResult && (
          <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-xl text-xs space-y-1 border border-gray-200 dark:border-slate-700 font-mono">
            <p className="font-bold text-emerald-600">Import Status: {gisResult.status}</p>
            <p>Features Imported: {gisResult.features_imported}</p>
            <p>Layer Version Assigned: v{gisResult.version}</p>
          </div>
        )}
      </div>

    </div>
  );
};
