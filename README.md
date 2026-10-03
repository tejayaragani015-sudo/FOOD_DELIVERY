# 🚴 Food Delivery Route Planner
### Multi-Order Delivery Optimization Engine & Comparative Algorithm Visualizer

A full-stack web application designed to solve, simulate, and benchmark multi-order food delivery routes using fundamental graph and routing optimization algorithms: **Dijkstra's Algorithm**, **Greedy Nearest Neighbor (NN)**, and **Traveling Salesperson Problem (TSP) 2-Opt Optimization**.

---

## 🌟 Key Features

### 1. Interactive Map & Graph Canvas
- **Dynamic Delivery Nodes**: Add delivery locations with precise spatial coordinates, order priorities (**Normal**, **High**, **Urgent 🔥**), and preparation costs/times.
- **Central Kitchen / Hub**: Clearly distinguished starting and termination depot with glowing aura and status indicators.
- **Real-Time Drag & Drop**: Drag nodes across the canvas to reposition them and watch routes recalculate live.
- **Click-to-Drop Orders**: Click anywhere on the empty canvas grid to instantly create customer delivery orders.
- **Edge Distances & Road Networks**: Visualize road network weights, Euclidean metric distances, and custom traffic costs.
- **Predefined Benchmarks**: Instant presets including *Crossed Loops Benchmark (2-Opt Showcase with 24% distance reduction)*, *Downtown Peak Lunch Rush*, *Suburban Multi-Cluster*, and *Custom Road Network Grid*.

### 2. Multi-Algorithm Optimization Engine
- **Dijkstra's Algorithm**:
  - Computes exact least-cost shortest paths with non-negative edge costs using a min-heap priority queue ($O((V + E) \log V)$).
  - Maintains an interactive **Tentative Cost Table** displaying finalized vs. tentative distances and predecessor nodes.
  - Backtracks predecessor pointers to perform deterministic path reconstruction.
- **Greedy Nearest Neighbor Heuristic**:
  - Sequential local optimizer selecting the closest unvisited delivery order from the current stop.
  - Optionally incorporates **Order Urgency Weights** (Normal $\times 1.0$, High $\times 1.3$, Urgent $\times 1.8$) to deliver hot food faster.
  - Closes the Hamiltonian cycle by returning to the central hub once all customers are served.
- **TSP 2-Opt Optimization**:
  - Solves the Traveling Salesperson Problem by iteratively testing 2-edge exchanges: replacing crossing edges $(A, B)$ and $(C, D)$ with $(A, C)$ and $(B, D)$.
  - Reverses sub-tours whenever $\Delta < 0$, uncrossing intersecting routes and reducing overall distance.
  - Guarantees valid cycles starting and terminating at the kitchen hub with zero duplicate stops.

### 3. Side-by-Side Comparative Metrics & Decision Logs
- **Comprehensive Decision Logs**:
  - Step-by-step reasoning log explaining every choice made by the algorithms.
  - Logs candidate evaluations in Greedy NN (why a specific stop was chosen over others).
  - Logs 2-Opt edge swaps (removed cross-edges, inserted uncrossed edges, and distance $\Delta$ gained).
  - Logs Dijkstra node settlements and tentative edge relaxations.
- **Comparative Metrics Dashboard**:
  - **Total Distance (km)** and % distance reduction.
  - **Delivery Cost ($)** (combining vehicle travel fuel costs + preparation costs).
  - **Estimated Total Time (mins)** (transit speed + kitchen prep pipelining).
  - **Algorithm Execution Time (ms)**.
  - **Overall Route Efficiency Score (%)**.
- **Interactive Route Simulation Player**:
  - Play, pause, step forward, and step backward through delivery stops.
  - Real-time animated delivery bike moving smoothly across the map with speed controls (0.5x, 1x, 2x).

### 4. Resilient Data Persistence
- **MongoDB Support**: Persists locations, edges, active presets, and historical runs when MongoDB is available.
- **Automatic In-Memory Simulation Fallback**: Automatically activates a thread-safe in-memory repository if MongoDB is not locally running, ensuring zero installation friction.

---

## 🏗️ Tech Stack

- **Backend**: Python 3.13+, Flask, Flask-CORS, PyMongo
- **Frontend**: React 19, Tailwind CSS v4, Vite, Lucide React Icons
- **Testing**: Python `unittest` suite testing algorithmic correctness, triangle inequality, and persistence CRUD

---

## 📁 Project Structure

```
FOOD DEL/
├── backend/
│   ├── app.py                     # Flask REST API & static file serving
│   ├── storage.py                 # Storage repository (MongoDB + In-Memory Fallback)
│   ├── presets.py                 # Benchmark presets (Crossed Loops, Downtown, Suburbs, Road Network)
│   ├── algorithms/
│   │   ├── __init__.py
│   │   ├── dijkstra.py            # Dijkstra least-cost path & tentative table
│   │   ├── nearest_neighbor.py    # Greedy Nearest Neighbor heuristic with candidate logs
│   │   ├── two_opt.py             # TSP 2-Opt iterative uncrossing optimization
│   │   └── comparator.py          # Side-by-side benchmark & metrics engine
│   └── tests/
│       └── test_algorithms.py     # Automated test suite
├── frontend/                      # React + Tailwind + Vite
│   ├── src/
│   │   ├── App.jsx                # Main dashboard orchestrator
│   │   ├── components/
│   │   │   ├── Navbar.jsx         # Header with preset selector & DB status
│   │   │   ├── GraphCanvas.jsx    # Interactive SVG map canvas & bike animator
│   │   │   ├── AlgorithmSelector.jsx # Mode switcher & priority toggle
│   │   │   ├── MetricsDashboard.jsx  # Side-by-side comparison cards & table
│   │   │   ├── DecisionLogs.jsx   # Step-by-step decision reasoning logs
│   │   │   ├── NodeControlPanel.jsx  # Location CRUD & urgency inspector
│   │   │   ├── RoutePlayer.jsx    # Simulation playback controls
│   │   │   └── DijkstraPathFinder.jsx # Dedicated Dijkstra inspector
│   │   └── services/
│   │       └── api.js             # API client
│   └── dist/                      # Pre-built production frontend bundle
├── start.bat                      # 1-Click Windows production launcher
├── start_dev.bat                  # 1-Click Windows development launcher
└── README.md
```

---

## 🚀 Quickstart Guide

### Option 1: One-Click Launch (Pre-bundled Production Mode)
Run the provided batch file or execute Python directly:
```bash
# Windows Batch script
start.bat

# Or directly in terminal:
python backend/app.py
```
Open **`http://localhost:5000`** in your browser. The Flask backend will automatically serve both the REST API and the React frontend bundle!

---

### Option 2: Development Mode (Hot Reloading)

1. **Start the Flask Backend**:
   ```bash
   python backend/app.py
   ```
   Backend starts on `http://localhost:5000`.

2. **Start the Vite React Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend starts on `http://localhost:3000` with hot module replacement and automatic API proxying.

Alternatively, double-click **`start_dev.bat`** to start both development servers concurrently in separate windows.

---

## 🧪 Running Automated Tests

To run the automated algorithm test suite:
```bash
python -m unittest discover -s backend/tests
```
All tests verify:
- Dijkstra shortest path correctness and tentative table evolution.
- Greedy Nearest Neighbor loop completeness (starts and ends at Hub, visits every customer once).
- 2-Opt cost monotonicity ($Cost_{2\text{Opt}} \le Cost_{NN}$) and Hamiltonian cycle validation.
- Comparator engine metrics calculation.
- Storage repository automatic in-memory fallback.

---

## 📊 Benchmark Showcase Example: Crossed Loops

When loading the default **Crossed Loops Benchmark**:
- **Greedy Nearest Neighbor**: 120.78 km ($181.17 delivery cost)
- **TSP 2-Opt Optimization**: 91.79 km ($137.69 delivery cost)
- **Optimization Impact**:
  - Distance Saved: **28.99 km (24.0% reduction)**
  - Cost Saved: **$43.48 USD**
  - Time Saved: **58.0 minutes**
  - Total Swaps: **5 2-edge uncrossing operations**
