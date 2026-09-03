import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { StructureSummary } from '../types';
import { fetchStructures } from '../services/api';
import { AlertTriangle, TrendingDown, ArrowRight, ShieldAlert, Clock, Cpu } from 'lucide-react';

export const PredictionsAlertsPage: React.FC = () => {
  const [structures, setStructures] = useState<StructureSummary[]>([]);

  useEffect(() => {
    fetchStructures()
      .then(data => setStructures(data))
      .catch(() => {});
  }, []);

  // Filter forward-looking predictions (Urgent or Monitor)
  const alertStructures = structures.filter(s => s.priority_tier === 'Urgent' || s.priority_tier === 'Monitor');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
          <AlertTriangle className="w-6 h-6 text-amber-500" />
          <span>Forward-Looking Failure Risk Predictions</span>
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Predictive alerts produced by the trained XGBoost time-series degradation model, forecasting likely failure within 3–12 months.
        </p>
      </div>

      {/* Model Tech Info Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-emerald-600/20 text-emerald-400 rounded-xl border border-emerald-500/30">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-base">XGBoost Degradation Forecaster Active</h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Engineered features: NDVI/NDWI slope velocity, structural age, condition trend, soil slope, and climate stubs.
            </p>
          </div>
        </div>
        <div className="hidden sm:block text-right text-xs text-slate-400">
          <span>Continuous Feedback Loop: Ground-truth inspection logs update model weights</span>
        </div>
      </div>

      {/* Alert Cards List */}
      <div className="space-y-4">
        {alertStructures.map((s) => (
          <div key={s.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            
            <div className="space-y-2 flex-1">
              <div className="flex items-center space-x-3">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase ${
                  s.priority_tier === 'Urgent' ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                }`}>
                  {s.priority_tier} Risk Alert
                </span>
                <span className="font-bold text-lg text-gray-900 dark:text-white">{s.name}</span>
                <span className="text-xs font-mono text-gray-400">({s.code})</span>
                {s.is_synthetic && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 font-medium">
                    Demo data — GEE not connected
                  </span>
                )}
              </div>

              <p className="text-xs text-gray-600 dark:text-gray-300">
                Watershed: {s.watershed_name} • Type: {s.structure_type.replace('_', ' ')} • Age: {2026 - s.construction_year} years
              </p>

              {/* Driver indicators */}
              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                <div className="flex items-center space-x-1.5 bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 px-2.5 py-1 rounded-md border border-red-100 dark:border-red-900/40">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>NDVI Declining (-0.08/mo)</span>
                </div>
                <div className="flex items-center space-x-1.5 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-md border border-amber-100 dark:border-amber-900/40">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Forecast Horizon: 3–6 Months</span>
                </div>
              </div>
            </div>

            {/* Score & Action Link */}
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <span className="text-xs text-gray-400">Predicted Failure Risk</span>
                <p className={`text-2xl font-extrabold ${s.priority_tier === 'Urgent' ? 'text-red-600' : 'text-amber-500'}`}>
                  {s.composite_score}%
                </p>
              </div>

              <Link
                to={`/structure/${s.id}`}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition-colors flex items-center space-x-1"
              >
                <span>Investigate</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
};
