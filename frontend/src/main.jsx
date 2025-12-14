import React from 'react'
import ReactDOM from 'react-dom/client'

import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx';
import './index.css'
import './utils/analytics.js'; // Initialize Amplitude analytics
import './utils/sentry.js'; // Initialize Sentry error tracking

import { ThemeProvider } from './context/ThemeContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)


