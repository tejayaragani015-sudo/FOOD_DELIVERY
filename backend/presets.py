"""
Realistic predefined delivery scenarios and map presets.
Includes benchmark scenarios where 2-Opt visibly uncrosses greedy heuristic routes.
"""

PRESETS = {
    "crossed_loops": {
        "id": "crossed_loops",
        "name": "Crossed Loops Benchmark (2-Opt Showcase)",
        "description": "A classic spatial layout where the greedy nearest neighbor heuristic forms crossed paths, showcasing 2-Opt's 24% route distance reduction.",
        "nodes": [
            {"id": "hub", "name": "Central Cloud Kitchen (Hub)", "type": "hub", "x": 400, "y": 300, "priority": "Normal", "prep_cost": 0.0, "prep_time_mins": 0.0},
            {"id": "c1", "name": "Order #1 - Oceanview Terrace", "type": "order", "x": 621, "y": 370, "priority": "Normal", "prep_cost": 3.5, "prep_time_mins": 14.0},
            {"id": "c2", "name": "Order #2 - Tech Hub Office", "type": "order", "x": 440, "y": 405, "priority": "High", "prep_cost": 5.0, "prep_time_mins": 10.0},
            {"id": "c3", "name": "Order #3 - Eastside Lofts", "type": "order", "x": 517, "y": 412, "priority": "Urgent", "prep_cost": 6.5, "prep_time_mins": 8.0},
            {"id": "c4", "name": "Order #4 - Parkside Condos", "type": "order", "x": 521, "y": 400, "priority": "Normal", "prep_cost": 4.0, "prep_time_mins": 16.0},
            {"id": "c5", "name": "Order #5 - Westgate Plaza", "type": "order", "x": 236, "y": 278, "priority": "High", "prep_cost": 5.5, "prep_time_mins": 12.0},
            {"id": "c6", "name": "Order #6 - Financial Tower", "type": "order", "x": 480, "y": 334, "priority": "Urgent", "prep_cost": 7.0, "prep_time_mins": 7.0},
            {"id": "c7", "name": "Order #7 - South Market Square", "type": "order", "x": 296, "y": 444, "priority": "Normal", "prep_cost": 3.0, "prep_time_mins": 18.0}
        ],
        "edges": []
    },
    "downtown_rush": {
        "id": "downtown_rush",
        "name": "Downtown Peak Lunch Rush",
        "description": "High density urban orders with mixed urgency levels, tight turns, and varying preparation costs.",
        "nodes": [
            {"id": "hub", "name": "Main Kitchen Hub (Downtown)", "type": "hub", "x": 380, "y": 280, "priority": "Normal", "prep_cost": 0.0, "prep_time_mins": 0.0},
            {"id": "d1", "name": "Order #1 - Financial Plaza", "type": "order", "x": 310, "y": 180, "priority": "Urgent", "prep_cost": 7.0, "prep_time_mins": 5.0},
            {"id": "d2", "name": "Order #2 - Tech Campus Tower", "type": "order", "x": 480, "y": 160, "priority": "High", "prep_cost": 5.0, "prep_time_mins": 10.0},
            {"id": "d3", "name": "Order #3 - Waterfront Condos", "type": "order", "x": 560, "y": 290, "priority": "Normal", "prep_cost": 3.0, "prep_time_mins": 18.0},
            {"id": "d4", "name": "Order #4 - Metro Central Station", "type": "order", "x": 450, "y": 420, "priority": "Urgent", "prep_cost": 8.0, "prep_time_mins": 6.0},
            {"id": "d5", "name": "Order #5 - University Dorms", "type": "order", "x": 280, "y": 390, "priority": "Normal", "prep_cost": 2.5, "prep_time_mins": 15.0},
            {"id": "d6", "name": "Order #6 - Medical Center", "type": "order", "x": 190, "y": 250, "priority": "High", "prep_cost": 6.0, "prep_time_mins": 12.0},
            {"id": "d7", "name": "Order #7 - Arts District Lofts", "type": "order", "x": 230, "y": 140, "priority": "Normal", "prep_cost": 4.0, "prep_time_mins": 14.0}
        ],
        "edges": []
    },
    "suburban_sprawl": {
        "id": "suburban_sprawl",
        "name": "Suburban Multi-Cluster Deliveries",
        "description": "Distanced clusters testing long highway hops and returning loops.",
        "nodes": [
            {"id": "hub", "name": "Suburban Hub Kitchen", "type": "hub", "x": 350, "y": 300, "priority": "Normal", "prep_cost": 0.0, "prep_time_mins": 0.0},
            {"id": "s1", "name": "Order #1 - Pine Ridge Valley", "type": "order", "x": 120, "y": 100, "priority": "Normal", "prep_cost": 3.0, "prep_time_mins": 25.0},
            {"id": "s2", "name": "Order #2 - Meadowbrook Estates", "type": "order", "x": 180, "y": 140, "priority": "High", "prep_cost": 5.0, "prep_time_mins": 12.0},
            {"id": "s3", "name": "Order #3 - Sunnyvale Homes", "type": "order", "x": 620, "y": 120, "priority": "Normal", "prep_cost": 4.0, "prep_time_mins": 15.0},
            {"id": "s4", "name": "Order #4 - Oakridge Circle", "type": "order", "x": 680, "y": 200, "priority": "Urgent", "prep_cost": 7.0, "prep_time_mins": 9.0},
            {"id": "s5", "name": "Order #5 - Lakefront Villas", "type": "order", "x": 550, "y": 480, "priority": "Normal", "prep_cost": 4.5, "prep_time_mins": 20.0},
            {"id": "s6", "name": "Order #6 - Green Valley Heights", "type": "order", "x": 160, "y": 460, "priority": "High", "prep_cost": 6.0, "prep_time_mins": 10.0}
        ],
        "edges": []
    },
    "road_network": {
        "id": "road_network",
        "name": "Road Network Graph (With Custom Edge Weights)",
        "description": "A structured road graph with specified road segments and non-Euclidean traffic costs.",
        "nodes": [
            {"id": "hub", "name": "Central Depot (Hub)", "type": "hub", "x": 350, "y": 300, "priority": "Normal", "prep_cost": 0.0, "prep_time_mins": 0.0},
            {"id": "rn1", "name": "Order #1 - North Station", "type": "order", "x": 350, "y": 120, "priority": "High", "prep_cost": 5.0, "prep_time_mins": 10.0},
            {"id": "rn2", "name": "Order #2 - East Pier", "type": "order", "x": 600, "y": 300, "priority": "Normal", "prep_cost": 3.0, "prep_time_mins": 15.0},
            {"id": "rn3", "name": "Order #3 - South Market", "type": "order", "x": 350, "y": 480, "priority": "Urgent", "prep_cost": 7.0, "prep_time_mins": 8.0},
            {"id": "rn4", "name": "Order #4 - West Gate", "type": "order", "x": 120, "y": 300, "priority": "Normal", "prep_cost": 4.0, "prep_time_mins": 14.0},
            {"id": "rn5", "name": "Order #5 - Northeast Suburb", "type": "order", "x": 550, "y": 150, "priority": "Normal", "prep_cost": 3.5, "prep_time_mins": 16.0}
        ],
        "edges": [
            {"source": "hub", "target": "rn1", "weight": 18.0},
            {"source": "hub", "target": "rn2", "weight": 25.0},
            {"source": "hub", "target": "rn3", "weight": 18.0},
            {"source": "hub", "target": "rn4", "weight": 23.0},
            {"source": "rn1", "target": "rn5", "weight": 20.0},
            {"source": "rn2", "target": "rn5", "weight": 15.0},
            {"source": "rn2", "target": "rn3", "weight": 28.0},
            {"source": "rn3", "target": "rn4", "weight": 27.0},
            {"source": "rn4", "target": "rn1", "weight": 26.0}
        ]
    }
}
