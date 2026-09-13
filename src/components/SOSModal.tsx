import React, { useState } from 'react';
import { 
  ShieldAlert, 
  X, 
  PhoneCall, 
  MapPin, 
  HeartHandshake, 
  Accessibility, 
  AlertOctagon, 
  Send, 
  CheckCircle2, 
  Sparkles, 
  HelpCircle,
  Clock,
  Radio
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SOSAlert, ZoneId } from '../types';
import { EVENT_DETAILS } from '../data/eventData';
import { geminiService } from '../services/geminiService';
import { audioService } from '../services/audioService';

interface SOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSOS: (newAlert: Omit<SOSAlert, 'id' | 'timestamp'>) => void;
  onShowFirstAidOnMap: () => void;
  onShowExitOnMap: () => void;
}

export const SOSModal: React.FC<SOSModalProps> = ({
  isOpen,
  onClose,
  onSubmitSOS,
  onShowFirstAidOnMap,
  onShowExitOnMap,
}) => {
  const [selectedType, setSelectedType] = useState<SOSAlert['type']>('medical');
  const [locationZone, setLocationZone] = useState<ZoneId>('atrium');
  const [specificDetails, setSpecificDetails] = useState('');
  const [submittedAlert, setSubmittedAlert] = useState<SOSAlert | null>(null);
  const [triageSteps, setTriageSteps] = useState<string[]>([]);
  const [loadingTriage, setLoadingTriage] = useState(false);

  if (!isOpen) return null;

  const handleTriggerSOS = async () => {
    audioService.playAlertChime('sos');
    setLoadingTriage(true);

    const alertData: Omit<SOSAlert, 'id' | 'timestamp'> = {
      type: selectedType,
      location: `Zone: ${locationZone}`,
      zoneId: locationZone,
      reportedBy: 'Attendee (Self-Reported SOS)',
      status: 'dispatched',
      severity: selectedType === 'medical' || selectedType === 'security' ? 'critical' : 'medium',
      details: specificDetails || `Immediate assistance requested for ${selectedType} situation.`,
    };

    // Get Gemini triage advice
    const advice = await geminiService.getEmergencyTriage(selectedType, specificDetails || 'Immediate assistance requested');
    setTriageSteps(advice);
    setLoadingTriage(false);

    const fullAlert: SOSAlert = {
      ...alertData,
      id: `sos-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      geminiTriageAdvice: advice,
      assignedResponder: 'Ground Response Unit #3 (Dispatched)',
    };

    setSubmittedAlert(fullAlert);
    onSubmitSOS(alertData);

    // Speak triage guidance aloud
    audioService.speak(`Emergency alert dispatched. First aid and ground stewards are en route. Please follow these steps: ${advice[0]}`);
  };

  const resetForm = () => {
    setSubmittedAlert(null);
    setTriageSteps([]);
    setSpecificDetails('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-950 border-2 border-red-500/80 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Glowing Red Emergency Aura */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-red-600/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-red-900/40 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-red-600 text-white shadow-lg shadow-red-600/40">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">
                Emergency & Safety SOS
              </h2>
              <p className="text-xs text-red-400 font-medium">
                Immediate Incident Dispatch & Gemini Triage
              </p>
            </div>
          </div>
          <button
            onClick={resetForm}
            className="p-1.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submittedAlert ? (
          /* Confirmation & Triage Screen */
          <div className="mt-5 space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 flex items-start space-x-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-sm text-emerald-300">
                  SOS Beacon Broadcasted!
                </h3>
                <p className="text-xs mt-1 text-emerald-300/80">
                  Incident #{submittedAlert.id} dispatched to Venue Security & Medical Command.
                  Responder ETA: <strong className="text-white">~90 seconds</strong>.
                </p>
              </div>
            </div>

            {/* Gemini Live Triage Guidance */}
            <div className="bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-4 space-y-3">
              <div className="flex items-center space-x-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Google Gemini Emergency Triage Protocol</span>
              </div>
              <div className="space-y-2">
                {triageSteps.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 flex items-start gap-2.5"
                  >
                    <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-300 flex items-center justify-center shrink-0 font-bold text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => {
                  resetForm();
                  onShowFirstAidOnMap();
                }}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <MapPin className="w-4 h-4 text-pink-400" />
                <span>Show First Aid Station</span>
              </button>
              <button
                onClick={() => {
                  resetForm();
                  onShowExitOnMap();
                }}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <AlertOctagon className="w-4 h-4 text-amber-400" />
                <span>Show Nearest Exit</span>
              </button>
            </div>

            <button
              onClick={resetForm}
              className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg transition-all"
            >
              Close & Keep Alert Active
            </button>
          </div>
        ) : (
          /* Input Form */
          <div className="mt-5 space-y-4">
            {/* Direct Phone Call Strip */}
            <div className="p-3 rounded-2xl bg-red-950/30 border border-red-800/40 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2 text-red-200">
                <PhoneCall className="w-4 h-4 text-red-400" />
                <span>Direct Hot-Line:</span>
                <strong className="text-white">{EVENT_DETAILS.emergencyNumber}</strong>
              </div>
              <a
                href={`tel:${EVENT_DETAILS.emergencyNumber}`}
                className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-[11px]"
              >
                Call Now
              </a>
            </div>

            {/* Emergency Type Selector */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2">
                Select Nature of Emergency:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'medical', label: '🚑 Medical / Injury', desc: 'Fainting, trauma, breathing issue' },
                  { id: 'accessibility', label: '♿ Accessibility Obstacle', desc: 'Ramp broken, elevator stuck' },
                  { id: 'security', label: '🚨 Safety & Security', desc: 'Harassment, threat, suspicious item' },
                  { id: 'facility', label: '⚠️ Hazard / Spill / Fire', desc: 'Water leak, smoke, exposed wire' },
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setSelectedType(type.id as any)}
                    className={`p-3 rounded-xl text-left border transition-all ${
                      selectedType === type.id
                        ? 'bg-red-900/40 border-red-500 text-white shadow-md'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="font-bold text-xs">{type.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{type.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Zone Selector */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Your Current Approximate Location:
              </label>
              <select
                value={locationZone}
                onChange={(e) => setLocationZone(e.target.value as ZoneId)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:ring-2 focus:ring-red-500 focus:outline-none"
              >
                <option value="hall-a">Hall A: Main Keynote & Vision Arena</option>
                <option value="hall-b">Hall B: Google AI & Gemini Stage</option>
                <option value="hall-c">Hall C: Startup Expo</option>
                <option value="atrium">Central Glass Atrium & ByteBar</option>
                <option value="food-court">Food Oasis & Refreshments</option>
                <option value="quiet-zone">Sensory Quiet Sanctuary</option>
                <option value="registration">Main Welcome Desk</option>
              </select>
            </div>

            {/* Specific details */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Additional Details (Optional):
              </label>
              <textarea
                value={specificDetails}
                onChange={(e) => setSpecificDetails(e.target.value)}
                placeholder="E.g., Attendee collapsed near entrance 3, or Wheelchair ramp blocked by cabling..."
                rows={2}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder:text-slate-500 focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
            </div>

            {/* Big Dispatch SOS Button */}
            <button
              onClick={handleTriggerSOS}
              disabled={loadingTriage}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white font-black text-sm tracking-wide shadow-xl shadow-red-600/40 border border-red-400 transition-all flex items-center justify-center space-x-2"
            >
              <Radio className="w-5 h-5 animate-pulse" />
              <span>{loadingTriage ? 'TRANSMITTING BEACON...' : 'TRANSMIT EMERGENCY SOS BEACON'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
