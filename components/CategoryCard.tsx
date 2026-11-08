import React from 'react';

interface CategoryCardProps {
  title: string;
  description: string;
  Icon: React.ElementType;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ title, description, Icon }) => {
  return (
    <div className="glass-card p-8 rounded-2xl text-center group">
      <div className="flex justify-center mb-6">
        <div className="glass-card group-hover:bg-brand-primary/20 p-5 rounded-2xl transition-colors duration-300">
          <Icon className="w-10 h-10 text-brand-primary transition-transform duration-300 group-hover:scale-110" />
        </div>
      </div>
      <h3 className="text-xl font-bold text-brand-dark dark:text-white mb-2">{title}</h3>
      <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{description}</p>
    </div>
  );
};

export default CategoryCard;