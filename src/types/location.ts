export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
  trackingType?: 'foreground' | 'background';
  lastUpdated?: string;
}

export interface LocationDetails {
  coordinates: {
    latitude: number;
    longitude: number;
  };
  formattedAddress: string;
  accuracy: 'high' | 'low';
}

export interface PilgrimStats {
  totalRequests: number;
  activeRequests: number;
  completedRequests: number;
  totalVolunteers: number;
  averageResponseTime: number;
  lastRequestTime: string;
  currentLocation: LocationData | null;
}
