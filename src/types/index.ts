export type ZoneId = 
  | 'hall-a' 
  | 'hall-b' 
  | 'hall-c' 
  | 'food-court' 
  | 'atrium' 
  | 'quiet-zone' 
  | 'first-aid' 
  | 'registration' 
  | 'restrooms-north' 
  | 'restrooms-south'
  | 'outdoor-patio';

export type POICategory = 
  | 'stage' 
  | 'booth' 
  | 'food' 
  | 'restroom' 
  | 'medical' 
  | 'quiet' 
  | 'help' 
  | 'exit'
  | 'elevator';

export interface POI {
  id: string;
  name: string;
  zoneId: ZoneId;
  category: POICategory;
  x: number; // SVG X coord (0-1000)
  y: number; // SVG Y coord (0-600)
  floor: number;
  description: string;
  wheelchairAccessible: boolean;
  crowdLevel: 'low' | 'moderate' | 'high' | 'critical';
  tags: string[];
  dietaryOptions?: string[]; // for food stalls
  sensoryScore?: number; // 1 (dead quiet) to 10 (rock concert loud)
}

export interface Zone {
  id: ZoneId;
  name: string;
  category: string;
  capacity: number;
  currentOccupancy: number;
  crowdPercentage: number;
  status: 'low' | 'moderate' | 'high' | 'critical';
  svgPath: string;
  labelX: number;
  labelY: number;
  color: string;
  alternateRouteAdvice?: string;
}

export interface Session {
  id: string;
  title: string;
  speaker: {
    name: string;
    role: string;
    avatar: string;
    company: string;
  };
  track: 'AI & Gemini' | 'Web & Cloud' | 'Robotics & IoT' | 'Design & UX' | 'Keynote';
  startTime: string;
  endTime: string;
  startEpochMs?: number;
  endEpochMs?: number;
  locationId: string;
  zoneId: ZoneId;
  description: string;
  tags: string[];
  accessibility: {
    asl: boolean;
    captions: boolean;
    stepFree: boolean;
    audioDescription: boolean;
  };
  capacityPercentage: number;
  isPopular?: boolean;
}

export interface Persona {
  id: string;
  name: string;
  role: string;
  avatar: string;
  interests: string[];
  dietaryRestrictions?: string[];
  accessibilityNeeds: {
    wheelchair: boolean;
    sensorySensitive: boolean;
    largeFont: boolean;
    highContrast: boolean;
  };
  bio: string;
}

export interface SOSAlert {
  id: string;
  timestamp: string;
  type: 'medical' | 'accessibility' | 'security' | 'lost-person' | 'facility';
  location: string;
  zoneId: ZoneId;
  reportedBy: string;
  status: 'open' | 'dispatched' | 'resolved';
  severity: 'high' | 'critical' | 'medium';
  details: string;
  geminiTriageAdvice?: string[];
  assignedResponder?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  timestamp: string;
  priority: 'normal' | 'urgent' | 'emergency';
  zoneId?: ZoneId;
  author: string;
}

export interface RouteStep {
  instruction: string;
  distanceMeters: number;
  accessible: boolean;
  iconType: 'straight' | 'turn-left' | 'turn-right' | 'elevator' | 'stairs' | 'arrive';
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  suggestedActions?: {
    label: string;
    action: string;
    payload?: any;
  }[];
}

export interface NavigationRoute {
  startPOI: POI;
  endPOI: POI;
  pathPoints: { x: number; y: number }[];
  steps: RouteStep[];
  totalDistanceMeters: number;
  estimatedMinutes: number;
  isStepFree: boolean;
  avoidsCrowds: boolean;
}
