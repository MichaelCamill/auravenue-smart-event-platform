import React, { useState, useMemo } from 'react';
import { 
  Navigation, 
  MapPin, 
  Accessibility, 
  Users, 
  Volume2, 
  RotateCcw, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  ChevronRight
} from 'lucide-react';
import { POI, Zone, NavigationRoute, RouteStep, POICategory } from '../types';
import { audioService } from '../services/audioService';

interface InteractiveMapProps {
  zones: Zone[];
  pois: POI[];
  selectedPoiId?: string | null;
  onSelectPoi: (poi: POI | null) => void;
  stepFreeRequired?: boolean;
  onNavigateToPoi?: (poiId: string) => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  zones,
  pois,
  selectedPoiId,
  onSelectPoi,
  stepFreeRequired = false,
}) => {
  const [startPoiId, setStartPoiId] = useState<string>('poi-info-desk');
  const [destPoiId, setDestPoiId] = useState<string>(selectedPoiId || 'poi-main-stage');
  const [isStepFree, setIsStepFree] = useState<boolean>(stepFreeRequired);
  const [avoidCrowds, setAvoidCrowds] = useState<boolean>(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [hoveredPoi, setHoveredPoi] = useState<POI | null>(null);
  const [showSteps, setShowSteps] = useState<boolean>(true);

  React.useEffect(() => {
    if (selectedPoiId) {
      setDestPoiId(selectedPoiId);
    }
  }, [selectedPoiId]);

  React.useEffect(() => {
    if (stepFreeRequired) {
      setIsStepFree(true);
    }
  }, [stepFreeRequired]);

  const activeStartPoi = useMemo(() => pois.find(p => p.id === startPoiId) || pois[0], [pois, startPoiId]);
  const activeDestPoi = useMemo(() => pois.find(p => p.id === destPoiId) || pois[1], [pois, destPoiId]);

  const filteredPois = useMemo(() => {
    if (categoryFilter === 'all') return pois;
    return pois.filter(p => p.category === categoryFilter);
  }, [pois, categoryFilter]);

  const route: NavigationRoute = useMemo(() => {
    const p1 = activeStartPoi;
    const p2 = activeDestPoi;

    const hallACongested = zones.find(z => z.id === 'hall-a')?.crowdPercentage! > 75;
    const foodCongested = zones.find(z => z.id === 'food-court')?.crowdPercentage! > 75;

    let waypoints: { x: number; y: number }[] = [];
    let steps: RouteStep[] = [];

    waypoints.push({ x: p1.x, y: p1.y });

    if (avoidCrowds && (hallACongested || foodCongested) && p1.y > 350 && p2.y < 250) {
      waypoints.push({ x: 650, y: 335 });
      steps.push({
        instruction: 'Bypass main concourse rush via East Atrium corridor.',
        distanceMeters: 45,
        accessible: true,
        iconType: 'straight',
      });
    } else if (isStepFree) {
      waypoints.push({ x: 550, y: 320 });
      steps.push({
        instruction: 'Follow tactile level-access path to Central Atrium.',
        distanceMeters: 35,
        accessible: true,
        iconType: 'straight',
      });
      waypoints.push({ x: 680, y: 335 });
      steps.push({
        instruction: 'Take Glass Priority Elevator to Level 1.',
        distanceMeters: 20,
        accessible: true,
        iconType: 'elevator',
      });
    } else {
      waypoints.push({ x: 450, y: 300 });
      steps.push({
        instruction: 'Walk straight through Central Concourse.',
        distanceMeters: 40,
        accessible: true,
        iconType: 'straight',
      });
    }

    waypoints.push({ x: p2.x, y: p2.y });
    steps.push({
      instruction: `Arrive at ${p2.name}. ${p2.wheelchairAccessible ? 'Step-free ramp on right.' : ''}`,
      distanceMeters: 25,
      accessible: p2.wheelchairAccessible,
      iconType: 'arrive',
    });

    const totalDist = steps.reduce((sum, s) => sum + s.distanceMeters, 0);
    const estMin = Math.max(1, Math.round(totalDist / 40));

    return {
      startPOI: p1,
      endPOI: p2,
      pathPoints: waypoints,
      steps,
      totalDistanceMeters: totalDist,
      estimatedMinutes: estMin,
      isStepFree,
      avoidsCrowds: avoidCrowds,
    };
  }, [activeStartPoi, activeDestPoi, isStepFree, avoidCrowds, zones]);

  const handleReadDirections = () => {
    const speech = `Navigating from ${route.startPOI.name} to ${route.endPOI.name}. Walking time is approximately ${route.estimatedMinutes} minutes, ${route.totalDistanceMeters} meters. ${route.isStepFree ? 'Step-free accessible routing is active.' : ''} ${route.steps.map((s, i) => `Step ${i + 1}: ${s.instruction}`).join(' ')}`;
    audioService.speak(speech);
  };

  const pathD = useMemo(() => {
    if (route.pathPoints.length < 2) return '';
    return route.pathPoints.reduce((acc, pt, index) => {
      return index === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
    }, '');
  }, [route]);

  const getCategoryIcon = (category: POICategory) => {
    switch (category) {
      case 'stage': return '🎤';
      case 'booth': return '🎪';
      case 'food': return '☕';
      case 'restroom': return '🚻';
      case 'medical': return '🏥';
      case 'quiet': return '🎧';
      case 'help': return 'ℹ️';
      case 'exit': return '🚪';
      case 'elevator': return '🛗';
      default: return '📍';
    }
  };

  const poiFilters = [
    { id: 'all', label: 'All' },
    { id: 'stage', label: 'Stages' },
    { id: 'booth', label: 'Expo' },
    { id: 'food', label: 'Dining' },
    { id: 'restroom', label: 'Restrooms' },
    { id: 'quiet', label: 'Quiet Rooms' },
    { id: 'medical', label: 'First Aid' },
    { id: 'exit', label: 'Exits' },
  ];

  return (
    <div className="space-y-4">
      {/* Sleek Floating Route Header */}
      <div className="bg-slate-900/70 border border-white/[0.08] rounded-2xl p-3 sm:p-4 backdrop-blur-md shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Origin & Destination */}
          <div className="flex items-center gap-2 w-full md:w-auto flex-1">
            <div className="flex-1 min-w-[140px]">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                From
              </label>
              <select
                value={startPoiId}
                onChange={(e) => setStartPoiId(e.target.value)}
                className="w-full bg-slate-950/80 border border-white/[0.08] rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 truncate"
              >
                {pois.map((poi) => (
                  <option key={poi.id} value={poi.id}>
                    {poi.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-slate-500 pt-4">
              <ArrowRight className="w-4 h-4" />
            </div>

            <div className="flex-1 min-w-[140px]">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                To
              </label>
              <select
                value={destPoiId}
                onChange={(e) => {
                  setDestPoiId(e.target.value);
                  const p = pois.find(item => item.id === e.target.value);
                  if (p) onSelectPoi(p);
                }}
                className="w-full bg-slate-950/80 border border-white/[0.08] rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 truncate"
              >
                {pois.map((poi) => (
                  <option key={poi.id} value={poi.id}>
                    {poi.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Route Controls */}
          <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
            <button
              onClick={() => setIsStepFree(!isStepFree)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                isStepFree
                  ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                  : 'bg-slate-950/60 border-white/[0.08] text-slate-400 hover:text-white'
              }`}
              title="Only elevators and step-free ramps"
            >
              <Accessibility className="w-3.5 h-3.5" />
              <span>Step-Free</span>
            </button>

            <button
              onClick={() => setAvoidCrowds(!avoidCrowds)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                avoidCrowds
                  ? 'bg-amber-600/20 border-amber-500 text-amber-300'
                  : 'bg-slate-950/60 border-white/[0.08] text-slate-400 hover:text-white'
              }`}
              title="Avoid congested bottlenecks"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Avoid Crowds</span>
            </button>

            <button
              onClick={handleReadDirections}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all"
              title="Read directions aloud"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Voice</span>
            </button>
          </div>
        </div>

        {/* Minimal Category Filter Strip */}
        <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-white/[0.06]">
          <div className="flex items-center space-x-1 overflow-x-auto scrollbar-none py-0.5">
            {poiFilters.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  categoryFilter === cat.id
                    ? 'bg-white/10 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-1 shrink-0">
            <button
              onClick={() => setZoomLevel(prev => Math.min(prev + 0.15, 1.5))}
              className="p-1 rounded-lg text-slate-400 hover:text-white"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(prev => Math.max(prev - 0.15, 0.85))}
              className="p-1 rounded-lg text-slate-400 hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="p-1 rounded-lg text-slate-400 hover:text-white"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Map & Route Details Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Interactive SVG Canvas */}
        <div className="lg:col-span-8 bg-slate-950 border border-white/[0.08] rounded-2xl p-3 relative overflow-hidden flex items-center justify-center min-h-[440px]">
          
          {/* Subtle Map Status Indicator */}
          <div className="absolute top-3 left-3 z-10 bg-slate-900/80 border border-white/[0.08] backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] text-slate-400 flex items-center space-x-3">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Normal
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span> Moderate
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-400"></span> Congested
            </span>
          </div>

          {/* SVG Map */}
          <div className="w-full overflow-auto flex justify-center py-2">
            <div 
              style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.2s ease-out' }}
              className="origin-center w-full max-w-[900px]"
            >
              <svg viewBox="0 0 1000 600" className="w-full h-auto select-none">
                <defs>
                  <radialGradient id="grad-crit" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="rgba(239, 68, 68, 0.25)" />
                    <stop offset="100%" stopColor="rgba(239, 68, 68, 0)" />
                  </radialGradient>
                  <radialGradient id="grad-mod" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="rgba(234, 179, 8, 0.2)" />
                    <stop offset="100%" stopColor="rgba(234, 179, 8, 0)" />
                  </radialGradient>
                </defs>

                {/* Base Background */}
                <rect width="1000" height="600" fill="#090d16" rx="16" />

                {/* Venue Boundary */}
                <rect
                  x="30"
                  y="30"
                  width="940"
                  height="540"
                  fill="none"
                  stroke="#1e293b"
                  strokeWidth="1.5"
                  rx="12"
                />

                {/* Zones Layout */}
                {zones.map((zone) => {
                  const isCrowded = zone.crowdPercentage > 75;
                  const isModerate = zone.crowdPercentage > 50 && zone.crowdPercentage <= 75;

                  return (
                    <g key={zone.id} className="cursor-pointer group">
                      {isCrowded && (
                        <path d={zone.svgPath} fill="url(#grad-crit)" className="animate-pulse" />
                      )}
                      {isModerate && (
                        <path d={zone.svgPath} fill="url(#grad-mod)" />
                      )}

                      <path
                        d={zone.svgPath}
                        fill="rgba(15, 23, 42, 0.6)"
                        stroke={isCrowded ? 'rgba(239, 68, 68, 0.5)' : isModerate ? 'rgba(234, 179, 8, 0.4)' : 'rgba(56, 189, 248, 0.3)'}
                        strokeWidth="1.5"
                        className="transition-colors hover:fill-slate-800/80"
                      />

                      <text
                        x={zone.labelX}
                        y={zone.labelY - 6}
                        textAnchor="middle"
                        fill="#cbd5e1"
                        fontSize="12"
                        fontWeight="600"
                        className="pointer-events-none"
                      >
                        {zone.name.split(':')[0]}
                      </text>
                      <text
                        x={zone.labelX}
                        y={zone.labelY + 12}
                        textAnchor="middle"
                        fill={isCrowded ? '#f87171' : isModerate ? '#fde047' : '#94a3b8'}
                        fontSize="10"
                        className="pointer-events-none"
                      >
                        {zone.crowdPercentage}% full
                      </text>
                    </g>
                  );
                })}

                {/* Animated Navigation Route Line */}
                {pathD && (
                  <>
                    <path
                      d={pathD}
                      fill="none"
                      stroke={isStepFree ? '#c084fc' : '#38bdf8'}
                      strokeWidth="6"
                      strokeOpacity="0.2"
                      strokeLinecap="round"
                    />
                    <path
                      d={pathD}
                      fill="none"
                      stroke={isStepFree ? '#a855f7' : '#38bdf8'}
                      strokeWidth="3"
                      strokeDasharray="6 6"
                      strokeLinecap="round"
                    />
                  </>
                )}

                {/* Waypoints */}
                {route.pathPoints.map((pt, i) => (
                  <circle
                    key={`wpt-${i}`}
                    cx={pt.x}
                    cy={pt.y}
                    r={i === 0 || i === route.pathPoints.length - 1 ? 6 : 3.5}
                    fill={i === 0 ? '#10b981' : i === route.pathPoints.length - 1 ? '#ef4444' : '#38bdf8'}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                ))}

                {/* POI Pins */}
                {filteredPois.map((poi) => {
                  const isStart = poi.id === startPoiId;
                  const isDest = poi.id === destPoiId;

                  return (
                    <g
                      key={poi.id}
                      transform={`translate(${poi.x}, ${poi.y})`}
                      className="cursor-pointer"
                      onClick={() => {
                        setDestPoiId(poi.id);
                        onSelectPoi(poi);
                      }}
                      onMouseEnter={() => setHoveredPoi(poi)}
                      onMouseLeave={() => setHoveredPoi(null)}
                    >
                      {isDest && (
                        <circle
                          r="14"
                          fill="rgba(239, 68, 68, 0.3)"
                          className="animate-ping-slow"
                        />
                      )}
                      <circle
                        r="10"
                        fill={
                          isDest
                            ? '#ef4444'
                            : isStart
                            ? '#10b981'
                            : poi.category === 'medical'
                            ? '#ec4899'
                            : poi.category === 'quiet'
                            ? '#8b5cf6'
                            : poi.category === 'food'
                            ? '#f97316'
                            : '#3b82f6'
                        }
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      />
                      <text
                        y="3.5"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="9"
                        fontWeight="bold"
                        className="pointer-events-none"
                      >
                        {poi.category === 'medical' ? '+' : poi.category === 'restroom' ? 'W' : '•'}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Hovered POI Popover */}
          {hoveredPoi && (
            <div className="absolute bottom-3 left-3 max-w-xs z-20 bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-xl backdrop-blur-md text-xs">
              <p className="font-bold text-white flex items-center gap-1">
                <span>{getCategoryIcon(hoveredPoi.category)}</span>
                <span>{hoveredPoi.name}</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{hoveredPoi.description}</p>
            </div>
          )}
        </div>

        {/* Right Route Panel */}
        <div className="lg:col-span-4 bg-slate-900/60 border border-white/[0.08] rounded-2xl p-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Active Route
                </span>
                <h3 className="font-bold text-sm text-white truncate max-w-[200px]">
                  {route.endPOI.name}
                </h3>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-blue-400 block">
                  ~{route.estimatedMinutes} min
                </span>
                <span className="text-[10px] text-slate-500">
                  {route.totalDistanceMeters}m walk
                </span>
              </div>
            </div>

            {/* Turn-by-Turn Steps */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {route.steps.map((step, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-slate-950/60 border border-white/[0.04] text-xs flex items-start space-x-2.5"
                >
                  <span className="w-5 h-5 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0 font-bold text-[10px] mt-0.5">
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-slate-200 leading-snug">{step.instruction}</p>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">{step.distanceMeters}m</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-white/[0.06] text-center">
            <span className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{route.isStepFree ? 'Step-Free elevator routing active' : 'Standard walking route'}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
