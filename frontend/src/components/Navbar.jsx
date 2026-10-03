import React from 'react';
import { Bike, Database, RefreshCw, Zap, Layers, MapPin } from 'lucide-react';

export default function Navbar({
  storageStatus,
  presets,
  currentPreset,
  onSelectPreset,
  onResetGraph,
  onAddRandomOrder,
  nodeCount
}) {
  const isFallback = storageStatus?.is_fallback ?? true;

  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 px-4 py-3 shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950 font-black">
            <Bike className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              Food Delivery Route Planner
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/20">
                v1.0
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Multi-Order Optimization: Dijkstra • Nearest Neighbor • TSP 2-Opt
            </p>
          </div>
        </div>

        {/* Center Controls: Presets */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-800/80 border border-slate-700 rounded-lg px-2.5 py-1 text-xs">
            <Layers className="w-3.5 h-3.5 text-cyan-400 mr-2" />
            <span className="text-slate-400 mr-2">Preset:</span>
            <select
              value={currentPreset}
              onChange={(e) => onSelectPreset(e.target.value)}
              className="bg-transparent text-slate-200 font-medium outline-none cursor-pointer pr-1"
            >
              {Object.entries(presets).map(([key, p]) => (
                <option key={key} value={key} className="bg-slate-900 text-white">
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onAddRandomOrder}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition cursor-pointer"
            title="Add random order in canvas"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>+ Add Order</span>
          </button>

          <button
            onClick={onResetGraph}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition cursor-pointer"
            title="Reset preset to default"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span>Reset</span>
          </button>
        </div>

        {/* Right: Storage & Status */}
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${
              !isFallback
                ? 'bg-emerald-950/40 border-emerald-600/30 text-emerald-300'
                : 'bg-blue-950/40 border-blue-600/30 text-blue-300'
            }`}
            title={storageStatus?.message || ''}
          >
            <Database className="w-3.5 h-3.5" />
            <span>{isFallback ? 'In-Memory Fallback' : 'MongoDB Connected'}</span>
            <span className={`w-2 h-2 rounded-full ${!isFallback ? 'bg-emerald-400 animate-pulse' : 'bg-blue-400'}`} />
          </div>

          <div className="text-xs text-slate-400 bg-slate-800/60 px-2.5 py-1.5 rounded-lg border border-slate-700/60">
            <span className="font-semibold text-slate-200">{nodeCount}</span> locations
          </div>
        </div>
      </div>
    </header>
  );
}
