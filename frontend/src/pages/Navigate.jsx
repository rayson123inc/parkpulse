import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import { Crosshair, VolumeX, Volume2, X, Navigation as NavIcon, ArrowLeft, ArrowRight, ArrowUp, CornerDownLeft, CornerDownRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { OSRM_BASE_URL } from '@/lib/config';

// Custom icons
const userIcon = L.divIcon({
  className: '',
  html: `<div style="width:16px;height:16px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 0 12px rgba(59,130,246,0.6)"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const destIcon = L.divIcon({
  className: '',
  html: `<div style="width:20px;height:20px;background:#14b8a6;border:3px solid white;border-radius:50%;box-shadow:0 0 12px rgba(20,184,166,0.6)"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// Map OSRM maneuver types to icons and clean text
function getManeuver(step) {
  const type = step.maneuver?.type || '';
  const modifier = step.maneuver?.modifier || '';
  const name = step.name ? `onto ${step.name}` : '';
  const dist = step.distance > 0 ? ` in ${step.distance >= 1000 ? (step.distance / 1000).toFixed(1) + ' km' : Math.round(step.distance) + ' m'}` : '';

  if (type === 'depart') return { text: `Head ${modifier || 'forward'}${name ? ' ' + name : ''}`, icon: 'straight' };
  if (type === 'arrive') return { text: 'Arrive at destination', icon: 'arrive' };
  if (type === 'turn') {
    if (modifier.includes('left')) return { text: `Turn left${dist}${name ? ' ' + name : ''}`, icon: 'left' };
    if (modifier.includes('right')) return { text: `Turn right${dist}${name ? ' ' + name : ''}`, icon: 'right' };
    if (modifier.includes('uturn')) return { text: `Make a U-turn${name ? ' ' + name : ''}`, icon: 'uturn' };
    return { text: `Continue${name ? ' ' + name : ''}`, icon: 'straight' };
  }
  if (type === 'roundabout' || type === 'rotary') return { text: `Enter roundabout${dist}`, icon: 'right' };
  if (type === 'fork') {
    if (modifier.includes('left')) return { text: `Keep left${name ? ' ' + name : ''}`, icon: 'left' };
    if (modifier.includes('right')) return { text: `Keep right${name ? ' ' + name : ''}`, icon: 'right' };
  }
  if (type === 'merge') return { text: `Merge${name ? ' ' + name : ''}`, icon: 'straight' };
  return { text: step.name ? `Continue on ${step.name}` : 'Continue straight', icon: 'straight' };
}

// Fetch real road-snapped route from OSRM, also returning turn steps
async function fetchRoute(start, end) {
  try {
    const url = `${OSRM_BASE_URL}/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson&steps=true`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.routes && data.routes[0]) {
      const pts = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
      // Collect steps from all legs
      const rawSteps = data.routes[0].legs.flatMap(leg => leg.steps || []);
      const steps = rawSteps.map(s => ({
        ...getManeuver(s),
        // The location where this step starts [lat, lng]
        location: s.maneuver?.location ? [s.maneuver.location[1], s.maneuver.location[0]] : null,
      })).filter(s => s.location);
      return { pts, steps };
    }
  } catch (e) {
    console.warn('OSRM fetch failed, using straight line:', e);
  }
  // Fallback: straight line
  const pts = [];
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    pts.push([start[0] + (end[0] - start[0]) * t, start[1] + (end[1] - start[1]) * t]);
  }
  return { pts, steps: [{ text: 'Head toward destination', icon: 'straight', location: pts[0] }] };
}

function getDistanceM(a, b) {
  const R = 6371e3;
  const p1 = (a[0] * Math.PI) / 180;
  const p2 = (b[0] * Math.PI) / 180;
  const dp = ((b[0] - a[0]) * Math.PI) / 180;
  const dl = ((b[1] - a[1]) * Math.PI) / 180;
  const x = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, map.getZoom(), { animate: true, duration: 0.5 });
  }, [center?.[0], center?.[1]]);
  return null;
}

export default function Navigate() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();

  const [muted, setMuted] = useState(false);
  const [arrived, setArrived] = useState(false);
  const [userPos, setUserPos] = useState(null);
  const [route, setRoute] = useState([]);
  const [navSteps, setNavSteps] = useState([]);
  const [locationStatus, setLocationStatus] = useState('requesting');
  const [resolvedStart, setResolvedStart] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const routeFetchedRef = useRef(false);
  const watchRef = useRef(null);
  const mutedRef = useRef(false);
  const totalDistRef = useRef(0);
  const spokenStepIndexRef = useRef(-1);
  const lastSpokenRef = useRef('');
  const stepsRef = useRef([]);

  // Keep mutedRef in sync so the interval closure always reads the latest value
  useEffect(() => { mutedRef.current = muted; }, [muted]);

  function speak(text) {
    if (mutedRef.current || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'en-SG';
    utt.rate = 1.0;
    utt.pitch = 1.0;
    window.speechSynthesis.speak(utt);
  }

  const carpark = location.state?.carpark;
  const destination = carpark ? [carpark.latitude, carpark.longitude] : null;
  const stateGps = location.state?.userGps;

  const requestGps = () => {
    if (!destination) return;
    if (!navigator.geolocation) {
      setLocationStatus('denied');
      setResolvedStart(stateGps || [destination[0] - 0.012, destination[1] - 0.008]);
      return;
    }
    setLocationStatus('requesting');
    if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current);
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setGpsAccuracy(Math.round(accuracy));
        setLocationStatus('granted');
        // Only set resolvedStart once to trigger route fetch
        if (!routeFetchedRef.current) {
          routeFetchedRef.current = true;
          setResolvedStart([latitude, longitude]);
        } else {
          // After route is fetched, just update userPos directly
          setUserPos([latitude, longitude]);
        }
      },
      (err) => {
        console.warn('GPS denied or failed:', err.message);
        setLocationStatus('denied');
        if (!routeFetchedRef.current) {
          routeFetchedRef.current = true;
          setResolvedStart(stateGps || [destination[0] - 0.012, destination[1] - 0.008]);
        }
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  };

  // Step 1: Request GPS on mount
  useEffect(() => {
    requestGps();
    return () => {
      if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current);
    };
  }, [destination?.[0], destination?.[1]]);

  // Step 2: Fetch route once we have a start position
  useEffect(() => {
    if (!resolvedStart || !destination) return;
    setArrived(false);
    setUserPos(null);
    setRoute([]);
    lastSpokenRef.current = '';
    spokenStepIndexRef.current = -1;

    fetchRoute(resolvedStart, destination).then(({ pts, steps }) => {
      const fullDist = pts.reduce((sum, p, i) => i === 0 ? 0 : sum + getDistanceM(pts[i - 1], p), 0);
      totalDistRef.current = fullDist;
      stepsRef.current = steps;
      setRoute(pts);
      setNavSteps(steps);
      setUserPos(resolvedStart);
    });

    return () => {
      window.speechSynthesis?.cancel();
    };
  }, [resolvedStart]);

  // Distance/ETA calculations — use actual route distances
  const remainingDist = route.length > 1 && userPos
    ? (() => {
        // Find closest route point to userPos
        let minD = Infinity, closestIdx = 0;
        route.forEach((p, i) => { const d = getDistanceM(userPos, p); if (d < minD) { minD = d; closestIdx = i; } });
        return route.slice(closestIdx).reduce((sum, p, i, arr) => i === 0 ? 0 : sum + getDistanceM(arr[i - 1], p), 0);
      })()
    : (totalDistRef.current || 0);

  // Estimate travel time at ~30 km/h urban speed
  const remainingMin = remainingDist > 0 ? Math.max(1, Math.round(remainingDist / (30000 / 60))) : 1;
  const etaStr = new Date(Date.now() + remainingMin * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Find the current step index: find the next upcoming step the user hasn't passed yet
  const currentStepIndex = (() => {
    if (!navSteps.length || !userPos) return 0;
    // Find the last step whose location we've already passed (within 40m)
    let lastPassedIdx = 0;
    for (let i = 0; i < navSteps.length; i++) {
      if (!navSteps[i].location) continue;
      if (getDistanceM(userPos, navSteps[i].location) < 40) {
        lastPassedIdx = i;
      }
    }
    // The current instruction is the next step after the last passed one
    const next = lastPassedIdx + 1;
    return next < navSteps.length ? next : lastPassedIdx;
  })();

  const currentStep = navSteps[currentStepIndex] || { text: 'Calculating…', icon: 'straight' };

  const ManeuverIcon = currentStep.icon === 'left' ? CornerDownLeft
    : currentStep.icon === 'right' ? CornerDownRight
    : currentStep.icon === 'uturn' ? ArrowLeft
    : NavIcon;

  // Speak only once per step index change
  useEffect(() => {
    if (!currentStep.text || currentStepIndex === spokenStepIndexRef.current) return;
    spokenStepIndexRef.current = currentStepIndex;
    speak(currentStep.text);
  }, [currentStepIndex]);

  // Check arrival based on real GPS position
  useEffect(() => {
    if (!userPos || !destination || arrived) return;
    if (getDistanceM(userPos, destination) < 40) {
      setArrived(true);
    }
  }, [userPos]);

  // Speak arrival
  useEffect(() => {
    if (arrived) speak('You have arrived at your destination');
  }, [arrived]);

  // Show loading / permission screens until route is ready
  if (!carpark || !userPos || route.length === 0) {
    return (
      <div className="min-h-screen bg-slate-900 dark:bg-blue-50 flex flex-col items-center justify-center gap-6 px-8 text-white dark:text-slate-800">
        {locationStatus === 'requesting' && (
          <>
            <div className="w-16 h-16 bg-teal-500/20 rounded-full flex items-center justify-center">
              <Crosshair className="w-8 h-8 text-teal-400 animate-pulse" />
            </div>
            <div className="text-center space-y-2">
               <p className="text-white dark:text-slate-900 font-semibold text-lg">Acquiring Your Location</p>
               <p className="text-slate-400 dark:text-slate-600 text-sm">When the browser asks, tap <strong className="text-white dark:text-slate-900">Allow</strong> to share your precise location.</p>
            </div>
            <div className="w-8 h-8 border-4 border-slate-700 border-t-teal-400 rounded-full animate-spin" />
          </>
        )}

        {locationStatus === 'denied' && (
          <>
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
              <Crosshair className="w-8 h-8 text-red-400" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-white dark:text-slate-900 font-semibold text-lg">Location Access Blocked</p>
              <p className="text-slate-400 dark:text-slate-600 text-sm">To navigate from your exact position:</p>
              <ol className="text-slate-400 dark:text-slate-600 text-sm text-left space-y-1 mt-2">
                <li>1. Tap the <strong className="text-white dark:text-slate-900">lock/info icon</strong> in your browser's address bar</li>
                <li>2. Set <strong className="text-white dark:text-slate-900">Location</strong> to <strong className="text-white dark:text-slate-900">Allow</strong></li>
                <li>3. Reload this page</li>
              </ol>
            </div>
            <button
              onClick={requestGps}
              className="px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-xl transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate(-1)}
              className="text-slate-500 text-sm underline"
            >
              Go back
            </button>
          </>
        )}

        {locationStatus === 'granted' && (
          <>
            <div className="w-8 h-8 border-4 border-slate-700 border-t-teal-400 rounded-full animate-spin" />
            <div className="text-center space-y-1">
              <p className="text-slate-300 dark:text-slate-700 text-sm">Calculating route…</p>
              {gpsAccuracy && <p className="text-teal-400 dark:text-teal-600 text-xs">GPS accuracy: ±{gpsAccuracy}m</p>}
            </div>
          </>
        )}
      </div>
    );
  }

  const closestRouteIdx = (() => {
    if (!userPos || !route.length) return 0;
    let minD = Infinity, idx = 0;
    route.forEach((p, i) => { const d = getDistanceM(userPos, p); if (d < minD) { minD = d; idx = i; } });
    return idx;
  })();
  const completedRoute = route.slice(0, closestRouteIdx + 1);
  const remainingRoute = route.slice(closestRouteIdx);
  
  const tileUrl = theme === 'dark' 
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  return (
    <div className="h-screen bg-slate-900 dark:bg-blue-50 text-white dark:text-slate-800 relative overflow-hidden">
      {/* Turn instruction banner */}
      <AnimatePresence>
        {!arrived && (
          <motion.div
            initial={{ y: -60 }}
            animate={{ y: 0 }}
            exit={{ y: -60 }}
            className="absolute top-0 left-0 right-0 z-[1000] bg-slate-900/90 dark:bg-white/90 backdrop-blur-xl border-b border-slate-700/50 dark:border-slate-200/50 px-5 pt-12 pb-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-500/20 dark:bg-teal-100 rounded-xl flex items-center justify-center shrink-0">
                <ManeuverIcon className="w-5 h-5 text-teal-400 dark:text-teal-600" />
              </div>
              <div>
                <p className="text-white dark:text-slate-900 font-semibold text-sm leading-tight">
                  {currentStep.text}
                </p>
                <p className="text-slate-400 dark:text-slate-600 text-xs mt-0.5">{carpark.name}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Arrival overlay */}
      <AnimatePresence>
        {arrived && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 z-[1001] bg-slate-900/95 dark:bg-white/95 backdrop-blur-xl flex items-center justify-center px-8"
          >
            <div className="text-center space-y-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="w-20 h-20 bg-teal-500/20 dark:bg-teal-100 rounded-full flex items-center justify-center mx-auto"
              >
                <NavIcon className="w-10 h-10 text-teal-400 dark:text-teal-600" />
              </motion.div>
              <div>
                <h2 className="text-2xl font-bold text-white dark:text-slate-900">You have arrived</h2>
                <p className="text-slate-400 dark:text-slate-600 mt-1">at your destination</p>
                <p className="text-teal-400 dark:text-teal-600 font-medium mt-2">{carpark.name}</p>
              </div>
              <button
                onClick={() => navigate(`/Rate?id=${carpark.id}`, { state: { carpark } })}
                className="w-full h-14 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-xl shadow-lg shadow-teal-500/25 transition-colors"
              >
                Rate This Carpark
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map */}
      <div className="h-full w-full">
        <MapContainer
          center={userPos}
          zoom={16}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer url={tileUrl} />
          <MapUpdater center={userPos} />
          {completedRoute.length >= 2 && (
            <Polyline
              positions={completedRoute}
              pathOptions={{ color: '#475569', weight: 5, opacity: 0.5 }}
            />
          )}
          {remainingRoute.length >= 2 && (
            <Polyline
              positions={remainingRoute}
              pathOptions={{ color: '#2dd4bf', weight: 5, opacity: 1 }}
            />
          )}
          <Marker position={userPos} icon={userIcon} />
          <Marker position={destination} icon={destIcon} />
        </MapContainer>
      </div>

      {/* Floating controls */}
      {!arrived && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-[1000] flex flex-col gap-2">
          <FloatingBtn icon={Crosshair} onClick={() => {}} />
          <FloatingBtn icon={muted ? VolumeX : Volume2} onClick={() => setMuted(!muted)} />
          <FloatingBtn
            icon={X}
            onClick={() => navigate(`/Rate?id=${carpark.id}`, { state: { carpark } })}
            className="bg-red-500/20 hover:bg-red-500/30"
          />
        </div>
      )}

      {/* Bottom bar */}
      {!arrived && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="absolute bottom-0 left-0 right-0 z-[1000] bg-slate-900/90 dark:bg-white/90 backdrop-blur-xl border-t border-slate-700/50 dark:border-slate-200/50 px-6 py-5"
        >
          <div className="flex items-center justify-between max-w-lg mx-auto">
            <div className="text-center">
              <p className="text-xl font-bold text-white dark:text-slate-900">{remainingMin} min</p>
              <p className="text-xs text-slate-400 dark:text-slate-600">Time</p>
            </div>
            <div className="h-8 w-px bg-slate-700 dark:bg-slate-200" />
            <div className="text-center">
              <p className="text-xl font-bold text-white dark:text-slate-900">
                {remainingDist >= 1000
                  ? `${(remainingDist / 1000).toFixed(1)} km`
                  : `${Math.round(remainingDist)} m`}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-600">Distance</p>
            </div>
            <div className="h-8 w-px bg-slate-700 dark:bg-slate-200" />
            <div className="text-center">
              <p className="text-xl font-bold text-teal-400 dark:text-teal-600">{etaStr}</p>
              <p className="text-xs text-slate-400 dark:text-slate-600">ETA</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function FloatingBtn({ icon: Icon, onClick, className = '' }) {
  return (
    <button
      onClick={onClick}
      className={`w-11 h-11 rounded-full bg-slate-800/80 dark:bg-white/80 backdrop-blur border border-slate-700/50 dark:border-slate-200/50 flex items-center justify-center hover:bg-slate-700/80 dark:hover:bg-slate-100/80 transition-colors ${className}`}
    >
      <Icon className="w-5 h-5 text-slate-200 dark:text-slate-700" />
    </button>
  );
}
