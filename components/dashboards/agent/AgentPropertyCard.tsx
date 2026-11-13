import React from 'react';
import type { Property } from '../../../types';
import { PropertyStatus } from '../../../types';
import {
  EyeIcon,
  HeartIcon,
  PencilIcon,
  TrashIcon,
  Square2StackIcon,
  VrHeadsetIcon,
} from '../../icons/ActionIcons';
import { useCurrency } from '../../../contexts/CurrencyContext';
import { useToast } from '../../../contexts/ToastContext';

interface AgentPropertyCardProps {
  property: Property;
  isSelected: boolean;
  onSelect: (id: string, isSelected: boolean) => void;
  onEdit: (property: Property) => void;
  onDelete: (propertyId: string) => void;
}

const statusStyles: Record<PropertyStatus, string> = {
  [PropertyStatus.ACTIVE]: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60',
  [PropertyStatus.PENDING]: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60',
  [PropertyStatus.DRAFT]: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  [PropertyStatus.EXPIRED]: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800/60',
  [PropertyStatus.SOLD]: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/60',
};

const AgentPropertyCard: React.FC<AgentPropertyCardProps> = ({
  property,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}) => {
  const { formatCurrency } = useCurrency();
  const { addToast } = useToast();

  const handleDuplicate = () => {
    addToast(`Draft copy queued for "${property.title}".`, 'info');
  };

  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-xl border transition-colors flex flex-col sm:flex-row gap-4 p-4 ${
        isSelected
          ? 'border-[#0F2D25] dark:border-amber-400 ring-1 ring-[#0F2D25] dark:ring-amber-400'
          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      <div className="flex-shrink-0 flex sm:flex-col items-start gap-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(property.id, e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-[#0F2D25] focus:ring-[#0F2D25] mt-1 cursor-pointer"
        />
        <img
          src={property.images[0] || '/images/house_suburbs_1779978598551.png'}
          alt={property.title}
          className="w-full sm:w-28 h-40 sm:h-24 object-cover rounded-lg flex-shrink-0 border border-slate-100 dark:border-slate-800"
        />
      </div>

      <div className="flex-grow flex flex-col justify-between min-w-0">
        <div>
          <div className="flex justify-between items-start gap-2">
            <h3 className="font-semibold text-base text-slate-900 dark:text-white truncate font-sans">
              {property.title}
            </h3>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {property.vrTourUrl && (
                <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-2 py-0.5 text-[11px] font-semibold rounded border border-slate-200 dark:border-slate-700">
                  <VrHeadsetIcon className="w-3.5 h-3.5" />
                  3D
                </span>
              )}
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${statusStyles[property.status]}`}
              >
                {property.status}
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            {property.address.street}, {property.address.city}
          </p>
          <p className="text-base font-bold text-slate-900 dark:text-white mt-2 font-mono tabular-nums">
            {property.listingType === 'For Rent'
              ? `${formatCurrency(property.price)}/mo`
              : formatCurrency(property.price)}
          </p>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 pt-3 mt-3 flex justify-between items-center gap-3">
          <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400 font-mono tabular-nums">
            <span className="flex items-center gap-1.5" title="Total Views">
              <EyeIcon className="w-4 h-4 text-slate-400" />
              {property.views}
            </span>
            <span className="flex items-center gap-1.5" title="Saves">
              <HeartIcon className="w-4 h-4 text-slate-400" />
              {property.saves}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleDuplicate}
              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
              title="Duplicate listing"
            >
              <Square2StackIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => onEdit(property)}
              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
              title="Edit listing"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(property.id)}
              className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950/50 text-red-500 hover:text-red-700 transition-colors"
              title="Delete listing"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentPropertyCard;
