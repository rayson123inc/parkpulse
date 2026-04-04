import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Star, Car, Clock, DollarSign, Zap, Shield, Smartphone, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { db } from '@/api/client';

export default function Detail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const params = new URLSearchParams(window.location.search);
  const id = decodeURIComponent(params.get('id') || '');
  
  const tileUrl = theme === 'dark' 
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  // Carpark passed via navigation state (from Results page)
  const stateCarpark = location.state?.carpark;

  // Also get saved ratings from our DB
  const { data: dbCarparks = [], isLoading: loadingDb } = useQuery({
    queryKey: ['carpark-db', id],
    queryFn: () => db.entities.Carpark.filter({ id }),
    enabled: !!id,
  });

  const dbCarpark = dbCarparks[0];

  // Merge state carpark with any stored ratings
  const carpark = stateCarpark
    ? {
        ...stateCarpark,
        average_rating: dbCarpark?.average_rating ?? null,
        total_ratings: dbCarpark?.total_ratings ?? 0,
      }
    : dbCarpark;

  if (loadingDb && !carpark) {
    return (
      <div className="min-h-screen bg-slate-900 dark:bg-blue-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-700 dark:border-slate-200 border-t-teal-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!carpark) {
    return (
      <div className="min-h-screen bg-slate-900 dark:bg-blue-50 text-white dark:text-slate-800 flex items-center justify-center">
        <p>Carpark not found</p>
      </div>
    );
  }

  const availPct = carpark.total_capacity > 0
    ? (carpark.available_lots / carpark.total_capacity) * 100
    : null;
  const availColor = availPct === null ? 'text-slate-400' : availPct > 50 ? 'text-emerald-400' : availPct > 20 ? 'text-amber-400' : 'text-red-400';

  const lotsLabel = carpark.total_capacity > 0
    ? `${carpark.available_lots} / ${carpark.total_capacity}`
    : `${carpark.available_lots} available`;

  const features = [
    { label: 'EV Charging', enabled: carpark.ev_charging, icon: Zap, color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
    { label: '24/7 Surveillance', enabled: carpark.surveillance_24_7, icon: Shield, color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
    { label: 'Mobile Payment', enabled: carpark.mobile_payment, icon: Smartphone, color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
    { label: 'Free Parking', enabled: carpark.free_parking, icon: DollarSign, color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 dark:from-blue-50 dark:to-slate-50 text-white dark:text-slate-800">
      {/* Map header */}
      <div className="detail-map-header relative h-56">
        <MapContainer
          center={[carpark.latitude, carpark.longitude]}
          zoom={16}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          attributionControl={false}
          dragging={false}
        >
          <TileLayer url={tileUrl} />
          <Marker position={[carpark.latitude, carpark.longitude]} />
        </MapContainer>
        <div className={`absolute inset-0 pointer-events-none ${theme === 'dark' ? 'bg-gradient-to-b from-slate-900/40 to-slate-900/80' : 'bg-gradient-to-b from-blue-50/40 to-blue-50/80'}`} />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-12 left-4 z-[1000] p-2 bg-slate-900/80 dark:bg-white/80 backdrop-blur rounded-xl"
        >
          <ArrowLeft className="w-5 h-5 text-white dark:text-slate-800" />
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 -mt-6 relative z-10 pb-8 max-w-lg mx-auto"
      >
        <div className="bg-slate-800/80 dark:bg-white/90 backdrop-blur-xl border border-slate-700/50 dark:border-slate-200/50 rounded-2xl p-5 space-y-5">
          {/* Title & Rating */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold leading-tight text-white dark:text-slate-900">{carpark.name}</h1>
              <p className="text-xs text-slate-400 dark:text-slate-600 mt-0.5">{carpark.car_park_type}</p>
            </div>
            {carpark.average_rating != null ? (
              <div className="flex items-center gap-1 bg-amber-500/20 px-2.5 py-1 rounded-lg shrink-0">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="text-amber-300 font-semibold text-sm">{carpark.average_rating?.toFixed(1)}</span>
                <span className="text-slate-400 text-xs">({carpark.total_ratings})</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 bg-slate-700/50 dark:bg-slate-200/50 px-2.5 py-1 rounded-lg shrink-0">
                <Star className="w-4 h-4 text-slate-500 dark:text-slate-600" />
                <span className="text-slate-400 dark:text-slate-600 text-sm">No ratings</span>
              </div>
            )}
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            <StatBlock icon={Car} label="Available Lots" className={availColor}>
              {lotsLabel}
            </StatBlock>
            <StatBlock icon={Clock} label="Operating Hours" className="text-white dark:text-slate-900">
              {carpark.operating_hours}
            </StatBlock>
            <StatBlock icon={Smartphone} label="Parking System" className="text-slate-300 dark:text-slate-700">
              {carpark.type_of_parking_system === 'ELECTRONIC PARKING' ? 'Electronic' : 'Coupon'}
            </StatBlock>
            <StatBlock icon={DollarSign} label="Short-Term" className={carpark.short_term_parking !== 'NO' ? 'text-emerald-400' : 'text-red-400'}>
              {carpark.short_term_parking === 'NO' ? 'Not available' : carpark.short_term_parking || 'Available'}
            </StatBlock>
          </div>

          {/* Features */}
          {features.filter(f => f.enabled).length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-slate-400 dark:text-slate-600 uppercase tracking-wider mb-2">Features</h3>
              <div className="flex flex-wrap gap-2">
                {features.filter(f => f.enabled).map((f) => (
                  <Badge key={f.label} className={`${f.color} border text-xs py-1 px-2.5`}>
                    <f.icon className="w-3 h-3 mr-1" />
                    {f.label}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={() => navigate(`/Navigate?id=${encodeURIComponent(carpark.id)}`, { state: { carpark, userGps: location.state?.userGps } })}
            className="w-full h-14 bg-teal-500 hover:bg-teal-600 text-white font-semibold text-base rounded-xl shadow-lg shadow-teal-500/25"
          >
            <Navigation className="w-5 h-5 mr-2" />
            Confirm Selection
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

function StatBlock({ icon: Icon, label, children, className }) {
  return (
    <div className="bg-slate-700/30 dark:bg-slate-200/30 rounded-xl p-3">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" />
        <span className="text-xs text-slate-400 dark:text-slate-600">{label}</span>
      </div>
      <p className={`text-sm font-semibold ${className}`}>{children}</p>
    </div>
  );
}
