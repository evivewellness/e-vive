/**
 * Acquiring a GPS fix good enough to attend a shift on.
 *
 * getCurrentPosition() answers as soon as it has *any* position. On a phone
 * that has just woken up indoors that first answer is derived from cell towers
 * or Wi-Fi and can be hundreds of metres out; the satellite fix arrives a few
 * seconds later and is an order of magnitude tighter. Accepting the first
 * answer is why honest clock-ins get refused and why a dishonest one can pass.
 *
 * So: watch the position for a few seconds, keep every sample, stop early once
 * one is tight enough, and hand back the best of them together with how it was
 * obtained. Browser-only — no imports from here into server code.
 */
import { bestFix, isCoord } from './geofence';

export const FIX_DEFAULTS = {
  desiredAccuracyM: 25,     // good enough — stop watching and proceed
  maxWaitMs: 15000,         // hard stop; a shift cannot wait forever
  minWaitMs: 2500,          // keep watching at least this long before settling
};

export class GeoFixError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}

function messageFor(err) {
  // GeolocationPositionError codes: 1 PERMISSION_DENIED, 2 POSITION_UNAVAILABLE, 3 TIMEOUT
  switch (err?.code) {
    case 1:  return new GeoFixError('denied',
      'Location permission is blocked. Allow location access for this site in your browser settings, then try again.');
    case 2:  return new GeoFixError('unavailable',
      'Your device could not determine its location. Check that location services are on, then try again.');
    case 3:  return new GeoFixError('timeout',
      'Getting your location took too long. Move near a window or step outside and try again.');
    default: return new GeoFixError('unsupported',
      'This device cannot provide a location, so attendance cannot be recorded here.');
  }
}

/**
 * @param {object}   opts
 * @param {function} opts.onProgress  called with each sample so the UI can
 *                                    show the accuracy tightening up
 * @returns {Promise<{lat, lng, accuracyM, capturedAt, sampleCount, bestOfMs}>}
 */
export function acquireFix({ desiredAccuracyM, maxWaitMs, minWaitMs, onProgress } = {}) {
  const cfg = {
    desiredAccuracyM: desiredAccuracyM ?? FIX_DEFAULTS.desiredAccuracyM,
    maxWaitMs:        maxWaitMs        ?? FIX_DEFAULTS.maxWaitMs,
    minWaitMs:        minWaitMs        ?? FIX_DEFAULTS.minWaitMs,
  };

  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new GeoFixError('unsupported', 'This browser cannot provide a location, so attendance cannot be recorded here.'));
      return;
    }

    const started = Date.now();
    const samples = [];
    let watchId = null, minTimer = null, maxTimer = null, done = false;

    const cleanup = () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      clearTimeout(minTimer); clearTimeout(maxTimer);
    };

    const settle = () => {
      if (done) return;
      const best = bestFix(samples);
      if (!best) return;                       // nothing usable yet — keep waiting
      done = true; cleanup();
      resolve({ ...best, sampleCount: samples.length, bestOfMs: Date.now() - started });
    };

    const fail = (err) => {
      if (done) return;
      // A late error after we already have a usable sample is not a failure.
      if (bestFix(samples)) { settle(); return; }
      done = true; cleanup();
      reject(err);
    };

    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const s = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracyM: pos.coords.accuracy,
          capturedAt: new Date(pos.timestamp || Date.now()).toISOString(),
        };
        if (!isCoord(s.lat, s.lng)) return;
        samples.push(s);
        if (onProgress) { try { onProgress(bestFix(samples), samples.length); } catch { /* UI only */ } }

        // Tight enough, and we have watched long enough to have seen the
        // satellite fix supersede the network one.
        if (s.accuracyM <= cfg.desiredAccuracyM && Date.now() - started >= cfg.minWaitMs) settle();
      },
      (err) => fail(messageFor(err)),
      // maximumAge: 0 — never accept a cached position. A position remembered
      // from this morning's location would place the HCA at a site they left
      // hours ago, which is precisely the reading we must not take.
      { enableHighAccuracy: true, timeout: cfg.maxWaitMs, maximumAge: 0 },
    );

    // If a good-enough fix arrives before minWait, settle as soon as it passes.
    minTimer = setTimeout(() => {
      const best = bestFix(samples);
      if (best && best.accuracyM <= cfg.desiredAccuracyM) settle();
    }, cfg.minWaitMs);

    // Out of time: take the best we have, whatever it is. The server decides
    // whether it is precise enough — that judgement is not the phone's to make.
    maxTimer = setTimeout(() => {
      if (bestFix(samples)) settle();
      else fail(new GeoFixError('timeout',
        'Getting your location took too long. Move near a window or step outside and try again.'));
    }, cfg.maxWaitMs);
  });
}
