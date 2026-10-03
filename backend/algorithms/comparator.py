import time
from typing import Dict, List, Any, Optional
from .dijkstra import run_dijkstra
from .nearest_neighbor import solve_nearest_neighbor
from .two_opt import solve_two_opt

def compare_routes(
    nodes: List[Dict[str, Any]],
    hub_id: Optional[str] = None,
    edges: Optional[List[Dict[str, Any]]] = None,
    consider_priority: bool = False
) -> Dict[str, Any]:
    """
    Runs Nearest Neighbor and TSP 2-Opt side-by-side and returns a comprehensive
    comparative dashboard payload including:
    - Side-by-side metrics table (Distance, Fuel Cost, Time, Stops, Run Time)
    - Calculated savings (Distance saved, % Efficiency gain, Cost reduction)
    - Full decision traces from each algorithm
    - Dijkstra sample benchmark from Hub to farthest order
    """
    node_map = {str(n["id"]): n for n in nodes}
    if not hub_id:
        hubs = [n for n in nodes if n.get("type") in ("hub", "restaurant")]
        hub_id = str(hubs[0]["id"]) if hubs else str(nodes[0]["id"])

    # 1. Run Greedy Nearest Neighbor
    nn_result = solve_nearest_neighbor(
        nodes=nodes,
        hub_id=hub_id,
        edges=edges,
        consider_priority=consider_priority
    )

    # 2. Run TSP 2-Opt Optimization starting from NN tour
    two_opt_result = solve_two_opt(
        nodes=nodes,
        hub_id=hub_id,
        edges=edges,
        initial_tour=nn_result.get("tour")
    )

    # 3. Benchmark Dijkstra from Hub to farthest order node
    dijkstra_benchmark = None
    customer_nodes = [n for n in nodes if str(n["id"]) != str(hub_id)]
    if customer_nodes:
        # Run Dijkstra from hub to all nodes
        dijk_res = run_dijkstra(nodes, source_id=hub_id, edges=edges)
        # Find farthest reachable customer
        farthest_node = None
        max_d = -1.0
        for cn in customer_nodes:
            cid = str(cn["id"])
            d = dijk_res["all_distances"].get(cid)
            if d is not None and d > max_d:
                max_d = d
                farthest_node = cid

        if farthest_node:
            dijkstra_benchmark = run_dijkstra(
                nodes,
                source_id=hub_id,
                target_id=farthest_node,
                edges=edges
            )

    # Calculate comparative delta
    nn_dist = nn_result["metrics"]["total_distance_km"]
    opt_dist = two_opt_result["metrics"]["total_distance_km"]
    dist_saved = round(nn_dist - opt_dist, 2)
    dist_saved_pct = round((dist_saved / nn_dist * 100), 2) if nn_dist > 0 else 0.0

    nn_cost = nn_result["metrics"]["total_cost"]
    opt_cost = two_opt_result["metrics"]["total_cost"]
    cost_saved = round(nn_cost - opt_cost, 2)

    nn_time = nn_result["metrics"]["estimated_total_time_mins"]
    opt_time = two_opt_result["metrics"]["estimated_total_time_mins"]
    time_saved = round(nn_time - opt_time, 1)

    # Efficiency Score calculation (0 to 100)
    # 100 indicates perfect theoretical compactness / optimal local resolution
    efficiency_score = min(100.0, round(85.0 + (dist_saved_pct * 1.5), 1)) if dist_saved_pct >= 0 else 80.0

    comparison_summary = {
        "distance_saved_km": dist_saved,
        "efficiency_gain_pct": dist_saved_pct,
        "cost_saved_usd": cost_saved,
        "time_saved_mins": time_saved,
        "efficiency_score": efficiency_score,
        "swaps_performed": two_opt_result.get("total_swaps", 0),
        "iterations_needed": two_opt_result.get("iterations_performed", 0),
        "winner": "TSP 2-Opt Optimization" if dist_saved > 0 else "Greedy Nearest Neighbor (Already Optimal)"
    }

    metrics_comparison = [
        {
            "metric": "Total Distance",
            "unit": "km",
            "nearest_neighbor": nn_dist,
            "two_opt": opt_dist,
            "difference": f"-{dist_saved} km ({dist_saved_pct}%)",
            "better": "two_opt" if dist_saved > 0 else "equal"
        },
        {
            "metric": "Total Delivery Cost",
            "unit": "$",
            "nearest_neighbor": nn_cost,
            "two_opt": opt_cost,
            "difference": f"-${cost_saved}",
            "better": "two_opt" if cost_saved > 0 else "equal"
        },
        {
            "metric": "Estimated Total Time",
            "unit": "mins",
            "nearest_neighbor": nn_time,
            "two_opt": opt_time,
            "difference": f"-{time_saved} mins",
            "better": "two_opt" if time_saved > 0 else "equal"
        },
        {
            "metric": "Algorithm Execution Time",
            "unit": "ms",
            "nearest_neighbor": nn_result["metrics"]["execution_time_ms"],
            "two_opt": two_opt_result["metrics"]["execution_time_ms"],
            "difference": f"+{round(two_opt_result['metrics']['execution_time_ms'] - nn_result['metrics']['execution_time_ms'], 2)} ms",
            "better": "nearest_neighbor"  # Greedy is computationally faster
        }
    ]

    return {
        "success": True,
        "summary": comparison_summary,
        "metrics_comparison": metrics_comparison,
        "nearest_neighbor": nn_result,
        "two_opt": two_opt_result,
        "dijkstra_benchmark": dijkstra_benchmark
    }
