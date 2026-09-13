import React, { useState } from 'react';
import { Key, X, CheckCircle2, Sparkles, ExternalLink, ShieldCheck } from 'lucide-react';
import { geminiService } from '../services/geminiService';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose }) => {
  const [apiKeyInput, setApiKeyInput] = useState(geminiService.getApiKey());
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    geminiService.setApiKey(apiKeyInput);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1000);
  };

  const handleClear = () => {
    geminiService.setApiKey('');
    setApiKeyInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-950 border border-indigo-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                Google Gemini API Settings
              </h3>
              <p className="text-[11px] text-slate-400">
                Zero-barrier evaluation & live API key toggle
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-xs">
          {/* Zero barrier callout */}
          <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-800/40 text-indigo-200 space-y-1.5">
            <div className="flex items-center space-x-1.5 font-bold text-indigo-300">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>100% Functional Without Any API Key!</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              AuraVenue includes a built-in neural simulation engine modeled on Gemini 2.0 Flash that handles personalized itineraries, emergency triage, and concierge Q&A out of the box.
            </p>
          </div>

          <div>
            <label className="font-semibold text-slate-300 block mb-1.5">
              Live Google Gemini API Key (Optional):
            </label>
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              Stored safely in local browser storage for your session.
            </span>
          </div>

          <div className="flex items-center justify-between pt-2">
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 text-[11px] flex items-center gap-1 font-medium"
            >
              <span>Get a Gemini Key from Google AI Studio</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            {geminiService.hasApiKey() && (
              <button
                type="button"
                onClick={handleClear}
                className="text-slate-400 hover:text-red-400 text-[11px]"
              >
                Clear Key
              </button>
            )}
          </div>

          <div className="pt-2 flex items-center space-x-2">
            <button
              onClick={handleSave}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-500/25 transition-all"
            >
              {saved ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save API Preference</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
