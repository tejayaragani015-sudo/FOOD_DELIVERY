import time
from typing import Dict, List, Any, Optional
from .dijkstra import compute_all_pairs_dijkstra
from .nearest_neighbor import solve_nearest_neighbor, AVERAGE_SPEED_KMH, FUEL_COST_PER_KM

def calculate_tour_distance(tour: List[str], dist_matrix: Dict[str, Dict[str, float]]) -> float:
    dist = 0.0
    for i in range(len(tour) - 1):
        u, v = tour[i], tour[i + 1]
        dist += dist_matrix[u][v]
    return round(dist, 2)

def solve_two_opt(
    nodes: List[Dict[str, Any]],
    hub_id: Optional[str] = None,
    edges: Optional[List[Dict[str, Any]]] = None,
    initial_tour: Optional[List[str]] = None,
    max_iterations: int = 500
) -> Dict[str, Any]:
    """
    Optimizes a round-trip delivery tour using the 2-Opt edge exchange heuristic.
    Starts with an initial tour (by default, Greedy Nearest Neighbor), and iteratively
    reverses sub-routes whenever a 2-edge swap decreases the overall cycle cost.
    Guarantees the tour begins and terminates at the central Hub without node repetitions.
    Logs every swap decision, distance delta, and uncrossing event.
    """
    start_time = time.perf_counter()

    if not nodes:
        return {"error": "No delivery locations provided", "success": False}

    node_map = {str(n["id"]): n for n in nodes}
    dist_matrix, path_matrix = compute_all_pairs_dijkstra(nodes, edges)

    # Determine hub
    if hub_id and str(hub_id) in node_map:
        current_hub_id = str(hub_id)
    else:
        hub_candidates = [n for n in nodes if n.get("type") in ("hub", "restaurant")]
        current_hub_id = str(hub_candidates[0]["id"]) if hub_candidates else str(nodes[0]["id"])

    # If no initial tour passed, generate one using Nearest Neighbor
    nn_result = None
    if not initial_tour:
        nn_result = solve_nearest_neighbor(nodes, hub_id=current_hub_id, edges=edges)
        current_tour = list(nn_result["tour"])
    else:
        current_tour = list(initial_tour)
        # Ensure it starts and ends with current_hub_id
        if current_tour[0] != current_hub_id:
            if current_hub_id in current_tour:
                idx = current_tour.index(current_hub_id)
                current_tour = current_tour[idx:] + current_tour[:idx]
            else:
                current_tour.insert(0, current_hub_id)
        if current_tour[-1] != current_hub_id:
            current_tour.append(current_hub_id)

    initial_distance = calculate_tour_distance(current_tour, dist_matrix)
    total_prep_cost = sum(float(n.get("prep_cost", 0.0)) for n in nodes if str(n["id"]) != current_hub_id)

    decision_log: List[Dict[str, Any]] = []
    step_num = 1

    decision_log.append({
        "step": step_num,
        "type": "INITIAL_TOUR",
        "description": f"Initialized 2-Opt solver with initial tour distance of {initial_distance:.2f} km. Tour length: {len(current_tour)} stops.",
        "current_distance": initial_distance,
        "tour": list(current_tour)
    })

    improved = True
    iteration = 0
    swaps_count = 0
    n = len(current_tour)

    # Note: current_tour is [Hub, c1, c2, ..., cn, Hub] with length n
    # indices: 0 to n-1. current_tour[0] is Hub, current_tour[n-1] is Hub
    while improved and iteration < max_iterations:
        improved = False
        iteration += 1

        for i in range(0, n - 2):
            for j in range(i + 2, n - 1):
                # Avoid swapping the wrap-around closing edge with first edge
                if i == 0 and j == n - 2:
                    continue

                node_i = current_tour[i]
                node_i_next = current_tour[i + 1]
                node_j = current_tour[j]
                node_j_next = current_tour[j + 1]

                old_cost = dist_matrix[node_i][node_i_next] + dist_matrix[node_j][node_j_next]
                new_cost = dist_matrix[node_i][node_j] + dist_matrix[node_i_next][node_j_next]
                delta = new_cost - old_cost

                # If improvement found beyond floating-point threshold
                if delta < -0.001:
                    # Reverse the subsegment between i+1 and j inclusive
                    reversed_segment = current_tour[i + 1:j + 1][::-1]
                    current_tour[i + 1:j + 1] = reversed_segment

                    swaps_count += 1
                    step_num += 1
                    new_tour_dist = calculate_tour_distance(current_tour, dist_matrix)

                    decision_log.append({
                        "step": step_num,
                        "type": "2OPT_SWAP",
                        "iteration": iteration,
                        "swap_number": swaps_count,
                        "edges_removed": [
                            f"({node_map[node_i]['name']} → {node_map[node_i_next]['name']})",
                            f"({node_map[node_j]['name']} → {node_map[node_j_next]['name']})"
                        ],
                        "edges_added": [
                            f"({node_map[node_i]['name']} → {node_map[node_j]['name']})",
                            f"({node_map[node_i_next]['name']} → {node_map[node_j_next]['name']})"
                        ],
                        "delta_km": round(delta, 2),
                        "saved_km": round(-delta, 2),
                        "new_distance": new_tour_dist,
                        "description": (
                            f"Swap #{swaps_count} (Iter {iteration}): Uncrossed routes between "
                            f"[{node_map[node_i]['name']}] & [{node_map[node_j]['name']}]. "
                            f"Replaced cross-edges, reducing distance by {-delta:.2f} km. "
                            f"Updated tour distance: {new_tour_dist:.2f} km."
                        )
                    })

                    improved = True
                    break  # Apply first improving move and restart scan
            if improved:
                break

    final_distance = calculate_tour_distance(current_tour, dist_matrix)
    total_saved_km = round(initial_distance - final_distance, 2)
    efficiency_gain_pct = round((total_saved_km / initial_distance * 100), 2) if initial_distance > 0 else 0.0

    step_num += 1
    decision_log.append({
        "step": step_num,
        "type": "OPTIMIZATION_COMPLETE",
        "total_swaps": swaps_count,
        "iterations": iteration,
        "initial_distance": initial_distance,
        "final_distance": final_distance,
        "total_saved_km": total_saved_km,
        "efficiency_gain_pct": efficiency_gain_pct,
        "description": (
            f"2-Opt Optimization complete after {iteration} scan passes and {swaps_count} 2-edge swaps. "
            f"Achieved {efficiency_gain_pct}% distance reduction ({initial_distance:.2f} km → {final_distance:.2f} km). "
            f"No further intersecting or sub-optimal edge exchanges exist."
        )
    })

    # Construct legs
    legs: List[Dict[str, Any]] = []
    for i in range(len(current_tour) - 1):
        u, v = current_tour[i], current_tour[i + 1]
        legs.append({
            "from_id": u,
            "to_id": v,
            "from_name": node_map[u].get("name", u),
            "to_name": node_map[v].get("name", v),
            "distance": round(dist_matrix[u][v], 2),
            "detailed_path": path_matrix.get(u, {}).get(v, [u, v])
        })

    exec_time_ms = round((time.perf_counter() - start_time) * 1000, 3)

    travel_time_hours = final_distance / AVERAGE_SPEED_KMH
    travel_time_mins = round(travel_time_hours * 60, 1)
    total_prep_time_mins = sum(float(n.get("prep_time_mins", 10.0)) for n in nodes if str(n["id"]) != current_hub_id)
    estimated_total_time_mins = round(travel_time_mins + (total_prep_time_mins * 0.35), 1)
    fuel_cost = round(final_distance * FUEL_COST_PER_KM, 2)
    total_cost = round(fuel_cost + total_prep_cost, 2)

    return {
        "success": True,
        "algorithm": "TSP 2-Opt Optimization",
        "hub_id": current_hub_id,
        "tour": current_tour,
        "tour_nodes": [node_map[nid] for nid in current_tour],
        "legs": legs,
        "initial_distance_km": initial_distance,
        "total_swaps": swaps_count,
        "iterations_performed": iteration,
        "efficiency_gain_pct": efficiency_gain_pct,
        "distance_saved_km": total_saved_km,
        "metrics": {
            "total_distance_km": final_distance,
            "initial_distance_km": initial_distance,
            "travel_time_mins": travel_time_mins,
            "estimated_total_time_mins": estimated_total_time_mins,
            "fuel_cost": fuel_cost,
            "prep_cost": round(total_prep_cost, 2),
            "total_cost": total_cost,
            "stop_count": len(current_tour) - 1,
            "efficiency_gain_pct": efficiency_gain_pct,
            "distance_saved_km": total_saved_km,
            "execution_time_ms": exec_time_ms
        },
        "decision_log": decision_log
    }
