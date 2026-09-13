import React, { useState } from 'react';
import { Bell, AlertTriangle, ShieldAlert, X, Volume2 } from 'lucide-react';
import { Announcement } from '../types';
import { audioService } from '../services/audioService';

interface BroadcastBannerProps {
  announcements: Announcement[];
}

export const BroadcastBanner: React.FC<BroadcastBannerProps> = ({ announcements }) => {
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  const latest = announcements.find(a => !dismissedIds.includes(a.id));
  if (!latest) return null;

  const isEmergency = latest.priority === 'emergency';
  const isUrgent = latest.priority === 'urgent';

  return (
    <div className={`w-full py-1.5 px-4 text-xs border-b transition-colors ${
      isEmergency
        ? 'bg-red-950/80 border-red-800 text-red-200'
        : isUrgent
        ? 'bg-amber-950/60 border-amber-800/60 text-amber-200'
        : 'bg-indigo-950/60 border-indigo-800/50 text-indigo-200'
    }`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center space-x-2 truncate">
          {isEmergency ? (
            <ShieldAlert className="w-3.5 h-3.5 text-red-400 shrink-0" />
          ) : isUrgent ? (
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          ) : (
            <Bell className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          )}
          <span className="font-semibold text-white">{latest.title}</span>
          <span className="text-slate-300 truncate hidden sm:inline">— {latest.content}</span>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => audioService.speak(`${latest.title}. ${latest.content}`)}
            className="text-slate-400 hover:text-white p-0.5"
            title="Listen to announcement"
          >
            <Volume2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDismissedIds(prev => [...prev, latest.id])}
            className="text-slate-400 hover:text-white p-0.5"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
