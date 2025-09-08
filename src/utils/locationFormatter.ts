/**
 * Location Formatting Utilities
 * Provides human-readable location formatting for admin interfaces
 */

export interface LocationFormatOptions {
  showCoordinates?: boolean;
  showAccuracy?: boolean;
  fallbackText?: string;
  coordinateFormat?: 'decimal' | 'dms'; // decimal degrees or degrees-minutes-seconds
}

export interface FormattedLocation {
  displayText: string;
  coordinates: string;
  accuracy?: string;
  isPlaceholder: boolean;
}

export class LocationFormatter {
  /**
   * Format location data for human-readable display
   */
  static formatLocation(
    location: any, 
    options: LocationFormatOptions = {}
  ): FormattedLocation {
    const {
      showCoordinates = false,
      showAccuracy = false,
      fallbackText = 'Location not available',
      coordinateFormat = 'decimal'
    } = options;

    // Handle null or undefined location
    if (!location) {
      return {
        displayText: fallbackText,
        coordinates: '',
        isPlaceholder: true
      };
    }

    let latitude: number | null = null;
    let longitude: number | null = null;
    let accuracy: number | null = null;

    // Extract coordinates from various location formats
    if (typeof location === 'string') {
      // Try to parse coordinate string like "23.0262, 72.5240"
      const coords = location.match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
      if (coords) {
        latitude = parseFloat(coords[1]);
        longitude = parseFloat(coords[2]);
      } else {
        // Return the string as-is if it's not coordinates
        return {
          displayText: location,
          coordinates: this.formatCoordinates(null, null, coordinateFormat),
          isPlaceholder: false
        };
      }
    } else if (typeof location === 'object') {
      // Handle PostGIS geography objects
      if (location.coordinates && Array.isArray(location.coordinates)) {
        longitude = location.coordinates[0];
        latitude = location.coordinates[1];
      } else if (location.latitude && location.longitude) {
        latitude = location.latitude;
        longitude = location.longitude;
        accuracy = location.accuracy;
      } else if (location.lat && location.lng) {
        latitude = location.lat;
        longitude = location.lng;
      }
    }

    // If we couldn't extract coordinates, return fallback
    if (latitude === null || longitude === null) {
      return {
        displayText: fallbackText,
        coordinates: '',
        isPlaceholder: true
      };
    }

    // Generate human-readable location description
    const locationName = this.getLocationName(latitude, longitude);
    const coordinates = this.formatCoordinates(latitude, longitude, coordinateFormat);
    const accuracyText = accuracy ? this.formatAccuracy(accuracy) : null;

    let displayText = locationName;
    if (showCoordinates) {
      displayText = `${locationName} (${coordinates})`;
    }

    return {
      displayText,
      coordinates,
      accuracy: accuracyText,
      isPlaceholder: false
    };
  }

  /**
   * Get a human-readable location name based on coordinates
   */
  private static getLocationName(latitude: number, longitude: number): string {
    // Parul University campus locations (demo data)
    const campusLocations = [
      {
        name: 'Parul University Main Campus',
        lat: 22.2587,
        lng: 72.7794,
        radius: 0.5 // km
      },
      {
        name: 'Parul University Library',
        lat: 22.2590,
        lng: 72.7800,
        radius: 0.1
      },
      {
        name: 'Engineering Block',
        lat: 22.2585,
        lng: 72.7790,
        radius: 0.1
      },
      {
        name: 'Medical Center',
        lat: 22.2595,
        lng: 72.7785,
        radius: 0.1
      },
      {
        name: 'Campus Canteen',
        lat: 22.2580,
        lng: 72.7795,
        radius: 0.1
      },
      {
        name: 'Student Hostel',
        lat: 22.2575,
        lng: 72.7800,
        radius: 0.1
      }
    ];

    // Check if coordinates match any known campus locations
    for (const location of campusLocations) {
      const distance = this.calculateDistance(
        latitude, longitude,
        location.lat, location.lng
      );
      
      if (distance <= location.radius) {
        return location.name;
      }
    }

    // Check if it's within general Parul University area
    const mainCampusDistance = this.calculateDistance(
      latitude, longitude,
      22.2587, 72.7794 // Main campus coordinates
    );
    
    if (mainCampusDistance <= 2) {
      return 'Parul University Area';
    }

    // Check if it's in Vadodara city area
    const vadodaraDistance = this.calculateDistance(
      latitude, longitude,
      22.3072, 73.1812 // Vadodara city center
    );
    
    if (vadodaraDistance <= 20) {
      return 'Vadodara City';
    }

    // Return general area description
    return this.getGeneralAreaName(latitude, longitude);
  }

  /**
   * Get general area name based on coordinates
   */
  private static getGeneralAreaName(latitude: number, longitude: number): string {
    // Simple area classification based on coordinates
    if (latitude >= 22 && latitude <= 24 && longitude >= 72 && longitude <= 74) {
      return 'Gujarat Region';
    }
    
    if (latitude >= 20 && latitude <= 28 && longitude >= 68 && longitude <= 78) {
      return 'Western India';
    }
    
    return `${this.formatCoordinates(latitude, longitude, 'decimal')}`;
  }

  /**
   * Format coordinates for display
   */
  private static formatCoordinates(
    latitude: number | null, 
    longitude: number | null,
    format: 'decimal' | 'dms' = 'decimal'
  ): string {
    if (latitude === null || longitude === null) {
      return 'Coordinates unavailable';
    }

    if (format === 'dms') {
      return `${this.toDMS(latitude, 'lat')}, ${this.toDMS(longitude, 'lng')}`;
    }

    return `${latitude.toFixed(6)}°N, ${longitude.toFixed(6)}°E`;
  }

  /**
   * Convert decimal degrees to degrees-minutes-seconds
   */
  private static toDMS(decimal: number, type: 'lat' | 'lng'): string {
    const absolute = Math.abs(decimal);
    const degrees = Math.floor(absolute);
    const minutes = Math.floor((absolute - degrees) * 60);
    const seconds = Math.round(((absolute - degrees) * 60 - minutes) * 60);
    
    const direction = type === 'lat' 
      ? (decimal >= 0 ? 'N' : 'S')
      : (decimal >= 0 ? 'E' : 'W');
      
    return `${degrees}°${minutes}'${seconds}"${direction}`;
  }

  /**
   * Format GPS accuracy for display
   */
  private static formatAccuracy(accuracy: number): string {
    if (accuracy < 10) {
      return `±${accuracy.toFixed(1)}m (High)`;
    } else if (accuracy < 50) {
      return `±${accuracy.toFixed(0)}m (Good)`;
    } else if (accuracy < 100) {
      return `±${accuracy.toFixed(0)}m (Fair)`;
    } else {
      return `±${accuracy.toFixed(0)}m (Low)`;
    }
  }

  /**
   * Calculate distance between two points in kilometers
   */
  private static calculateDistance(
    lat1: number, lng1: number,
    lat2: number, lng2: number
  ): number {
    const R = 6371; // Earth's radius in km
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  /**
   * Format distance for display
   */
  static formatDistance(distanceKm: number): string {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)}m`;
    } else if (distanceKm < 10) {
      return `${distanceKm.toFixed(1)}km`;
    } else {
      return `${Math.round(distanceKm)}km`;
    }
  }

  /**
   * Validate coordinates
   */
  static isValidCoordinates(latitude: any, longitude: any): boolean {
    const lat = typeof latitude === 'number' ? latitude : parseFloat(latitude);
    const lng = typeof longitude === 'number' ? longitude : parseFloat(longitude);
    
    return !isNaN(lat) && !isNaN(lng) &&
           lat >= -90 && lat <= 90 &&
           lng >= -180 && lng <= 180;
  }
}
