import React, { useState } from 'react';
import { 
  Smile, 
  Utensils, 
  Baby, 
  Accessibility, 
  Compass,
  CheckCircle2
} from 'lucide-react';
import { POI } from '../types';

interface AccessibilitySuiteProps {
  pois: POI[];
  onNavigateToPoi: (poiId: string) => void;
}

export const AccessibilitySuite: React.FC<AccessibilitySuiteProps> = ({
  pois,
  onNavigateToPoi,
}) => {
  const [selectedDiet, setSelectedDiet] = useState<string>('all');
  const dietFilters = ['all', 'Vegan', 'Gluten-Free', 'Halal', 'Kosher', 'Nut-Free'];

  const foodPois = pois.filter(p => p.category === 'food');
  const quietPois = pois.filter(p => p.category === 'quiet');
  const restroomPois = pois.filter(p => p.category === 'restroom');

  const filteredFood = foodPois.filter(p => {
    if (selectedDiet === 'all') return true;
    return p.dietaryOptions?.includes(selectedDiet);
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-slate-900/70 border border-white/[0.08] rounded-2xl p-4 backdrop-blur-md">
        <h3 className="font-bold text-base text-white flex items-center gap-2">
          <Accessibility className="w-4 h-4 text-purple-400" />
          <span>Universal Accessibility & Inclusivity</span>
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Dedicated low-stimulus spaces, allergen-segregated dining, and universal accessible restrooms.
        </p>
      </div>

      {/* 3 Clean Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Sensory Quiet Room */}
        <div className="bg-slate-900/50 border border-white/[0.06] rounded-2xl p-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-purple-300 flex items-center gap-1.5">
                <Smile className="w-3.5 h-3.5" />
                Quiet Sanctuary
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-semibold">
                Noise: 1/10
              </span>
            </div>

            <p className="text-xs text-slate-300">
              Noise-dampened room with dim warm lighting, noise-canceling headphones, and weighted lap pads.
            </p>

            <div className="pt-2 text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-purple-400" />
                <span>Low ambient lighting</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-purple-400" />
                <span>Zero loudspeaker bleed</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateToPoi(quietPois[0]?.id || 'poi-quiet-room')}
            className="mt-4 w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Directions to Sanctuary</span>
          </button>
        </div>

        {/* Dietary & Allergens */}
        <div className="bg-slate-900/50 border border-white/[0.06] rounded-2xl p-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                <Utensils className="w-3.5 h-3.5" />
                Dietary & Allergens
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                Segregated
              </span>
            </div>

            {/* Filter pills */}
            <div className="flex flex-wrap gap-1 pt-1">
              {dietFilters.map((diet) => (
                <button
                  key={diet}
                  onClick={() => setSelectedDiet(diet)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors ${
                    selectedDiet === diet
                      ? 'bg-emerald-600 text-white font-semibold'
                      : 'bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  {diet === 'all' ? 'All' : diet}
                </button>
              ))}
            </div>

            <div className="space-y-1.5 pt-1">
              {filteredFood.slice(0, 2).map((stall) => (
                <div key={stall.id} className="p-2 rounded-lg bg-slate-950/70 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-white">{stall.name}</p>
                    <span className="text-[10px] text-emerald-400">{stall.dietaryOptions?.join(', ')}</span>
                  </div>
                  <button
                    onClick={() => onNavigateToPoi(stall.id)}
                    className="p-1 text-slate-400 hover:text-white"
                    title="Directions"
                  >
                    <Compass className="w-3.5 h-3.5 text-blue-400" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-2 text-center text-[10px] text-slate-500">
            Dedicated allergen prep kitchens inspected daily.
          </div>
        </div>

        {/* Universal Restrooms & Care */}
        <div className="bg-slate-900/50 border border-white/[0.06] rounded-2xl p-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-blue-300 flex items-center gap-1.5">
                <Baby className="w-3.5 h-3.5" />
                Universal Facilities
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-semibold">
                ADA Ready
              </span>
            </div>

            <div className="space-y-2 pt-1">
              {restroomPois.map((restroom) => (
                <div key={restroom.id} className="p-2.5 rounded-lg bg-slate-950/70 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-white">{restroom.name}</p>
                    <span className="text-[10px] text-slate-400">Wide door • Step-Free</span>
                  </div>
                  <button
                    onClick={() => onNavigateToPoi(restroom.id)}
                    className="p-1 text-slate-400 hover:text-white"
                    title="Directions"
                  >
                    <Compass className="w-3.5 h-3.5 text-blue-400" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-2 text-center text-[10px] text-slate-500">
            All facilities include power door openers & touchless fixtures.
          </div>
        </div>
      </div>
    </div>
  );
};
