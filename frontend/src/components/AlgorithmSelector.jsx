import React from 'react';
import { GitCompare, Compass, Sparkles, Navigation, Play, Loader2 } from 'lucide-react';

export default function AlgorithmSelector({
  activeMode,
  onChangeMode,
  considerPriority,
  onTogglePriority,
  onSolve,
  isSolving
}) {
  const modes = [
    {
      id: 'compare',
      label: 'Compare All (Side-by-Side)',
      desc: 'Benchmark Greedy Nearest Neighbor vs 2-Opt Optimization',
      icon: GitCompare,
      badge: 'Recommended'
    },
    {
      id: 'nearest_neighbor',
      label: 'Greedy Nearest Neighbor',
      desc: 'Local greedy heuristic picking closest unvisited order',
      icon: Compass,
      badge: 'Heuristic'
    },
    {
      id: 'two_opt',
      label: 'TSP 2-Opt Optimizer',
      desc: 'Iterative 2-edge exchange uncrossing sub-tours',
      icon: Sparkles,
      badge: 'Optimal'
    },
    {
      id: 'dijkstra',
      label: "Dijkstra Shortest Path",
      desc: 'Direct least-cost path exploration with tentative cost table',
      icon: Navigation,
      badge: 'Exact'
    }
  ];

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 shadow-xl">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Mode Buttons */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 flex-1">
          {modes.map((m) => {
            const Icon = m.icon;
            const isActive = activeMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => onChangeMode(m.id)}
                className={`flex flex-col text-left p-3 rounded-xl border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-800 border-emerald-500 shadow-lg shadow-emerald-500/10'
                    : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-emerald-400' : 'text-slate-400'
                    }`}
                  />
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {m.badge}
                  </span>
                </div>
                <span className={`text-xs font-bold leading-tight ${isActive ? 'text-white' : 'text-slate-300'}`}>
                  {m.label}
                </span>
                <span className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                  {m.desc}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Action: Priority Toggle & Solve Button */}
        <div className="flex items-center gap-3 self-end md:self-center">
          {activeMode !== 'dijkstra' && (
            <label className="flex items-center gap-2 text-xs text-slate-300 bg-slate-950/80 px-3 py-2.5 rounded-xl border border-slate-800 cursor-pointer hover:bg-slate-800/60 transition">
              <input
                type="checkbox"
                checked={considerPriority}
                onChange={(e) => onTogglePriority(e.target.checked)}
                className="accent-emerald-500 rounded cursor-pointer"
              />
              <span className="font-medium whitespace-nowrap">Weigh Urgency Priority</span>
            </label>
          )}

          <button
            onClick={onSolve}
            disabled={isSolving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer whitespace-nowrap"
          >
            {isSolving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Solving...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Calculate Optimal Route</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
