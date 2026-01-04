// DEPRECATED: This file is deprecated. Use '../services/api' instead.
// This file exists only for backward compatibility during migration.

import { api, authService, apiService } from '../services/api';

// Re-export everything from the main API service
export { api, authService, apiService };

// Log deprecation warning in development
if (import.meta.env.DEV) {
  console.warn('⚠️ DEPRECATED: Importing from "../lib/api" is deprecated. Use "../services/api" instead.');
}
