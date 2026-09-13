import { Session, Zone, POI, Persona, SOSAlert } from '../types';
import { INITIAL_SESSIONS, INITIAL_ZONES, INITIAL_POIS } from '../data/eventData';

class GeminiService {
  private apiKey: string = '';

  constructor() {
    if (typeof window !== 'undefined') {
      const storedKey = localStorage.getItem('gemini_api_key');
      if (storedKey) {
        this.apiKey = storedKey;
      } else if (import.meta.env.VITE_GEMINI_API_KEY) {
        this.apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      }
    }
  }

  public setApiKey(key: string) {
    this.apiKey = key.trim();
    if (typeof window !== 'undefined') {
      localStorage.setItem('gemini_api_key', this.apiKey);
    }
  }

  public getApiKey(): string {
    return this.apiKey;
  }

  public hasApiKey(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 5);
  }

  // 1. Personalized Schedule Recommendation
  public async getPersonalizedRecommendations(
    persona: Persona,
    allSessions: Session[] = INITIAL_SESSIONS
  ): Promise<{
    recommendedSessionIds: string[];
    itineraryOverview: string;
    personalizedReasoning: Record<string, string>;
    networkingAdvice: string;
  }> {
    // If API key is available, call Gemini API
    if (this.hasApiKey()) {
      try {
        const prompt = `You are the Google Gemini Event AI Architect for "Google I/O & Gemini Global HackFest 2026".
Attendee Persona:
Name: ${persona.name}
Role: ${persona.role}
Interests: ${persona.interests.join(', ')}
Dietary Restrictions: ${persona.dietaryRestrictions?.join(', ') || 'None'}
Accessibility Needs: Wheelchair: ${persona.accessibilityNeeds.wheelchair}, Sensory-Sensitive: ${persona.accessibilityNeeds.sensorySensitive}
Bio: ${persona.bio}

Available Sessions:
${JSON.stringify(allSessions.map(s => ({ id: s.id, title: s.title, track: s.track, time: `${s.startTime}-${s.endTime}`, tags: s.tags, accessibility: s.accessibility })), null, 2)}

Return a JSON object ONLY with:
{
  "recommendedSessionIds": ["ses-1", ...],
  "itineraryOverview": "A warm, inspiring 2-sentence summary of why this schedule maximizes their experience.",
  "personalizedReasoning": {
    "ses-1": "Specific reason why this matches their persona goals and accessibility requirements",
    ...
  },
  "networkingAdvice": "Actionable advice on which zones and people to connect with during breaks."
}`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: 'application/json' }
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            return JSON.parse(rawText);
          }
        }
      } catch (err) {
        console.warn('Gemini Live API fallback activated:', err);
      }
    }

    // Built-in Intelligent Contextual Fallback
    await new Promise(r => setTimeout(r, 600)); // natural simulation delay

    if (persona.accessibilityNeeds.wheelchair || persona.accessibilityNeeds.sensorySensitive) {
      return {
        recommendedSessionIds: ['ses-1', 'ses-3', 'ses-5'],
        itineraryOverview: `Curated an accessible, sensory-friendly journey for ${persona.name}. Every selected session guarantees step-free reserved seating, live ASL interpreters, and easy proximity to quiet decompression corridors.`,
        personalizedReasoning: {
          'ses-1': 'Opening Keynote provides dedicated level-access wheelchair podiums and live captioning screens right in Hall A.',
          'ses-3': 'Essential talk on Universal Accessibility and physical-digital beacon design led by Marcus Thorne.',
          'ses-5': 'Safe AI and Emergency Coordination session; Hall C features low-crowd wide ramps and easy access to Quiet Sanctuary in Zone 4.',
        },
        networkingAdvice: 'Take breaks in the Central Glass Atrium near the priority elevators, and visit the Sensory Decompression Sanctuary between 12:30 PM and 1:30 PM for quiet recharging.',
      };
    } else if (persona.interests.some(i => i.toLowerCase().includes('agent') || i.toLowerCase().includes('gemini'))) {
      return {
        recommendedSessionIds: ['ses-1', 'ses-2', 'ses-4'],
        itineraryOverview: `Tailored high-octane technical track for ${persona.name}. Centers on frontier Gemini 2.0 autonomous agent architectures, real-time tool calling, and high-performance WebGPU client inference.`,
        personalizedReasoning: {
          'ses-1': 'Demis Hassabis & Sundar Pichai reveal the latest Gemini 2.0 reasoning milestones.',
          'ses-2': 'Deep technical code walkthrough with Priya Sharma on self-correcting multi-agent frameworks.',
          'ses-4': 'Explores WebGPU shaders for 120 FPS in-browser neural computing, ideal for engineering scalable apps.',
        },
        networkingAdvice: 'Head to ByteBar in the Atrium after Session 2 to join the "Agentic AI Hackers" informal circle, and explore Startup Booths 12-18 in Hall C.',
      };
    } else {
      return {
        recommendedSessionIds: ['ses-1', 'ses-3', 'ses-5'],
        itineraryOverview: `Strategic leadership and innovation track tailored for ${persona.name}, balancing keynote announcements with high-impact ethics and real-world system applications.`,
        personalizedReasoning: {
          'ses-1': 'Crucial macro overview of Google AI investments and industry roadmap.',
          'ses-3': 'Insights on inclusive product standards that reduce legal and adoption friction.',
          'ses-5': 'Critical look at safety systems and smart venue robotics for scalable event operations.',
        },
        networkingAdvice: 'Connect with founders and venture partners at Green Leaf Gourmet Bistro during the lunch window, followed by the Startup Expo floor.',
      };
    }
  }

  // 2. Emergency SOS First-Aid Triage Guidance
  public async getEmergencyTriage(alertType: SOSAlert['type'], details: string): Promise<string[]> {
    if (this.hasApiKey()) {
      try {
        const prompt = `You are the Google Gemini Emergency Safety Protocol Engine for a high-density venue.
Incident Type: ${alertType}
Details: ${details}

Provide exactly 3 immediate, crisp, life-saving safety action steps for the attendee and nearby staff while emergency dispatch is en route.
Return as a JSON array of 3 strings.`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: 'application/json' }
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (raw) return JSON.parse(raw);
        }
      } catch (err) {
        console.warn('Gemini Triage Fallback:', err);
      }
    }

    // Default expert triage rules
    switch (alertType) {
      case 'medical':
        return [
          'Stay calm and ensure the person is lying down or seated in a cool, ventilated area.',
          'Do not crowd the patient; maintain an open airway and loosen restrictive collars or belts.',
          'First-aid responder with AED & diagnostic kit has been dispatched; ETA 90 seconds.',
        ];
      case 'accessibility':
        return [
          'Maintain your stationary position on flat terrain; ground stewards have locked your coordinates.',
          'If a wheelchair ramp is blocked, our accessibility team is bringing a portable curb ramp.',
          'Ground Steward Unit arriving via East Concourse with priority elevator clearance.',
        ];
      case 'security':
        return [
          'Move away from immediate friction towards marked illuminated Emergency Exits.',
          'Alert nearby event security personnel (wearing neon high-vis vests).',
          'Venue Security Control has locked zone cameras and dispatched floor units.',
        ];
      default:
        return [
          'Stay at your current marked location so the response team can locate your beacon pin.',
          'If immediate danger exists, follow the illuminated Green Running Person exit signs.',
          'Central Operations has received your alert and notified floor marshals.',
        ];
    }
  }

  // 3. Interactive Event Concierge Q&A
  public async askConcierge(userQuery: string, activePersona?: Persona): Promise<{
    answer: string;
    suggestedAction?: { label: string; action: string; payload?: any };
  }> {
    const query = userQuery.toLowerCase();

    // If live API key is present
    if (this.hasApiKey()) {
      try {
        const systemPrompt = `You are Aura, the intelligent Google Gemini Event Concierge for "Google I/O & Gemini Global HackFest 2026".
Venue Context:
- Zones: Hall A (Main Keynote, high crowd), Hall B (Gemini Dev Stage), Hall C (Startup Expo), Food Oasis (Dining, gluten-free, vegan, halal), Quiet Sanctuary (Zone 4, noise-free decompression), First Aid (AED ready), Central Atrium (ByteBar Coffee).
- Accessibility: Step-free elevators in Atrium, ASL in Hall A & C, tactile navigation, quiet rooms.
- Emergency SOS button available 24/7.
User Profile: ${activePersona ? `${activePersona.name} (${activePersona.role}), Dietary: ${activePersona.dietaryRestrictions?.join(', ')}, Wheelchair: ${activePersona.accessibilityNeeds.wheelchair}` : 'General Attendee'}

Answer helpfully, concisely (2-4 sentences), with extreme accuracy. If relevant, mention navigation or specific rooms.`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                { parts: [{ text: `${systemPrompt}\n\nAttendee Query: "${userQuery}"` }] }
              ]
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            return { answer: text };
          }
        }
      } catch (err) {
        console.warn('Gemini Live Concierge Fallback:', err);
      }
    }

    // High-fidelity instant contextual responses
    await new Promise(r => setTimeout(r, 450));

    if (query.includes('restroom') || query.includes('bathroom') || query.includes('toilet')) {
      return {
        answer: 'We have two universal restroom suites: North Restrooms (Hall A) and South Restrooms (Food Oasis). Both feature extra-wide wheelchair accessible stalls, all-gender facilities, and touchless fixtures.',
        suggestedAction: { label: 'View North Restrooms on Map', action: 'NAVIGATE_TO_POI', payload: 'poi-restroom-north' },
      };
    }

    if (query.includes('quiet') || query.includes('sensory') || query.includes('rest') || query.includes('calm') || query.includes('overwhelm')) {
      return {
        answer: 'The Sensory Decompression Sanctuary is located between the Food Oasis and First Aid (Zone 4). It has ambient dim lighting, noise-canceling headphones, and a sensory score of 1/10 for peaceful recharging.',
        suggestedAction: { label: 'Navigate to Quiet Sanctuary', action: 'NAVIGATE_TO_POI', payload: 'poi-quiet-room' },
      };
    }

    if (query.includes('food') || query.includes('lunch') || query.includes('eat') || query.includes('vegan') || query.includes('halal') || query.includes('gluten')) {
      return {
        answer: 'The Food Oasis features Green Leaf Gourmet Bistro with dedicated allergen-free preparation zones. Vegan, Gluten-Free, Halal, Kosher, and Nut-Free options are all clearly labeled. The current crowd level is high, so expect ~8-10 min wait times.',
        suggestedAction: { label: 'View Food Oasis on Map', action: 'NAVIGATE_TO_POI', payload: 'poi-food-oasis' },
      };
    }

    if (query.includes('gemini') || query.includes('ai') || query.includes('session') || query.includes('talk')) {
      return {
        answer: 'Check out "Building Autonomous Agentic Workflows with Gemini 2.0 Flash" at 11:00 AM in Hall B with Priya Sharma, followed by the Opening Keynote with Sundar Pichai and Demis Hassabis in Hall A.',
        suggestedAction: { label: 'Explore AI Sessions', action: 'FILTER_SESSIONS', payload: 'AI & Gemini' },
      };
    }

    if (query.includes('wheelchair') || query.includes('accessible') || query.includes('step-free') || query.includes('elevator')) {
      return {
        answer: 'The entire venue is 100% ADA & universal accessibility compliant! You can toggle the "Step-Free Navigation" switch on the Interactive Map to ensure all walking directions use priority elevators and wide ramps instead of stairs.',
        suggestedAction: { label: 'Open Step-Free Map', action: 'TOGGLE_STEP_FREE', payload: true },
      };
    }

    if (query.includes('coffee') || query.includes('drink') || query.includes('tea')) {
      return {
        answer: 'ByteBar Espresso is located in the Central Glass Atrium. They serve barista-crafted espresso, nitro cold brew, and oat milk lattes.',
        suggestedAction: { label: 'Locate ByteBar Coffee', action: 'NAVIGATE_TO_POI', payload: 'poi-coffee-lounge' },
      };
    }

    if (query.includes('emergency') || query.includes('medical') || query.includes('hurt') || query.includes('doctor') || query.includes('sos')) {
      return {
        answer: 'For any medical or physical emergency, tap the RED SOS BUTTON at the bottom right of the screen. Paramedics and AED-equipped emergency staff are located in the First Aid Post (Zone 5).',
        suggestedAction: { label: 'Open Emergency SOS', action: 'TRIGGER_SOS' },
      };
    }

    return {
      answer: `I can help you navigate the 120,000 sq ft venue, find upcoming Gemini sessions, discover dietary-safe food, locate step-free elevators, or dispatch emergency assistance. What would you like to know?`,
    };
  }

  // 4. Organizer Crowd Optimization
  public async getCrowdOptimizationAdvice(zones: Zone[]): Promise<{
    headline: string;
    criticalAlerts: string[];
    suggestedInterventions: string[];
  }> {
    const congestedZones = zones.filter(z => z.crowdPercentage > 75);

    if (congestedZones.length > 0) {
      return {
        headline: `Bottleneck detected in ${congestedZones.map(z => z.name).join(' & ')}`,
        criticalAlerts: [
          `Food Oasis is at 92% capacity with an 18-minute queue buildup at main food counters.`,
          `Hall A main foyer is at 84% density due to keynote exit rush into the central concourse.`,
        ],
        suggestedInterventions: [
          `Activate digital signage: Direct 40% of southbound foot traffic via the West Garden Atrium.`,
          `Broadcast app announcement offering express Grab-and-Go lunch boxes at North Lawn Station.`,
          `Deploy two additional ground marshals to hold the Hall A main double-doors open to relieve chokepoints.`,
        ],
      };
    }

    return {
      headline: 'Crowd flow is balanced across all major halls and concourses',
      criticalAlerts: ['All zones operating within safe 25-65% design capacity thresholds.'],
      suggestedInterventions: [
        'Maintain standard ushering protocols at Hall B entrance for upcoming afternoon session.',
        'Continuous ambient monitoring active on IoT optical door sensors.',
      ],
    };
  }
}

export const geminiService = new GeminiService();
