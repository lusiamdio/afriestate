

import React from 'react';
import type { Property, User } from '../types';
import PropertyCard from './PropertyCard';
import PropertyCardSkeleton from './PropertyCardSkeleton';

interface PropertyListProps {
  properties: Property[];
  currentUser: User | null;
  onSaveToggle: (propertyId: string) => void;
  savedPropertyIds: Set<string>;
  onOpenCalculator: (property: Property) => void;
  onOpenTourModal: (property: Property) => void;
  onFindSimilar: (property: Property) => void;
  onOpenDetailModal: (property: Property) => void;
  onOpenVRTour: (url: string) => void;
  onToggleCompare: (property: Property) => void;
  compareList: Property[];
  onEdit: (property: Property) => void;
  onDelete: (propertyId: string) => void;
  isLoading?: boolean;
  onOpenVerificationModal?: (property: Property) => void;
  enquiryCounts?: Record<string, number>;
  averageEnquiryCount?: number;
}

const PropertyList: React.FC<PropertyListProps> = (props) => {
  const { 
    properties, 
    currentUser,
    onSaveToggle, 
    savedPropertyIds,
    onOpenCalculator,
    onOpenTourModal,
    onFindSimilar,
    onOpenDetailModal,
    onOpenVRTour,
    onToggleCompare,
    compareList,
    onEdit,
    onDelete,
    isLoading,
    enquiryCounts,
    averageEnquiryCount,
  } = props;

  const resolvedAverageEnquiryCount = React.useMemo(() => {
    if (typeof averageEnquiryCount === 'number' && Number.isFinite(averageEnquiryCount)) {
      return averageEnquiryCount;
    }
    if (!enquiryCounts) return Infinity;
    const positiveCounts = Object.values(enquiryCounts).filter((n) => typeof n === 'number' && n > 0);
    if (positiveCounts.length === 0) return Infinity;
    return positiveCounts.reduce((acc, n) => acc + n, 0) / positiveCounts.length;
  }, [averageEnquiryCount, enquiryCounts]);

  if (isLoading) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <PropertyCardSkeleton key={i} />)}
        </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {properties.map(property => {
        const count = enquiryCounts ? enquiryCounts[property.id] || 0 : 0;
        const isHighDemand = Boolean(enquiryCounts && count > resolvedAverageEnquiryCount);
        return (
          <PropertyCard 
            key={property.id} 
            property={property} 
            isSaved={savedPropertyIds.has(property.id)}
            isCompared={compareList.some(p => p.id === property.id)}
            isOwner={currentUser?.username === property.agent.name}
            onSaveToggle={onSaveToggle}
            onOpenCalculator={onOpenCalculator}
            onOpenTourModal={onOpenTourModal}
            onFindSimilar={onFindSimilar}
            onOpenDetailModal={onOpenDetailModal}
            onOpenVRTour={onOpenVRTour}
            onToggleCompare={onToggleCompare}
            onEdit={onEdit}
            onDelete={onDelete}
            onOpenVerificationModal={props.onOpenVerificationModal}
            enquiryCount={count}
            isHighDemand={isHighDemand}
          />
        );
      })}
    </div>
  );
};

export default PropertyList;