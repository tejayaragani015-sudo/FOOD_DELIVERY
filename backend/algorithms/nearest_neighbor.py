import time
import math
from typing import Dict, List, Any, Optional
from .dijkstra import compute_all_pairs_dijkstra, euclidean_distance

PRIORITY_FACTORS = {
    "Normal": 1.0,
    "High": 1.3,
    "Urgent": 1.8
}

AVERAGE_SPEED_KMH = 30.0  # 30 km/h delivery bike speed
FUEL_COST_PER_KM = 1.50   # $1.50 per km travel cost

def solve_nearest_neighbor(
    nodes: List[Dict[str, Any]],
    hub_id: Optional[str] = None,
    edges: Optional[List[Dict[str, Any]]] = None,
    consider_priority: bool = False
) -> Dict[str, Any]:
    """
    Solves the multi-order delivery route using the Greedy Nearest Neighbor Heuristic.
    Starts at the restaurant/hub, iteratively selects the nearest unvisited delivery location,
    and returns to the hub once all deliveries are complete.
    Provides detailed step-by-step decision logs detailing candidate evaluation.
    """
    start_time = time.perf_counter()

    if not nodes:
        return {"error": "No delivery locations provided", "success": False}

    node_map = {str(n["id"]): n for n in nodes}

    # Determine hub
    if hub_id and str(hub_id) in node_map:
        current_hub_id = str(hub_id)
    else:
        # Look for node with type == 'hub' or 'restaurant', default to first node
        hub_candidates = [n for n in nodes if n.get("type") in ("hub", "restaurant")]
        if hub_candidates:
            current_hub_id = str(hub_candidates[0]["id"])
        else:
            current_hub_id = str(nodes[0]["id"])

    # Compute pairwise distance matrix (via Dijkstra on graph, or Euclidean)
    dist_matrix, path_matrix = compute_all_pairs_dijkstra(nodes, edges)

    # Customers to visit
    unvisited = [str(n["id"]) for n in nodes if str(n["id"]) != current_hub_id]
    
    current_node = current_hub_id
    tour = [current_hub_id]
    total_distance = 0.0
    total_prep_cost = sum(float(n.get("prep_cost", 0.0)) for n in nodes if str(n["id"]) != current_hub_id)
    
    decision_log: List[Dict[str, Any]] = []
    legs: List[Dict[str, Any]] = []
    step_num = 1

    decision_log.append({
        "step": step_num,
        "type": "TOUR_START",
        "node_id": current_hub_id,
        "node_name": node_map[current_hub_id].get("name", current_hub_id),
        "description": f"Starting delivery run from Central Hub [{node_map[current_hub_id].get('name', current_hub_id)}]. {len(unvisited)} order destinations queued.",
        "accumulated_distance": 0.0
    })

    while unvisited:
        step_num += 1
        curr_name = node_map[current_node].get("name", current_node)

        # Evaluate candidate options
        candidate_evaluations = []
        best_candidate = None
        best_score = float("inf")
        best_dist = float("inf")

        for candidate_id in unvisited:
            cand_node = node_map[candidate_id]
            raw_dist = dist_matrix[current_node][candidate_id]
            priority = cand_node.get("priority", "Normal")
            prep_cost = float(cand_node.get("prep_cost", 0.0))

            if consider_priority:
                # Priority factor scales down effective distance score to prioritize Urgent orders
                factor = PRIORITY_FACTORS.get(priority, 1.0)
                score = raw_dist / factor
            else:
                score = raw_dist

            candidate_evaluations.append({
                "candidate_id": candidate_id,
                "name": cand_node.get("name", candidate_id),
                "distance": round(raw_dist, 2),
                "priority": priority,
                "prep_cost": prep_cost,
                "score": round(score, 2)
            })

            if score < best_score:
                best_score = score
                best_dist = raw_dist
                best_candidate = candidate_id

        # Sort candidate evaluations by score for log visibility
        candidate_evaluations.sort(key=lambda x: x["score"])

        selected_node = node_map[best_candidate]
        selected_name = selected_node.get("name", best_candidate)
        selected_priority = selected_node.get("priority", "Normal")

        total_distance += best_dist
        tour.append(best_candidate)
        unvisited.remove(best_candidate)

        reason = (
            f"Selected [{selected_name}] (Dist: {best_dist:.2f} km, Priority: {selected_priority}) "
            f"from {len(candidate_evaluations)} unvisited candidate(s). "
            f"It had the minimum {'priority-weighted ' if consider_priority else ''}travel cost."
        )

        decision_log.append({
            "step": step_num,
            "type": "GREEDY_CHOICE",
            "from_node": current_node,
            "from_name": curr_name,
            "to_node": best_candidate,
            "to_name": selected_name,
            "distance": round(best_dist, 2),
            "accumulated_distance": round(total_distance, 2),
            "candidates_considered": candidate_evaluations,
            "description": reason
        })

        legs.append({
            "from_id": current_node,
            "to_id": best_candidate,
            "from_name": curr_name,
            "to_name": selected_name,
            "distance": round(best_dist, 2),
            "detailed_path": path_matrix.get(current_node, {}).get(best_candidate, [current_node, best_candidate])
        })

        current_node = best_candidate

    # Return to hub
    step_num += 1
    return_dist = dist_matrix[current_node][current_hub_id]
    total_distance += return_dist
    tour.append(current_hub_id)

    last_name = node_map[current_node].get("name", current_node)
    hub_name = node_map[current_hub_id].get("name", current_hub_id)

    decision_log.append({
        "step": step_num,
        "type": "RETURN_TO_HUB",
        "from_node": current_node,
        "from_name": last_name,
        "to_node": current_hub_id,
        "to_name": hub_name,
        "distance": round(return_dist, 2),
        "accumulated_distance": round(total_distance, 2),
        "description": f"All customer deliveries completed. Returned from [{last_name}] to Hub [{hub_name}] (+{return_dist:.2f} km). Tour cycle closed."
    })

    legs.append({
        "from_id": current_node,
        "to_id": current_hub_id,
        "from_name": last_name,
        "to_name": hub_name,
        "distance": round(return_dist, 2),
        "detailed_path": path_matrix.get(current_node, {}).get(current_hub_id, [current_node, current_hub_id])
    })

    exec_time_ms = round((time.perf_counter() - start_time) * 1000, 3)
    
    # Calculate delivery metrics
    travel_time_hours = total_distance / AVERAGE_SPEED_KMH
    travel_time_mins = round(travel_time_hours * 60, 1)
    total_prep_time_mins = sum(float(n.get("prep_time_mins", 10.0)) for n in nodes if str(n["id"]) != current_hub_id)
    estimated_total_time_mins = round(travel_time_mins + (total_prep_time_mins * 0.35), 1)  # prep pipelined
    fuel_cost = round(total_distance * FUEL_COST_PER_KM, 2)
    total_cost = round(fuel_cost + total_prep_cost, 2)

    return {
        "success": True,
        "algorithm": "Greedy Nearest Neighbor",
        "hub_id": current_hub_id,
        "tour": tour,
        "tour_nodes": [node_map[nid] for nid in tour],
        "legs": legs,
        "metrics": {
            "total_distance_km": round(total_distance, 2),
            "travel_time_mins": travel_time_mins,
            "estimated_total_time_mins": estimated_total_time_mins,
            "fuel_cost": fuel_cost,
            "prep_cost": round(total_prep_cost, 2),
            "total_cost": total_cost,
            "stop_count": len(tour) - 1,
            "execution_time_ms": exec_time_ms
        },
        "decision_log": decision_log
    }
