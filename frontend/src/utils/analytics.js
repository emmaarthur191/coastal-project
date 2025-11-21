// analytics.js
import amplitude from 'amplitude-js';

// Replace with your actual Amplitude API key
const AMPLITUDE_API_KEY = import.meta.env.VITE_AMPLITUDE_API_KEY;

let amplitudeInstance = null;

// Only initialize Amplitude if a valid API key is provided
if (AMPLITUDE_API_KEY && AMPLITUDE_API_KEY !== '<YOUR_API_KEY>') {
  amplitudeInstance = amplitude.init(AMPLITUDE_API_KEY, {
    defaultTracking: true, // Explicitly enable default event tracking
  });
} else {
  console.warn('Amplitude API key not configured. Analytics tracking disabled.');
  // Create a mock instance for development
  amplitudeInstance = {
    logEvent: () => {},
    setUserId: () => {},
    setUserProperties: () => {},
    identify: () => {},
    track: () => {},
    reset: () => {},
  };
}

export default amplitudeInstance;
