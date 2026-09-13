import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  X, 
  Send, 
  Sparkles, 
  Mic, 
  MicOff, 
  Volume2, 
  ArrowRight, 
  Bot, 
  User, 
  Navigation,
  Compass
} from 'lucide-react';
import { ChatMessage, Persona } from '../types';
import { geminiService } from '../services/geminiService';
import { audioService } from '../services/audioService';

interface GeminiConciergeProps {
  activePersona: Persona;
  onNavigateToPoi: (poiId: string) => void;
  onTriggerSOS: () => void;
  onSwitchTab: (tab: any) => void;
}

export const GeminiConcierge: React.FC<GeminiConciergeProps> = ({
  activePersona,
  onNavigateToPoi,
  onTriggerSOS,
  onSwitchTab,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputQuery, setInputQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'assistant',
      text: `Hello ${activePersona.name}! I am Aura, your Google Gemini 2.0 Event Concierge. How can I guide you across the venue, sessions, dietary dining, or accessibility services today?`,
      timestamp: '10:00 AM',
      suggestedActions: [
        { label: 'Where is the Quiet Sanctuary?', action: 'NAVIGATE_TO_POI', payload: 'poi-quiet-room' },
        { label: 'Which talks focus on Gemini 2.0?', action: 'ASK_GEMINI_TALKS' },
        { label: 'Where can I get gluten-free lunch?', action: 'NAVIGATE_TO_POI', payload: 'poi-food-oasis' },
      ],
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognizerRef = useRef<any>(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const response = await geminiService.askConcierge(query, activePersona);

      const assistantMsg: ChatMessage = {
        id: `ast-${Date.now()}`,
        sender: 'assistant',
        text: response.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: response.suggestedAction ? [response.suggestedAction] : undefined,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Read answer if audio is enabled
      if (audioService.isAudioEnabled()) {
        audioService.speak(response.answer);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (actionObj: { label: string; action: string; payload?: any }) => {
    if (actionObj.action === 'NAVIGATE_TO_POI' && actionObj.payload) {
      onNavigateToPoi(actionObj.payload);
      onSwitchTab('map');
      setIsOpen(false);
    } else if (actionObj.action === 'TRIGGER_SOS') {
      onTriggerSOS();
      setIsOpen(false);
    } else if (actionObj.action === 'FILTER_SESSIONS') {
      onSwitchTab('schedule');
      setIsOpen(false);
    } else if (actionObj.action === 'TOGGLE_STEP_FREE') {
      onSwitchTab('map');
      setIsOpen(false);
    } else if (actionObj.action === 'ASK_GEMINI_TALKS') {
      handleSendMessage('What talks focus on Gemini 2.0?');
    }
  };

  const handleToggleVoiceInput = () => {
    if (isListening) {
      if (recognizerRef.current) {
        recognizerRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const recognizer = audioService.createSpeechRecognizer(
      (transcript) => {
        setInputQuery(transcript);
        setIsListening(false);
        handleSendMessage(transcript);
      },
      () => {
        setIsListening(false);
      }
    );

    if (recognizer) {
      recognizerRef.current = recognizer;
      recognizer.start();
      setIsListening(true);
    } else {
      alert('Speech Recognition is not supported by this browser. Please type your message.');
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center space-x-2 px-4 py-3 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-xs shadow-2xl shadow-indigo-500/40 border border-indigo-400 hover:scale-105 transition-all group"
          title="Open Gemini AI Event Concierge"
        >
          <Sparkles className="w-4 h-4 text-amber-300 animate-spin-slow" />
          <span>Ask Gemini Concierge</span>
        </button>
      )}

      {/* Chat Drawer / Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-full max-w-sm sm:max-w-md h-[550px] bg-slate-950 border border-indigo-500/40 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200">
          {/* Header */}
          <div className="p-4 bg-slate-900/90 border-b border-indigo-950/80 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
                <Sparkles className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                  <span>Aura Concierge</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Gemini 2.0 Flash
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Venue maps, sessions, dietary & emergency answers
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Message History */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-950/60">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start space-x-2.5 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                      isUser
                        ? 'bg-blue-600 text-white'
                        : 'bg-indigo-600/20 border border-indigo-500/40 text-indigo-300'
                    }`}
                  >
                    {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>

                  <div className={`max-w-[80%] space-y-1.5 ${isUser ? 'items-end' : ''}`}>
                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed ${
                        isUser
                          ? 'bg-blue-600 text-white rounded-tr-none'
                          : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none shadow-sm'
                      }`}
                    >
                      {msg.text}
                    </div>

                    {/* Suggested Action Pills */}
                    {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {msg.suggestedActions.map((act, i) => (
                          <button
                            key={i}
                            onClick={() => handleActionClick(act)}
                            className="text-[11px] px-2.5 py-1 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 text-indigo-200 border border-indigo-700/50 flex items-center gap-1.5 transition-all"
                          >
                            <Compass className="w-3 h-3 text-indigo-400" />
                            <span>{act.label}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="text-[10px] text-slate-500 px-1">
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center space-x-2 text-xs text-indigo-400 p-2">
                <Sparkles className="w-4 h-4 animate-spin-slow" />
                <span>Gemini is thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <div className="p-3 bg-slate-900/90 border-t border-slate-800">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center space-x-2"
            >
              {/* Mic Voice Button */}
              <button
                type="button"
                onClick={handleToggleVoiceInput}
                className={`p-2 rounded-xl border transition-all ${
                  isListening
                    ? 'bg-red-600 text-white border-red-500 animate-pulse'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
                title={isListening ? 'Listening... Speak now' : 'Voice Query (Microphone)'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Ask about rooms, food, sessions, directions..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />

              <button
                type="submit"
                disabled={!inputQuery.trim() || loading}
                className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white shadow-md transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
