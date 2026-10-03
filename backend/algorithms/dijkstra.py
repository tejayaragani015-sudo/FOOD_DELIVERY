import heapq
import time
import math
from typing import Dict, List, Any, Optional, Tuple

def euclidean_distance(node_a: Dict[str, Any], node_b: Dict[str, Any]) -> float:
    dx = float(node_a.get("x", 0)) - float(node_b.get("x", 0))
    dy = float(node_a.get("y", 0)) - float(node_b.get("y", 0))
    # Scaled to kilometers (assuming 10 canvas units approx = 1 km, or raw euclidean)
    return round(math.sqrt(dx * dx + dy * dy) / 10.0, 2)

def build_adjacency_graph(nodes: List[Dict[str, Any]], edges: Optional[List[Dict[str, Any]]] = None) -> Dict[str, List[Tuple[str, float]]]:
    """
    Builds an adjacency list representation. If explicit edges are provided,
    uses those. If not provided or graph is disconnected, falls back to direct
    Euclidean distances between all nodes.
    """
    node_map = {str(n["id"]): n for n in nodes}
    graph: Dict[str, List[Tuple[str, float]]] = {str(n["id"]): [] for n in nodes}

    if edges and len(edges) > 0:
        for edge in edges:
            u = str(edge.get("source"))
            v = str(edge.get("target"))
            weight = edge.get("weight")
            if weight is None and u in node_map and v in node_map:
                weight = euclidean_distance(node_map[u], node_map[v])
            else:
                weight = float(weight if weight is not None else 1.0)
            
            if u in graph and v in graph:
                graph[u].append((v, weight))
                if not edge.get("directed", False):
                    graph[v].append((u, weight))
    else:
        # Fully connected metric network
        node_ids = list(node_map.keys())
        for i in range(len(node_ids)):
            for j in range(i + 1, len(node_ids)):
                u, v = node_ids[i], node_ids[j]
                d = euclidean_distance(node_map[u], node_map[v])
                graph[u].append((v, d))
                graph[v].append((u, d))

    return graph

def run_dijkstra(
    nodes: List[Dict[str, Any]],
    source_id: str,
    target_id: Optional[str] = None,
    edges: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Executes Dijkstra's algorithm to compute the shortest path(s) from source_id.
    Maintains tentative costs, predecessor tracking, relaxation events, and a step-by-step decision log.
    """
    start_time = time.perf_counter()
    node_map = {str(n["id"]): n for n in nodes}
    source_id = str(source_id)
    if target_id is not None:
        target_id = str(target_id)

    if source_id not in node_map:
        return {
            "error": f"Source node '{source_id}' not found.",
            "success": False
        }

    graph = build_adjacency_graph(nodes, edges)

    # Initialize tentative distances and predecessors
    distances: Dict[str, float] = {str(n["id"]): float("inf") for n in nodes}
    predecessors: Dict[str, Optional[str]] = {str(n["id"]): None for n in nodes}
    visited = set()
    
    distances[source_id] = 0.0
    pq = [(0.0, source_id)]
    
    decision_log: List[Dict[str, Any]] = []
    step_num = 1

    decision_log.append({
        "step": step_num,
        "type": "INITIALIZATION",
        "node_id": source_id,
        "node_name": node_map[source_id].get("name", source_id),
        "description": f"Initialized tentative distance of source [{node_map[source_id].get('name', source_id)}] to 0.00 km. All other nodes set to ∞.",
        "tentative_cost": 0.0
    })

    tentative_history: List[Dict[str, Any]] = []

    while pq:
        curr_dist, curr_node = heapq.heappop(pq)
        
        if curr_node in visited:
            continue
            
        visited.add(curr_node)
        curr_name = node_map[curr_node].get("name", curr_node)
        step_num += 1

        decision_log.append({
            "step": step_num,
            "type": "SETTLED_NODE",
            "node_id": curr_node,
            "node_name": curr_name,
            "description": f"Extracted min-node [{curr_name}] with finalized shortest distance {curr_dist:.2f} km.",
            "tentative_cost": round(curr_dist, 2)
        })

        if target_id and curr_node == target_id:
            step_num += 1
            decision_log.append({
                "step": step_num,
                "type": "TARGET_REACHED",
                "node_id": curr_node,
                "node_name": curr_name,
                "description": f"Target node [{curr_name}] settled at distance {curr_dist:.2f} km. Terminating early.",
                "tentative_cost": round(curr_dist, 2)
            })
            break

        # Relax adjacent edges
        neighbors = graph.get(curr_node, [])
        for neighbor, weight in neighbors:
            if neighbor in visited:
                continue

            new_dist = curr_dist + weight
            old_dist = distances[neighbor]
            neighbor_name = node_map[neighbor].get("name", neighbor)

            if new_dist < old_dist:
                distances[neighbor] = new_dist
                predecessors[neighbor] = curr_node
                heapq.heappush(pq, (new_dist, neighbor))
                step_num += 1
                decision_log.append({
                    "step": step_num,
                    "type": "EDGE_RELAXED",
                    "from_node": curr_node,
                    "from_name": curr_name,
                    "to_node": neighbor,
                    "to_name": neighbor_name,
                    "edge_weight": round(weight, 2),
                    "old_distance": "∞" if old_dist == float("inf") else round(old_dist, 2),
                    "new_distance": round(new_dist, 2),
                    "description": f"Relaxed edge ({curr_name} → {neighbor_name}, wt: {weight:.2f} km): Updated tentative cost from {'∞' if old_dist == float('inf') else f'{old_dist:.2f}'} km down to {new_dist:.2f} km."
                })
            else:
                step_num += 1
                decision_log.append({
                    "step": step_num,
                    "type": "EDGE_IGNORED",
                    "from_node": curr_node,
                    "from_name": curr_name,
                    "to_node": neighbor,
                    "to_name": neighbor_name,
                    "edge_weight": round(weight, 2),
                    "candidate_distance": round(new_dist, 2),
                    "current_distance": round(old_dist, 2),
                    "description": f"Considered edge ({curr_name} → {neighbor_name}, wt: {weight:.2f} km): Candidate cost {new_dist:.2f} km does not improve current {old_dist:.2f} km. Kept."
                })

    exec_time_ms = round((time.perf_counter() - start_time) * 1000, 3)

    # Reconstruct path if target is provided
    path: List[Dict[str, Any]] = []
    path_node_ids: List[str] = []
    if target_id:
        if distances[target_id] < float("inf"):
            curr = target_id
            while curr is not None:
                path_node_ids.append(curr)
                curr = predecessors[curr]
            path_node_ids.reverse()
            path = [node_map[nid] for nid in path_node_ids]
        else:
            path_node_ids = []
            path = []

    tentative_summary = {
        nid: {
            "node_name": node_map[nid].get("name", nid),
            "shortest_distance": round(distances[nid], 2) if distances[nid] < float("inf") else None,
            "predecessor": predecessors[nid],
            "visited": nid in visited
        }
        for nid in node_map
    }

    return {
        "success": True,
        "algorithm": "Dijkstra's Algorithm",
        "source": node_map[source_id],
        "target": node_map[target_id] if target_id else None,
        "path": path,
        "path_node_ids": path_node_ids,
        "total_distance": round(distances[target_id], 2) if target_id and distances[target_id] < float("inf") else 0.0,
        "all_distances": {nid: (round(d, 2) if d < float("inf") else None) for nid, d in distances.items()},
        "tentative_summary": tentative_summary,
        "decision_log": decision_log,
        "execution_time_ms": exec_time_ms
    }

def compute_all_pairs_dijkstra(nodes: List[Dict[str, Any]], edges: Optional[List[Dict[str, Any]]] = None) -> Tuple[Dict[str, Dict[str, float]], Dict[str, Dict[str, List[str]]]]:
    """
    Computes all-pairs shortest path matrix and paths using repeated Dijkstra.
    If graph is disconnected, falls back to direct euclidean distance for missing paths.
    """
    dist_matrix: Dict[str, Dict[str, float]] = {}
    path_matrix: Dict[str, Dict[str, List[str]]] = {}
    node_map = {str(n["id"]): n for n in nodes}

    for n in nodes:
        u = str(n["id"])
        dist_matrix[u] = {}
        path_matrix[u] = {}
        res = run_dijkstra(nodes, source_id=u, edges=edges)
        for target in nodes:
            v = str(target["id"])
            if u == v:
                dist_matrix[u][v] = 0.0
                path_matrix[u][v] = [u]
            else:
                d = res["all_distances"].get(v)
                if d is not None:
                    dist_matrix[u][v] = d
                    # reconstruct path
                    curr = v
                    p = []
                    while curr is not None:
                        p.append(curr)
                        curr = res["tentative_summary"][curr]["predecessor"]
                    p.reverse()
                    path_matrix[u][v] = p
                else:
                    # Fallback to direct euclidean distance if disconnected
                    d_euc = euclidean_distance(node_map[u], node_map[v])
                    dist_matrix[u][v] = d_euc
                    path_matrix[u][v] = [u, v]

    return dist_matrix, path_matrix
