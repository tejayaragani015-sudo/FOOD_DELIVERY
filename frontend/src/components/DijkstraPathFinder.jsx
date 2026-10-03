import React from 'react';
import { Navigation, CornerDownRight, CheckCircle2, CircleDashed } from 'lucide-react';

export default function DijkstraPathFinder({
  nodes,
  sourceId,
  targetId,
  onChangeSource,
  onChangeTarget,
  dijkstraData
}) {
  const tentativeSummary = dijkstraData?.tentative_summary || {};
  const path = dijkstraData?.path || [];

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 shadow-xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Navigation className="w-5 h-5 text-sky-400" />
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Dijkstra Least-Cost Path Finder & Tentative Table
            </h3>
            <p className="text-[11px] text-slate-400">
              Maintains tentative distance table with min-heap node relaxations
            </p>
          </div>
        </div>

        {/* Source and Target Pickers */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
            <span className="text-slate-400 mr-2">From:</span>
            <select
              value={sourceId}
              onChange={(e) => onChangeSource(e.target.value)}
              className="bg-transparent text-white font-medium outline-none cursor-pointer"
            >
              {nodes.map(n => (
                <option key={n.id} value={n.id} className="bg-slate-900 text-white">
                  {n.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
            <span className="text-slate-400 mr-2">To:</span>
            <select
              value={targetId || ''}
              onChange={(e) => onChangeTarget(e.target.value)}
              className="bg-transparent text-white font-medium outline-none cursor-pointer"
            >
              <option value="" className="bg-slate-900 text-slate-400">All Nodes (Single-Source)</option>
              {nodes.filter(n => String(n.id) !== String(sourceId)).map(n => (
                <option key={n.id} value={n.id} className="bg-slate-900 text-white">
                  {n.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Path Reconstruction Banner */}
      {targetId && path.length > 0 && (
        <div className="bg-sky-950/40 border border-sky-600/30 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CornerDownRight className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-semibold text-slate-300">Reconstructed Path:</span>
            <span className="text-xs font-bold text-sky-300">
              {path.map(n => n.name).join('  ➔  ')}
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-white bg-sky-900/60 px-2 py-0.5 rounded border border-sky-500/30">
            {dijkstraData.total_distance} km
          </span>
        </div>
      )}

      {/* Tentative Cost Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800/80">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
            <tr>
              <th className="py-2 px-3">Node / Destination</th>
              <th className="py-2 px-3">Settled Status</th>
              <th className="py-2 px-3">Tentative / Final Distance</th>
              <th className="py-2 px-3">Predecessor (Backtracking)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50 text-slate-300">
            {nodes.map(n => {
              const summary = tentativeSummary[String(n.id)];
              const isSettled = summary?.visited;
              const dist = summary?.shortest_distance;
              const predId = summary?.predecessor;
              const predNode = nodes.find(node => String(node.id) === String(predId));

              return (
                <tr key={n.id} className="hover:bg-slate-800/30">
                  <td className="py-2 px-3 font-medium text-white flex items-center gap-2">
                    {String(n.id) === String(sourceId) && (
                      <span className="text-[10px] px-1 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        SRC
                      </span>
                    )}
                    {String(n.id) === String(targetId) && (
                      <span className="text-[10px] px-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        DEST
                      </span>
                    )}
                    <span>{n.name}</span>
                  </td>
                  <td className="py-2 px-3">
                    {isSettled ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Finalized
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                        <CircleDashed className="w-3.5 h-3.5" />
                        Tentative
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3 font-mono font-semibold">
                    {dist !== null && dist !== undefined ? (
                      <span className="text-sky-300">{dist} km</span>
                    ) : (
                      <span className="text-slate-500">∞ (Unreachable)</span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-slate-400">
                    {predNode ? predNode.name : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
