import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Bookmark, 
  BookmarkCheck, 
  Clock, 
  MapPin, 
  Volume2, 
  CalendarPlus, 
  Timer, 
  AlertCircle,
  PlayCircle,
  Hourglass,
  CheckCircle2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Session, POI } from '../types';
import { audioService } from '../services/audioService';
import { ScheduleEventModal } from './ScheduleEventModal';

interface ScheduleDiscoveryProps {
  sessions: Session[];
  pois: POI[];
  bookmarkedSessionIds: string[];
  onToggleBookmark: (sessionId: string) => void;
  onNavigateToSession: (poiId: string) => void;
  onAddSession: (newSession: Session) => void;
}

export const ScheduleDiscovery: React.FC<ScheduleDiscoveryProps> = ({
  sessions,
  pois,
  bookmarkedSessionIds,
  onToggleBookmark,
  onNavigateToSession,
  onAddSession,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrack, setSelectedTrack] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'ongoing' | 'upcoming' | 'ended'>('all');
  const [onlyBookmarked, setOnlyBookmarked] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  // Live real-time clock ticking every 1 second
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const tracks = ['all', 'Keynote', 'AI & Gemini', 'Web & Cloud', 'Robotics & IoT', 'Design & UX'];

  // Helper to extract exact epoch timestamps
  const getSessionTimings = (s: Session) => {
    if (s.startEpochMs && s.endEpochMs) {
      return { start: s.startEpochMs, end: s.endEpochMs };
    }

    const parseTimeToday = (timeStr: string) => {
      const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
      if (!match) return now + 3600000;
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const meridiem = match[3]?.toUpperCase();
      if (meridiem === 'PM' && hours < 12) hours += 12;
      if (meridiem === 'AM' && hours === 12) hours = 0;
      const d = new Date();
      d.setHours(hours, minutes, 0, 0);
      return d.getTime();
    };

    return {
      start: parseTimeToday(s.startTime),
      end: parseTimeToday(s.endTime),
    };
  };

  // Filter sessions: Compute live labels and apply 1-MINUTE AUTO-DISAPPEAR!
  const activeSessionsWithStatus = useMemo(() => {
    return sessions
      .map((s) => {
        const { start, end } = getSessionTimings(s);
        
        // Auto-disappear rule: 1 minute (60,000 ms) after the end time
        const isDisappeared = now > (end + 60 * 1000);
        if (isDisappeared) {
          return null; // DISAPPEARED!
        }

        let status: 'upcoming' | 'ongoing' | 'ended';
        let countdownBadge = '';
        const secondsUntilStart = Math.max(0, Math.ceil((start - now) / 1000));
        const secondsUntilEnd = Math.max(0, Math.ceil((end - now) / 1000));
        const secondsUntilDisappear = Math.max(0, Math.ceil((end + 60 * 1000 - now) / 1000));

        if (now < start) {
          status = 'upcoming';
          if (secondsUntilStart <= 120) {
            countdownBadge = `Starts in ${secondsUntilStart}s`;
          } else {
            countdownBadge = `Starts at ${s.startTime}`;
          }
        } else if (now >= start && now <= end) {
          status = 'ongoing';
          if (secondsUntilEnd <= 120) {
            countdownBadge = `Ends in ${secondsUntilEnd}s`;
          } else {
            countdownBadge = `Ends at ${s.endTime}`;
          }
        } else {
          status = 'ended';
          countdownBadge = `Disappears in ${secondsUntilDisappear}s`;
        }

        return {
          session: s,
          status,
          countdownBadge,
          start,
          end,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .filter(({ session: s, status }) => {
        // Status filter
        if (selectedStatusFilter !== 'all' && status !== selectedStatusFilter) return false;

        // Search match
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          s.title.toLowerCase().includes(query) ||
          s.speaker.name.toLowerCase().includes(query) ||
          s.tags.some(t => t.toLowerCase().includes(query));

        if (!matchesSearch) return false;
        if (selectedTrack !== 'all' && s.track !== selectedTrack) return false;
        if (onlyBookmarked && !bookmarkedSessionIds.includes(s.id)) return false;

        return true;
      });
  }, [sessions, now, searchQuery, selectedTrack, selectedStatusFilter, onlyBookmarked, bookmarkedSessionIds]);

  const handleBookmarkClick = (sessionId: string) => {
    onToggleBookmark(sessionId);
    if (!bookmarkedSessionIds.includes(sessionId)) {
      confetti({ particleCount: 25, spread: 50, origin: { y: 0.8 } });
      audioService.playAlertChime('success');
    }
  };

  // Count active statuses for display
  const ongoingCount = sessions.filter(s => {
    const { start, end } = getSessionTimings(s);
    return now >= start && now <= end;
  }).length;

  const upcomingCount = sessions.filter(s => {
    const { start } = getSessionTimings(s);
    return now < start;
  }).length;

  const endedCount = sessions.filter(s => {
    const { end } = getSessionTimings(s);
    return now > end && now <= end + 60 * 1000;
  }).length;

  return (
    <div className="space-y-4">
      {/* Search & Actions Bar */}
      <div className="bg-slate-900/80 border border-white/[0.12] rounded-2xl p-4 backdrop-blur-md shadow-md">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Search bar */}
          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sessions or speakers..."
              className="w-full bg-slate-950 border border-white/[0.1] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Track Filter Pills */}
          <div className="flex items-center space-x-1 overflow-x-auto w-full md:w-auto scrollbar-none py-1">
            {tracks.map((track) => (
              <button
                key={track}
                onClick={() => setSelectedTrack(track)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  selectedTrack === track
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {track === 'all' ? 'All Tracks' : track}
              </button>
            ))}
          </div>

          {/* Action Buttons: Bookmarks & SCHEDULE EVENT */}
          <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
            <button
              onClick={() => setOnlyBookmarked(!onlyBookmarked)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all shrink-0 ${
                onlyBookmarked
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'bg-slate-950 border-white/[0.08] text-slate-400 hover:text-white'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Saved ({bookmarkedSessionIds.length})</span>
            </button>

            {/* HIGH VISIBILITY BUTTON TO SCHEDULE AN EVENT */}
            <button
              onClick={() => setIsScheduleModalOpen(true)}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30 border border-blue-400 transition-all shrink-0"
              title="Schedule a new live event with dynamic Upcoming -> Ongoing -> Ended lifecycle"
            >
              <CalendarPlus className="w-4 h-4" />
              <span>+ Schedule Event</span>
            </button>
          </div>
        </div>

        {/* Live Status Filter Buttons (Highlights Upcoming, Ongoing, Ended counts) */}
        <div className="mt-3 pt-3 border-t border-white/[0.08] flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
              Live Status:
            </span>
            <button
              onClick={() => setSelectedStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                selectedStatusFilter === 'all'
                  ? 'bg-white/20 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Events ({activeSessionsWithStatus.length})
            </button>

            <button
              onClick={() => setSelectedStatusFilter('ongoing')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                selectedStatusFilter === 'ongoing'
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                  : 'text-emerald-400 hover:bg-emerald-500/10'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>Ongoing ({ongoingCount})</span>
            </button>

            <button
              onClick={() => setSelectedStatusFilter('upcoming')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                selectedStatusFilter === 'upcoming'
                  ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                  : 'text-amber-300 hover:bg-amber-500/10'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Upcoming ({upcomingCount})</span>
            </button>

            {endedCount > 0 && (
              <button
                onClick={() => setSelectedStatusFilter('ended')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  selectedStatusFilter === 'ended'
                    ? 'bg-rose-500 text-white font-black shadow-md'
                    : 'text-rose-400 hover:bg-rose-500/10'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Ended ({endedCount})</span>
              </button>
            )}
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Timer className="w-3.5 h-3.5 text-blue-400" />
            <span>Ended events automatically vanish after 1 minute</span>
          </div>
        </div>
      </div>

      {/* Sessions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activeSessionsWithStatus.map(({ session, status, countdownBadge }) => {
          const isSaved = bookmarkedSessionIds.includes(session.id);
          const poi = pois.find(p => p.id === session.locationId);

          return (
            <div
              key={session.id}
              className={`rounded-2xl border-2 p-5 transition-all flex flex-col justify-between relative shadow-lg ${
                status === 'ongoing'
                  ? 'bg-slate-900/90 border-emerald-500 ring-2 ring-emerald-500/20 shadow-emerald-500/10'
                  : status === 'ended'
                  ? 'bg-slate-950 border-rose-500/80 opacity-80'
                  : 'bg-slate-900/70 border-white/[0.1] hover:border-amber-500/50'
              }`}
            >
              <div>
                {/* PROMINENT TOP HEADER ROW WITH BOLD STATUS LABEL */}
                <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-white/[0.08]">
                  
                  {/* BOLD STATUS LABELS (IMPOSSIBLE TO MISS) */}
                  <div className="flex items-center space-x-2">
                    {status === 'ongoing' && (
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/40">
                        <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping"></span>
                        <span>ONGOING</span>
                        <span className="text-[10px] font-bold bg-slate-950/20 px-1.5 py-0.2 rounded ml-1">
                          {countdownBadge}
                        </span>
                      </span>
                    )}

                    {status === 'upcoming' && (
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow-md shadow-amber-400/40">
                        <Clock className="w-3.5 h-3.5" />
                        <span>UPCOMING</span>
                        <span className="text-[10px] font-bold bg-slate-950/20 px-1.5 py-0.2 rounded ml-1">
                          {countdownBadge}
                        </span>
                      </span>
                    )}

                    {status === 'ended' && (
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-600 text-white shadow-md shadow-rose-600/40 animate-pulse">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>ENDED</span>
                        <span className="text-[10px] font-bold bg-white/20 px-1.5 py-0.2 rounded ml-1">
                          {countdownBadge}
                        </span>
                      </span>
                    )}

                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-blue-500/15 text-blue-300 border border-blue-500/30">
                      {session.track}
                    </span>
                  </div>

                  {/* Scheduled Time Window */}
                  <div className="text-right">
                    <span className="text-xs font-bold text-white block">
                      {session.startTime} – {session.endTime}
                    </span>
                  </div>
                </div>

                {/* Session Title */}
                <h3 className="font-bold text-base text-white leading-snug">
                  {session.title}
                </h3>

                {/* Speaker Info */}
                <div className="flex items-center space-x-3 mt-3">
                  <img
                    src={session.speaker.avatar}
                    alt={session.speaker.name}
                    className="w-8 h-8 rounded-full object-cover border border-white/[0.15]"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-slate-200">{session.speaker.name}</span>
                    <span className="text-slate-400 text-[11px] block">
                      {session.speaker.role} • <strong className="text-slate-300">{session.speaker.company}</strong>
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 mt-2.5 line-clamp-2 leading-relaxed">
                  {session.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {session.tags.map((tag) => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded bg-slate-950 border border-white/[0.08] text-slate-400 font-medium">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card Footer: Location, Audio, Navigation, Bookmark */}
              <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs">
                <span className="text-slate-300 text-xs flex items-center gap-1.5 truncate max-w-[200px]">
                  <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span className="truncate font-medium">{poi?.name || 'Stage Area'}</span>
                </span>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => audioService.speak(`${session.title}. Current status: ${status}. Starting at ${session.startTime}. Presented by ${session.speaker.name}.`)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-950 border border-white/[0.08]"
                    title="Read session details"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onNavigateToSession(session.locationId)}
                    className="px-3 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/15 text-slate-200 text-xs font-semibold transition-colors"
                  >
                    Navigate
                  </button>

                  <button
                    onClick={() => handleBookmarkClick(session.id)}
                    className={`p-1.5 rounded-xl border transition-colors ${
                      isSaved
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'border-white/[0.08] bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                    title="Bookmark"
                  >
                    {isSaved ? <BookmarkCheck className="w-4 h-4 text-amber-400" /> : <Bookmark className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {activeSessionsWithStatus.length === 0 && (
        <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-white/[0.08] space-y-3">
          <p className="text-slate-300 text-sm font-medium">No sessions matching the selected filter.</p>
          <button
            onClick={() => setIsScheduleModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md"
          >
            + Schedule an Event Now
          </button>
        </div>
      )}

      {/* Schedule Event Modal */}
      <ScheduleEventModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        pois={pois}
        onAddSession={onAddSession}
      />
    </div>
  );
};
