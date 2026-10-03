"""
Food Delivery Route Optimization Algorithms Package
Contains implementations of:
- Dijkstra's Algorithm (Shortest paths, tentative costs, path reconstruction)
- Greedy Nearest Neighbor Heuristic (Sequential local routing with decision logs)
- TSP 2-Opt Optimization (Iterative tour uncrossing and global cost reduction)
- Route Comparator (Side-by-side benchmarking and metrics calculation)
"""

from .dijkstra import run_dijkstra, compute_all_pairs_dijkstra
from .nearest_neighbor import solve_nearest_neighbor
from .two_opt import solve_two_opt
from .comparator import compare_routes

__all__ = [
    "run_dijkstra",
    "compute_all_pairs_dijkstra",
    "solve_nearest_neighbor",
    "solve_two_opt",
    "compare_routes"
]
