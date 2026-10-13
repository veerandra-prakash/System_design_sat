import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Play, RotateCw, MapPin, Navigation, Info } from 'lucide-react';
import api from '../services/api';
import { getSocket } from '../services/socket';

// Fix default leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});

export default function LeafletMap({
  pickup,
  destination,
  ambulance,
  requestId,
  height = '500px',
  allowSimulation = true,
  onLocationUpdate
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const polylineRef = useRef(null);

  const [currentAmbLoc, setCurrentAmbLoc] = useState(() => ambulance?.location || null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [lastUpdateNotice, setLastUpdateNotice] = useState(
    ambulance?.location?.updatedAt ? new Date(ambulance.location.updatedAt).toLocaleTimeString() : 'Awaiting signal'
  );
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Sync prop changes
  useEffect(() => {
    if (ambulance?.location) {
      setCurrentAmbLoc(ambulance.location);
      if (ambulance.location.updatedAt) {
        setLastUpdateNotice(new Date(ambulance.location.updatedAt).toLocaleTimeString());
      }
    }
  }, [ambulance]);

  // Socket.IO live updates listener
  useEffect(() => {
    const socket = getSocket();

    if (requestId) {
      socket.emit('join_request', requestId);
    }
    if (ambulance?._id) {
      socket.emit('join_ambulance', ambulance._id);
    }

    const handleLocationUpdate = (data) => {
      if (ambulance?._id && (data.ambulanceId === ambulance._id || data.ambulanceId === ambulance)) {
        setCurrentAmbLoc(data.location);
        setLastUpdateNotice(new Date().toLocaleTimeString());
        if (data.location?.isSimulatedDemo) {
          setIsDemoMode(true);
        }
        if (onLocationUpdate) {
          onLocationUpdate(data.location);
        }
      }
    };

    socket.on('ambulance_location_updated', handleLocationUpdate);
    if (ambulance?._id) {
      socket.on(`location:${ambulance._id}`, handleLocationUpdate);
    }

    return () => {
      socket.off('ambulance_location_updated', handleLocationUpdate);
      if (ambulance?._id) {
        socket.off(`location:${ambulance._id}`, handleLocationUpdate);
      }
      if (requestId) {
        socket.emit('leave_request', requestId);
      }
    };
  }, [requestId, ambulance, onLocationUpdate]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialLat = pickup?.latitude || currentAmbLoc?.latitude || 12.9716;
      const initialLng = pickup?.longitude || currentAmbLoc?.longitude || 77.5946;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 14,
        zoomControl: true,
        attributionControl: true
      });

      // OpenStreetMap Tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers & Polylines whenever positions change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const boundsPoints = [];

    // 1. Pickup Marker
    if (pickup?.latitude && pickup?.longitude) {
      boundsPoints.push([pickup.latitude, pickup.longitude]);

      const pickupIcon = L.divIcon({
        className: 'custom-map-icon',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-10 h-10 bg-red-500/25 rounded-full animate-ping"></div>
            <div class="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white font-bold text-xs">
              📍
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      if (!markersRef.current.pickup) {
        markersRef.current.pickup = L.marker([pickup.latitude, pickup.longitude], { icon: pickupIcon })
          .addTo(map)
          .bindPopup(`<strong>Patient Pickup Location</strong><br/>${pickup.address || 'Pickup Point'}`);
      } else {
        markersRef.current.pickup.setLatLng([pickup.latitude, pickup.longitude]);
      }
    }

    // 2. Hospital / Destination Marker
    if (destination?.latitude && destination?.longitude) {
      boundsPoints.push([destination.latitude, destination.longitude]);

      const hospitalIcon = L.divIcon({
        className: 'custom-map-icon',
        html: `
          <div class="w-8 h-8 bg-blue-700 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white font-bold text-xs">
            🏥
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      if (!markersRef.current.destination) {
        markersRef.current.destination = L.marker([destination.latitude, destination.longitude], { icon: hospitalIcon })
          .addTo(map)
          .bindPopup(`<strong>${destination.hospitalName || 'Emergency Hospital'}</strong><br/>${destination.address || ''}`);
      } else {
        markersRef.current.destination.setLatLng([destination.latitude, destination.longitude]);
      }
    }

    // 3. Ambulance Marker
    if (currentAmbLoc?.latitude && currentAmbLoc?.longitude) {
      boundsPoints.push([currentAmbLoc.latitude, currentAmbLoc.longitude]);

      const ambulanceIcon = L.divIcon({
        className: 'ambulance-marker-icon',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-12 h-12 bg-blue-500/30 rounded-full animate-pulse"></div>
            <div class="w-10 h-10 bg-slate-900 border-2 border-red-500 rounded-xl shadow-2xl flex items-center justify-center text-white text-base">
              🚑
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      if (!markersRef.current.ambulance) {
        markersRef.current.ambulance = L.marker([currentAmbLoc.latitude, currentAmbLoc.longitude], { icon: ambulanceIcon })
          .addTo(map)
          .bindPopup(`
            <div class="text-xs">
              <strong class="text-blue-600 font-bold">${ambulance?.ambulanceNumber || 'Ambulance'} (${ambulance?.type || 'EMS'})</strong><br/>
              Status: <span class="text-emerald-600 font-semibold">${ambulance?.status || 'Active'}</span><br/>
              Last Signal: ${lastUpdateNotice}<br/>
              ${isDemoMode ? '<span class="text-amber-600 font-semibold">⚠️ Simulated Demo Mode</span>' : '<span class="text-blue-600">📡 Live GPS</span>'}
            </div>
          `);
      } else {
        markersRef.current.ambulance.setLatLng([currentAmbLoc.latitude, currentAmbLoc.longitude]);
      }
    }

    // 4. Route Polyline
    if (polylineRef.current) {
      map.removeLayer(polylineRef.current);
      polylineRef.current = null;
    }

    if (boundsPoints.length >= 2) {
      polylineRef.current = L.polyline(boundsPoints, {
        color: '#dc2626',
        weight: 4,
        opacity: 0.75,
        dashArray: '8, 8'
      }).addTo(map);

      map.fitBounds(boundsPoints, { padding: [50, 50], maxZoom: 16 });
    }
  }, [pickup, destination, currentAmbLoc, lastUpdateNotice, isDemoMode, ambulance]);

  // Demo Movement Step Trigger
  const handleSimulateStep = async () => {
    if (!ambulance?._id || !pickup?.latitude) return;
    try {
      setIsSimulating(true);
      setIsDemoMode(true);
      const res = await api.post(`/ambulances/${ambulance._id}/simulate-move`, {
        targetLat: pickup.latitude,
        targetLng: pickup.longitude,
        stepFraction: 0.25
      });
      if (res.data?.data?.location) {
        setCurrentAmbLoc(res.data.data.location);
        setLastUpdateNotice(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error('Failed to step simulated movement:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  // Recenter map button
  const handleRecenter = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const centerPoint = currentAmbLoc?.latitude ? [currentAmbLoc.latitude, currentAmbLoc.longitude] : pickup?.latitude ? [pickup.latitude, pickup.longitude] : [12.9716, 77.5946];
    map.setView(centerPoint, 15);
  };

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-white">
      {/* Map Control Bar Top */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-wrap items-center gap-2">
        <div className="bg-white/95 backdrop-blur px-3 py-1.5 rounded-lg shadow-md border border-slate-200 text-xs flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isDemoMode ? 'bg-amber-400' : 'bg-emerald-400'} opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isDemoMode ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
          </span>
          <span className="font-semibold text-slate-800">
            {isDemoMode ? 'Demo Mode (Simulated Movement)' : 'Live GPS Receiver'}
          </span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-500 font-mono">Updated: {lastUpdateNotice}</span>
        </div>

        {isDemoMode && (
          <span className="bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider shadow">
            Simulated Coordinates
          </span>
        )}
      </div>

      {/* Action Controls Top Right */}
      <div className="absolute top-3 right-3 z-[1000] flex items-center gap-2">
        <button
          onClick={handleRecenter}
          className="bg-white/95 hover:bg-white text-slate-700 p-2 rounded-lg shadow-md border border-slate-200 text-xs font-medium flex items-center gap-1 transition"
          title="Recenter on Ambulance"
        >
          <Navigation className="w-4 h-4 text-blue-600" />
          <span className="hidden sm:inline">Center</span>
        </button>

        {allowSimulation && ambulance?._id && (
          <button
            onClick={handleSimulateStep}
            disabled={isSimulating}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg shadow-md font-medium text-xs flex items-center gap-1.5 transition active:scale-95"
            title="Step simulated ambulance GPS towards patient for testing"
          >
            {isSimulating ? (
              <RotateCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>Simulate Step (Demo)</span>
          </button>
        )}
      </div>

      {/* Map DOM Container */}
      <div ref={mapContainerRef} style={{ height, width: '100%' }} className="z-0" />

      {/* Map Footer Info */}
      <div className="bg-slate-50 px-4 py-2 border-t border-slate-200 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="text-base">📍</span> Pickup Point: {pickup?.address || 'Current Position'}
          </span>
          {destination?.hospitalName && (
            <span className="flex items-center gap-1">
              <span className="text-base">🏥</span> Destination: {destination.hospitalName}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-slate-500">
          <Info className="w-3.5 h-3.5 text-blue-500" />
          <span>Leaflet + OpenStreetMap engine</span>
        </div>
      </div>
    </div>
  );
}
