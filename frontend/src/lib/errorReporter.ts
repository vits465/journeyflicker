/**
 * JourneyFlicker — Frontend Error Reporter
 * Automatically captures unhandled errors & promise rejections
 * and reports them to the backend admin analytics system.
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function sendLog(payload: {
  level: 'error' | 'warn' | 'info';
  message: string;
  stack?: string;
  url?: string;
}) {
  try {
    await fetch(`${API_BASE}/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        source: 'frontend',
        url: payload.url || window.location.href,
        userAgent: navigator.userAgent,
      }),
    });
  } catch {
    // Never throw — the reporter must never crash the app
  }
}

let installed = false;

export function installErrorReporter() {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  // Unhandled JS errors
  window.addEventListener('error', (event) => {
    // Ignore cross-origin script errors (no message content)
    if (!event.message || event.message === 'Script error.') return;

    sendLog({
      level: 'error',
      message: event.message,
      stack: event.error?.stack || `${event.filename}:${event.lineno}:${event.colno}`,
      url: window.location.href,
    });
  });

  // Unhandled Promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const message =
      reason instanceof Error
        ? reason.message
        : typeof reason === 'string'
        ? reason
        : JSON.stringify(reason);

    sendLog({
      level: 'error',
      message: `Unhandled Promise Rejection: ${message}`,
      stack: reason instanceof Error ? reason.stack : undefined,
      url: window.location.href,
    });
  });
}

// Expose manual reporting for use in React Error Boundaries
export function reportError(error: Error | unknown, context?: string) {
  const err = error instanceof Error ? error : new Error(String(error));
  sendLog({
    level: 'error',
    message: context ? `[${context}] ${err.message}` : err.message,
    stack: err.stack,
    url: window.location.href,
  });
}
