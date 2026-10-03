import os
import copy
from typing import Dict, List, Any, Optional
from presets import PRESETS

class StorageInterface:
    def get_status(self) -> Dict[str, Any]:
        raise NotImplementedError

    def get_nodes(self) -> List[Dict[str, Any]]:
        raise NotImplementedError

    def save_node(self, node: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError

    def update_node(self, node_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        raise NotImplementedError

    def delete_node(self, node_id: str) -> bool:
        raise NotImplementedError

    def get_edges(self) -> List[Dict[str, Any]]:
        raise NotImplementedError

    def set_edges(self, edges: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        raise NotImplementedError

    def reset_preset(self, preset_id: str) -> Dict[str, Any]:
        raise NotImplementedError

    def get_presets(self) -> Dict[str, Any]:
        raise NotImplementedError

    def save_run(self, run_result: Dict[str, Any]) -> None:
        raise NotImplementedError

    def get_runs(self, limit: int = 10) -> List[Dict[str, Any]]:
        raise NotImplementedError


class InMemoryStorage(StorageInterface):
    """
    High-performance in-memory simulation repository.
    Used automatically when MongoDB server is not running locally.
    """
    def __init__(self):
        self.preset_id = "crossed_loops"
        preset = PRESETS.get(self.preset_id, list(PRESETS.values())[0])
        self.nodes: Dict[str, Dict[str, Any]] = {str(n["id"]): copy.deepcopy(n) for n in preset["nodes"]}
        self.edges: List[Dict[str, Any]] = copy.deepcopy(preset["edges"])
        self.runs: List[Dict[str, Any]] = []

    def get_status(self) -> Dict[str, Any]:
        return {
            "type": "in_memory",
            "connected": True,
            "is_fallback": True,
            "message": "Running on In-Memory Storage Simulation (MongoDB not detected locally). Fully functional!"
        }

    def get_nodes(self) -> List[Dict[str, Any]]:
        return list(self.nodes.values())

    def save_node(self, node: Dict[str, Any]) -> Dict[str, Any]:
        node_id = str(node.get("id"))
        self.nodes[node_id] = copy.deepcopy(node)
        return self.nodes[node_id]

    def update_node(self, node_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        node_id = str(node_id)
        if node_id in self.nodes:
            self.nodes[node_id].update(data)
            return copy.deepcopy(self.nodes[node_id])
        return None

    def delete_node(self, node_id: str) -> bool:
        node_id = str(node_id)
        if node_id in self.nodes:
            del self.nodes[node_id]
            # Also remove incident edges
            self.edges = [e for e in self.edges if str(e.get("source")) != node_id and str(e.get("target")) != node_id]
            return True
        return False

    def get_edges(self) -> List[Dict[str, Any]]:
        return list(self.edges)

    def set_edges(self, edges: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        self.edges = copy.deepcopy(edges)
        return list(self.edges)

    def reset_preset(self, preset_id: str) -> Dict[str, Any]:
        if preset_id not in PRESETS:
            preset_id = "crossed_loops"
        self.preset_id = preset_id
        preset = PRESETS[preset_id]
        self.nodes = {str(n["id"]): copy.deepcopy(n) for n in preset["nodes"]}
        self.edges = copy.deepcopy(preset["edges"])
        return {
            "preset_id": preset_id,
            "nodes": list(self.nodes.values()),
            "edges": list(self.edges)
        }

    def get_presets(self) -> Dict[str, Any]:
        return PRESETS

    def save_run(self, run_result: Dict[str, Any]) -> None:
        self.runs.append(copy.deepcopy(run_result))
        if len(self.runs) > 50:
            self.runs.pop(0)

    def get_runs(self, limit: int = 10) -> List[Dict[str, Any]]:
        return self.runs[-limit:][::-1]


class MongoStorage(StorageInterface):
    """
    MongoDB persistence repository. Used when MongoDB is reachable.
    """
    def __init__(self, client, db_name="food_delivery_db"):
        self.client = client
        self.db = self.client[db_name]
        self.nodes_col = self.db["nodes"]
        self.edges_col = self.db["edges"]
        self.runs_col = self.db["runs"]
        self.metadata_col = self.db["metadata"]

        # Ensure initialized
        if self.nodes_col.count_documents({}) == 0:
            self.reset_preset("crossed_loops")

    def get_status(self) -> Dict[str, Any]:
        return {
            "type": "mongodb",
            "connected": True,
            "is_fallback": False,
            "message": "Connected to MongoDB instance."
        }

    def get_nodes(self) -> List[Dict[str, Any]]:
        docs = list(self.nodes_col.find({}, {"_id": 0}))
        return docs

    def save_node(self, node: Dict[str, Any]) -> Dict[str, Any]:
        node_id = str(node.get("id"))
        self.nodes_col.update_one({"id": node_id}, {"$set": node}, upsert=True)
        doc = self.nodes_col.find_one({"id": node_id}, {"_id": 0})
        return doc

    def update_node(self, node_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        node_id = str(node_id)
        res = self.nodes_col.update_one({"id": node_id}, {"$set": data})
        if res.matched_count > 0:
            return self.nodes_col.find_one({"id": node_id}, {"_id": 0})
        return None

    def delete_node(self, node_id: str) -> bool:
        node_id = str(node_id)
        res = self.nodes_col.delete_one({"id": node_id})
        if res.deleted_count > 0:
            self.edges_col.delete_many({"$or": [{"source": node_id}, {"target": node_id}]})
            return True
        return False

    def get_edges(self) -> List[Dict[str, Any]]:
        return list(self.edges_col.find({}, {"_id": 0}))

    def set_edges(self, edges: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        self.edges_col.delete_many({})
        if edges:
            self.edges_col.insert_many([copy.deepcopy(e) for e in edges])
        return list(self.edges_col.find({}, {"_id": 0}))

    def reset_preset(self, preset_id: str) -> Dict[str, Any]:
        if preset_id not in PRESETS:
            preset_id = "crossed_loops"
        preset = PRESETS[preset_id]
        
        self.nodes_col.delete_many({})
        self.edges_col.delete_many({})
        if preset["nodes"]:
            self.nodes_col.insert_many([copy.deepcopy(n) for n in preset["nodes"]])
        if preset["edges"]:
            self.edges_col.insert_many([copy.deepcopy(e) for e in preset["edges"]])

        self.metadata_col.update_one({"key": "active_preset"}, {"$set": {"preset_id": preset_id}}, upsert=True)
        return {
            "preset_id": preset_id,
            "nodes": list(self.nodes_col.find({}, {"_id": 0})),
            "edges": list(self.edges_col.find({}, {"_id": 0}))
        }

    def get_presets(self) -> Dict[str, Any]:
        return PRESETS

    def save_run(self, run_result: Dict[str, Any]) -> None:
        self.runs_col.insert_one(copy.deepcopy(run_result))

    def get_runs(self, limit: int = 10) -> List[Dict[str, Any]]:
        return list(self.runs_col.find({}, {"_id": 0}).sort("_id", -1).limit(limit))


def initialize_storage() -> StorageInterface:
    mongo_uri = os.environ.get("MONGODB_URI", "mongodb://localhost:27017/")
    try:
        import pymongo
        client = pymongo.MongoClient(mongo_uri, serverSelectionTimeoutMS=500)
        client.server_info()  # Will throw ServerSelectionTimeoutError if not running
        print(f"[Storage] Successfully connected to MongoDB at {mongo_uri}")
        return MongoStorage(client)
    except Exception as e:
        print(f"[Storage] MongoDB connection notice ({type(e).__name__}). Initializing In-Memory Storage Simulation fallback.")
        return InMemoryStorage()

storage = initialize_storage()
