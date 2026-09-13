import React, { useState, useEffect } from 'react';
import { 
  Navbar 
} from './components/Navbar';
import { 
  InteractiveMap 
} from './components/InteractiveMap';
import { 
  ScheduleDiscovery 
} from './components/ScheduleDiscovery';
import { 
  PersonalizedRecommendations 
} from './components/PersonalizedRecommendations';
import { 
  CrowdCoordinator 
} from './components/CrowdCoordinator';
import { 
  AccessibilitySuite 
} from './components/AccessibilitySuite';
import { 
  GeminiConcierge 
} from './components/GeminiConcierge';
import { 
  OrganizerDashboard 
} from './components/OrganizerDashboard';
import { 
  SOSModal 
} from './components/SOSModal';
import { 
  ApiKeyModal 
} from './components/ApiKeyModal';
import { 
  BroadcastBanner 
} from './components/BroadcastBanner';

import { 
  INITIAL_ZONES, 
  INITIAL_POIS, 
  INITIAL_SESSIONS, 
  INITIAL_ANNOUNCEMENTS, 
  INITIAL_SOS_ALERTS, 
  PERSONA_PRESETS,
  EVENT_DETAILS
} from './data/eventData';
import { Persona, Zone, POI, Session, Announcement, SOSAlert } from './types';
import { audioService } from './services/audioService';

export function App() {
  // App State
  const [activePersona, setActivePersona] = useState<Persona>(PERSONA_PRESETS[0]);
  const [viewMode, setViewMode] = useState<'attendee' | 'organizer'>('attendee');
  const [activeTab, setActiveTab] = useState<'map' | 'schedule' | 'recommendations' | 'crowd' | 'accessibility'>('map');
  
  // Accessibility & Visual Themes
  const [highContrast, setHighContrast] = useState(false);
  const [dyslexiaFont, setDyslexiaFont] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);

  // Core Event Datasets
  const [zones, setZones] = useState<Zone[]>(INITIAL_ZONES);
  const [pois, setPois] = useState<POI[]>(INITIAL_POIS);
  const [sessions, setSessions] = useState<Session[]>(INITIAL_SESSIONS);
  const [announcements, setAnnouncements] = useState<Announcement[]>(INITIAL_ANNOUNCEMENTS);
  const [sosAlerts, setSosAlerts] = useState<SOSAlert[]>(INITIAL_SOS_ALERTS);
  const [bookmarkedSessionIds, setBookmarkedSessionIds] = useState<string[]>(['ses-1', 'ses-2']);

  // Modals & Navigation Target
  const [selectedPoiId, setSelectedPoiId] = useState<string | null>('poi-main-stage');
  const [isSOSOpen, setIsSOSOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  // Sync persona accessibility defaults
  const handleSelectPersona = (persona: Persona) => {
    setActivePersona(persona);
    if (persona.accessibilityNeeds.highContrast) {
      setHighContrast(true);
    }
    if (persona.accessibilityNeeds.wheelchair) {
      // Prioritize map navigation with step-free active
      setActiveTab('map');
    }
  };

  const handleToggleAudio = () => {
    const next = !audioEnabled;
    setAudioEnabled(next);
    audioService.setAudioEnabled(next);
  };

  const handleToggleBookmark = (sessionId: string) => {
    setBookmarkedSessionIds(prev => 
      prev.includes(sessionId) ? prev.filter(id => id !== sessionId) : [...prev, sessionId]
    );
  };

  // Cross-component navigation helper
  const handleNavigateToPoi = (poiId: string) => {
    setSelectedPoiId(poiId);
    setActiveTab('map');
    if (viewMode === 'organizer') {
      setViewMode('attendee');
    }
  };

  const handleBroadcastAnnouncement = (newAnn: Omit<Announcement, 'id' | 'timestamp'>) => {
    const fullAnn: Announcement = {
      ...newAnn,
      id: `ann-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setAnnouncements(prev => [fullAnn, ...prev]);
  };

  const handleCreateSOSAlert = (newAlert: Omit<SOSAlert, 'id' | 'timestamp'>) => {
    const fullAlert: SOSAlert = {
      ...newAlert,
      id: `sos-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      assignedResponder: 'Emergency Command Unit 1',
    };
    setSosAlerts(prev => [fullAlert, ...prev]);
  };

  const handleUpdateSOSStatus = (id: string, status: SOSAlert['status']) => {
    setSosAlerts(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  const handleAddSession = (newSession: Session) => {
    setSessions(prev => [newSession, ...prev]);
  };

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white ${
      highContrast ? 'high-contrast' : ''
    } ${dyslexiaFont ? 'dyslexia-font' : ''}`}>
      {/* Top Real-Time Announcement Banner */}
      <BroadcastBanner announcements={announcements} />

      {/* Main Responsive Header / Navigation Bar */}
      <Navbar
        activePersona={activePersona}
        onSelectPersona={handleSelectPersona}
        viewMode={viewMode}
        onToggleViewMode={setViewMode}
        highContrast={highContrast}
        onToggleHighContrast={() => setHighContrast(!highContrast)}
        dyslexiaFont={dyslexiaFont}
        onToggleDyslexiaFont={() => setDyslexiaFont(!dyslexiaFont)}
        audioEnabled={audioEnabled}
        onToggleAudio={handleToggleAudio}
        onOpenSOS={() => setIsSOSOpen(true)}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
      />

      {/* Main Application Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {viewMode === 'organizer' ? (
          /* Organizer Executive Command Center */
          <OrganizerDashboard
            zones={zones}
            sosAlerts={sosAlerts}
            announcements={announcements}
            onBroadcastAnnouncement={handleBroadcastAnnouncement}
            onUpdateSOSStatus={handleUpdateSOSStatus}
          />
        ) : (
          /* Attendee Tabs */
          <>
            {activeTab === 'map' && (
              <InteractiveMap
                zones={zones}
                pois={pois}
                selectedPoiId={selectedPoiId}
                onSelectPoi={(p) => setSelectedPoiId(p ? p.id : null)}
                stepFreeRequired={activePersona.accessibilityNeeds.wheelchair}
                onNavigateToPoi={handleNavigateToPoi}
              />
            )}

            {activeTab === 'schedule' && (
              <ScheduleDiscovery
                sessions={sessions}
                pois={pois}
                bookmarkedSessionIds={bookmarkedSessionIds}
                onToggleBookmark={handleToggleBookmark}
                onNavigateToSession={handleNavigateToPoi}
                onAddSession={handleAddSession}
              />
            )}

            {activeTab === 'recommendations' && (
              <PersonalizedRecommendations
                persona={activePersona}
                sessions={sessions}
                pois={pois}
                bookmarkedSessionIds={bookmarkedSessionIds}
                onToggleBookmark={handleToggleBookmark}
                onNavigateToPoi={handleNavigateToPoi}
              />
            )}

            {activeTab === 'crowd' && (
              <CrowdCoordinator
                zones={zones}
                onNavigateToZone={(zoneId) => {
                  const targetPoi = pois.find(p => p.zoneId === zoneId) || pois[0];
                  handleNavigateToPoi(targetPoi.id);
                }}
              />
            )}

            {activeTab === 'accessibility' && (
              <AccessibilitySuite
                pois={pois}
                onNavigateToPoi={handleNavigateToPoi}
              />
            )}
          </>
        )}
      </main>

      {/* Floating Gemini Event Concierge Assistant */}
      <GeminiConcierge
        activePersona={activePersona}
        onNavigateToPoi={handleNavigateToPoi}
        onTriggerSOS={() => setIsSOSOpen(true)}
        onSwitchTab={setActiveTab}
      />

      {/* Emergency SOS Modal */}
      <SOSModal
        isOpen={isSOSOpen}
        onClose={() => setIsSOSOpen(false)}
        onSubmitSOS={handleCreateSOSAlert}
        onShowFirstAidOnMap={() => handleNavigateToPoi('poi-medical-hub')}
        onShowExitOnMap={() => handleNavigateToPoi('poi-emergency-exit-west')}
      />

      {/* Google Gemini API Key Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
      />

      {/* Footer & Event Metadata */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 text-xs text-slate-500 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-400">AuraVenue AI</span>
            <span>• Built for PromptWars x Hack Sprint with Google for Developers</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-slate-400">
            <span>Powered by <strong>Google Gemini 2.0 Flash</strong></span>
            <span>• 100% Zero-Barrier Guest Access</span>
            <span>• WCAG AAA Accessible</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
