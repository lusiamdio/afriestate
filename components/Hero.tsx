
import React, { useEffect, useState } from 'react';
import SearchBar from './SearchBar';
import type { SearchFilters } from '../types';
import { useTranslations } from '../contexts/LanguageContext';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

const FadeInSection: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => {
  const [isVisible, setVisible] = useState(false);
  const domRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
          if (entry.isIntersecting) {
              setVisible(true);
          }
      });
    });
    
    if (domRef.current) {
        observer.observe(domRef.current);
    }
    return () => {
        if (domRef.current) observer.unobserve(domRef.current);
    }
  }, []);

  return (
    <div
      ref={domRef}
      className={`transition-all duration-1000 ease-out transform ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

interface HeroProps {
    onSearch: (query: string) => void;
    isSearchingAI: boolean;
    filters: SearchFilters;
    onFilterChange: (key: keyof SearchFilters, value: any) => void;
}

const Hero: React.FC<HeroProps> = (props) => {
  const { t } = useTranslations();

  return (
    <div className="relative h-[80vh] min-h-[700px] flex items-center justify-center text-center overflow-hidden font-sans">
      <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2500&q=80" 
            alt="Luxury Property Background" 
            className="w-full h-full object-cover transform scale-105 animate-slow-zoom"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-brand-dark/50 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-transparent to-transparent"></div>
      </div>
      
      <div className="relative z-10 px-6 w-full max-w-7xl mx-auto mt-16">
        <FadeInSection>
            <span className="inline-block py-1 px-3 rounded-full bg-white/10 text-white backdrop-blur-sm border border-white/20 text-sm font-semibold tracking-widest uppercase mb-6 shadow-xl">
                Discover Premium Real Estate
            </span>
            <h1 
              className="text-5xl sm:text-6xl md:text-8xl font-black mb-6 tracking-tight text-white font-heading drop-shadow-2xl" 
            >
              {t.hero.title}
            </h1>
        </FadeInSection>
        
        <FadeInSection delay={200}>
            <p 
              className="text-xl md:text-3xl mb-12 max-w-3xl mx-auto font-light leading-relaxed text-slate-100 drop-shadow-lg"
            >
              Find a place you'll love to call home. Secure your future with the continent's most premier property platform.
            </p>
        </FadeInSection>

        <FadeInSection delay={400}>
            <div className="max-w-5xl mx-auto bg-white/10 backdrop-blur-md p-3 md:p-4 rounded-3xl border border-white/20 shadow-2xl">
              <div className="bg-white rounded-2xl p-2 shadow-inner">
                <SearchBar {...props} />
              </div>
            </div>
            
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <div className="text-white text-sm opacity-80 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-brand-secondary animate-pulse"></span>
                    Over 10,000 Verified Listings
                </div>
            </div>
        </FadeInSection>
      </div>

      <style>{`
        @keyframes slowZoom {
            from { transform: scale(1.0); }
            to { transform: scale(1.1); }
        }
        .animate-slow-zoom {
            animation: slowZoom 20s ease-in-out infinite alternate;
        }
      `}</style>
    </div>
  );
};

export default Hero;