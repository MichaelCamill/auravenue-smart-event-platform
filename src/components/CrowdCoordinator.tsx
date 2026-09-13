import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Compass, 
  Radio, 
  Activity
} from 'lucide-react';
import { Zone } from '../types';

interface CrowdCoordinatorProps {
  zones: Zone[];
  onNavigateToZone: (zoneId: string) => void;
}

export const CrowdCoordinator: React.FC<CrowdCoordinatorProps> = ({
  zones,
  onNavigateToZone,
}) => {
  const [autoSimulate, setAutoSimulate] = useState(true);
  const [localZones, setLocalZones] = useState<Zone[]>(zones);

  useEffect(() => {
    setLocalZones(zones);
  }, [zones]);

  useEffect(() => {
    if (!autoSimulate) return;
    const timer = setInterval(() => {
      setLocalZones(prev => 
        prev.map(z => {
          const delta = Math.floor(Math.random() * 9) - 4;
          const newOcc = Math.max(10, Math.min(z.capacity, z.currentOccupancy + delta));
          const pct = Math.round((newOcc / z.capacity) * 100);
          return {
            ...z,
            currentOccupancy: newOcc,
            crowdPercentage: pct,
            status: pct > 80 ? 'critical' : pct > 60 ? 'high' : pct > 35 ? 'moderate' : 'low',
          };
        })
      );
    }, 4000);
    return () => clearInterval(timer);
  }, [autoSimulate]);

  const criticalZones = localZones.filter(z => z.crowdPercentage > 75);

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-slate-900/70 border border-white/[0.08] rounded-2xl p-4 backdrop-blur-md flex items-center justify-between">
        <div>
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Live Venue Crowd Telemetry</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time occupancy tracking to help you navigate around congested corridors.
          </p>
        </div>

        <button
          onClick={() => setAutoSimulate(!autoSimulate)}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
            autoSimulate
              ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-300'
              : 'bg-slate-950 border-white/[0.08] text-slate-400'
          }`}
        >
          <Radio className={`w-3 h-3 ${autoSimulate ? 'animate-pulse text-emerald-400' : ''}`} />
          <span>{autoSimulate ? 'Live Sensors' : 'Paused'}</span>
        </button>
      </div>

      {/* Congestion Notice */}
      {criticalZones.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/30 flex items-center justify-between gap-3 text-xs text-amber-200">
          <div className="flex items-center space-x-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Congestion Warning:</strong> {criticalZones.map(z => z.name.split(':')[0]).join(', ')} currently at high capacity.
            </span>
          </div>
          <button
            onClick={() => onNavigateToZone(criticalZones[0].id)}
            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold text-[11px] shrink-0"
          >
            View Detour
          </button>
        </div>
      )}

      {/* Zone Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {localZones.map((zone) => {
          const isCritical = zone.crowdPercentage > 75;
          const isModerate = zone.crowdPercentage > 50 && zone.crowdPercentage <= 75;

          return (
            <div
              key={zone.id}
              className="bg-slate-900/50 border border-white/[0.06] hover:border-white/10 rounded-2xl p-3.5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 uppercase font-semibold text-[10px]">
                    {zone.category}
                  </span>
                  <span className={`font-bold ${isCritical ? 'text-red-400' : isModerate ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {zone.crowdPercentage}% full
                  </span>
                </div>

                <h4 className="font-bold text-xs text-white mt-1.5 truncate">
                  {zone.name.split(':')[0]}
                </h4>

                {/* Clean minimal progress line */}
                <div className="w-full h-1.5 rounded-full bg-slate-950 mt-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isCritical ? 'bg-red-500' : isModerate ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                    style={{ width: `${zone.crowdPercentage}%` }}
                  />
                </div>

                <div className="flex justify-between text-[10px] text-slate-500 mt-2">
                  <span>{zone.currentOccupancy} inside</span>
                  <span>Cap: {zone.capacity}</span>
                </div>
              </div>

              <button
                onClick={() => onNavigateToZone(zone.id)}
                className="mt-3 w-full py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[11px] font-medium text-slate-300 transition-colors flex items-center justify-center gap-1"
              >
                <Compass className="w-3 h-3 text-blue-400" />
                <span>Locate on Map</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
