/**
 * JourneyFlicker — Frontend Error Reporter
 * Automatically captures unhandled errors & promise rejections
 * and reports them to the backend admin analytics system.
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';

/**
 * Filter out benign browser noise, in-app browser injected scripts,
 * third-party extensions, and auto-healed transient errors.
 */
function shouldIgnoreError(message: string, stack?: string, filename?: string): boolean {
  if (!message && !stack) return true;
  const combined = `${message || ''} ${stack || ''} ${filename || ''}`.toLowerCase();

  const ignoredPatterns = [
    'script error.',
    'webkit.messagehandlers',
    'senddatatonative',
    'sendpagehidemessage',
    'sendpageshowmessage',
    'chrome-extension://',
    'moz-extension://',
    'safari-extension://',
    'safari-web-extension://',
    'resizeobserver loop',
    'failed to fetch dynamically imported module',
    'loading chunk',
    'chunkloaderror',
    'window.webkit',
    'evaluating \'window.webkit',
    'evaluating "window.webkit',
  ];

  return ignoredPatterns.some(pattern => combined.includes(pattern));
}

async function sendLog(payload: {
  level: 'error' | 'warn' | 'info';
  message: string;
  stack?: string;
  url?: string;
  filename?: string;
}) {
  if (shouldIgnoreError(payload.message, payload.stack, payload.filename)) {
    return;
  }

  try {
    await fetch(`${API_BASE}/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        source: 'frontend',
        url: payload.url || (typeof window !== 'undefined' ? window.location.href : ''),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
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
    if (shouldIgnoreError(event.message, event.error?.stack, event.filename)) return;

    sendLog({
      level: 'error',
      message: event.message,
      stack: event.error?.stack || `${event.filename || ''}:${event.lineno || ''}:${event.colno || ''}`,
      url: window.location.href,
      filename: event.filename,
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

    const stack = reason instanceof Error ? reason.stack : undefined;
    if (shouldIgnoreError(message, stack)) return;

    sendLog({
      level: 'error',
      message: `Unhandled Promise Rejection: ${message}`,
      stack,
      url: window.location.href,
    });
  });
}

// Expose manual reporting for use in React Error Boundaries
export function reportError(error: Error | unknown, context?: string) {
  const err = error instanceof Error ? error : new Error(String(error));
  if (shouldIgnoreError(err.message, err.stack)) return;

  sendLog({
    level: 'error',
    message: context ? `[${context}] ${err.message}` : err.message,
    stack: err.stack,
    url: typeof window !== 'undefined' ? window.location.href : '',
  });
}

