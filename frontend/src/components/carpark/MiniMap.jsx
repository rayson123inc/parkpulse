import React from 'react';
import { useTheme } from 'next-themes';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export default function MiniMap({ carparks, center, onMarkerClick }) {
  const { theme } = useTheme();
  const tileUrl = theme === 'dark' 
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  return (
    <div className="results-mini-map rounded-2xl overflow-hidden border border-slate-700/50 dark:border-slate-700/50 h-48">
      <MapContainer
        center={center || [1.2900, 103.8550]}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url={tileUrl}
        />
        {carparks?.map((cp) => (
          <Marker
            key={cp.id}
            position={[cp.latitude, cp.longitude]}
            eventHandlers={{ click: () => onMarkerClick?.(cp) }}
          >
            <Popup>
              <span className="font-semibold text-sm">{cp.name}</span>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
