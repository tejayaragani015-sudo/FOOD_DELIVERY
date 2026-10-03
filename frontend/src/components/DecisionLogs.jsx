import React, { useState } from 'react';
import { ListTree, ChevronRight, ChevronDown, Check, ArrowRight, CornerDownRight, Search } from 'lucide-react';

const STEP_TYPE_BADGES = {
  INITIALIZATION: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  SETTLED_NODE: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  EDGE_RELAXED: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  EDGE_IGNORED: 'bg-slate-700/50 text-slate-400 border-slate-600',
  TARGET_REACHED: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  TOUR_START: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  GREEDY_CHOICE: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  RETURN_TO_HUB: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  INITIAL_TOUR: 'bg-slate-700/50 text-slate-300 border-slate-600',
  '2OPT_SWAP': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  OPTIMIZATION_COMPLETE: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
};

export default function DecisionLogs({ activeMode, comparisonData, singleData }) {
  const [selectedAlgoTab, setSelectedAlgoTab] = useState('two_opt');
  const [expandedSteps, setExpandedSteps] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  // Determine logs to display
  let logs = [];
  let availableTabs = [];

  if (activeMode === 'compare' && comparisonData) {
    availableTabs = [
      { id: 'two_opt', label: 'TSP 2-Opt Swaps' },
      { id: 'nearest_neighbor', label: 'Nearest Neighbor Choices' }
    ];
    if (selectedAlgoTab === 'two_opt') {
      logs = comparisonData.two_opt?.decision_log || [];
    } else {
      logs = comparisonData.nearest_neighbor?.decision_log || [];
    }
  } else if (singleData?.decision_log) {
    logs = singleData.decision_log;
  }

  const toggleExpand = (stepIndex) => {
    setExpandedSteps(prev => ({
      ...prev,
      [stepIndex]: !prev[stepIndex]
    }));
  };

  const filteredLogs = logs.filter(item => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.description?.toLowerCase().includes(q) ||
      item.type?.toLowerCase().includes(q) ||
      String(item.step).includes(q)
    );
  });

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col h-[520px]">
      {/* Header */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ListTree className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-bold text-white tracking-wide">
            Step-by-Step Decision Logs & Reasoning
          </h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            {filteredLogs.length} events
          </span>
        </div>

        {/* Algorithm Tabs (when in compare mode) */}
        {availableTabs.length > 0 && (
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            {availableTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedAlgoTab(tab.id)}
                className={`px-3 py-1 rounded-md font-medium transition cursor-pointer ${
                  selectedAlgoTab === tab.id
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search decisions..."
            className="pl-8 pr-3 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 outline-none focus:border-emerald-500 w-44"
          />
        </div>
      </div>

      {/* Log List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {filteredLogs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs text-center p-8">
            <ListTree className="w-8 h-8 mb-2 opacity-40" />
            <p>No decision log events found. Run the solver above to generate detailed traces.</p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isExpanded = !!expandedSteps[log.step];
            const badgeClass = STEP_TYPE_BADGES[log.type] || 'bg-slate-800 text-slate-300 border-slate-700';

            return (
              <div
                key={log.step}
                className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 hover:border-slate-700/80 transition"
              >
                <div
                  onClick={() => toggleExpand(log.step)}
                  className="flex items-start justify-between gap-3 cursor-pointer"
                >
                  <div className="flex items-start gap-2.5 flex-1">
                    <span className="text-xs font-mono font-bold text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      #{log.step}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${badgeClass}`}>
                      {log.type}
                    </span>
                    <p className="text-xs text-slate-200 font-medium leading-relaxed flex-1">
                      {log.description}
                    </p>
                  </div>

                  <div className="text-slate-500 hover:text-slate-300 transition mt-0.5">
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs space-y-2">
                    {/* For 2-Opt Swaps */}
                    {log.edges_removed && (
                      <div className="grid grid-cols-2 gap-3 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60 font-mono text-[11px]">
                        <div>
                          <span className="text-rose-400 font-bold block mb-1">Removed Intersecting Edges:</span>
                          {log.edges_removed.map((e, idx) => (
                            <div key={idx} className="text-slate-300">{e}</div>
                          ))}
                        </div>
                        <div>
                          <span className="text-emerald-400 font-bold block mb-1">Inserted Uncrossed Edges:</span>
                          {log.edges_added.map((e, idx) => (
                            <div key={idx} className="text-slate-300">{e}</div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* For Candidates Evaluated in Greedy Choice */}
                    {log.candidates_considered && log.candidates_considered.length > 0 && (
                      <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                        <span className="text-slate-400 font-bold text-[11px] block mb-1.5">
                          Unvisited Candidates Ranked by Travel Cost:
                        </span>
                        <div className="space-y-1">
                          {log.candidates_considered.map((c, idx) => (
                            <div
                              key={idx}
                              className={`flex items-center justify-between text-[11px] px-2 py-1 rounded ${
                                idx === 0 ? 'bg-emerald-950/40 text-emerald-300 font-semibold' : 'text-slate-400'
                              }`}
                            >
                              <span>
                                {idx === 0 && '✓ Winner: '}
                                {c.name} ({c.priority})
                              </span>
                              <span className="font-mono">
                                Dist: {c.distance} km • Score: {c.score}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Dijkstra Tentative Data */}
                    {log.tentative_cost !== undefined && (
                      <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
                        <span>Settled Distance: <strong className="text-white">{log.tentative_cost} km</strong></span>
                        {log.old_distance && (
                          <span>Relaxed from: <strong className="text-amber-400">{log.old_distance} km</strong></span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
