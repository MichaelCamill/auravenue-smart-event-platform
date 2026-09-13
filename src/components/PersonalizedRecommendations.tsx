import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  BrainCircuit, 
  CheckCircle2, 
  CalendarPlus, 
  RefreshCw, 
  Users, 
  Compass
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Persona, Session, POI } from '../types';
import { geminiService } from '../services/geminiService';
import { audioService } from '../services/audioService';

interface PersonalizedRecommendationsProps {
  persona: Persona;
  sessions: Session[];
  pois: POI[];
  bookmarkedSessionIds: string[];
  onToggleBookmark: (sessionId: string) => void;
  onNavigateToPoi: (poiId: string) => void;
}

export const PersonalizedRecommendations: React.FC<PersonalizedRecommendationsProps> = ({
  persona,
  sessions,
  pois,
  bookmarkedSessionIds,
  onToggleBookmark,
  onNavigateToPoi,
}) => {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<{
    recommendedSessionIds: string[];
    itineraryOverview: string;
    personalizedReasoning: Record<string, string>;
    networkingAdvice: string;
  } | null>(null);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const res = await geminiService.getPersonalizedRecommendations(persona, sessions);
      setRecommendations(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [persona]);

  const handleAddAllToSchedule = () => {
    if (!recommendations) return;
    recommendations.recommendedSessionIds.forEach(id => {
      if (!bookmarkedSessionIds.includes(id)) {
        onToggleBookmark(id);
      }
    });
    confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
    audioService.playAlertChime('success');
  };

  return (
    <div className="space-y-4">
      {/* Persona Context Card */}
      <div className="bg-slate-900/70 border border-white/[0.08] rounded-2xl p-4 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <span className="text-2xl p-2 rounded-xl bg-slate-950 border border-white/[0.08]">
              {persona.avatar}
            </span>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base text-white">{persona.name}</h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold">
                  {persona.role}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{persona.bio}</p>
            </div>
          </div>

          <button
            onClick={fetchRecommendations}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-950 border border-white/[0.08] text-slate-300 hover:text-white transition-colors self-start sm:self-auto shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Regenerate AI Itinerary</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center bg-slate-900/40 rounded-2xl border border-white/[0.06] flex flex-col items-center justify-center space-y-2">
          <BrainCircuit className="w-8 h-8 text-indigo-400 animate-pulse" />
          <p className="text-xs text-slate-300 font-medium">
            Gemini is curating your personalized agenda...
          </p>
        </div>
      ) : recommendations ? (
        <div className="space-y-4">
          {/* AI Overview Box */}
          <div className="bg-slate-900/50 border border-indigo-500/20 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Gemini 2.0 Strategic Focus
              </span>
              <button
                onClick={handleAddAllToSchedule}
                className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
              >
                <CalendarPlus className="w-3.5 h-3.5" />
                <span>Save All to Agenda</span>
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {recommendations.itineraryOverview}
            </p>

            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/[0.04] text-xs text-indigo-200 flex items-start space-x-2">
              <Users className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
              <span><strong>Networking Suggestion: </strong>{recommendations.networkingAdvice}</span>
            </div>
          </div>

          {/* Recommended Session Cards */}
          <div className="space-y-2.5">
            {recommendations.recommendedSessionIds.map((sessionId, index) => {
              const session = sessions.find(s => s.id === sessionId);
              if (!session) return null;
              const poi = pois.find(p => p.id === session.locationId);
              const isSaved = bookmarkedSessionIds.includes(session.id);
              const reason = recommendations.personalizedReasoning[sessionId];

              return (
                <div
                  key={sessionId}
                  className="bg-slate-900/60 border border-white/[0.06] hover:border-white/10 rounded-2xl p-4 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center space-x-2 text-xs">
                      <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px] font-bold">
                        {index + 1}
                      </span>
                      <span className="text-[10px] font-bold uppercase text-blue-400">
                        {session.track}
                      </span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-400 text-[11px]">{session.startTime}</span>
                    </div>

                    <h4 className="font-bold text-sm text-white">{session.title}</h4>
                    <p className="text-xs text-slate-400">
                      {session.speaker.name} ({session.speaker.company}) • {poi?.name}
                    </p>

                    {reason && (
                      <p className="text-[11px] text-purple-300 bg-purple-950/30 border border-purple-900/30 p-2 rounded-lg leading-relaxed mt-1">
                        <strong>Match Reason:</strong> {reason}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 shrink-0 self-end md:self-center">
                    <button
                      onClick={() => onNavigateToPoi(session.locationId)}
                      className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/10 text-xs font-medium text-slate-200 transition-colors"
                    >
                      Directions
                    </button>
                    <button
                      onClick={() => onToggleBookmark(session.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        isSaved
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-blue-600 hover:bg-blue-500 text-white'
                      }`}
                    >
                      {isSaved ? 'Saved ✓' : '+ Save'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
};
