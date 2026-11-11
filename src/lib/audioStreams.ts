/** Shared helpers to request and always release the microphone (web + Capacitor WebView). */

declare global {
  interface Window {
    localStream?: MediaStream | null;
  }
}

export const canUseMicrophone = (): boolean =>
  typeof navigator !== 'undefined' &&
  typeof navigator.mediaDevices?.getUserMedia === 'function' &&
  (typeof window === 'undefined' || window.isSecureContext !== false);

export const stopStream = (stream?: MediaStream | null) => {
  if (!stream) return;
  try {
    stream.getTracks().forEach((track) => {
      try { track.stop(); } catch { /* ignore */ }
    });
  } catch { /* ignore */ }
};

/** Stops any globally tracked stream and clears the reference. */
export const releaseGlobalStream = () => {
  if (typeof window === 'undefined') return;
  stopStream(window.localStream);
  window.localStream = null;
};

/** Requests the mic, tracks it globally. Returns null when unavailable or denied. */
export const acquireMicrophone = async (): Promise<MediaStream | null> => {
  if (!canUseMicrophone()) return null;
  releaseGlobalStream();
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    window.localStream = stream;
    return stream;
  } catch (e) {
    console.error('Microphone unavailable:', e);
    return null;
  }
};
