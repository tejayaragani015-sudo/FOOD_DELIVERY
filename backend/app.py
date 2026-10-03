import os
import sys
import uuid

# Ensure backend directory is in python search path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

from storage import storage
from algorithms.dijkstra import run_dijkstra
from algorithms.nearest_neighbor import solve_nearest_neighbor
from algorithms.two_opt import solve_two_opt
from algorithms.comparator import compare_routes

FRONTEND_DIST = os.path.abspath(os.path.join(CURRENT_DIR, "..", "frontend", "dist"))

app = Flask(__name__, static_folder=FRONTEND_DIST if os.path.exists(FRONTEND_DIST) else None)
# Enable CORS for development frontend
CORS(app, resources={r"/api/*": {"origins": "*"}})

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    if FRONTEND_DIST and os.path.exists(os.path.join(FRONTEND_DIST, path)) and path != "":
        return send_from_directory(FRONTEND_DIST, path)
    if FRONTEND_DIST and os.path.exists(os.path.join(FRONTEND_DIST, "index.html")):
        return send_from_directory(FRONTEND_DIST, "index.html")
    return jsonify({
        "message": "Food Delivery Route Planner API is running.",
        "api_docs": "/api/health",
        "frontend": "Run 'npm run dev' inside frontend or 'npm run build' to bundle."
    })

@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "healthy",
        "service": "Food Delivery Route Planner API",
        "version": "1.0.0",
        "storage": storage.get_status()
    })

@app.route("/api/status", methods=["GET"])
def get_system_status():
    return jsonify({
        "storage": storage.get_status(),
        "node_count": len(storage.get_nodes()),
        "edge_count": len(storage.get_edges())
    })

# --- PRESET & GRAPH CONFIGURATION ---

@app.route("/api/presets", methods=["GET"])
def list_presets():
    return jsonify(storage.get_presets())

@app.route("/api/presets/<preset_id>/load", methods=["POST"])
def load_preset(preset_id):
    result = storage.reset_preset(preset_id)
    return jsonify({
        "success": True,
        "message": f"Loaded preset '{preset_id}' successfully.",
        "data": result
    })

# --- NODES & EDGES CRUD ---

@app.route("/api/nodes", methods=["GET"])
def get_all_nodes():
    return jsonify({
        "success": True,
        "nodes": storage.get_nodes(),
        "edges": storage.get_edges()
    })

@app.route("/api/nodes", methods=["POST"])
def add_node():
    data = request.get_json() or {}
    if "name" not in data:
        return jsonify({"error": "Node name is required"}), 400

    node_id = str(data.get("id") or f"node_{uuid.uuid4().hex[:6]}")
    node = {
        "id": node_id,
        "name": data.get("name", f"Order #{node_id}"),
        "type": data.get("type", "order"),
        "x": float(data.get("x", 300)),
        "y": float(data.get("y", 300)),
        "priority": data.get("priority", "Normal"),
        "prep_cost": float(data.get("prep_cost", 3.0)),
        "prep_time_mins": float(data.get("prep_time_mins", 10.0))
    }
    saved = storage.save_node(node)
    return jsonify({"success": True, "node": saved}), 201

@app.route("/api/nodes/<node_id>", methods=["PUT"])
def update_node(node_id):
    data = request.get_json() or {}
    updated = storage.update_node(node_id, data)
    if updated is None:
        return jsonify({"error": f"Node with ID '{node_id}' not found"}), 404
    return jsonify({"success": True, "node": updated})

@app.route("/api/nodes/<node_id>", methods=["DELETE"])
def delete_node(node_id):
    deleted = storage.delete_node(node_id)
    if not deleted:
        return jsonify({"error": f"Node with ID '{node_id}' not found"}), 404
    return jsonify({"success": True, "message": f"Deleted node '{node_id}'"})

@app.route("/api/edges", methods=["GET"])
def get_edges():
    return jsonify({"success": True, "edges": storage.get_edges()})

@app.route("/api/edges", methods=["POST"])
def save_edges():
    data = request.get_json() or {}
    edges = data.get("edges", [])
    saved = storage.set_edges(edges)
    return jsonify({"success": True, "edges": saved})

# --- ALGORITHM RUNNERS ---

@app.route("/api/solve/dijkstra", methods=["POST"])
def solve_dijkstra_endpoint():
    data = request.get_json() or {}
    nodes = storage.get_nodes()
    edges = storage.get_edges()
    
    source_id = data.get("source_id")
    target_id = data.get("target_id")

    if not source_id:
        # Default to first hub or first node
        hubs = [n for n in nodes if n.get("type") in ("hub", "restaurant")]
        source_id = str(hubs[0]["id"]) if hubs else str(nodes[0]["id"])

    res = run_dijkstra(
        nodes=nodes,
        source_id=source_id,
        target_id=target_id,
        edges=edges
    )
    if not res.get("success"):
        return jsonify(res), 400

    storage.save_run({"algorithm": "dijkstra", "source": source_id, "target": target_id, "result": res})
    return jsonify(res)

@app.route("/api/solve/nearest-neighbor", methods=["POST"])
def solve_nearest_neighbor_endpoint():
    data = request.get_json() or {}
    nodes = storage.get_nodes()
    edges = storage.get_edges()
    hub_id = data.get("hub_id")
    consider_priority = data.get("consider_priority", False)

    res = solve_nearest_neighbor(
        nodes=nodes,
        hub_id=hub_id,
        edges=edges,
        consider_priority=consider_priority
    )
    if not res.get("success"):
        return jsonify(res), 400

    storage.save_run({"algorithm": "nearest_neighbor", "result": res})
    return jsonify(res)

@app.route("/api/solve/two-opt", methods=["POST"])
def solve_two_opt_endpoint():
    data = request.get_json() or {}
    nodes = storage.get_nodes()
    edges = storage.get_edges()
    hub_id = data.get("hub_id")
    initial_tour = data.get("initial_tour")

    res = solve_two_opt(
        nodes=nodes,
        hub_id=hub_id,
        edges=edges,
        initial_tour=initial_tour
    )
    if not res.get("success"):
        return jsonify(res), 400

    storage.save_run({"algorithm": "two_opt", "result": res})
    return jsonify(res)

@app.route("/api/solve/compare", methods=["POST"])
def solve_compare_endpoint():
    data = request.get_json() or {}
    nodes = storage.get_nodes()
    edges = storage.get_edges()
    hub_id = data.get("hub_id")
    consider_priority = data.get("consider_priority", False)

    res = compare_routes(
        nodes=nodes,
        hub_id=hub_id,
        edges=edges,
        consider_priority=consider_priority
    )
    if not res.get("success"):
        return jsonify(res), 400

    storage.save_run({"algorithm": "comparison", "summary": res.get("summary")})
    return jsonify(res)

@app.route("/api/history", methods=["GET"])
def get_run_history():
    runs = storage.get_runs(limit=10)
    return jsonify({"success": True, "history": runs})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"🚀 Food Delivery Route Planner Backend running at http://localhost:{port}")
    app.run(host="0.0.0.0", port=port, debug=False)
