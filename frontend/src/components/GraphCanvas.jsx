import React, { useRef, useState, useEffect } from 'react';
import { Utensils, AlertCircle, Clock, DollarSign, Crosshair, ZoomIn, ZoomOut, Maximize2, Bike } from 'lucide-react';

const PRIORITY_COLORS = {
  Urgent: {
    bg: 'bg-rose-500',
    border: 'border-rose-400',
    ring: 'ring-rose-500/40',
    text: 'text-rose-400',
    badge: 'bg-rose-950/80 text-rose-300 border-rose-800'
  },
  High: {
    bg: 'bg-amber-500',
    border: 'border-amber-400',
    ring: 'ring-amber-500/40',
    text: 'text-amber-400',
    badge: 'bg-amber-950/80 text-amber-300 border-amber-800'
  },
  Normal: {
    bg: 'bg-emerald-500',
    border: 'border-emerald-400',
    ring: 'ring-emerald-500/40',
    text: 'text-emerald-400',
    badge: 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
  }
};

export default function GraphCanvas({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
  onMoveNode,
  onCanvasClick,
  activeMode,
  comparisonData,
  singleAlgorithmData,
  playbackProgress, // 0.0 to 1.0 or current leg index
  activeLegIndex
}) {
  const containerRef = useRef(null);
  const [draggingNodeId, setDraggingNodeId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showEdgeWeights, setShowEdgeWeights] = useState(true);
  const [showNodeLabels, setShowNodeLabels] = useState(true);

  const nodeMap = React.useMemo(() => {
    const map = {};
    nodes.forEach(n => {
      map[String(n.id)] = n;
    });
    return map;
  }, [nodes]);

  // Handle Dragging
  const handleMouseDown = (e, node) => {
    e.stopPropagation();
    onSelectNode(node.id);
    const rect = containerRef.current.getBoundingClientRect();
    setDraggingNodeId(node.id);
    setDragOffset({
      x: (e.clientX - rect.left) - node.x,
      y: (e.clientY - rect.top) - node.y
    });
  };

  const handleMouseMove = (e) => {
    if (!draggingNodeId || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const newX = Math.max(40, Math.min(rect.width - 40, (e.clientX - rect.left) - dragOffset.x));
    const newY = Math.max(40, Math.min(rect.height - 40, (e.clientY - rect.top) - dragOffset.y));
    onMoveNode(draggingNodeId, Math.round(newX), Math.round(newY));
  };

  const handleMouseUp = () => {
    setDraggingNodeId(null);
  };

  const handleCanvasClick = (e) => {
    if (draggingNodeId) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = Math.round(e.clientX - rect.left);
    const clickY = Math.round(e.clientY - rect.top);
    onCanvasClick(clickX, clickY);
  };

  // Build SVG path strings
  const buildTourPath = (tourIds) => {
    if (!tourIds || tourIds.length < 2) return '';
    const points = tourIds
      .map(id => nodeMap[String(id)])
      .filter(Boolean)
      .map(n => `${n.x},${n.y}`);
    return `M ${points.join(' L ')}`;
  };

  // Determine active route paths
  let nnPathD = '';
  let twoOptPathD = '';
  let singlePathD = '';
  let activeTour = [];

  if (activeMode === 'compare' && comparisonData) {
    if (comparisonData.nearest_neighbor?.tour) {
      nnPathD = buildTourPath(comparisonData.nearest_neighbor.tour);
    }
    if (comparisonData.two_opt?.tour) {
      twoOptPathD = buildTourPath(comparisonData.two_opt.tour);
      activeTour = comparisonData.two_opt.tour;
    }
  } else if (singleAlgorithmData?.tour) {
    singlePathD = buildTourPath(singleAlgorithmData.tour);
    activeTour = singleAlgorithmData.tour;
  } else if (singleAlgorithmData?.path_node_ids) {
    // Dijkstra path
    singlePathD = buildTourPath(singleAlgorithmData.path_node_ids);
    activeTour = singleAlgorithmData.path_node_ids;
  }

  // Calculate animated delivery bike position along active tour
  let bikePos = null;
  if (activeTour.length >= 2 && activeLegIndex !== undefined && activeLegIndex >= 0) {
    const curIdx = Math.min(activeLegIndex, activeTour.length - 2);
    const u = nodeMap[String(activeTour[curIdx])];
    const v = nodeMap[String(activeTour[curIdx + 1])];
    if (u && v) {
      // Interpolate with playbackProgress (fraction between u and v)
      const t = playbackProgress ?? 0;
      bikePos = {
        x: u.x + (v.x - u.x) * t,
        y: u.y + (v.y - u.y) * t,
        angle: Math.atan2(v.y - u.y, v.x - u.x) * (180 / Math.PI)
      };
    }
  }

  return (
    <div className="relative w-full h-[620px] bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden select-none flex flex-col">
      {/* Canvas Top Bar Controls */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-xs shadow-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-slate-200">Interactive Delivery Canvas</span>
          <span className="text-slate-400">| Click empty map to drop order • Drag to reposition</span>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-xs shadow-md">
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
            <input
              type="checkbox"
              checked={showEdgeWeights}
              onChange={(e) => setShowEdgeWeights(e.target.checked)}
              className="accent-emerald-500 rounded cursor-pointer"
            />
            <span>Show Distances</span>
          </label>
          <span className="text-slate-600">•</span>
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
            <input
              type="checkbox"
              checked={showNodeLabels}
              onChange={(e) => setShowNodeLabels(e.target.checked)}
              className="accent-emerald-500 rounded cursor-pointer"
            />
            <span>Show Details</span>
          </label>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div
        ref={containerRef}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="relative w-full h-full cursor-crosshair overflow-hidden"
      >
        <svg className="w-full h-full absolute inset-0 pointer-events-none">
          <defs>
            {/* Grid Pattern */}
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.8" strokeDasharray="3 3" />
            </pattern>
            {/* Glow Filter */}
            <filter id="glow-emerald" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-orange" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            {/* Arrow Marker */}
            <marker id="arrow" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
            </marker>
            <marker id="arrow-nn" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#f97316" />
            </marker>
          </defs>

          {/* Background Grid */}
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Explicit Road Network Edges */}
          {edges && edges.map((e, idx) => {
            const u = nodeMap[String(e.source)];
            const v = nodeMap[String(e.target)];
            if (!u || !v) return null;
            const midX = (u.x + v.x) / 2;
            const midY = (u.y + v.y) / 2;
            return (
              <g key={`edge-${idx}`}>
                <line
                  x1={u.x}
                  y1={u.y}
                  x2={v.x}
                  y2={v.y}
                  stroke="#334155"
                  strokeWidth="2.5"
                  strokeDasharray="4 2"
                />
                {showEdgeWeights && (
                  <g transform={`translate(${midX}, ${midY})`}>
                    <rect x="-18" y="-9" width="36" height="18" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                    <text
                      x="0"
                      y="3.5"
                      fill="#94a3b8"
                      fontSize="10"
                      fontWeight="600"
                      textAnchor="middle"
                    >
                      {e.weight ? `${e.weight}k` : ''}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* ROUTE VISUALIZATION */}

          {/* 1. Comparison: Nearest Neighbor Route (Orange Dashed) */}
          {activeMode === 'compare' && nnPathD && (
            <path
              d={nnPathD}
              fill="none"
              stroke="#f97316"
              strokeWidth="2.5"
              strokeDasharray="6 4"
              opacity="0.85"
              filter="url(#glow-orange)"
              markerMid="url(#arrow-nn)"
            />
          )}

          {/* 2. Comparison: 2-Opt Optimized Route (Emerald Solid Glowing) */}
          {activeMode === 'compare' && twoOptPathD && (
            <path
              d={twoOptPathD}
              fill="none"
              stroke="#10b981"
              strokeWidth="3.5"
              filter="url(#glow-emerald)"
              markerMid="url(#arrow)"
            />
          )}

          {/* 3. Single Algorithm Route (NN, 2-Opt, or Dijkstra) */}
          {activeMode !== 'compare' && singlePathD && (
            <path
              d={singlePathD}
              fill="none"
              stroke={activeMode === 'dijkstra' ? '#38bdf8' : activeMode === 'nearest_neighbor' ? '#f97316' : '#10b981'}
              strokeWidth="3.5"
              filter={activeMode === 'dijkstra' ? 'url(#glow-cyan)' : 'url(#glow-emerald)'}
              markerMid="url(#arrow)"
            />
          )}

          {/* Route Leg Order Badges along the path */}
          {activeTour.length > 2 && activeTour.slice(1, -1).map((id, index) => {
            const n = nodeMap[String(id)];
            if (!n) return null;
            return (
              <g key={`stop-badge-${id}`} transform={`translate(${n.x - 22}, ${n.y - 22})`}>
                <circle cx="0" cy="0" r="10" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="0" y="3.5" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">
                  #{index + 1}
                </text>
              </g>
            );
          })}

          {/* Animated Delivery Bike Icon */}
          {bikePos && (
            <g
              transform={`translate(${bikePos.x}, ${bikePos.y}) rotate(${bikePos.angle})`}
              className="transition-transform duration-75"
            >
              <circle cx="0" cy="0" r="16" fill="#10b981" fillOpacity="0.25" className="animate-ping" />
              <circle cx="0" cy="0" r="13" fill="#047857" stroke="#34d399" strokeWidth="2" />
              <g transform="translate(-8, -8) scale(0.65)">
                <path
                  d="M5.5 17a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zm13 0a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM15 6h2l2 4h-4M9 14l3-6h4"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            </g>
          )}
        </svg>

        {/* NODES (DOM Elements on top of SVG for rich dragging & events) */}
        {nodes.map((node) => {
          const isHub = node.type === 'hub' || node.type === 'restaurant';
          const isSelected = String(node.id) === String(selectedNodeId);
          const priority = node.priority || 'Normal';
          const styleConfig = isHub
            ? {
                bg: 'bg-amber-500',
                border: 'border-amber-300',
                ring: 'ring-amber-500/50',
                text: 'text-amber-300',
                badge: 'bg-amber-950 text-amber-300 border-amber-700'
              }
            : PRIORITY_COLORS[priority] || PRIORITY_COLORS.Normal;

          return (
            <div
              key={node.id}
              style={{
                left: `${node.x}px`,
                top: `${node.y}px`,
                transform: 'translate(-50%, -50%)',
              }}
              onMouseDown={(e) => handleMouseDown(e, node)}
              className={`absolute cursor-grab active:cursor-grabbing transition-shadow z-10 ${
                isSelected ? 'scale-110 z-30' : 'hover:scale-105'
              }`}
            >
              {/* Outer pulsing ring for Hub or Urgent orders */}
              {(isHub || priority === 'Urgent') && (
                <div
                  className={`absolute -inset-2 rounded-full animate-ping opacity-30 ${
                    isHub ? 'bg-amber-400' : 'bg-rose-500'
                  }`}
                />
              )}

              {/* Main Node Circle */}
              <div
                className={`relative w-12 h-12 rounded-full flex flex-col items-center justify-center border-2 shadow-xl ${
                  isHub
                    ? 'bg-gradient-to-tr from-amber-600 to-amber-400 border-amber-200 text-slate-950 font-bold'
                    : `${styleConfig.bg} ${styleConfig.border} text-white font-bold`
                } ${isSelected ? 'ring-4 ' + styleConfig.ring : ''}`}
              >
                {isHub ? (
                  <Utensils className="w-5 h-5 text-slate-950 stroke-[2.5]" />
                ) : (
                  <span className="text-xs tracking-tighter">
                    {node.name.includes('#') ? `#${node.name.split('#')[1]?.trim()?.split(' ')[0]}` : node.id.slice(0, 3)}
                  </span>
                )}
              </div>

              {/* Node Card / Label on Hover or Toggle */}
              {showNodeLabels && (
                <div
                  className={`absolute left-1/2 -translate-x-1/2 mt-1.5 px-2.5 py-1 rounded-lg backdrop-blur-md shadow-lg border text-[11px] whitespace-nowrap pointer-events-none transition-all ${
                    isHub
                      ? 'bg-slate-900/90 text-amber-300 border-amber-500/40 font-semibold'
                      : 'bg-slate-900/90 text-slate-200 border-slate-700 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{node.name}</span>
                    {!isHub && (
                      <span className={`text-[9px] px-1 py-0.2 rounded border font-semibold ${styleConfig.badge}`}>
                        {priority}
                      </span>
                    )}
                  </div>
                  {!isHub && (
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      <span className="flex items-center gap-0.5">
                        <DollarSign className="w-2.5 h-2.5 text-emerald-400" />
                        {Number(node.prep_cost || 0).toFixed(2)}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5 text-cyan-400" />
                        {node.prep_time_mins || 10}m
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Comparison Overlay Legend (Visible when Compare mode is active) */}
      {activeMode === 'compare' && (
        <div className="absolute bottom-3 left-3 z-20 bg-slate-900/90 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-800 text-xs shadow-xl flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-4 h-0.5 border-t-2 border-dashed border-orange-500" />
            <span className="text-orange-400 font-medium">Nearest Neighbor Tour</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-1 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981]" />
            <span className="text-emerald-400 font-medium">TSP 2-Opt Optimized Tour</span>
          </div>
        </div>
      )}
    </div>
  );
}
