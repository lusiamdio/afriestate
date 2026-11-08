import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Property } from '../types';
import PropertyCard from './PropertyCard';

// Fix for default marker icon in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapInterfaceProps {
  properties: Property[];
  onOpenDetailModal: (property: Property) => void;
}

const UpdateMapCenter: React.FC<{ properties: Property[] }> = ({ properties }) => {
  const map = useMap();
  useEffect(() => {
    if (properties.length > 0) {
      if (properties[0].coordinates) {
         map.setView([properties[0].coordinates.lat, properties[0].coordinates.lng], 12);
      }
    }
  }, [properties, map]);
  return null;
};

const MapInterface: React.FC<MapInterfaceProps> = ({ properties, onOpenDetailModal }) => {
  const defaultCenter: [number, number] = [-33.9249, 18.4241]; // Default to Cape Town

  return (
    <div className="w-full h-[600px] rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800 relative z-0">
      <MapContainer center={defaultCenter} zoom={10} scrollWheelZoom={true} style={{ height: '100%', width: '100%', zIndex: 1 }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <UpdateMapCenter properties={properties} />
        {properties.map(property => {
          if (!property.coordinates) return null;
          return (
            <Marker key={property.id} position={[property.coordinates.lat, property.coordinates.lng]}>
              <Popup className="property-popup">
                <div 
                  className="cursor-pointer"
                  onClick={() => onOpenDetailModal(property)}
                >
                  <img src={property.images[0]} alt={property.title} className="w-full h-32 object-cover rounded-t-lg mb-2" />
                  <div className="p-2 pt-0 text-sm">
                    <h4 className="font-bold text-slate-800 truncate mb-1">{property.title}</h4>
                    <p className="text-brand-primary font-bold">R {property.price.toLocaleString()}</p>
                    <p className="text-slate-500 text-xs truncate">{property.address.street}, {property.address.city}</p>
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
      <style>{`
        .property-popup .leaflet-popup-content-wrapper {
          padding: 0;
          overflow: hidden;
          border-radius: 0.5rem;
        }
        .property-popup .leaflet-popup-content {
          margin: 0;
          width: 220px !important;
        }
      `}</style>
    </div>
  );
}

export default MapInterface;
