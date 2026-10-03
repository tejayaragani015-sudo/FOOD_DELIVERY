import React from 'react';
import { TrendingUp, Clock, DollarSign, Gauge, Award, CheckCircle2, Zap } from 'lucide-react';

export default function MetricsDashboard({ activeMode, comparisonData, singleData }) {
  if (activeMode === 'compare' && comparisonData) {
    const { summary, metrics_comparison, nearest_neighbor, two_opt } = comparisonData;
    const isImproved = summary.distance_saved_km > 0;

    return (
      <div className="space-y-4">
        {/* Top Summary Banner */}
        <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/60 border border-emerald-500/30 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">Optimization Result:</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/40">
                  {summary.winner}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {isImproved ? (
                  <>
                    2-Opt uncrossed routes in <span className="text-emerald-400 font-bold">{summary.swaps_performed} swaps</span>, saving{' '}
                    <span className="text-emerald-400 font-bold">{summary.distance_saved_km} km</span> ({summary.efficiency_gain_pct}% reduction) and{' '}
                    <span className="text-emerald-400 font-bold">${summary.cost_saved_usd}</span> in travel cost.
                  </>
                ) : (
                  <>Greedy Nearest Neighbor path was already locally optimal for this configuration.</>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-slate-400">Efficiency Score</div>
              <div className="text-2xl font-black text-emerald-400">
                {summary.efficiency_score}%
              </div>
            </div>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Distance */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span className="flex items-center gap-1.5 font-medium">
                <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                Total Distance
              </span>
              {isImproved && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  -{summary.efficiency_gain_pct}%
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">
                {two_opt?.metrics?.total_distance_km}
              </span>
              <span className="text-xs text-slate-400">km</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex justify-between">
              <span>NN: <span className="text-orange-400 font-medium">{nearest_neighbor?.metrics?.total_distance_km} km</span></span>
              {isImproved && <span className="text-emerald-400 font-medium">Saved: {summary.distance_saved_km} km</span>}
            </div>
          </div>

          {/* 2. Total Cost */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span className="flex items-center gap-1.5 font-medium">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                Delivery Cost
              </span>
              {isImproved && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  -${summary.cost_saved_usd}
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-400">
                ${two_opt?.metrics?.total_cost}
              </span>
              <span className="text-xs text-slate-400">USD</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex justify-between">
              <span>NN: <span className="text-orange-400 font-medium">${nearest_neighbor?.metrics?.total_cost}</span></span>
              <span className="text-slate-500">Fuel + Prep</span>
            </div>
          </div>

          {/* 3. Delivery Time */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span className="flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Est. Total Time
              </span>
              {isImproved && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  -{summary.time_saved_mins}m
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">
                {two_opt?.metrics?.estimated_total_time_mins}
              </span>
              <span className="text-xs text-slate-400">mins</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex justify-between">
              <span>NN: <span className="text-orange-400 font-medium">{nearest_neighbor?.metrics?.estimated_total_time_mins}m</span></span>
              <span className="text-cyan-400 font-medium">Travel: {two_opt?.metrics?.travel_time_mins}m</span>
            </div>
          </div>

          {/* 4. Execution Runtime */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span className="flex items-center gap-1.5 font-medium">
                <Zap className="w-3.5 h-3.5 text-yellow-400" />
                Compute Runtime
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-medium border border-blue-500/30">
                Ultra-fast
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-cyan-300">
                {two_opt?.metrics?.execution_time_ms}
              </span>
              <span className="text-xs text-slate-400">ms</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex justify-between">
              <span>NN: {nearest_neighbor?.metrics?.execution_time_ms} ms</span>
              <span>{summary.iterations_needed} iterations</span>
            </div>
          </div>
        </div>

        {/* Side-by-Side Comparison Table */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          <div className="px-4 py-2.5 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Side-by-Side Algorithm Comparison
            </h3>
            <span className="text-[11px] text-slate-400">
              Evaluated on identical order set & coordinates
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4">Evaluation Metric</th>
                  <th className="py-2.5 px-4 text-orange-400">Greedy Nearest Neighbor</th>
                  <th className="py-2.5 px-4 text-emerald-400">TSP 2-Opt Optimization</th>
                  <th className="py-2.5 px-4">Improvement / Delta</th>
                  <th className="py-2.5 px-4 text-center">Optimal Winner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {metrics_comparison.map((item, i) => (
                  <tr key={i} className="hover:bg-slate-800/30 transition">
                    <td className="py-2.5 px-4 font-medium text-white">{item.metric}</td>
                    <td className="py-2.5 px-4 font-mono">
                      {item.unit === '$' ? `$${item.nearest_neighbor}` : `${item.nearest_neighbor} ${item.unit}`}
                    </td>
                    <td className="py-2.5 px-4 font-mono font-semibold text-emerald-400">
                      {item.unit === '$' ? `$${item.two_opt}` : `${item.two_opt} ${item.unit}`}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-emerald-400">
                      {item.difference}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        {item.better === 'two_opt' ? '2-Opt' : item.better === 'nearest_neighbor' ? 'Greedy (Speed)' : 'Equal'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Single Algorithm Mode Metrics
  if (singleData?.metrics) {
    const m = singleData.metrics;
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-lg">
          <div className="text-slate-400 text-xs mb-1 font-medium flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
            Total Distance
          </div>
          <div className="text-2xl font-black text-white">
            {m.total_distance_km} <span className="text-xs text-slate-400 font-normal">km</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">{m.stop_count} stops in tour</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-lg">
          <div className="text-slate-400 text-xs mb-1 font-medium flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            Total Delivery Cost
          </div>
          <div className="text-2xl font-black text-emerald-400">
            ${m.total_cost}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Fuel: ${m.fuel_cost} • Prep: ${m.prep_cost}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-lg">
          <div className="text-slate-400 text-xs mb-1 font-medium flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            Est. Total Time
          </div>
          <div className="text-2xl font-black text-white">
            {m.estimated_total_time_mins} <span className="text-xs text-slate-400 font-normal">mins</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Transit: {m.travel_time_mins} mins</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-lg">
          <div className="text-slate-400 text-xs mb-1 font-medium flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-yellow-400" />
            Execution Time
          </div>
          <div className="text-2xl font-black text-cyan-300">
            {m.execution_time_ms} <span className="text-xs text-slate-400 font-normal">ms</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">{singleData.algorithm}</div>
        </div>
      </div>
    );
  }

  // Dijkstra Result Metrics
  if (singleData?.algorithm?.includes('Dijkstra')) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-lg">
          <div className="text-slate-400 text-xs mb-1 font-medium">Shortest Path Distance</div>
          <div className="text-2xl font-black text-sky-400">
            {singleData.total_distance} <span className="text-xs text-slate-400 font-normal">km</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">{singleData.path?.length || 0} nodes traversed</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-lg">
          <div className="text-slate-400 text-xs mb-1 font-medium">Reconstructed Path</div>
          <div className="text-sm font-semibold text-white truncate">
            {singleData.path?.map(n => n.name).join(' → ') || 'None'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Guaranteed optimal least-cost path</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-lg">
          <div className="text-slate-400 text-xs mb-1 font-medium">Compute Runtime</div>
          <div className="text-2xl font-black text-cyan-300">
            {singleData.execution_time_ms} <span className="text-xs text-slate-400 font-normal">ms</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Min-heap priority queue</div>
        </div>
      </div>
    );
  }

  return null;
}
