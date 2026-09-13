import React, { useState } from 'react';
import { 
  CalendarPlus, 
  X, 
  Clock, 
  Sparkles, 
  Zap, 
  MapPin, 
  User, 
  Layers
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Session, POI, ZoneId } from '../types';
import { audioService } from '../services/audioService';

interface ScheduleEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  pois: POI[];
  onAddSession: (newSession: Session) => void;
}

export const ScheduleEventModal: React.FC<ScheduleEventModalProps> = ({
  isOpen,
  onClose,
  pois,
  onAddSession,
}) => {
  const [title, setTitle] = useState('');
  const [speakerName, setSpeakerName] = useState('Alex Chen');
  const [speakerRole, setSpeakerRole] = useState('Senior AI Architect');
  const [speakerCompany, setSpeakerCompany] = useState('Google DeepMind');
  const [track, setTrack] = useState<Session['track']>('AI & Gemini');
  const [locationId, setLocationId] = useState(pois[0]?.id || 'poi-main-stage');
  const [timingMode, setTimingMode] = useState<'quick-15s' | 'quick-now' | 'custom'>('quick-15s');
  const [customStartDelaySec, setCustomStartDelaySec] = useState(20);
  const [customDurationSec, setCustomDurationSec] = useState(40);

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const eventTitle = title.trim() || 'Rapid AI Prototyping Workshop';

    const now = Date.now();
    let startEpochMs: number;
    let endEpochMs: number;

    if (timingMode === 'quick-15s') {
      // Starts in 15 seconds, runs for 30 seconds
      startEpochMs = now + 15 * 1000;
      endEpochMs = startEpochMs + 30 * 1000;
    } else if (timingMode === 'quick-now') {
      // Starts right now, runs for 35 seconds
      startEpochMs = now;
      endEpochMs = now + 35 * 1000;
    } else {
      // Custom
      startEpochMs = now + customStartDelaySec * 1000;
      endEpochMs = startEpochMs + customDurationSec * 1000;
    }

    const formatTime = (epochMs: number) => {
      return new Date(epochMs).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      });
    };

    const selectedPoi = pois.find(p => p.id === locationId) || pois[0];

    const newSession: Session = {
      id: `custom-ses-${Date.now()}`,
      title: eventTitle,
      speaker: {
        name: speakerName.trim() || 'Guest Speaker',
        role: speakerRole.trim() || 'Tech Lead',
        company: speakerCompany.trim() || 'HackFest 2026',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      },
      track,
      startTime: formatTime(startEpochMs),
      endTime: formatTime(endEpochMs),
      startEpochMs,
      endEpochMs,
      locationId: selectedPoi.id,
      zoneId: selectedPoi.zoneId,
      description: `Live scheduled session: ${eventTitle}. Demonstrating real-time Upcoming -> Ongoing -> Ended lifecycle and automated disappearance after 1 minute of ending.`,
      tags: [track, 'Live Demo', 'Real-Time'],
      accessibility: {
        asl: true,
        captions: true,
        stepFree: true,
        audioDescription: false,
      },
      capacityPercentage: 40,
      isPopular: true,
    };

    onAddSession(newSession);
    confetti({ particleCount: 35, spread: 60, origin: { y: 0.7 } });
    audioService.playAlertChime('success');
    audioService.speak(`Event ${eventTitle} has been scheduled. It is now marked upcoming.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-950 border border-white/[0.12] rounded-3xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <CalendarPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Schedule New Event</h3>
              <p className="text-[11px] text-slate-400">
                Live lifecycle: Upcoming ➜ Ongoing ➜ Ended ➜ Disappears in 1 min
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-white/[0.08]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleCreate} className="mt-4 space-y-4 text-xs">
          
          {/* Quick Timing Preset Selector */}
          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1.5">
              Testing Schedule Preset:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTimingMode('quick-15s')}
                className={`p-2.5 rounded-xl text-left border transition-all ${
                  timingMode === 'quick-15s'
                    ? 'bg-blue-600/20 border-blue-500 text-blue-200'
                    : 'bg-slate-900/60 border-white/[0.06] text-slate-400 hover:text-white'
                }`}
              >
                <div className="font-bold text-xs flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Starts in 15s</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Runs 30s, ends & auto-vanishes in 1m
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTimingMode('quick-now')}
                className={`p-2.5 rounded-xl text-left border transition-all ${
                  timingMode === 'quick-now'
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-200'
                    : 'bg-slate-900/60 border-white/[0.06] text-slate-400 hover:text-white'
                }`}
              >
                <div className="font-bold text-xs flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Starts Now</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Ongoing for 35s, then ends
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTimingMode('custom')}
                className={`p-2.5 rounded-xl text-left border transition-all ${
                  timingMode === 'custom'
                    ? 'bg-purple-600/20 border-purple-500 text-purple-200'
                    : 'bg-slate-900/60 border-white/[0.06] text-slate-400 hover:text-white'
                }`}
              >
                <div className="font-bold text-xs flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Custom Time</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Set custom seconds / duration
                </div>
              </button>
            </div>
          </div>

          {/* If custom timing mode */}
          {timingMode === 'custom' && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-900/50 rounded-xl border border-white/[0.06]">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Start Delay (Seconds)
                </label>
                <input
                  type="number"
                  min="0"
                  max="3600"
                  value={customStartDelaySec}
                  onChange={(e) => setCustomStartDelaySec(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-white/[0.08] rounded-lg p-2 text-white"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Duration (Seconds)
                </label>
                <input
                  type="number"
                  min="5"
                  max="7200"
                  value={customDurationSec}
                  onChange={(e) => setCustomDurationSec(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-white/[0.08] rounded-lg p-2 text-white"
                />
              </div>
            </div>
          )}

          {/* Event Title */}
          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">
              Event / Session Title:
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="E.g., Next-Gen Gemini Agentic Hacks"
              className="w-full bg-slate-950 border border-white/[0.08] rounded-xl px-3 py-2 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Track & Stage Location */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Track:
              </label>
              <select
                value={track}
                onChange={(e) => setTrack(e.target.value as any)}
                className="w-full bg-slate-950 border border-white/[0.08] rounded-xl px-2.5 py-1.5 text-white focus:outline-none"
              >
                <option value="AI & Gemini">AI & Gemini</option>
                <option value="Web & Cloud">Web & Cloud</option>
                <option value="Robotics & IoT">Robotics & IoT</option>
                <option value="Design & UX">Design & UX</option>
                <option value="Keynote">Keynote</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Stage / Venue:
              </label>
              <select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="w-full bg-slate-950 border border-white/[0.08] rounded-xl px-2.5 py-1.5 text-white focus:outline-none"
              >
                {pois.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Speaker Details */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Speaker Name:
              </label>
              <input
                type="text"
                value={speakerName}
                onChange={(e) => setSpeakerName(e.target.value)}
                className="w-full bg-slate-950 border border-white/[0.08] rounded-xl px-3 py-1.5 text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Organization:
              </label>
              <input
                type="text"
                value={speakerCompany}
                onChange={(e) => setSpeakerCompany(e.target.value)}
                className="w-full bg-slate-950 border border-white/[0.08] rounded-xl px-3 py-1.5 text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Notice about 1-minute auto-disappear */}
          <div className="p-2.5 rounded-xl bg-slate-900 border border-white/[0.06] text-[11px] text-slate-400">
            💡 <strong>Auto-Lifecycle Rule:</strong> Marked <span className="text-amber-300 font-bold">Upcoming</span> before start time, <span className="text-emerald-300 font-bold">Ongoing</span> during event, <span className="text-red-300 font-bold">Ended</span> when finished, and disappears <strong>after 1 minute of ending</strong>.
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/25 transition-all"
          >
            <CalendarPlus className="w-4 h-4" />
            <span>Confirm & Schedule Event</span>
          </button>
        </form>
      </div>
    </div>
  );
};
