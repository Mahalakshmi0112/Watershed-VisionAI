import React, { useState } from 'react';
import { generateReport } from '../services/api';
import { FileText, Download, Filter, CheckCircle, AlertTriangle, ShieldAlert } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [region, setRegion] = useState<string>('Ulhas River Basin');
  const [reportData, setReportData] = useState<any>(null);
  const [generating, setGenerating] = useState<boolean>(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const data = await generateReport(region);
      setReportData(data);
    } catch (err) {
      alert('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const handleExportCSV = () => {
    if (!reportData) return;
    const headers = ['Structure Code', 'Name', 'Type', 'Watershed', 'Score', 'Priority Tier', 'Is Synthetic'];
    const rows = reportData.records.map((r: any) => [
      r.code, `"${r.name}"`, r.type, `"${r.watershed}"`, r.score, r.priority_tier, r.is_synthetic
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e: any) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `watershed_report_${region.toLowerCase().replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
          <FileText className="w-6 h-6 text-emerald-600" />
          <span>Executive Summary & Watershed Audit Reports</span>
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Export region-wise structure monitoring reports with natural language executive summaries for water resource authorities.
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
        <form onSubmit={handleGenerate} className="flex flex-wrap items-end gap-4 text-xs">
          <div className="flex-1 min-w-[200px]">
            <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Select Watershed / Basin Region</label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg font-medium"
            >
              <option value="Ulhas River Basin">Ulhas River Basin (Maharashtra)</option>
              <option value="Malaprabha Basin">Malaprabha Basin (Karnataka)</option>
              <option value="Pej Sub-Basin">Pej Sub-Basin</option>
              <option value="All Regions">All Regions Combined</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={generating}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
          >
            {generating ? 'Compiling Report...' : 'Generate Executive Report'}
          </button>
        </form>
      </div>

      {/* Report Display */}
      {reportData && (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-gray-100 dark:border-slate-700 gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{reportData.report_title}</h2>
              <p className="text-xs text-gray-400 mt-1">Generated: {new Date().toLocaleDateString()} • Total Structures Audited: {reportData.total_structures}</p>
            </div>

            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center space-x-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV Dataset</span>
            </button>
          </div>

          {/* Tier Summary KPI Grid */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-100 dark:border-emerald-900">
              <span className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold uppercase">Healthy</span>
              <p className="text-2xl font-extrabold text-emerald-600 mt-1">{reportData.tier_summary.healthy}</p>
            </div>
            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-100 dark:border-amber-900">
              <span className="text-xs text-amber-800 dark:text-amber-300 font-semibold uppercase">Monitor</span>
              <p className="text-2xl font-extrabold text-amber-500 mt-1">{reportData.tier_summary.monitor}</p>
            </div>
            <div className="p-4 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-100 dark:border-red-900">
              <span className="text-xs text-red-800 dark:text-red-300 font-semibold uppercase">Urgent Action</span>
              <p className="text-2xl font-extrabold text-red-600 mt-1">{reportData.tier_summary.urgent}</p>
            </div>
          </div>

          {/* Records Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-slate-900 text-gray-500 dark:text-gray-400 font-semibold uppercase border-b border-gray-100 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Priority Tier</th>
                  <th className="px-4 py-3">Data Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {reportData.records.map((r: any, idx: number) => (
                  <tr key={idx}>
                    <td className="px-4 py-3 font-mono text-gray-500">{r.code}</td>
                    <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">{r.name}</td>
                    <td className="px-4 py-3 uppercase text-gray-600 dark:text-gray-300">{r.type.replace('_', ' ')}</td>
                    <td className="px-4 py-3 font-bold">{r.score}/100</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded font-extrabold text-[10px] uppercase ${
                        r.priority_tier === 'Urgent' ? 'bg-red-100 text-red-700' :
                        r.priority_tier === 'Monitor' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {r.priority_tier}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {r.is_synthetic ? (
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

        </div>
      )}

    </div>
  );
};
