import React, { useMemo, useState } from 'react';
import {
  MagnifyingGlassIcon as SearchIcon,
  StarIcon,
  MapPinIcon,
  ShieldCheckIcon,
  HeartIcon,
  ChevronDownIcon,
  CalendarIcon,
  UsersIcon,
  XMarkIcon,
  SparklesIcon,
  ChatBubbleBottomCenterTextIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon, StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import StayDetailsPage from './StayDetailsPage';
import type { Property } from '../../types';
import { GoogleGenAI } from '../../lib/ai';
import { useToast } from '../../contexts/ToastContext';

const categories = [
  {
    name: 'Hotels',
    subtitle: 'Executive city suites and flagship luxury hotels',
    image: '/images/841376502.webp',
  },
  {
    name: 'Resorts',
    subtitle: 'Coastal sanctuaries, safari lodges, and spa retreats',
    image: '/images/safari_lodge_retreat.jpg',
  },
  {
    name: 'Guest Houses',
    subtitle: 'Intimate architectural stays and local hospitality',
    image: '/images/harbour_house_1779978766107.png',
  },
  {
    name: 'Private Villas',
    subtitle: 'Curated residences and design-led vacation homes',
    image: '/images/house_pool_1779978750296.png',
  },
];

const destinations = [
  { name: 'Cape Town', stays: '1,240', price: 'R 1,500' },
  { name: 'Johannesburg', stays: '860', price: 'R 950' },
  { name: 'Kigali', stays: '410', price: 'R 1,200' },
  { name: 'Zanzibar', stays: '340', price: 'R 2,500' },
];

const curatedStays = [
  {
    id: 'stay-silo',
    name: 'The Silo Architectural Suite',
    location: 'Cape Town, South Africa',
    type: 'Hotels',
    rating: 4.9,
    price: 'R 15,000',
    image: '/images/coastal_mansion_1779978805301.png',
    badge: 'Super Host',
  },
  {
    id: 'stay-serengeti',
    name: 'Serengeti Sanctuary Pavilion',
    location: 'Zanzibar & Arusha, Tanzania',
    type: 'Resorts',
    rating: 5.0,
    price: 'R 24,500',
    image: '/images/safari_lodge_retreat.jpg',
    badge: 'Verified',
  },
  {
    id: 'stay-karen',
    name: 'Karen Estate Guest House',
    location: 'Nairobi, Kenya',
    type: 'Guest Houses',
    rating: 4.8,
    price: 'R 11,800',
    image: '/images/modern_house_tan_1779978632706.png',
    badge: 'Popular',
  },
  {
    id: 'stay-clifton',
    name: 'Clifton Ocean Terrace Villa',
    location: 'Cape Town, South Africa',
    type: 'Private Villas',
    rating: 4.9,
    price: 'R 9,200',
    image: '/images/house_pool_1779978750296.png',
    badge: 'Trending',
  },
  {
    id: 'stay-sandton',
    name: 'Sandton Sky Loft Residence',
    location: 'Johannesburg, South Africa',
    type: 'Hotels',
    rating: 4.8,
    price: 'R 4,800',
    image: '/images/loft_interior_1779978697203.png',
    badge: 'Verified',
  },
  {
    id: 'stay-kigali',
    name: 'Nyarutarama Ridge Villa',
    location: 'Kigali, Rwanda',
    type: 'Private Villas',
    rating: 4.9,
    price: 'R 6,400',
    image: '/images/luxury_kitchen_living_1779978720358.png',
    badge: 'Curated',
  },
];

interface ChatMsg {
  role: 'assistant' | 'user';
  text: string;
}

const BookAStayPage: React.FC<{ properties?: Property[] }> = ({ properties = [] }) => {
  const { addToast } = useToast();
  const [selectedPropertyForDetails, setSelectedPropertyForDetails] = useState<any>(null);
  const [isChatBotOpen, setIsChatBotOpen] = useState(false);

  // Filters
  const [destinationQuery, setDestinationQuery] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [guestSummary, setGuestSummary] = useState('2 Guests, 1 Room');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Ntanta AI State
  const [chatInput, setChatInput] = useState('');
  const [isAiReplying, setIsAiReplying] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([
    {
      role: 'assistant',
      text: "Hello! I'm Ntanta, your hospitality concierge. Tell me your preferred destination, nightly budget, or stay style and I'll match verified residences.",
    },
  ]);

  const baseStays = useMemo(() => {
    if (properties.length > 0) {
      return properties.map((p, idx) => ({
        ...p,
        name: p.title,
        location: `${p.address.city}, ${p.address.street}`,
        type: p.propertyType || categories[idx % categories.length].name,
        rating: p.agent?.rating || 4.8,
        price: `R ${p.price.toLocaleString()}`,
        image: p.images?.[0] || curatedStays[idx % curatedStays.length].image,
        badge: p.featured ? 'Featured' : 'Verified',
      }));
    }
    return curatedStays;
  }, [properties]);

  const filteredStays = useMemo(() => {
    const q = destinationQuery.trim().toLowerCase();
    return baseStays.filter((stay) => {
      const matchesCat =
        selectedCategory === 'All' ||
        stay.type.toLowerCase().includes(selectedCategory.toLowerCase()) ||
        (selectedCategory === 'Private Villas' && stay.type.toLowerCase().includes('villa'));
      const matchesDest =
        !q ||
        stay.location.toLowerCase().includes(q) ||
        stay.name.toLowerCase().includes(q) ||
        stay.type.toLowerCase().includes(q);
      return matchesCat && matchesDest;
    });
  }, [baseStays, selectedCategory, destinationQuery]);

  const toggleFavorite = (e: React.MouseEvent, name: string) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
        addToast(`Removed "${name}" from saved stays`, 'info');
      } else {
        next.add(name);
        addToast(`Saved "${name}" to your shortlist`, 'success');
      }
      return next;
    });
  };

  const handleSearchClick = () => {
    const el = document.getElementById('stays-catalog');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    if (destinationQuery.trim()) {
      addToast(`Showing verified stays matching "${destinationQuery}"`, 'info');
    }
  };

  const handleSendChat = async (promptText?: string) => {
    const query = (promptText ?? chatInput).trim();
    if (!query || isAiReplying) return;
    setChatMessages((prev) => [...prev, { role: 'user', text: query }]);
    setChatInput('');
    setIsAiReplying(true);

    try {
      const ai = new GoogleGenAI();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are Ntanta, a concise, helpful African luxury hospitality concierge on AfriEstate. Recommend 2-3 specific property types or regions in Africa matching this request in 3 short sentences: "${query}".`,
      });
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text:
            response.text ||
            'For that itinerary, I recommend our Clifton Ocean Terrace Villa in Cape Town or Serengeti Sanctuary Pavilion — both include verified host support and flexible dates.',
        },
      ]);
    } catch {
      const lower = query.toLowerCase();
      let reply =
        'I recommend exploring The Silo Architectural Suite in Cape Town or Sandton Sky Loft Residence — both offer verified 24/7 concierge check-in.';
      if (lower.includes('safari') || lower.includes('kenya')) {
        reply =
          'For an authentic East African retreat, consider Karen Estate Guest House in Nairobi or the Serengeti Sanctuary Pavilion with private game-drive transfers.';
      } else if (lower.includes('zanzibar') || lower.includes('beach')) {
        reply =
          'For coastal tranquility, Clifton Ocean Terrace Villa and our Zanzibar beachfront sanctuaries offer private terraces and direct ocean access.';
      }
      setChatMessages((prev) => [...prev, { role: 'assistant', text: reply }]);
    } finally {
      setIsAiReplying(false);
    }
  };

  if (selectedPropertyForDetails) {
    return (
      <StayDetailsPage
        property={selectedPropertyForDetails}
        initialDates={{ checkIn: checkInDate, checkOut: checkOutDate }}
        onBack={() => setSelectedPropertyForDetails(null)}
      />
    );
  }

  return (
    <div className="w-full bg-[#FAF8F5] dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans min-h-screen">
      {/* Full-Bleed Architectural Hero */}
      <section className="relative w-full bg-[#0B1F1A] text-white pt-20 pb-36 lg:pt-28 lg:pb-44 px-6 sm:px-10 lg:px-16 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/images/coastal_mansion_1779978805301.png"
            alt="Luxury African coastal villa stay"
            className="w-full h-full object-cover opacity-35"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B1F1A] via-[#0B1F1A]/65 to-[#0B1F1A]/40" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#C9A35D] mb-4">
            AfriEstate Short-Term Stays
          </p>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-white max-w-4xl mx-auto leading-[1.08]">
            Verified Residences &amp; Signature Stays Across Africa
          </h1>
          <p className="text-base sm:text-lg text-slate-200/85 mt-5 max-w-2xl mx-auto font-light leading-relaxed">
            Reserve vetted boutique hotels, architectural villas, and private safari lodges with transparent pricing and direct concierge support.
          </p>
        </div>
      </section>

      {/* Overlapping Search Bar */}
      <section className="relative z-20 -mt-20 px-6 sm:px-10 lg:px-16 mb-16">
        <div className="max-w-6xl mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
            <div className="bg-[#FAF8F5] dark:bg-slate-800/80 rounded-xl px-3.5 py-2.5 border border-slate-200/70 dark:border-slate-700">
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Destination
              </label>
              <div className="flex items-center gap-2">
                <MapPinIcon className="w-4 h-4 text-[#0F2D25] dark:text-[#C9A35D] shrink-0" />
                <input
                  type="text"
                  value={destinationQuery}
                  onChange={(e) => setDestinationQuery(e.target.value)}
                  placeholder="Cape Town, Kigali..."
                  className="w-full bg-transparent outline-none text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="bg-[#FAF8F5] dark:bg-slate-800/80 rounded-xl px-3.5 py-2.5 border border-slate-200/70 dark:border-slate-700">
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Check-in
              </label>
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-[#0F2D25] dark:text-[#C9A35D] shrink-0" />
                <input
                  type="date"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  className="w-full bg-transparent outline-none text-sm font-medium text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="bg-[#FAF8F5] dark:bg-slate-800/80 rounded-xl px-3.5 py-2.5 border border-slate-200/70 dark:border-slate-700">
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Check-out
              </label>
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-[#0F2D25] dark:text-[#C9A35D] shrink-0" />
                <input
                  type="date"
                  value={checkOutDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  className="w-full bg-transparent outline-none text-sm font-medium text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="bg-[#FAF8F5] dark:bg-slate-800/80 rounded-xl px-3.5 py-2.5 border border-slate-200/70 dark:border-slate-700 relative">
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Guests
              </label>
              <div className="flex items-center gap-2">
                <UsersIcon className="w-4 h-4 text-[#0F2D25] dark:text-[#C9A35D] shrink-0" />
                <select
                  value={guestSummary}
                  onChange={(e) => setGuestSummary(e.target.value)}
                  className="w-full bg-transparent outline-none text-sm font-medium text-slate-900 dark:text-white appearance-none pr-5 cursor-pointer"
                >
                  <option>2 Guests, 1 Room</option>
                  <option>1 Guest, 1 Room</option>
                  <option>4 Guests, 2 Rooms</option>
                  <option>Family (4+ Guests)</option>
                </select>
                <ChevronDownIcon className="w-4 h-4 text-slate-400 absolute right-3 bottom-3 pointer-events-none" />
              </div>
            </div>

            <button
              onClick={handleSearchClick}
              className="h-[58px] bg-[#0F2D25] text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#173f34] transition-colors whitespace-nowrap"
            >
              <SearchIcon className="w-4 h-4 text-[#C9A35D]" />
              Search Stays
            </button>
          </div>
        </div>
      </section>

      {/* Stay Categories */}
      <section className="py-12 px-6 sm:px-10 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C9A35D]">Curated Collections</p>
              <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-slate-900 dark:text-white mt-1">
                Explore by Stay Style
              </h2>
            </div>
            {selectedCategory !== 'All' && (
              <button
                onClick={() => setSelectedCategory('All')}
                className="text-xs font-semibold text-[#0F2D25] dark:text-[#C9A35D] hover:underline self-start sm:self-auto"
              >
                Show All Categories &rarr;
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {categories.map((category) => {
              const isSelected = selectedCategory === category.name;
              return (
                <button
                  key={category.name}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(isSelected ? 'All' : category.name);
                    document.getElementById('stays-catalog')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`text-left rounded-2xl overflow-hidden relative group h-72 transition-transform duration-300 ${
                    isSelected ? 'ring-2 ring-[#C9A35D]' : ''
                  }`}
                >
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-6 w-full">
                    <h3 className="font-heading text-2xl font-semibold text-white">{category.name}</h3>
                    <p className="text-white/80 text-xs mt-1 leading-relaxed">{category.subtitle}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Catalog Grid */}
      <section id="stays-catalog" className="py-16 px-6 sm:px-10 lg:px-16 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 mb-10 border-b border-slate-200 dark:border-slate-800">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C9A35D]">Verified Portfolio</p>
              <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-slate-900 dark:text-white mt-1">
                {selectedCategory === 'All' ? 'Trending Short-Term Stays' : `${selectedCategory}`}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              {(destinationQuery || selectedCategory !== 'All') && (
                <button
                  onClick={() => {
                    setDestinationQuery('');
                    setSelectedCategory('All');
                  }}
                  className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Clear filters
                </button>
              )}
              <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                {filteredStays.length} residences
              </span>
            </div>
          </div>

          {filteredStays.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStays.map((property) => {
                const isFav = favorites.has(property.name);
                return (
                  <div
                    key={property.name}
                    onClick={() => setSelectedPropertyForDetails(property)}
                    className="bg-[#FAF8F5] dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden hover:border-slate-300 dark:hover:border-slate-700 transition-colors group flex flex-col cursor-pointer"
                  >
                    <div className="relative h-60 overflow-hidden bg-slate-200 dark:bg-slate-800">
                      <img
                        src={property.image}
                        alt={property.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                      <span className="absolute bottom-3 left-4 text-[11px] font-semibold uppercase tracking-wider text-white/95">
                        {property.badge}
                      </span>
                      <button
                        onClick={(e) => toggleFavorite(e, property.name)}
                        aria-label={`Save ${property.name}`}
                        className="absolute top-3 right-3 p-2 bg-black/35 backdrop-blur-sm rounded-full text-white hover:bg-black/60 transition-colors"
                      >
                        {isFav ? (
                          <HeartSolidIcon className="w-4 h-4 text-rose-400" />
                        ) : (
                          <HeartIcon className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-heading font-semibold text-xl text-slate-900 dark:text-white leading-snug">
                          {property.name}
                        </h4>
                        <div className="flex items-center gap-1 text-xs font-mono tabular-nums font-semibold text-slate-800 dark:text-slate-200 shrink-0 pt-1">
                          <StarSolidIcon className="w-3.5 h-3.5 text-[#C9A35D]" />
                          {property.rating}
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                        {property.type} · {property.location}
                      </p>

                      <div className="mt-auto pt-4 mt-5 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="font-mono tabular-nums font-bold text-lg text-[#0F2D25] dark:text-emerald-400">
                            {property.price}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400"> / night</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPropertyForDetails(property);
                          }}
                          className="bg-[#0F2D25] text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-[#173f34] transition-colors whitespace-nowrap"
                        >
                          Reserve Stay
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center bg-[#FAF8F5] dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
              <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
                No stays matched your filter criteria.
              </p>
              <button
                onClick={() => {
                  setDestinationQuery('');
                  setSelectedCategory('All');
                }}
                className="mt-3 px-4 py-2 bg-[#0F2D25] text-white rounded-lg text-xs font-semibold"
              >
                Reset Stay Filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Ntanta AI Concierge Banner */}
      <section className="py-20 px-6 sm:px-10 lg:px-16 bg-[#0B1F1A] text-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#C9A35D] mb-3">
              <SparklesIcon className="w-4 h-4" />
              <span>Ntanta Hospitality AI</span>
            </div>
            <h2 className="font-heading text-3xl sm:text-5xl font-semibold leading-tight text-white">
              Curated Itineraries Without the Endless Search
            </h2>
            <p className="text-base text-slate-300 mt-4 max-w-xl leading-relaxed font-light">
              Describe your travel dates, preferred neighborhood, or amenity checklist and Ntanta recommends vetted stays tailored to your schedule.
            </p>
            <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10 max-w-lg">
              <p className="text-sm italic text-slate-200">
                &ldquo;Find me an oceanfront villa in Cape Town under R 10,000 per night with private pool and concierge check-in.&rdquo;
              </p>
            </div>
            <button
              onClick={() => setIsChatBotOpen(true)}
              className="mt-7 bg-[#C9A35D] text-[#0B1F1A] px-6 py-3 rounded-xl text-sm font-semibold hover:bg-[#d8b471] transition-colors inline-flex items-center gap-2"
            >
              <ChatBubbleBottomCenterTextIcon className="w-5 h-5" />
              Consult Ntanta Concierge
            </button>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-sm font-semibold text-white">Live Availability Desk</p>
                <p className="text-xs text-slate-400">Instant recommendations · Direct booking verification</p>
              </div>
              <SparklesIcon className="w-6 h-6 text-[#C9A35D]" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {destinations.map((dest) => (
                <button
                  key={dest.name}
                  type="button"
                  onClick={() => {
                    setDestinationQuery(dest.name);
                    document.getElementById('stays-catalog')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-left p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                >
                  <p className="font-heading text-lg font-semibold text-white">{dest.name}</p>
                  <p className="text-xs text-slate-300 mt-1 font-mono tabular-nums">
                    {dest.stays} stays · From {dest.price}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust Guarantees */}
      <section className="py-16 px-6 sm:px-10 lg:px-16 bg-[#FAF8F5] dark:bg-slate-950">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-slate-200 dark:border-slate-800 pt-12">
          <div>
            <ShieldCheckIcon className="w-7 h-7 text-[#0F2D25] dark:text-[#C9A35D] mb-3" />
            <h3 className="font-heading text-xl font-semibold text-slate-900 dark:text-white">Verified Residences</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
              Every residence and host undergoes physical inspection and title verification prior to listing.
            </p>
          </div>
          <div>
            <StarIcon className="w-7 h-7 text-[#0F2D25] dark:text-[#C9A35D] mb-3" />
            <h3 className="font-heading text-xl font-semibold text-slate-900 dark:text-white">Authentic Guest Ledger</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
              Ratings are tied strictly to completed stays so every review reflects real hospitality standards.
            </p>
          </div>
          <div>
            <SearchIcon className="w-7 h-7 text-[#0F2D25] dark:text-[#C9A35D] mb-3" />
            <h3 className="font-heading text-xl font-semibold text-slate-900 dark:text-white">Protected Escrow Checkout</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
              Booking funds remain safeguarded until smooth property check-in with 24/7 concierge support.
            </p>
          </div>
        </div>
      </section>

      {/* Ntanta Modal */}
      {isChatBotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsChatBotOpen(false)}
          />
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden flex flex-col h-[560px] max-h-[90vh]">
            <div className="px-5 py-4 bg-[#0B1F1A] text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#173f34] rounded-lg flex items-center justify-center">
                  <SparklesIcon className="w-5 h-5 text-[#C9A35D]" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Ntanta Hospitality Concierge</h3>
                  <p className="text-[11px] text-slate-300">Personalized African Stay Curations</p>
                </div>
              </div>
              <button
                onClick={() => setIsChatBotOpen(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Close Ntanta concierge"
              >
                <XMarkIcon className="w-4 h-4 text-white" />
              </button>
            </div>

            <div className="flex-1 p-5 overflow-y-auto bg-[#FAF8F5] dark:bg-slate-950 space-y-3">
              {chatMessages.map((m, idx) => (
                <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`px-4 py-3 rounded-xl max-w-[85%] text-xs leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-[#0F2D25] text-white'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {isAiReplying && (
                <div className="text-xs text-slate-500 dark:text-slate-400">Ntanta is curating stays...</div>
              )}
              <div className="flex flex-wrap gap-2 pt-2">
                {['Beachfront villa in Cape Town', 'Safari lodge near Serengeti', 'Luxury stay in Zanzibar'].map(
                  (suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleSendChat(suggestion)}
                      className="text-xs px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-[#0F2D25] text-slate-700 dark:text-slate-200 transition-colors"
                    >
                      {suggestion}
                    </button>
                  )
                )}
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendChat();
              }}
              className="p-3.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask Ntanta about stays, regions, or dates..."
                className="flex-1 bg-[#FAF8F5] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#0F2D25]"
              />
              <button
                type="submit"
                disabled={isAiReplying}
                className="p-2.5 bg-[#0F2D25] text-white rounded-lg hover:bg-[#173f34] disabled:bg-slate-400 transition-colors"
                aria-label="Send message"
              >
                <PaperAirplaneIcon className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookAStayPage;
