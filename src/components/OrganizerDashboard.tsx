import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Bell
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Zone, SOSAlert, Announcement } from '../types';
import { EVENT_DETAILS } from '../data/eventData';
import { geminiService } from '../services/geminiService';
import { audioService } from '../services/audioService';

interface OrganizerDashboardProps {
  zones: Zone[];
  sosAlerts: SOSAlert[];
  announcements: Announcement[];
  onBroadcastAnnouncement: (announcement: Omit<Announcement, 'id' | 'timestamp'>) => void;
  onUpdateSOSStatus: (id: string, status: SOSAlert['status']) => void;
}

export const OrganizerDashboard: React.FC<OrganizerDashboardProps> = ({
  zones,
  sosAlerts,
  announcements,
  onBroadcastAnnouncement,
  onUpdateSOSStatus,
}) => {
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastContent, setBroadcastContent] = useState('');
  const [broadcastPriority, setBroadcastPriority] = useState<Announcement['priority']>('normal');

  const [optimizing, setOptimizing] = useState(false);
  const [optimizerAdvice, setOptimizerAdvice] = useState<{
    headline: string;
    criticalAlerts: string[];
    suggestedInterventions: string[];
  } | null>(null);

  const handleRunOptimizer = async () => {
    setOptimizing(true);
    try {
      const advice = await geminiService.getCrowdOptimizationAdvice(zones);
      setOptimizerAdvice(advice);
    } catch (e) {
      console.error(e);
    } finally {
      setOptimizing(false);
    }
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastContent.trim()) return;

    onBroadcastAnnouncement({
      title: broadcastTitle,
      content: broadcastContent,
      priority: broadcastPriority,
      author: 'Operations Team',
    });

    audioService.playAlertChime(broadcastPriority === 'emergency' ? 'sos' : 'urgent');
    confetti({ particleCount: 20, spread: 40, origin: { y: 0.5 } });

    setBroadcastTitle('');
    setBroadcastContent('');
    setBroadcastPriority('normal');
  };

  const openTickets = sosAlerts.filter(a => a.status !== 'resolved');

  return (
    <div className="space-y-4">
      {/* Header & 4 Clean Metrics */}
      <div className="bg-slate-900/70 border border-white/[0.08] rounded-2xl p-4 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
          <div>
            <h3 className="font-bold text-base text-white">Event Operations Command</h3>
            <p className="text-xs text-slate-400">Live venue pulse, incident triage, and broadcast controls.</p>
          </div>

          <button
            onClick={handleRunOptimizer}
            disabled={optimizing}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors self-start sm:self-auto"
          >
            <Sparkles className={`w-3.5 h-3.5 ${optimizing ? 'animate-spin' : ''}`} />
            <span>{optimizing ? 'Analyzing...' : 'Gemini Crowd Optimizer'}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-white/[0.04]">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Checked In</span>
            <p className="text-lg font-bold text-white mt-0.5">{EVENT_DETAILS.totalAttendees} <span className="text-xs font-normal text-slate-500">/ {EVENT_DETAILS.maxCapacity}</span></p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-white/[0.04]">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Venue Capacity</span>
            <p className="text-lg font-bold text-emerald-400 mt-0.5">{Math.round((EVENT_DETAILS.totalAttendees / EVENT_DETAILS.maxCapacity) * 100)}%</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-white/[0.04]">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Open Incidents</span>
            <p className="text-lg font-bold text-red-400 mt-0.5">{openTickets.length}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-white/[0.04]">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Broadcasts</span>
            <p className="text-lg font-bold text-blue-400 mt-0.5">{announcements.length}</p>
          </div>
        </div>
      </div>

      {/* Gemini Optimizer Advice Card */}
      {optimizerAdvice && (
        <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-800/40 text-xs space-y-2">
          <p className="font-bold text-purple-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gemini Crowd Optimizer: {optimizerAdvice.headline}</span>
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-300 pt-1">
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-white/[0.04] space-y-1">
              <span className="text-[10px] font-bold text-red-400 uppercase">Bottlenecks</span>
              {optimizerAdvice.criticalAlerts.map((a, i) => (
                <div key={i} className="flex items-start gap-1.5 text-[11px]">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>{a}</span>
                </div>
              ))}
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-white/[0.04] space-y-1">
              <span className="text-[10px] font-bold text-emerald-400 uppercase">Suggested Interventions</span>
              {optimizerAdvice.suggestedInterventions.map((a, i) => (
                <div key={i} className="flex items-start gap-1.5 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{a}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Two Column Layout: SOS Queue + Broadcast Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* SOS Incident List */}
        <div className="lg:col-span-7 bg-slate-900/50 border border-white/[0.06] rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span>Incident Response Queue</span>
            </h4>
            <span className="text-xs text-slate-400">{openTickets.length} active</span>
          </div>

          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {sosAlerts.map((alert) => {
              const isResolved = alert.status === 'resolved';
              return (
                <div
                  key={alert.id}
                  className={`p-3 rounded-xl border text-xs transition-colors ${
                    isResolved
                      ? 'bg-slate-950/40 border-white/[0.04] opacity-50'
                      : alert.severity === 'critical'
                      ? 'bg-red-950/20 border-red-500/30'
                      : 'bg-slate-950/70 border-white/[0.06]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-bold uppercase text-red-400">
                          {alert.type}
                        </span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-400">{alert.timestamp}</span>
                      </div>
                      <p className="font-bold text-white mt-1">{alert.location}</p>
                      <p className="text-slate-300 mt-0.5">{alert.details}</p>
                    </div>

                    {!isResolved && (
                      <button
                        onClick={() => onUpdateSOSStatus(alert.id, 'resolved')}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] shrink-0 ml-2"
                      >
                        Resolve ✓
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Broadcast Broadcaster */}
        <div className="lg:col-span-5 bg-slate-900/50 border border-white/[0.06] rounded-2xl p-4 space-y-3">
          <div className="pb-2 border-b border-white/[0.06]">
            <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-blue-400" />
              <span>Broadcast Announcement</span>
            </h4>
          </div>

          <form onSubmit={handleSendBroadcast} className="space-y-2.5 text-xs">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Title</label>
              <input
                type="text"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                placeholder="E.g., Hall B session begins in 10 mins"
                className="w-full bg-slate-950 border border-white/[0.08] rounded-xl px-3 py-1.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Message</label>
              <textarea
                value={broadcastContent}
                onChange={(e) => setBroadcastContent(e.target.value)}
                placeholder="Enter alert text..."
                rows={3}
                className="w-full bg-slate-950 border border-white/[0.08] rounded-xl p-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Priority</label>
              <select
                value={broadcastPriority}
                onChange={(e) => setBroadcastPriority(e.target.value as any)}
                className="w-full bg-slate-950 border border-white/[0.08] rounded-xl px-2.5 py-1.5 text-white focus:outline-none"
              >
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={!broadcastTitle.trim() || !broadcastContent.trim()}
              className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Broadcast</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
