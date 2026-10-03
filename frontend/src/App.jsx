import React, { useState, useEffect, useRef, useCallback } from 'react';
import Navbar from './components/Navbar';
import GraphCanvas from './components/GraphCanvas';
import AlgorithmSelector from './components/AlgorithmSelector';
import MetricsDashboard from './components/MetricsDashboard';
import DecisionLogs from './components/DecisionLogs';
import NodeControlPanel from './components/NodeControlPanel';
import RoutePlayer from './components/RoutePlayer';
import DijkstraPathFinder from './components/DijkstraPathFinder';

import {
  fetchHealth,
  fetchPresets,
  loadPreset,
  fetchNodesAndEdges,
  createNode,
  updateNode,
  deleteNode,
  solveCompare,
  solveNearestNeighbor,
  solveTwoOpt,
  solveDijkstra
} from './services/api';

export default function App() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [presets, setPresets] = useState({});
  const [currentPreset, setCurrentPreset] = useState('crossed_loops');
  const [storageStatus, setStorageStatus] = useState(null);

  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [activeMode, setActiveMode] = useState('compare');
  const [considerPriority, setConsiderPriority] = useState(false);
  const [isSolving, setIsSolving] = useState(false);

  // Solved results
  const [comparisonData, setComparisonData] = useState(null);
  const [singleData, setSingleData] = useState(null);

  // Dijkstra specifics
  const [dijkstraSourceId, setDijkstraSourceId] = useState('');
  const [dijkstraTargetId, setDijkstraTargetId] = useState('');

  // Simulation playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLegIndex, setCurrentLegIndex] = useState(0);
  const [playbackProgress, setPlaybackProgress] = useState(0.0);
  const [speed, setSpeed] = useState(1);
  const animFrameRef = useRef(null);
  const lastTimeRef = useRef(null);

  // Find hub node
  const hubNode = nodes.find(n => n.type === 'hub' || n.type === 'restaurant') || nodes[0];
  const hubId = hubNode ? hubNode.id : null;

  // Initial Load
  useEffect(() => {
    async function init() {
      try {
        const health = await fetchHealth();
        setStorageStatus(health.storage);

        const presetsData = await fetchPresets();
        setPresets(presetsData);

        const graph = await fetchNodesAndEdges();
        setNodes(graph.nodes || []);
        setEdges(graph.edges || []);

        if (graph.nodes?.length > 0) {
          const defaultHub = graph.nodes.find(n => n.type === 'hub') || graph.nodes[0];
          setDijkstraSourceId(defaultHub.id);
          // Auto-run comparison on initial load
          runSolverWithParams('compare', graph.nodes, defaultHub.id, false);
        }
      } catch (err) {
        console.error('Initialization error:', err);
      }
    }
    init();
  }, []);

  // Run Solver Function
  const runSolverWithParams = async (mode, currentNodes, currentHubId, withPriority) => {
    if (!currentNodes || currentNodes.length < 2) return;
    setIsSolving(true);
    try {
      if (mode === 'compare') {
        const res = await solveCompare(currentHubId, withPriority);
        setComparisonData(res);
        setSingleData(null);
      } else if (mode === 'nearest_neighbor') {
        const res = await solveNearestNeighbor(currentHubId, withPriority);
        setSingleData(res);
      } else if (mode === 'two_opt') {
        const res = await solveTwoOpt(currentHubId);
        setSingleData(res);
      } else if (mode === 'dijkstra') {
        const res = await solveDijkstra(dijkstraSourceId || currentHubId, dijkstraTargetId || null);
        setSingleData(res);
      }
      // Reset playback
      setCurrentLegIndex(0);
      setPlaybackProgress(0.0);
      setIsPlaying(false);
    } catch (err) {
      console.error('Solver error:', err);
    } finally {
      setIsSolving(false);
    }
  };

  const handleSolve = () => {
    runSolverWithParams(activeMode, nodes, hubId, considerPriority);
  };

  // Change mode
  const handleChangeMode = (newMode) => {
    setActiveMode(newMode);
    runSolverWithParams(newMode, nodes, hubId, considerPriority);
  };

  // Toggle Priority
  const handleTogglePriority = (val) => {
    setConsiderPriority(val);
    runSolverWithParams(activeMode, nodes, hubId, val);
  };

  // Switch Preset
  const handleSelectPreset = async (presetId) => {
    setCurrentPreset(presetId);
    try {
      const res = await loadPreset(presetId);
      setNodes(res.data.nodes || []);
      setEdges(res.data.edges || []);
      const newHub = res.data.nodes.find(n => n.type === 'hub') || res.data.nodes[0];
      if (newHub) setDijkstraSourceId(newHub.id);
      setSelectedNodeId(null);
      runSolverWithParams(activeMode, res.data.nodes, newHub?.id, considerPriority);
    } catch (err) {
      console.error('Failed to load preset:', err);
    }
  };

  // Reset Graph
  const handleResetGraph = () => {
    handleSelectPreset(currentPreset);
  };

  // Add random order
  const handleAddRandomOrder = async () => {
    const num = Math.floor(100 + Math.random() * 900);
    const priorities = ['Normal', 'High', 'Urgent'];
    const p = priorities[Math.floor(Math.random() * priorities.length)];
    const newNodeData = {
      name: `Order #${num}`,
      type: 'order',
      priority: p,
      prep_cost: parseFloat((2.0 + Math.random() * 5.0).toFixed(1)),
      prep_time_mins: Math.floor(5 + Math.random() * 20),
      x: Math.floor(120 + Math.random() * 550),
      y: Math.floor(100 + Math.random() * 420)
    };
    try {
      const res = await createNode(newNodeData);
      const updatedNodes = [...nodes, res.node];
      setNodes(updatedNodes);
      setSelectedNodeId(res.node.id);
      runSolverWithParams(activeMode, updatedNodes, hubId, considerPriority);
    } catch (err) {
      console.error('Failed to add random order:', err);
    }
  };

  // Add node by form
  const handleAddNode = async (nodeData) => {
    try {
      const res = await createNode(nodeData);
      const updated = [...nodes, res.node];
      setNodes(updated);
      setSelectedNodeId(res.node.id);
      runSolverWithParams(activeMode, updated, hubId, considerPriority);
    } catch (err) {
      console.error('Failed to create node:', err);
    }
  };

  // Canvas Click to drop order
  const handleCanvasClick = async (x, y) => {
    const num = Math.floor(100 + Math.random() * 900);
    const newNode = {
      name: `Order #${num}`,
      type: 'order',
      priority: 'Normal',
      prep_cost: 3.5,
      prep_time_mins: 12,
      x: x,
      y: y
    };
    try {
      const res = await createNode(newNode);
      const updated = [...nodes, res.node];
      setNodes(updated);
      setSelectedNodeId(res.node.id);
      runSolverWithParams(activeMode, updated, hubId, considerPriority);
    } catch (err) {
      console.error('Failed to drop node:', err);
    }
  };

  // Move node (drag)
  const handleMoveNode = (nodeId, newX, newY) => {
    setNodes(prev => prev.map(n => String(n.id) === String(nodeId) ? { ...n, x: newX, y: newY } : n));
    // Persist position update to backend
    updateNode(nodeId, { x: newX, y: newY }).catch(console.error);
    // Debounced or live solver update
    runSolverWithParams(activeMode, nodes.map(n => String(n.id) === String(nodeId) ? { ...n, x: newX, y: newY } : n), hubId, considerPriority);
  };

  // Update node details
  const handleUpdateNode = async (nodeId, data) => {
    try {
      const res = await updateNode(nodeId, data);
      const updated = nodes.map(n => String(n.id) === String(nodeId) ? res.node : n);
      setNodes(updated);
      runSolverWithParams(activeMode, updated, hubId, considerPriority);
    } catch (err) {
      console.error('Failed to update node:', err);
    }
  };

  // Delete node
  const handleDeleteNode = async (nodeId) => {
    try {
      await deleteNode(nodeId);
      const updated = nodes.filter(n => String(n.id) !== String(nodeId));
      setNodes(updated);
      setSelectedNodeId(null);
      runSolverWithParams(activeMode, updated, hubId, considerPriority);
    } catch (err) {
      console.error('Failed to delete node:', err);
    }
  };

  // Determine active legs for animation player
  let activeLegs = [];
  if (activeMode === 'compare' && comparisonData) {
    activeLegs = comparisonData.two_opt?.legs || [];
  } else if (singleData?.legs) {
    activeLegs = singleData.legs;
  }

  // Animation Loop
  const animate = useCallback((timestamp) => {
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const deltaTime = timestamp - lastTimeRef.current;
    lastTimeRef.current = timestamp;

    const legDurationMs = 1200 / speed;

    setPlaybackProgress((prev) => {
      const nextProgress = prev + (deltaTime / legDurationMs);
      if (nextProgress >= 1.0) {
        setCurrentLegIndex((prevIdx) => {
          if (prevIdx >= activeLegs.length - 1) {
            setIsPlaying(false);
            return prevIdx;
          }
          return prevIdx + 1;
        });
        return 0.0;
      }
      return nextProgress;
    });

    if (isPlaying) {
      animFrameRef.current = requestAnimationFrame(animate);
    }
  }, [isPlaying, speed, activeLegs.length]);

  useEffect(() => {
    if (isPlaying) {
      lastTimeRef.current = null;
      animFrameRef.current = requestAnimationFrame(animate);
    } else {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, animate]);

  // Selected node object
  const selectedNode = nodes.find(n => String(n.id) === String(selectedNodeId));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Navbar */}
      <Navbar
        storageStatus={storageStatus}
        presets={presets}
        currentPreset={currentPreset}
        onSelectPreset={handleSelectPreset}
        onResetGraph={handleResetGraph}
        onAddRandomOrder={handleAddRandomOrder}
        nodeCount={nodes.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        {/* Top: Algorithm Selector */}
        <AlgorithmSelector
          activeMode={activeMode}
          onChangeMode={handleChangeMode}
          considerPriority={considerPriority}
          onTogglePriority={handleTogglePriority}
          onSolve={handleSolve}
          isSolving={isSolving}
        />

        {/* Dijkstra Specific Controls (Shown when Dijkstra is active) */}
        {activeMode === 'dijkstra' && (
          <DijkstraPathFinder
            nodes={nodes}
            sourceId={dijkstraSourceId}
            targetId={dijkstraTargetId}
            onChangeSource={(val) => {
              setDijkstraSourceId(val);
              solveDijkstra(val, dijkstraTargetId || null).then(setSingleData);
            }}
            onChangeTarget={(val) => {
              setDijkstraTargetId(val);
              solveDijkstra(dijkstraSourceId || hubId, val || null).then(setSingleData);
            }}
            dijkstraData={singleData}
          />
        )}

        {/* Metrics Dashboard */}
        <MetricsDashboard
          activeMode={activeMode}
          comparisonData={comparisonData}
          singleData={singleData}
        />

        {/* Center Grid: Interactive Canvas & Side Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Canvas area (Span 3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            <GraphCanvas
              nodes={nodes}
              edges={edges}
              selectedNodeId={selectedNodeId}
              onSelectNode={setSelectedNodeId}
              onMoveNode={handleMoveNode}
              onCanvasClick={handleCanvasClick}
              activeMode={activeMode}
              comparisonData={comparisonData}
              singleAlgorithmData={singleData}
              playbackProgress={playbackProgress}
              activeLegIndex={currentLegIndex}
            />

            {/* Route Simulation Player */}
            <RoutePlayer
              isPlaying={isPlaying}
              onTogglePlay={() => {
                if (currentLegIndex >= activeLegs.length - 1) {
                  setCurrentLegIndex(0);
                  setPlaybackProgress(0.0);
                }
                setIsPlaying(!isPlaying);
              }}
              onStepForward={() => {
                if (currentLegIndex < activeLegs.length - 1) {
                  setCurrentLegIndex(currentLegIndex + 1);
                  setPlaybackProgress(0.0);
                }
              }}
              onStepBackward={() => {
                if (currentLegIndex > 0) {
                  setCurrentLegIndex(currentLegIndex - 1);
                  setPlaybackProgress(0.0);
                }
              }}
              onReset={() => {
                setIsPlaying(false);
                setCurrentLegIndex(0);
                setPlaybackProgress(0.0);
              }}
              currentLegIndex={currentLegIndex}
              totalLegs={activeLegs.length}
              legs={activeLegs}
              speed={speed}
              onChangeSpeed={setSpeed}
            />
          </div>

          {/* Right Column: Node Control Panel & Quick Stats */}
          <div className="lg:col-span-1 space-y-4">
            <NodeControlPanel
              selectedNode={selectedNode}
              onUpdateNode={handleUpdateNode}
              onDeleteNode={handleDeleteNode}
              onAddNode={handleAddNode}
              onClose={() => setSelectedNodeId(null)}
            />

            {/* Quick Algorithm Cheat Sheet */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 text-xs space-y-3 shadow-xl">
              <h4 className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <span>Algorithm Key</span>
              </h4>
              <div className="space-y-2 text-slate-300">
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <strong className="text-orange-400 block mb-0.5">Greedy Nearest Neighbor:</strong>
                  Makes locally optimal choices from current stop. Fast ($O(n^2)$), but can cause crossed edges and sub-optimal return trips.
                </div>
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <strong className="text-emerald-400 block mb-0.5">TSP 2-Opt Optimizer:</strong>
                  Iteratively searches for pairs of crossing edges and performs 2-edge swaps to uncross them, strictly reducing total tour distance.
                </div>
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <strong className="text-sky-400 block mb-0.5">Dijkstra's Algorithm:</strong>
                  Maintains a tentative cost table and min-heap to guarantee exact point-to-point shortest paths with non-negative weights.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Step-by-Step Decision Logs */}
        <DecisionLogs
          activeMode={activeMode}
          comparisonData={comparisonData}
          singleData={singleData}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/60 py-4 text-center text-xs text-slate-500 mt-8">
        Food Delivery Multi-Order Route Optimization System • Dijkstra • Greedy Nearest Neighbor • TSP 2-Opt
      </footer>
    </div>
  );
}
