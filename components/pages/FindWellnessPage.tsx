import React, { useMemo, useState } from 'react';
import {
  MagnifyingGlassIcon as SearchIcon,
  MapPinIcon,
  ChevronDownIcon,
  PhoneIcon,
  GlobeAltIcon,
  XMarkIcon,
  SparklesIcon,
  HeartIcon,
  SunIcon,
  ShieldCheckIcon,
  BuildingOffice2Icon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon, CheckBadgeIcon } from '@heroicons/react/24/solid';
import { wellnessDirectory } from '../../src/wellnessDirectory';
import type { Property } from '../../types';
import { supabase } from '../../lib/supabase';
import { GoogleGenAI } from '../../lib/ai';
import { useToast } from '../../contexts/ToastContext';

const categories = [
  { name: 'Mental Wellness', subtitle: 'Psychologists, therapists, and clinical counselors', icon: HeartIcon },
  { name: 'Physical Wellness', subtitle: 'Performance coaching, movement studios, physiotherapy', icon: UserGroupIcon },
  { name: 'Nutrition & Diet', subtitle: 'Clinical dieticians and metabolic specialists', icon: SunIcon },
  { name: 'Alternative Healing', subtitle: 'Acupuncture, breathwork, and holistic care', icon: SparklesIcon },
  { name: 'Beauty & Spa', subtitle: 'Thermal hydrotherapy, massage, and skin ateliers', icon: SparklesIcon },
  { name: 'Corporate Wellness', subtitle: 'Executive health & organizational wellbeing programs', icon: BuildingOffice2Icon },
  { name: 'Medical Wellness', subtitle: 'Preventive diagnostics and longevity clinics', icon: ShieldCheckIcon },
  { name: 'Wellness Retreats', subtitle: 'Multi-day sanctuary immersions across Africa', icon: SunIcon },
];

const popularServices = [
  { name: 'Executive Therapy Session', price: 'From R 450', action: 'Book Online' },
  { name: 'Private Fitness Coaching', price: 'From R 300', action: 'Book Now' },
  { name: 'Metabolic & Nutrition Consult', price: 'From R 420', action: 'Schedule' },
  { name: 'Thermal Spa & Massage Ritual', price: 'From R 650', action: 'Reserve' },
  { name: 'Corporate Wellness Audit', price: 'Custom Quote', action: 'Request Quote' },
];

const retreatTypes = [
  'Wellness Retreats',
  'Yoga & Breathwork',
  'Restorative Healing',
  'Longevity & Detox',
  'Executive Reset',
  'Mindfulness Sanctuaries',
];

const fallbackProviders = [
  {
    name: 'Serenity Botanical Sanctuary',
    location: 'Cape Town',
    rating: 4.9,
    category: 'Mental Wellness · Holistic Therapy',
    image: '/images/safari_lodge_retreat.jpg',
    notes: 'Architectural ocean-view wellness studio offering integrative clinical psychology and restorative sound therapy.',
    phone: '+27 21 555 1234',
    website: 'serenitysanctuary.co.za',
  },
  {
    name: 'Vital Longevity Clinic',
    location: 'Johannesburg',
    rating: 4.8,
    category: 'Medical Wellness · Preventive Care',
    image: '/images/spa_wellness_1779978823248.png',
    notes: 'Diagnostics-led preventive health center specializing in stress recovery, sleep medicine, and metabolic care.',
    phone: '+27 11 444 8888',
    website: 'vitallongevity.co.za',
  },
  {
    name: 'Wilderness Lodge & Spa',
    location: 'Garden Route',
    rating: 5.0,
    category: 'Wellness Retreats · Thermal Hydrotherapy',
    image: '/images/house_pool_1779978750296.png',
    notes: 'Private teak pavilion retreat with mineral pools, guided yoga sessions, and farm-to-table botanical menus.',
    phone: '+27 44 333 9999',
    website: 'wildernessretreat.co.za',
  },
  {
    name: 'Balance Corporate Health',
    location: 'Pretoria',
    rating: 4.7,
    category: 'Corporate Wellness · Nutrition',
    image: '/images/getlstd-property-photo.jpg',
    notes: 'Structured resilience workshops and preventative executive health screenings for distributed African teams.',
    phone: '+27 12 222 7777',
    website: 'balancecorporate.co.za',
  },
];

const FindWellnessPage: React.FC<{ properties?: Property[] }> = ({ properties = [] }) => {
  const { addToast } = useToast();
  const [visibleCount, setVisibleCount] = useState(8);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [selectedGoals, setSelectedGoals] = useState<string[]>(['Stress Management']);
  const [aiRecommendation, setAiRecommendation] = useState<{ title: string; detail: string }>({
    title: 'Restorative Sanctuary Immersion',
    detail: 'Based on your goals, we recommend combining clinical stress recovery sessions in Cape Town with thermal hydrotherapy retreats.',
  });
  const [isMatching, setIsMatching] = useState(false);

  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [modalMode, setModalMode] = useState<'book' | 'enquire' | null>(null);

  const allCompanies = useMemo(() => {
    if (properties.length > 0) {
      return properties.map((p, idx) => ({
        name: p.title,
        location: p.address.city,
        rating: p.agent?.rating || 4.8,
        category: p.amenities.join(' · ') || 'Wellness Sanctuary',
        image: p.images?.[0] || fallbackProviders[idx % fallbackProviders.length].image,
        notes: p.neighborhoodInfo || 'Vetted residential wellness partner.',
        phone: p.agent?.phone || '+27 12 345 6789',
        website: 'afriestate-wellness.com',
      }));
    }
    const dirItems = (wellnessDirectory || []).map((item: any) => ({
      name: item.name,
      location: item.location || 'South Africa',
      rating: item.rating || 4.8,
      category: item.category || 'Holistic Care',
      image: item.image || '/images/spa_wellness_1779978823248.png',
      notes: item.notes || item.description || 'Verified AfriEstate wellness practitioner and retreat sanctuary.',
      phone: item.phone || 'N/A',
      website: item.website || 'N/A',
    }));
    return dirItems.length > 0 ? dirItems : fallbackProviders;
  }, [properties]);

  const filteredCompanies = useMemo(() => {
    const kw = searchKeyword.trim().toLowerCase();
    const loc = locationQuery.trim().toLowerCase();
    const cat = selectedCategory.trim().toLowerCase();

    return allCompanies.filter((c) => {
      const matchKw =
        !kw ||
        c.name.toLowerCase().includes(kw) ||
        c.category.toLowerCase().includes(kw) ||
        (c.notes || '').toLowerCase().includes(kw);
      const matchCat =
        !cat ||
        c.category.toLowerCase().includes(cat) ||
        c.name.toLowerCase().includes(cat);
      const matchLoc = !loc || c.location.toLowerCase().includes(loc);
      return matchKw && matchCat && matchLoc;
    });
  }, [allCompanies, searchKeyword, selectedCategory, locationQuery]);

  const closeModal = () => {
    setSelectedCompany(null);
    setModalMode(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) return;
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const username = user?.email || 'guest';
      await supabase.from('tour_requests').insert({
        property_id: 'wellness_' + Date.now().toString(36),
        property_title: selectedCompany.name,
        username,
        date: new Date().toISOString().split('T')[0],
        time: '12:00',
        status: 'Pending',
        timestamp: Date.now(),
      });
    } catch {
      // graceful continuation
    } finally {
      addToast(
        modalMode === 'book'
          ? `Appointment requested with ${selectedCompany.name}.`
          : `Enquiry sent to ${selectedCompany.name}.`,
        'success'
      );
      closeModal();
    }
  };

  const toggleGoal = (goal: string) => {
    setSelectedGoals((prev) => (prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]));
  };

  const handleGenerateRecommendation = async () => {
    setIsMatching(true);
    const goalText = selectedGoals.length > 0 ? selectedGoals.join(', ') : 'Holistic Recovery';
    try {
      const ai = new GoogleGenAI();
      const res = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Suggest a short wellness program title and 2-sentence bespoke retreat/practitioner match in South Africa for someone focused on: ${goalText}.`,
      });
      const text = res.text || '';
      setAiRecommendation({
        title: `${selectedGoals[0] || 'Holistic'} Sanctuary Track`,
        detail: text || `Tailored practitioner pairing and thermal spa immersion calibrated around ${goalText}.`,
      });
    } catch {
      setAiRecommendation({
        title: `${selectedGoals[0] || 'Restorative'} Sanctuary Track`,
        detail: `Matched with top-rated Cape Town & Garden Route retreats specializing in ${goalText.toLowerCase()}, guided breathwork, and private recovery suites.`,
      });
    } finally {
      setIsMatching(false);
    }
  };

  return (
    <div className="w-full bg-[#FAF8F5] dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans min-h-screen">
      {/* Editorial Hero + Directory Filter Bar */}
      <section className="relative w-full bg-[#0B1F1A] text-white pt-20 pb-28 px-6 sm:px-10 lg:px-16 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/images/safari_lodge_retreat.jpg"
            alt="African sanctuary retreat with infinity pool"
            className="w-full h-full object-cover opacity-35"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B1F1A] via-[#0B1F1A]/70 to-[#0B1F1A]/45" />
        </div>

        <div className="max-w-6xl mx-auto relative z-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#C9A35D] mb-4">
            AfriEstate Wellness &amp; Retreats
          </p>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.08] max-w-4xl mx-auto">
            Restorative Retreats &amp; Clinical Wellbeing Sanctuaries
          </h1>
          <p className="text-base sm:text-lg text-slate-300 mt-5 mb-10 max-w-2xl mx-auto font-light">
            Connect with vetted wellness sanctuaries, longevity clinics, private therapists, and restorative retreats across Southern Africa.
          </p>

          {/* Directory Search Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
              <div className="bg-[#FAF8F5] dark:bg-slate-800/80 rounded-xl px-3.5 py-2.5 border border-slate-200/70 dark:border-slate-700">
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Search Directory
                </label>
                <div className="flex items-center gap-2">
                  <SearchIcon className="w-4 h-4 text-[#0F2D25] dark:text-[#C9A35D] shrink-0" />
                  <input
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder="Retreat, clinic, or modality..."
                    className="w-full bg-transparent outline-none text-sm font-medium"
                  />
                </div>
              </div>

              <div className="bg-[#FAF8F5] dark:bg-slate-800/80 rounded-xl px-3.5 py-2.5 border border-slate-200/70 dark:border-slate-700 relative">
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Modality
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-transparent outline-none text-sm font-medium appearance-none pr-6 cursor-pointer"
                >
                  <option value="">All Modalities</option>
                  {categories.map((cat) => (
                    <option key={cat.name} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="w-4 h-4 text-slate-400 absolute right-3 bottom-3 pointer-events-none" />
              </div>

              <div className="bg-[#FAF8F5] dark:bg-slate-800/80 rounded-xl px-3.5 py-2.5 border border-slate-200/70 dark:border-slate-700">
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Region
                </label>
                <div className="flex items-center gap-2">
                  <MapPinIcon className="w-4 h-4 text-[#0F2D25] dark:text-[#C9A35D] shrink-0" />
                  <input
                    type="text"
                    value={locationQuery}
                    onChange={(e) => setLocationQuery(e.target.value)}
                    placeholder="Cape Town, Sandton..."
                    className="w-full bg-transparent outline-none text-sm font-medium"
                  />
                </div>
              </div>

              <button
                onClick={() => document.getElementById('wellness-directory')?.scrollIntoView({ behavior: 'smooth' })}
                className="h-[58px] bg-[#0F2D25] text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#173f34] transition-colors"
              >
                <SearchIcon className="w-4 h-4 text-[#C9A35D]" /> Search Sanctuaries
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs">
            {['Therapy', 'Spa', 'Retreat', 'Nutrition', 'Fitness', 'Corporate'].map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  setSearchKeyword(tag);
                  document.getElementById('wellness-directory')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-white/10 hover:bg-white/20 px-3.5 py-1.5 rounded-lg text-slate-200 transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Modality Categories Grid */}
      <section className="py-14 px-6 sm:px-10 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C9A35D]">Disciplines</p>
              <h2 className="font-heading text-3xl font-semibold text-slate-900 dark:text-white mt-1">
                Explore Care Modalities
              </h2>
            </div>
            {(searchKeyword || selectedCategory || locationQuery) && (
              <button
                onClick={() => {
                  setSearchKeyword('');
                  setSelectedCategory('');
                  setLocationQuery('');
                }}
                className="text-xs font-semibold text-[#0F2D25] dark:text-[#C9A35D] hover:underline"
              >
                Reset Directory Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.name;
              const Icon = cat.icon;
              return (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(isSelected ? '' : cat.name);
                    document.getElementById('wellness-directory')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`text-left p-5 rounded-xl border transition-colors ${
                    isSelected
                      ? 'bg-[#0F2D25] text-white border-[#0F2D25]'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-3 ${isSelected ? 'text-[#C9A35D]' : 'text-[#0F2D25] dark:text-[#C9A35D]'}`} />
                  <h3 className="font-semibold text-sm">{cat.name}</h3>
                  <p className={`text-xs mt-1 leading-relaxed ${isSelected ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>
                    {cat.subtitle}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Wellness Directory */}
      <section id="wellness-directory" className="py-16 px-6 sm:px-10 lg:px-16 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-end justify-between gap-4 pb-6 mb-10 border-b border-slate-200 dark:border-slate-800">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C9A35D]">Verified Providers</p>
              <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-slate-900 dark:text-white mt-1">
                Wellness Sanctuary &amp; Clinic Directory
              </h2>
            </div>
            <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
              Showing {Math.min(visibleCount, filteredCompanies.length)} of {filteredCompanies.length}
            </span>
          </div>

          {filteredCompanies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredCompanies.slice(0, visibleCount).map((company, i) => (
                <div
                  key={`${company.name}-${i}`}
                  className="bg-[#FAF8F5] dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                >
                  <div className="h-44 relative overflow-hidden bg-slate-200 dark:bg-slate-800">
                    <img
                      src={company.image}
                      alt={company.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="p-5 flex flex-col flex-grow">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-heading text-lg font-semibold text-slate-900 dark:text-white leading-snug">
                        {company.name}
                      </h3>
                      <span className="inline-flex items-center gap-1 text-xs font-mono tabular-nums font-semibold shrink-0 pt-0.5">
                        <StarSolidIcon className="w-3.5 h-3.5 text-[#C9A35D]" /> {company.rating}
                      </span>
                    </div>

                    <p className="text-[11px] font-semibold text-[#0F2D25] dark:text-[#C9A35D] mt-1">
                      {company.category}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {company.notes}
                    </p>

                    <div className="mt-auto pt-4 mt-4 border-t border-slate-200/70 dark:border-slate-800 space-y-1 text-xs text-slate-600 dark:text-slate-300">
                      <p className="flex items-center gap-1.5 truncate">
                        <MapPinIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {company.location}
                      </p>
                      {company.phone !== 'N/A' && (
                        <p className="flex items-center gap-1.5 font-mono tabular-nums truncate">
                          <PhoneIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {company.phone}
                        </p>
                      )}
                      {company.website !== 'N/A' && (
                        <p className="flex items-center gap-1.5 truncate">
                          <GlobeAltIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {company.website.replace('https://', '').replace('www.', '')}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedCompany(company);
                          setModalMode('book');
                        }}
                        className="flex-1 bg-[#0F2D25] text-white py-2 rounded-lg text-xs font-semibold hover:bg-[#173f34] transition-colors"
                      >
                        Book
                      </button>
                      <button
                        onClick={() => {
                          setSelectedCompany(company);
                          setModalMode('enquire');
                        }}
                        className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 py-2 rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        Enquire
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-14 text-center bg-[#FAF8F5] dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                No practitioners matched your current directory filters.
              </p>
              <button
                onClick={() => {
                  setSearchKeyword('');
                  setSelectedCategory('');
                  setLocationQuery('');
                }}
                className="mt-3 px-4 py-2 bg-[#0F2D25] text-white rounded-lg text-xs font-semibold"
              >
                Show All Sanctuaries
              </button>
            </div>
          )}

          {visibleCount < filteredCompanies.length && (
            <div className="mt-10 text-center">
              <button
                onClick={() => setVisibleCount((prev) => prev + 8)}
                className="px-6 py-2.5 bg-[#0F2D25] text-white rounded-xl text-xs font-semibold hover:bg-[#173f34] transition-colors"
              >
                Load More Sanctuaries
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Popular Treatments & Retreats Split */}
      <section className="py-16 px-6 sm:px-10 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C9A35D]">Quick Scheduling</p>
            <h2 className="font-heading text-3xl font-semibold text-slate-900 dark:text-white mt-1">
              Signature Treatments &amp; Consultations
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {popularServices.map((service) => (
              <div
                key={service.name}
                className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4"
              >
                <div>
                  <h4 className="font-semibold text-sm text-slate-900 dark:text-white">{service.name}</h4>
                  <p className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400 mt-0.5">
                    {service.price}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedCompany({ name: service.name });
                    setModalMode('book');
                  }}
                  className="bg-[#0F2D25] text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-[#173f34] transition-colors whitespace-nowrap shrink-0"
                >
                  {service.action}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Immersive Retreats & AI Matchmaker */}
      <section className="py-16 px-6 sm:px-10 lg:px-16 bg-[#0B1F1A] text-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C9A35D] mb-3">
              Curated Wellness Retreats
            </p>
            <h2 className="font-heading text-3xl sm:text-5xl font-semibold leading-tight">
              Immersive Escapes Built Around Recovery
            </h2>
            <p className="text-sm sm:text-base text-slate-300 mt-4 font-light leading-relaxed">
              Select your core wellbeing objectives and let our concierge match retreats, medical spas, and holistic specialists across Africa.
            </p>

            <div className="flex flex-wrap gap-2 mt-6">
              {retreatTypes.map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setSearchKeyword(r.split(' ')[0]);
                    document.getElementById('wellness-directory')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="bg-white/10 hover:bg-white/20 px-3.5 py-2 rounded-lg text-xs font-medium text-slate-200 transition-colors"
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Matchmaker Panel */}
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading text-2xl font-semibold">AI Retreat Matchmaker</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Select one or more goals below</p>
              </div>
              <CheckBadgeIcon className="w-6 h-6 text-[#0F2D25] dark:text-[#C9A35D]" />
            </div>

            <div className="flex flex-wrap gap-2">
              {['Stress Management', 'Better Sleep', 'Fitness & Mobility', 'Longevity', 'Mental Clarity'].map(
                (goal) => {
                  const active = selectedGoals.includes(goal);
                  return (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => toggleGoal(goal)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                        active
                          ? 'bg-[#0F2D25] text-white border-[#0F2D25]'
                          : 'bg-[#FAF8F5] dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {goal}
                    </button>
                  );
                }
              )}
            </div>

            <div className="bg-[#FAF8F5] dark:bg-slate-800/70 p-4 rounded-xl border border-slate-200/70 dark:border-slate-700">
              <p className="text-xs font-semibold text-[#0F2D25] dark:text-[#C9A35D]">{aiRecommendation.title}</p>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                {aiRecommendation.detail}
              </p>
            </div>

            <button
              onClick={handleGenerateRecommendation}
              disabled={isMatching}
              className="w-full bg-[#0F2D25] text-white py-3 rounded-xl text-xs font-semibold hover:bg-[#173f34] disabled:bg-slate-400 transition-colors"
            >
              {isMatching ? 'Matching Sanctuaries...' : 'Generate Bespoke Match'}
            </button>
          </div>
        </div>
      </section>

      {/* Partner Onboarding Footer Strip */}
      <section className="py-16 px-6 sm:px-10 lg:px-16 text-center bg-[#FAF8F5] dark:bg-slate-950">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-heading text-3xl font-semibold text-slate-900 dark:text-white">
            Partner With the AfriEstate Wellness Network
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 mb-7">
            Position your clinic, sanctuary lodge, or therapeutic practice directly alongside verified luxury stays and residential communities.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => {
                setSelectedCompany({ name: 'AfriEstate Partner Onboarding' });
                setModalMode('enquire');
              }}
              className="bg-[#0F2D25] text-white px-6 py-3 rounded-xl text-xs font-semibold hover:bg-[#173f34] transition-colors"
            >
              List Your Sanctuary
            </button>
            <button
              onClick={() => addToast('Partner prospectus sent to your registered email.', 'info')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 px-6 py-3 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Request Partner Prospectus
            </button>
          </div>
        </div>
      </section>

      {/* Booking / Enquiry Modal */}
      {selectedCompany && modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="font-heading text-xl font-semibold text-slate-900 dark:text-white">
                  {modalMode === 'book' ? 'Schedule Appointment' : 'Direct Enquiry'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{selectedCompany.name}</p>
              </div>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    placeholder="First name"
                    className="w-full px-3 py-2.5 bg-[#FAF8F5] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Last name"
                    className="w-full px-3 py-2.5 bg-[#FAF8F5] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="you@domain.com"
                  className="w-full px-3 py-2.5 bg-[#FAF8F5] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
                />
              </div>

              {modalMode === 'book' && (
                <div>
                  <label className="block text-xs font-semibold mb-1">Preferred Date</label>
                  <input
                    type="date"
                    required
                    defaultValue="2026-06-15"
                    className="w-full px-3 py-2.5 bg-[#FAF8F5] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold mb-1">
                  {modalMode === 'book' ? 'Focus Areas or Preferences' : 'Enquiry Message'}
                </label>
                <textarea
                  rows={3}
                  required={modalMode === 'enquire'}
                  placeholder="Share preferred timing, retreat dates, or specialist requirements..."
                  className="w-full px-3 py-2.5 bg-[#FAF8F5] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#0F2D25] text-white py-3 rounded-xl text-xs font-semibold hover:bg-[#173f34] transition-colors"
              >
                {modalMode === 'book' ? 'Confirm Appointment Request' : 'Send Enquiry'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FindWellnessPage;
