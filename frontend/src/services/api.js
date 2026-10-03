const API_BASE = '/api';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Failed to fetch health');
  return res.json();
}

export async function fetchPresets() {
  const res = await fetch(`${API_BASE}/presets`);
  if (!res.ok) throw new Error('Failed to fetch presets');
  return res.json();
}

export async function loadPreset(presetId) {
  const res = await fetch(`${API_BASE}/presets/${presetId}/load`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to load preset');
  return res.json();
}

export async function fetchNodesAndEdges() {
  const res = await fetch(`${API_BASE}/nodes`);
  if (!res.ok) throw new Error('Failed to fetch nodes');
  return res.json();
}

export async function createNode(nodeData) {
  const res = await fetch(`${API_BASE}/nodes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(nodeData),
  });
  if (!res.ok) throw new Error('Failed to create node');
  return res.json();
}

export async function updateNode(nodeId, nodeData) {
  const res = await fetch(`${API_BASE}/nodes/${nodeId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(nodeData),
  });
  if (!res.ok) throw new Error('Failed to update node');
  return res.json();
}

export async function deleteNode(nodeId) {
  const res = await fetch(`${API_BASE}/nodes/${nodeId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete node');
  return res.json();
}

export async function solveDijkstra(sourceId, targetId) {
  const res = await fetch(`${API_BASE}/solve/dijkstra`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source_id: sourceId, target_id: targetId }),
  });
  if (!res.ok) throw new Error('Failed to solve with Dijkstra');
  return res.json();
}

export async function solveNearestNeighbor(hubId, considerPriority = false) {
  const res = await fetch(`${API_BASE}/solve/nearest-neighbor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hub_id: hubId, consider_priority: considerPriority }),
  });
  if (!res.ok) throw new Error('Failed to solve with Nearest Neighbor');
  return res.json();
}

export async function solveTwoOpt(hubId, initialTour = null) {
  const res = await fetch(`${API_BASE}/solve/two-opt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hub_id: hubId, initial_tour: initialTour }),
  });
  if (!res.ok) throw new Error('Failed to solve with 2-Opt');
  return res.json();
}

export async function solveCompare(hubId, considerPriority = false) {
  const res = await fetch(`${API_BASE}/solve/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hub_id: hubId, consider_priority: considerPriority }),
  });
  if (!res.ok) throw new Error('Failed to run comparison engine');
  return res.json();
}
