import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { StructureSummary } from '../types';
import { fetchStructures } from '../services/api';
import { ShieldAlert, AlertTriangle, CheckCircle, ArrowRight, Layers, Activity, FlaskConical } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export const OverviewPage: React.FC = () => {
  const [structures, setStructures] = useState<StructureSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchStructures()
      .then(data => setStructures(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalCount = structures.length;
  const healthyCount = structures.filter(s => s.priority_tier === 'Healthy').length;
  const monitorCount = structures.filter(s => s.priority_tier === 'Monitor').length;
  const urgentCount = structures.filter(s => s.priority_tier === 'Urgent').length;
  const syntheticCount = structures.filter(s => s.is_synthetic).length;

  const pieData = [
    { name: 'Healthy', value: healthyCount, color: '#22c55e' },
    { name: 'Monitor', value: monitorCount, color: '#f59e0b' },
    { name: 'Urgent', value: urgentCount, color: '#ef4444' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Watershed Executive Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Real-time condition monitoring, failure risk forecasting, and priority inspection queues for rural check dams and bunds.
          </p>
        </div>

        {/* Subtle demo mode chip — replaces the large alarming banner */}
        {syntheticCount > 0 && (
          <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-400 flex-shrink-0 ml-6">
            <FlaskConical className="w-4 h-4 flex-shrink-0" />
            <span className="text-xs font-semibold whitespace-nowrap">
              Demo — Synthetic satellite data ({syntheticCount} structures)
            </span>
          </div>
        )}
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total Structures */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Structures</p>
            <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">{totalCount}</p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-xl">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* Healthy */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Healthy</p>
            <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{healthyCount}</p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Monitor */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Monitor Needed</p>
            <p className="text-3xl font-extrabold text-amber-500 dark:text-amber-400 mt-1">{monitorCount}</p>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950 text-amber-500 dark:text-amber-400 rounded-xl">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        {/* Urgent Action */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Urgent Action</p>
            <p className="text-3xl font-extrabold text-red-600 dark:text-red-400 mt-1">{urgentCount}</p>
          </div>
          <div className="p-3 bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 rounded-xl">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Main Charts & Action List Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Priority Breakdown Pie Chart */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Structure Priority Tier Split</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center space-x-6 mt-2 text-xs font-medium text-gray-600 dark:text-gray-300">
            <div className="flex items-center space-x-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500"></span><span>Healthy</span></div>
            <div className="flex items-center space-x-1.5"><span className="w-3 h-3 rounded-full bg-amber-500"></span><span>Monitor</span></div>
            <div className="flex items-center space-x-1.5"><span className="w-3 h-3 rounded-full bg-red-500"></span><span>Urgent</span></div>
          </div>
        </div>

        {/* Urgent Alert List */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">High Priority Inspection Targets</h2>
              <Link to="/queue" className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center hover:underline">
                View Full Queue <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>

            <div className="space-y-3">
              {structures
                .filter(s => s.priority_tier === 'Urgent' || s.priority_tier === 'Monitor')
                .slice(0, 4)
                .map(s => (
                  <div key={s.id} className="p-4 rounded-xl border border-gray-100 dark:border-slate-700 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                    <div>
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="font-bold text-gray-900 dark:text-white">{s.name}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 uppercase font-mono">{s.code}</span>
                        {s.is_synthetic && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 font-medium border border-amber-200 dark:border-amber-800">
                            ⚗ Demo data
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {s.watershed_name} • Type: {s.structure_type.replace('_', ' ')}
                      </p>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <span className="text-xs text-gray-400">Score</span>
                        <p className={`text-base font-extrabold ${s.priority_tier === 'Urgent' ? 'text-red-600 dark:text-red-400' : 'text-amber-500'}`}>
                          {s.composite_score}/100
                        </p>
                      </div>
                      <Link
                        to={`/structure/${s.id}`}
                        className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                      >
                        Inspect
                      </Link>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-700 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
            <span>ML Models Active: Dual-Head ResNet18 (CV) + XGBoost Degradation Forecaster</span>
            <Link to="/map" className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
              Open Interactive GIS Map →
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
};
