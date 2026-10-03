import React from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, FastForward, Bike } from 'lucide-react';

export default function RoutePlayer({
  isPlaying,
  onTogglePlay,
  onStepForward,
  onStepBackward,
  onReset,
  currentLegIndex,
  totalLegs,
  legs,
  speed,
  onChangeSpeed
}) {
  if (!totalLegs || totalLegs === 0) return null;

  const currentLeg = legs && legs[currentLegIndex] ? legs[currentLegIndex] : null;

  return (
    <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 p-3 shadow-xl flex flex-wrap items-center justify-between gap-4">
      {/* Current Leg Info */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
          <Bike className="w-5 h-5 stroke-[2.2]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white">Route Simulation</span>
            <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono">
              Leg {Math.min(currentLegIndex + 1, totalLegs)} of {totalLegs}
            </span>
          </div>
          <p className="text-xs text-slate-400 truncate max-w-xs md:max-w-md">
            {currentLeg ? (
              <>
                <strong className="text-slate-200">{currentLeg.from_name}</strong> →{' '}
                <strong className="text-emerald-400">{currentLeg.to_name}</strong>{' '}
                <span className="text-slate-500">({currentLeg.distance} km)</span>
              </>
            ) : (
              'Route ready for playback'
            )}
          </p>
        </div>
      </div>

      {/* Playback Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={onReset}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
          title="Reset to Start"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={onStepBackward}
          disabled={currentLegIndex <= 0}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition cursor-pointer"
          title="Previous Step"
        >
          <SkipBack className="w-4 h-4" />
        </button>

        <button
          onClick={onTogglePlay}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition cursor-pointer"
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4 fill-current" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>{currentLegIndex >= totalLegs - 1 ? 'Replay' : 'Play Tour'}</span>
            </>
          )}
        </button>

        <button
          onClick={onStepForward}
          disabled={currentLegIndex >= totalLegs - 1}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition cursor-pointer"
          title="Next Step"
        >
          <SkipForward className="w-4 h-4" />
        </button>

        {/* Speed toggle */}
        <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800 ml-2 text-[10px]">
          {[0.5, 1, 2].map((s) => (
            <button
              key={s}
              onClick={() => onChangeSpeed(s)}
              className={`px-2 py-1 rounded font-mono font-bold transition cursor-pointer ${
                speed === s
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
