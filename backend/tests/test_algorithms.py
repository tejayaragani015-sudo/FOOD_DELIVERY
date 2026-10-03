import unittest
import sys
import os

# Add parent directory to sys.path so tests can import backend modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from algorithms.dijkstra import run_dijkstra, compute_all_pairs_dijkstra
from algorithms.nearest_neighbor import solve_nearest_neighbor
from algorithms.two_opt import solve_two_opt
from algorithms.comparator import compare_routes
from presets import PRESETS
from storage import InMemoryStorage

class TestDeliveryAlgorithms(unittest.TestCase):

    def setUp(self):
        # A simple triangle + hub graph
        self.nodes = [
            {"id": "hub", "name": "Hub", "type": "hub", "x": 0, "y": 0, "priority": "Normal", "prep_cost": 0.0, "prep_time_mins": 0.0},
            {"id": "n1", "name": "Node 1", "type": "order", "x": 30, "y": 0, "priority": "High", "prep_cost": 5.0, "prep_time_mins": 10.0},
            {"id": "n2", "name": "Node 2", "type": "order", "x": 30, "y": 40, "priority": "Normal", "prep_cost": 3.0, "prep_time_mins": 15.0},
            {"id": "n3", "name": "Node 3", "type": "order", "x": 0, "y": 40, "priority": "Urgent", "prep_cost": 7.0, "prep_time_mins": 8.0}
        ]

    def test_dijkstra_shortest_path(self):
        # Test Dijkstra from hub to n2
        res = run_dijkstra(self.nodes, source_id="hub", target_id="n2")
        self.assertTrue(res["success"])
        self.assertIn("path", res)
        self.assertIn("tentative_summary", res)
        self.assertIn("decision_log", res)
        # Direct Euclidean distance (0,0) to (30,40) is sqrt(900+1600)/10 = 50/10 = 5.0 km
        self.assertEqual(res["total_distance"], 5.0)
        self.assertGreater(len(res["decision_log"]), 0)

    def test_nearest_neighbor_tour(self):
        res = solve_nearest_neighbor(self.nodes, hub_id="hub")
        self.assertTrue(res["success"])
        tour = res["tour"]
        # Tour must start and end at hub
        self.assertEqual(tour[0], "hub")
        self.assertEqual(tour[-1], "hub")
        # Every customer must be visited exactly once
        customer_visits = tour[1:-1]
        self.assertEqual(sorted(customer_visits), ["n1", "n2", "n3"])
        self.assertIn("metrics", res)
        self.assertGreater(res["metrics"]["total_distance_km"], 0)
        self.assertGreater(len(res["decision_log"]), 0)

    def test_two_opt_improvement_and_validity(self):
        preset = PRESETS["crossed_loops"]
        nodes = preset["nodes"]
        nn_res = solve_nearest_neighbor(nodes, hub_id="hub")
        opt_res = solve_two_opt(nodes, hub_id="hub", initial_tour=nn_res["tour"])

        self.assertTrue(opt_res["success"])
        nn_dist = nn_res["metrics"]["total_distance_km"]
        opt_dist = opt_res["metrics"]["total_distance_km"]

        # 2-Opt distance must be <= Nearest Neighbor distance
        self.assertLessEqual(opt_dist, nn_dist)
        self.assertEqual(opt_res["tour"][0], "hub")
        self.assertEqual(opt_res["tour"][-1], "hub")

        # Check all customer nodes are visited exactly once
        all_customers = sorted([n["id"] for n in nodes if n["id"] != "hub"])
        tour_customers = sorted(opt_res["tour"][1:-1])
        self.assertEqual(tour_customers, all_customers)

    def test_comparator_engine(self):
        preset = PRESETS["crossed_loops"]
        nodes = preset["nodes"]
        res = compare_routes(nodes, hub_id="hub")
        self.assertTrue(res["success"])
        self.assertIn("summary", res)
        self.assertIn("metrics_comparison", res)
        self.assertIn("nearest_neighbor", res)
        self.assertIn("two_opt", res)

    def test_storage_fallback_crud(self):
        storage = InMemoryStorage()
        status = storage.get_status()
        self.assertTrue(status["is_fallback"])
        
        # Test adding a node
        new_node = {"id": "test_1", "name": "Test Order", "x": 100, "y": 100, "priority": "High", "prep_cost": 4.0}
        saved = storage.save_node(new_node)
        self.assertEqual(saved["name"], "Test Order")

        # Test updating node
        storage.update_node("test_1", {"priority": "Urgent"})
        nodes = storage.get_nodes()
        test_node = next(n for n in nodes if n["id"] == "test_1")
        self.assertEqual(test_node["priority"], "Urgent")

        # Test deleting node
        deleted = storage.delete_node("test_1")
        self.assertTrue(deleted)
        self.assertNotIn("test_1", [n["id"] for n in storage.get_nodes()])

if __name__ == "__main__":
    unittest.main()
