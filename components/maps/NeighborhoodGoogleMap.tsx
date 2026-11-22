import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Map as GoogleMap,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useMap,
  useMapsLibrary,
  useAdvancedMarkerRef,
  CollisionBehavior,
} from '@vis.gl/react-google-maps';
import { MapsReadyGuard, isGmpQuotaError, triggerGmpQuotaBanner } from './GoogleMapsProvider';

interface NeighborhoodGoogleMapProps {
  lat: number;
  lng: number;
  label: string;
  subtitle?: string;
  heightClass?: string;
  enableNearbyFilter?: boolean;
  onRouteCalculated?: (info: { distanceText: string; durationText: string; destination: string }) => void;
  routeDestinationQuery?: string;
}

type NearbyCategory = '' | 'school' | 'hospital' | 'restaurant' | 'transit_station';

const CATEGORY_LABELS: Record<NearbyCategory, string> = {
  '': 'District Pin Only',
  school: 'Schools & Universities',
  hospital: 'Hospitals & Clinics',
  restaurant: 'Dining & Cafes',
  transit_station: 'Transit Stations',
};

const CameraSynchronizer: React.FC<{ lat: number; lng: number }> = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    map.panTo({ lat, lng });
    map.setZoom(14);
  }, [map, lat, lng]);
  return null;
};

const NearbyPlacesLayer: React.FC<{
  lat: number;
  lng: number;
  category: NearbyCategory;
  onSelectPlace: (place: google.maps.places.Place | null) => void;
}> = ({ lat, lng, category, onSelectPlace }) => {
  const placesLib = useMapsLibrary('places');
  const [places, setPlaces] = useState<google.maps.places.Place[]>([]);

  useEffect(() => {
    if (!placesLib || !category) {
      setPlaces([]);
      onSelectPlace(null);
      return;
    }

    let cancelled = false;
    const runSearch = async () => {
      try {
        const { places: found } = await placesLib.Place.searchNearby({
          fields: ['id', 'displayName', 'location', 'formattedAddress', 'rating', 'googleMapsURI'],
          locationRestriction: {
            center: { lat, lng },
            radius: 3500,
          },
          includedPrimaryTypes: [category],
          maxResultCount: 10,
        });
        if (!cancelled) {
          setPlaces(found || []);
        }
      } catch (err) {
        if (isGmpQuotaError(err)) {
          triggerGmpQuotaBanner();
        }
        if (!cancelled) {
          setPlaces([]);
        }
      }
    };

    void runSearch();
    return () => {
      cancelled = true;
    };
  }, [placesLib, lat, lng, category, onSelectPlace]);

  return (
    <>
      {places.map((p) => {
        if (!p.location) return null;
        return (
          <AdvancedMarker
            key={p.id}
            position={p.location}
            title={p.displayName || 'Nearby Place'}
            collisionBehavior={CollisionBehavior.OPTIONAL_AND_HIDES_LOWER_PRIORITY}
            onClick={() => onSelectPlace(p)}
          >
            <Pin background="#0F2D25" borderColor="#C9A35D" glyphColor="#FFFFFF" scale={0.85} />
          </AdvancedMarker>
        );
      })}
    </>
  );
};

const RoutesEstimatorBridge: React.FC<{
  origin: { lat: number; lng: number };
  destinationQuery?: string;
  onRouteCalculated?: (info: { distanceText: string; durationText: string; destination: string }) => void;
}> = ({ origin, destinationQuery, onRouteCalculated }) => {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const placesLib = useMapsLibrary('places');

  useEffect(() => {
    const cleanDest = (destinationQuery || '').trim();
    if (!cleanDest || !routesLib || !placesLib || !map || !onRouteCalculated) return;

    let cancelled = false;
    const compute = async () => {
      try {
        const { places } = await placesLib.Place.searchByText({
          textQuery: cleanDest,
          fields: ['location', 'displayName'],
          locationBias: { center: origin, radius: 30000 },
          maxResultCount: 1,
        });

        const destPlace = places?.[0];
        if (!destPlace?.location || cancelled) return;

        const routeService = new (routesLib as any).Route(map);
        const response = await routeService.computeRoutes({
          origin,
          destination: destPlace.location,
          travelMode: 'DRIVING',
          provideRouteAlternatives: false,
        });

        const primaryRoute = response?.routes?.[0];
        if (!primaryRoute || cancelled) return;

        const meters = Number(primaryRoute.distanceMeters || 0);
        const distanceText = meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${meters} m`;
        const durationSec = parseInt(String(primaryRoute.duration || '0').replace(/\D/g, ''), 10);
        const durationMin = Math.max(1, Math.round((Number.isFinite(durationSec) ? durationSec : 900) / 60));

        onRouteCalculated({
          distanceText,
          durationText: `${durationMin} min drive`,
          destination: destPlace.displayName || cleanDest,
        });
      } catch (err) {
        if (isGmpQuotaError(err)) {
          triggerGmpQuotaBanner();
        }
      }
    };

    void compute();
    return () => {
      cancelled = true;
    };
  }, [destinationQuery, origin.lat, origin.lng, routesLib, placesLib, map, onRouteCalculated]);

  return null;
};

const NeighborhoodGoogleMap: React.FC<NeighborhoodGoogleMapProps> = ({
  lat,
  lng,
  label,
  subtitle,
  heightClass = 'h-[340px]',
  enableNearbyFilter = true,
  onRouteCalculated,
  routeDestinationQuery,
}) => {
  const [category, setCategory] = useState<NearbyCategory>('');
  const [selectedPlace, setSelectedPlace] = useState<google.maps.places.Place | null>(null);
  const [mainMarkerRef, mainMarker] = useAdvancedMarkerRef();
  const [showMainInfo, setShowMainInfo] = useState(false);

  const center = useMemo(() => ({ lat, lng }), [lat, lng]);

  const handleSelectPlace = useCallback((p: google.maps.places.Place | null) => {
    setSelectedPlace(p);
    setShowMainInfo(false);
  }, []);

  return (
    <div className="space-y-3">
      {enableNearbyFilter && (
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(CATEGORY_LABELS) as NearbyCategory[]).map((cat) => (
            <button
              key={cat || 'none'}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                category === cat
                  ? 'bg-[#0B1F1A] text-amber-300'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      )}

      <div className={`w-full ${heightClass} rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 relative`}>
        <MapsReadyGuard>
          <GoogleMap
            defaultCenter={center}
            defaultZoom={14}
            mapId="DEMO_MAP_ID"
            gestureHandling="greedy"
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            style={{ width: '100%', height: '100%' }}
            onClick={() => {
              setSelectedPlace(null);
              setShowMainInfo(false);
            }}
          >
            <CameraSynchronizer lat={lat} lng={lng} />
            <NearbyPlacesLayer
              lat={lat}
              lng={lng}
              category={category}
              onSelectPlace={handleSelectPlace}
            />
            {routeDestinationQuery && onRouteCalculated && (
              <RoutesEstimatorBridge
                origin={center}
                destinationQuery={routeDestinationQuery}
                onRouteCalculated={onRouteCalculated}
              />
            )}

            <AdvancedMarker
              ref={mainMarkerRef}
              position={center}
              title={label}
              onClick={() => {
                setSelectedPlace(null);
                setShowMainInfo((prev) => !prev);
              }}
            >
              <Pin background="#C9A35D" borderColor="#0F2D25" glyphColor="#0F2D25" scale={1.15} />
            </AdvancedMarker>

            {showMainInfo && mainMarker && (
              <InfoWindow anchor={mainMarker} onCloseClick={() => setShowMainInfo(false)}>
                <div className="p-1 max-w-[200px] text-slate-900">
                  <p className="text-xs font-bold">{label}</p>
                  {subtitle && <p className="text-[11px] text-slate-600 mt-0.5">{subtitle}</p>}
                </div>
              </InfoWindow>
            )}

            {selectedPlace && selectedPlace.location && (
              <InfoWindow
                position={selectedPlace.location}
                pixelOffset={[0, -28]}
                onCloseClick={() => setSelectedPlace(null)}
              >
                <div className="p-1 max-w-[220px] text-slate-900 space-y-1">
                  <p className="text-xs font-bold">{selectedPlace.displayName}</p>
                  {selectedPlace.formattedAddress && (
                    <p className="text-[11px] text-slate-600">{selectedPlace.formattedAddress}</p>
                  )}
                  {typeof selectedPlace.rating === 'number' && (
                    <p className="text-[11px] font-semibold text-amber-700">
                      Rating: {selectedPlace.rating.toFixed(1)} / 5
                    </p>
                  )}
                  {selectedPlace.googleMapsURI && (
                    <a
                      href={selectedPlace.googleMapsURI}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-[11px] font-semibold text-emerald-700 underline"
                    >
                      Open in Google Maps
                    </a>
                  )}
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        </MapsReadyGuard>
      </div>
    </div>
  );
};

export default NeighborhoodGoogleMap;
