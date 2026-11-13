import React from 'react';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

interface CategoryCardProps {
  title: string;
  description: string;
  Icon: React.ElementType;
  image?: string;
  indexLabel?: string;
  actionLabel?: string;
  onClick?: () => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  title,
  description,
  Icon,
  image,
  indexLabel = '01',
  actionLabel = 'Explore Category',
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative w-full h-full min-h-[290px] text-left rounded-2xl overflow-hidden bg-slate-900 hover:bg-slate-800/95 transition-all duration-300 shadow-lg hover:shadow-2xl flex flex-col justify-between p-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
    >
      {image && (
        <>
          <img
            src={image}
            alt={title}
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover opacity-65 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#081713] via-[#0B1F1A]/75 to-[#0B1F1A]/30" />
        </>
      )}

      <div className="relative z-10 flex items-center justify-between w-full">
        <span className="font-mono text-xs tracking-widest text-amber-300/90 tabular-nums">
          {indexLabel}
        </span>
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white group-hover:bg-amber-400 group-hover:text-slate-950 transition-colors duration-200">
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="relative z-10 mt-10">
        <h3 className="text-xl font-bold text-white font-heading tracking-tight mb-2">
          {title}
        </h3>
        <p className="text-slate-300 text-sm leading-relaxed">
          {description}
        </p>
        <div className="mt-5 pt-4 flex items-center justify-between text-xs font-semibold text-amber-300 group-hover:text-white transition-colors">
          <span className="whitespace-nowrap">{actionLabel}</span>
          <ArrowRightIcon className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
        </div>
      </div>
    </button>
  );
};

export default CategoryCard;