import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  Map as GoogleMap,
  MapControl,
  ControlPosition,
  AdvancedMarker,
  InfoWindow,
  CollisionBehavior,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import type { Property } from '../types';
import { useCurrency } from '../contexts/CurrencyContext';
import { MapsReadyGuard, isGmpQuotaError, triggerGmpQuotaBanner } from './maps/GoogleMapsProvider';

interface MapInterfaceProps {
  properties: Property[];
  onOpenDetailModal: (property: Property) => void;
}

const FALLBACK_IMAGE = '/images/2ec34ce4ca57aef13fc8b3239a99345e.jpg';
const DEFAULT_AFRICA_CENTER = { lat: -15.5, lng: 21.5 };

const PlaceJumpAutocomplete: React.FC<{
  onPlaceChosen: (name: string) => void;
}> = ({ onPlaceChosen }) => {
  const map = useMap();
  const placesLibrary = useMapsLibrary('places');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!map || !placesLibrary || !containerRef.current) return;

    const autocomplete = new placesLibrary.PlaceAutocompleteElement();
    containerRef.current.appendChild(autocomplete);

    const handleSelect = (e: Event) => {
      const event = e as google.maps.places.PlacePredictionSelectEvent;
      if (!event?.placePrediction) return;
      const place = event.placePrediction.toPlace();

      void place
        .fetchFields({
          fields: ['location', 'viewport', 'displayName', 'formattedAddress'],
        })
        .then(() => {
          if (place.viewport) {
            map.fitBounds(place.viewport);
          } else if (place.location) {
            map.setCenter(place.location);
            map.setZoom(13);
          }
          onPlaceChosen(place.displayName || place.formattedAddress || '');
        })
        .catch((err: unknown) => {
          if (isGmpQuotaError(err)) {
            triggerGmpQuotaBanner();
          }
        });
    };

    autocomplete.addEventListener('gmp-select', handleSelect);

    return () => {
      autocomplete.removeEventListener('gmp-select', handleSelect);
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [map, placesLibrary, onPlaceChosen]);

  return (
    <div className="m-3 w-[270px] sm:w-[320px] rounded-xl bg-white shadow-xl border border-slate-200 p-1.5">
      <div ref={containerRef} className="w-full" />
    </div>
  );
};

const BoundsFitter: React.FC<{ properties: Property[] }> = ({ properties }) => {
  const map = useMap();
  const coreLib = useMapsLibrary('core');

  useEffect(() => {
    if (!map || !coreLib) return;
    const valid = properties.filter(
      (p) => p.coordinates && typeof p.coordinates.lat === 'number' && typeof p.coordinates.lng === 'number'
    );
    if (valid.length === 0) return;

    if (valid.length === 1) {
      map.setCenter({ lat: valid[0].coordinates.lat, lng: valid[0].coordinates.lng });
      map.setZoom(13);
      return;
    }

    const bounds = new coreLib.LatLngBounds();
    for (const prop of valid) {
      bounds.extend({ lat: prop.coordinates.lat, lng: prop.coordinates.lng });
    }
    map.fitBounds(bounds, 48);
  }, [properties, map, coreLib]);

  return null;
};

const MapInterface: React.FC<MapInterfaceProps> = ({ properties, onOpenDetailModal }) => {
  const { formatCurrency } = useCurrency();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [searchedPlaceLabel, setSearchedPlaceLabel] = useState<string | null>(null);

  // Store marker DOM/AdvancedMarkerElement refs in plain object record (never shadow global Map!)
  const markerInstancesRef = useRef<Record<string, google.maps.marker.AdvancedMarkerElement | null>>({});

  // Sort markers descending by latitude for layered visual depth (per advanced marker guidelines)
  const orderedProperties = useMemo(() => {
    return properties
      .filter((p) => p.coordinates && typeof p.coordinates.lat === 'number' && typeof p.coordinates.lng === 'number')
      .slice()
      .sort((a, b) => b.coordinates.lat - a.coordinates.lat);
  }, [properties]);

  const selectedProperty = useMemo(
    () => orderedProperties.find((p) => p.id === selectedPropertyId) || null,
    [orderedProperties, selectedPropertyId]
  );

  const selectedAnchor = selectedPropertyId ? markerInstancesRef.current[selectedPropertyId] || null : null;

  const handlePlaceChosen = useCallback((name: string) => {
    setSearchedPlaceLabel(name || null);
  }, []);

  return (
    <div className="w-full space-y-2">
      {searchedPlaceLabel && (
        <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-xs text-emerald-900 dark:text-emerald-200">
          <span>Centered map on <strong>{searchedPlaceLabel}</strong> via Google Places</span>
          <button
            type="button"
            onClick={() => setSearchedPlaceLabel(null)}
            className="text-[11px] font-semibold underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="w-full h-[600px] rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800 relative z-0">
        <MapsReadyGuard>
          <GoogleMap
            defaultCenter={DEFAULT_AFRICA_CENTER}
            defaultZoom={4}
            mapId="DEMO_MAP_ID"
            gestureHandling="greedy"
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            style={{ width: '100%', height: '100%' }}
            onClick={() => setSelectedPropertyId(null)}
          >
            <BoundsFitter properties={orderedProperties} />

            <MapControl position={ControlPosition.TOP_LEFT}>
              <PlaceJumpAutocomplete onPlaceChosen={handlePlaceChosen} />
            </MapControl>

            {orderedProperties.map((property, index) => {
              const isSelected = selectedPropertyId === property.id;
              const isHovered = hoveredId === property.id;
              const zIndex = isSelected ? 1000 : isHovered ? 999 : index + 1;

              return (
                <AdvancedMarker
                  key={property.id}
                  ref={(el) => {
                    markerInstancesRef.current[property.id] = el;
                  }}
                  position={{ lat: property.coordinates.lat, lng: property.coordinates.lng }}
                  zIndex={zIndex}
                  collisionBehavior={CollisionBehavior.OPTIONAL_AND_HIDES_LOWER_PRIORITY}
                  onMouseEnter={() => setHoveredId(property.id)}
                  onMouseLeave={() => setHoveredId((prev) => (prev === property.id ? null : prev))}
                  onClick={() => setSelectedPropertyId(property.id)}
                >
                  <div
                    className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-bold shadow-md border transition-transform ${
                      isSelected
                        ? 'bg-amber-400 text-slate-950 border-slate-950 scale-110'
                        : isHovered
                        ? 'bg-emerald-800 text-white border-amber-300 scale-105'
                        : 'bg-[#0B1F1A] text-white border-white/80'
                    }`}
                  >
                    {formatCurrency(property.price)}
                  </div>
                </AdvancedMarker>
              );
            })}

            {selectedProperty && selectedAnchor && (
              <InfoWindow
                anchor={selectedAnchor}
                pixelOffset={[0, -6]}
                onCloseClick={() => setSelectedPropertyId(null)}
              >
                <div
                  className="w-[230px] cursor-pointer text-slate-900"
                  onClick={() => onOpenDetailModal(selectedProperty)}
                >
                  <img
                    src={selectedProperty.images?.[0] || FALLBACK_IMAGE}
                    alt={selectedProperty.title}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      if (!e.currentTarget.dataset.fb) {
                        e.currentTarget.dataset.fb = '1';
                        e.currentTarget.src = FALLBACK_IMAGE;
                      }
                    }}
                    className="w-full h-28 object-cover rounded-lg mb-2"
                  />
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-900 text-xs line-clamp-1">
                      {selectedProperty.title}
                    </h4>
                    <p className="text-emerald-800 font-bold text-xs font-mono">
                      {formatCurrency(selectedProperty.price)}
                    </p>
                    <p className="text-slate-500 text-[11px] truncate">
                      {selectedProperty.address.street}, {selectedProperty.address.city}
                    </p>
                    <span className="inline-block text-[11px] font-semibold text-amber-700 pt-1">
                      Inspect Property Details →
                    </span>
                  </div>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        </MapsReadyGuard>
      </div>
    </div>
  );
};

export default MapInterface;
