import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2, Edit3, Save, X, DollarSign, Clock, AlertTriangle } from 'lucide-react';

export default function NodeControlPanel({
  selectedNode,
  onUpdateNode,
  onDeleteNode,
  onAddNode,
  onClose
}) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'order',
    priority: 'Normal',
    prep_cost: 3.5,
    prep_time_mins: 12.0,
    x: 300,
    y: 300
  });

  const [isCreatingNew, setIsCreatingNew] = useState(false);

  useEffect(() => {
    if (selectedNode) {
      setIsCreatingNew(false);
      setFormData({
        name: selectedNode.name || '',
        type: selectedNode.type || 'order',
        priority: selectedNode.priority || 'Normal',
        prep_cost: selectedNode.prep_cost ?? 3.5,
        prep_time_mins: selectedNode.prep_time_mins ?? 12.0,
        x: selectedNode.x || 300,
        y: selectedNode.y || 300
      });
    }
  }, [selectedNode]);

  const handleSave = (e) => {
    e.preventDefault();
    if (isCreatingNew) {
      onAddNode({
        ...formData,
        prep_cost: parseFloat(formData.prep_cost) || 0,
        prep_time_mins: parseFloat(formData.prep_time_mins) || 0,
        x: parseFloat(formData.x) || 300,
        y: parseFloat(formData.y) || 300
      });
      setIsCreatingNew(false);
    } else if (selectedNode) {
      onUpdateNode(selectedNode.id, {
        ...formData,
        prep_cost: parseFloat(formData.prep_cost) || 0,
        prep_time_mins: parseFloat(formData.prep_time_mins) || 0,
        x: parseFloat(formData.x) || 300,
        y: parseFloat(formData.y) || 300
      });
    }
  };

  const handleStartCreate = () => {
    setIsCreatingNew(true);
    setFormData({
      name: `Order #${Math.floor(100 + Math.random() * 900)}`,
      type: 'order',
      priority: 'High',
      prep_cost: 4.5,
      prep_time_mins: 10.0,
      x: Math.floor(150 + Math.random() * 400),
      y: Math.floor(150 + Math.random() * 300)
    });
  };

  const isHub = selectedNode && (selectedNode.type === 'hub' || selectedNode.type === 'restaurant');

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 shadow-xl">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center gap-2">
          <Edit3 className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            {isCreatingNew ? 'Add Delivery Order' : selectedNode ? `Edit Location: ${selectedNode.name}` : 'Location Inspector'}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {!isCreatingNew && (
            <button
              onClick={handleStartCreate}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold hover:bg-emerald-500/30 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
          )}

          {selectedNode && !isCreatingNew && (
            <button
              onClick={() => onDeleteNode(selectedNode.id)}
              disabled={isHub}
              title={isHub ? "Central Kitchen Hub cannot be deleted" : "Delete Order"}
              className="p-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {(!selectedNode && !isCreatingNew) ? (
        <div className="text-xs text-slate-500 text-center py-6">
          <MapPin className="w-6 h-6 mx-auto mb-2 opacity-40 text-emerald-400" />
          Click any delivery node on the map to inspect or adjust its priority & preparation cost.
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Location Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none focus:border-emerald-500"
              required
            />
          </div>

          {!isHub && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Order Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent 🔥</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="order">Customer Order</option>
                  <option value="hub">Central Kitchen Hub</option>
                </select>
              </div>
            </div>
          )}

          {!isHub && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Prep Cost ($)</label>
                <div className="relative">
                  <DollarSign className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={formData.prep_cost}
                    onChange={(e) => setFormData({ ...formData, prep_cost: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-6 pr-2 py-1.5 text-slate-200 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Prep Time (mins)</label>
                <div className="relative">
                  <Clock className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={formData.prep_time_mins}
                    onChange={(e) => setFormData({ ...formData, prep_time_mins: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-6 pr-2 py-1.5 text-slate-200 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500">
            <div>
              <span>Coord X: </span>
              <strong className="text-slate-300 font-mono">{formData.x}px</strong>
            </div>
            <div>
              <span>Coord Y: </span>
              <strong className="text-slate-300 font-mono">{formData.y}px</strong>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isCreatingNew ? 'Create Location' : 'Save Changes'}</span>
            </button>
            {isCreatingNew && (
              <button
                type="button"
                onClick={() => setIsCreatingNew(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
