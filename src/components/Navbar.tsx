import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  ShieldAlert, 
  Volume2, 
  VolumeX, 
  Eye, 
  Type, 
  Key, 
  Users, 
  LayoutDashboard, 
  Compass,
  Radio,
  SlidersHorizontal,
  ChevronDown,
  Settings2,
  Check
} from 'lucide-react';
import { Persona } from '../types';
import { PERSONA_PRESETS } from '../data/eventData';

interface NavbarProps {
  activePersona: Persona;
  onSelectPersona: (persona: Persona) => void;
  viewMode: 'attendee' | 'organizer';
  onToggleViewMode: (mode: 'attendee' | 'organizer') => void;
  highContrast: boolean;
  onToggleHighContrast: () => void;
  dyslexiaFont: boolean;
  onToggleDyslexiaFont: () => void;
  audioEnabled: boolean;
  onToggleAudio: () => void;
  onOpenSOS: () => void;
  onOpenApiKeyModal: () => void;
  activeTab: 'map' | 'schedule' | 'recommendations' | 'crowd' | 'accessibility';
  onChangeTab: (tab: 'map' | 'schedule' | 'recommendations' | 'crowd' | 'accessibility') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activePersona,
  onSelectPersona,
  viewMode,
  onToggleViewMode,
  highContrast,
  onToggleHighContrast,
  dyslexiaFont,
  onToggleDyslexiaFont,
  audioEnabled,
  onToggleAudio,
  onOpenSOS,
  onOpenApiKeyModal,
  activeTab,
  onChangeTab,
}) => {
  const [personaMenuOpen, setPersonaMenuOpen] = useState(false);
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const personaRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (personaRef.current && !personaRef.current.contains(e.target as Node)) {
        setPersonaMenuOpen(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navTabs = [
    { id: 'map', label: 'Venue Map', icon: Compass },
    { id: 'schedule', label: 'Schedule', icon: SlidersHorizontal },
    { id: 'recommendations', label: 'AI Itinerary', icon: Sparkles },
    { id: 'crowd', label: 'Crowd Flow', icon: Radio },
    { id: 'accessibility', label: 'Inclusivity', icon: Eye },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/80 backdrop-blur-xl border-b border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Left: Clean Brand */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm tracking-tight text-white">AuraVenue</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Gemini
              </span>
            </div>
            <span className="text-[11px] text-slate-400 hidden sm:block">
              Smart Event Experience
            </span>
          </div>
        </div>

        {/* Center: Clean Segmented Navigation Tabs (Attendee view) */}
        {viewMode === 'attendee' ? (
          <nav className="hidden md:flex items-center bg-slate-900/90 border border-white/[0.08] p-1 rounded-xl shadow-inner">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onChangeTab(tab.id as any)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        ) : (
          <div className="hidden md:flex items-center space-x-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-purple-950/60 border border-purple-500/30 text-purple-200">
            <LayoutDashboard className="w-4 h-4 text-purple-400" />
            <span>Event Operations Command Mode</span>
          </div>
        )}

        {/* Right Controls: Persona Dropdown, Settings, Organizer Switch, SOS */}
        <div className="flex items-center space-x-2 shrink-0">
          
          {/* Persona Switcher Dropdown */}
          <div className="relative" ref={personaRef}>
            <button
              onClick={() => setPersonaMenuOpen(!personaMenuOpen)}
              className="flex items-center space-x-2 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-white/[0.08] hover:border-white/20 text-xs font-medium text-slate-200 transition-all"
              title="Switch demo persona"
            >
              <span className="text-sm">{activePersona.avatar}</span>
              <span className="hidden lg:inline">{activePersona.name.split(' ')[0]}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {personaMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-800">
                  Select Guest Demo Persona
                </div>
                <div className="mt-1 space-y-1">
                  {PERSONA_PRESETS.map((p) => {
                    const isSelected = activePersona.id === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          onSelectPersona(p);
                          if (p.id === 'elena-organizer') {
                            onToggleViewMode('organizer');
                          } else if (viewMode === 'organizer') {
                            onToggleViewMode('attendee');
                          }
                          setPersonaMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors ${
                          isSelected
                            ? 'bg-blue-600/20 text-blue-200 border border-blue-500/30'
                            : 'text-slate-300 hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <span className="text-base">{p.avatar}</span>
                          <div>
                            <p className="font-semibold text-white">{p.name}</p>
                            <p className="text-[10px] text-slate-400">{p.role}</p>
                          </div>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Accessibility & Settings Popover */}
          <div className="relative" ref={settingsRef}>
            <button
              onClick={() => setSettingsMenuOpen(!settingsMenuOpen)}
              className="p-2 rounded-xl bg-slate-900 border border-white/[0.08] hover:border-white/20 text-slate-300 hover:text-white transition-all"
              title="Accessibility & Audio Options"
            >
              <Settings2 className="w-4 h-4" />
            </button>

            {settingsMenuOpen && (
              <div className="absolute right-0 mt-2 w-60 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-xs">
                <div className="px-2 py-1.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-800">
                  Universal Accessibility
                </div>
                <div className="py-2 space-y-1">
                  {/* TTS Voice Guidance */}
                  <button
                    onClick={onToggleAudio}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.04] text-slate-300"
                  >
                    <span className="flex items-center gap-2">
                      {audioEnabled ? <Volume2 className="w-4 h-4 text-blue-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
                      <span>Voice Guidance</span>
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${audioEnabled ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-800 text-slate-500'}`}>
                      {audioEnabled ? 'ON' : 'OFF'}
                    </span>
                  </button>

                  {/* High Contrast */}
                  <button
                    onClick={onToggleHighContrast}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.04] text-slate-300"
                  >
                    <span className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-amber-400" />
                      <span>High Contrast</span>
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${highContrast ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-500'}`}>
                      {highContrast ? 'ON' : 'OFF'}
                    </span>
                  </button>

                  {/* Dyslexia Typography */}
                  <button
                    onClick={onToggleDyslexiaFont}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.04] text-slate-300"
                  >
                    <span className="flex items-center gap-2">
                      <Type className="w-4 h-4 text-purple-400" />
                      <span>Dyslexia Font</span>
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${dyslexiaFont ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-800 text-slate-500'}`}>
                      {dyslexiaFont ? 'ON' : 'OFF'}
                    </span>
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <button
                    onClick={() => {
                      setSettingsMenuOpen(false);
                      onOpenApiKeyModal();
                    }}
                    className="w-full flex items-center space-x-2 p-2 rounded-lg hover:bg-indigo-950/40 text-indigo-300"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>Gemini API Key</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Organizer Mode Quick Switch */}
          <button
            onClick={() => onToggleViewMode(viewMode === 'attendee' ? 'organizer' : 'attendee')}
            className={`p-2 sm:px-3 sm:py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              viewMode === 'organizer'
                ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                : 'bg-slate-900 border-white/[0.08] text-slate-300 hover:text-white'
            }`}
            title="Toggle Organizer Operations View"
          >
            <span className="hidden sm:inline">{viewMode === 'organizer' ? 'Attendee Mode' : 'Organizer Ops'}</span>
            <LayoutDashboard className="w-4 h-4 sm:hidden" />
          </button>

          {/* Emergency SOS Button */}
          <button
            onClick={onOpenSOS}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md shadow-red-600/30 transition-transform active:scale-95"
            title="Emergency SOS Dispatch"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>SOS</span>
          </button>
        </div>
      </div>

      {/* Mobile Tab Bar (visible on small screens) */}
      {viewMode === 'attendee' && (
        <div className="md:hidden flex items-center space-x-1 overflow-x-auto px-4 py-2 bg-slate-900/60 border-t border-white/[0.06] scrollbar-none">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onChangeTab(tab.id as any)}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
