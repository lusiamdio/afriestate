import React, { useEffect, useRef, useState } from 'react';
import { MagnifyingGlassIcon as SearchIcon, StarIcon, MapPinIcon, ShieldCheckIcon, HeartIcon, ChevronDownIcon, CalendarIcon, UsersIcon, XMarkIcon, SparklesIcon, ChatBubbleBottomCenterTextIcon } from '@heroicons/react/24/outline';
import StayDetailsPage from './StayDetailsPage';

const FadeInSection: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => {
    const [isVisible, setVisible] = useState(false);
    const domRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setVisible(true);
                }
            });
        });
        
        const currentRef = domRef.current;
        if (currentRef) observer.observe(currentRef);
        return () => {
            if (currentRef) observer.unobserve(currentRef);
        };
    }, []);

    return (
        <div
            ref={domRef}
            className={`transition-all duration-1000 ease-out ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
            }`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
};

import { Property } from '../../types';

const categories = [
    { name: 'Hotels', subtitle: 'Business hotels, city hotels, luxury hotels', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80' },
    { name: 'Resorts', subtitle: 'Beach resorts, safari resorts, wellness resorts', image: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&q=80' },
    { name: 'Guest Houses', subtitle: 'Affordable, family-friendly, local experiences', image: 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=800&q=80' },
    { name: 'Airbnb', subtitle: 'Unique homes and vacation rentals', image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80' },
];

const destinations = [
    { name: 'Cape Town', stays: '1,200', price: 'R1,500' },
    { name: 'Johannesburg', stays: '850', price: 'R900' },
    { name: 'Kigali', stays: '400', price: 'R1,200' },
    { name: 'Zanzibar', stays: '300', price: 'R2,500' }
];

const BookAStayPage: React.FC<{ properties?: Property[] }> = ({ properties = [] }) => {
    const [selectedPropertyForDetails, setSelectedPropertyForDetails] = useState<any>(null);
    const [isChatBotOpen, setIsChatBotOpen] = useState(false);

    // Map `Property` interface from DB to the shape expected by BookAStayPage
    const displayProperties = properties.length > 0 ? properties.map(p => ({
        ...p, // keep original properties for downstream
        name: p.title,
        location: `${p.address.city}, ${p.address.street}`,
        type: p.propertyType,
        rating: p.agent?.rating || 4.5,
        price: `R ${p.price.toLocaleString()}`,
        image: p.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&q=80',
        badge: p.featured ? 'Featured' : 'Verified'
    })) : [
        { name: 'The Silo Hotel', location: 'Cape Town, South Africa', type: 'Luxury Hotel', rating: 4.9, price: 'R 15,000', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&q=80', badge: 'Super Host' },
        { name: 'Four Seasons Safari Lodge', location: 'Serengeti, Tanzania', type: 'Resort', rating: 5.0, price: 'R 25,000', image: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=500&q=80', badge: 'Verified' },
        { name: 'Giraffe Manor', location: 'Nairobi, Kenya', type: 'Boutique Hotel', rating: 4.8, price: 'R 18,000', image: 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=500&q=80', badge: 'Popular' },
        { name: 'Zuri Zanzibar', location: 'Zanzibar, Tanzania', type: 'Beach Resort', rating: 4.9, price: 'R 8,500', image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500&q=80', badge: 'Trending' }
    ];

    if (selectedPropertyForDetails) {
        return <StayDetailsPage property={selectedPropertyForDetails} onBack={() => setSelectedPropertyForDetails(null)} />;
    }

    return (
        <div className="bg-brand-light text-brand-dark font-sans min-h-screen">
            {/* Hero Section */}
            <section className="relative pt-32 pb-48 lg:pt-48 lg:pb-64 overflow-hidden bg-brand-primary">
                <div className="absolute inset-0 z-0">
                    <img src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2070" alt="Hero" className="w-full h-full object-cover opacity-30"  referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-primary via-transparent to-transparent"></div>
                </div>

                <div className="container mx-auto px-6 relative z-10 text-center">
                    <FadeInSection>
                        <h1 className="text-5xl font-heading md:text-7xl font-heading font-semibold tracking-tight text-white mb-6 font-heading">
                            Find Your Perfect Stay Anywhere in Africa
                        </h1>
                        <p className="text-xl md:text-2xl text-white/80 mb-12 max-w-3xl mx-auto">
                            Book unforgettable stays with confidence. Discover thousands of verified accommodations across Africa with real-time availability, transparent pricing, and AI-powered recommendations.
                        </p>
                    </FadeInSection>
                </div>
            </section>

             {/* Search Module - Overlapping Hero */}
            <section className="relative z-20 -mt-32 mb-24">
                <div className="container mx-auto px-6">
                    <div className="bg-white/90 backdrop-blur-2xl p-6 md:p-8 rounded-[32px] shadow-2xl max-w-5xl mx-auto border border-white/50">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                            <div className="bg-brand-light rounded-2xl p-4 border border-gray-100 focus-within:ring-2 ring-brand-primary relative">
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 ml-8">Destination</label>
                                <MapPinIcon className="w-5 h-5 text-brand-primary absolute left-4 bottom-4" />
                                <input type="text" placeholder="Where to?" className="w-full bg-transparent outline-none font-medium text-brand-dark pl-6" />
                            </div>
                            <div className="bg-brand-light rounded-2xl p-4 border border-gray-100 focus-within:ring-2 ring-brand-primary relative">
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 ml-8">Check-in</label>
                                <CalendarIcon className="w-5 h-5 text-brand-primary absolute left-4 bottom-4" />
                                <input type="date" className="w-full bg-transparent outline-none font-medium text-brand-dark pl-6" />
                            </div>
                            <div className="bg-brand-light rounded-2xl p-4 border border-gray-100 focus-within:ring-2 ring-brand-primary relative">
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 ml-8">Check-out</label>
                                <CalendarIcon className="w-5 h-5 text-brand-primary absolute left-4 bottom-4" />
                                <input type="date" className="w-full bg-transparent outline-none font-medium text-brand-dark pl-6" />
                            </div>
                            <div className="bg-brand-light rounded-2xl p-4 border border-gray-100 focus-within:ring-2 ring-brand-primary relative">
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 ml-8">Guests</label>
                                <UsersIcon className="w-5 h-5 text-brand-primary absolute left-4 bottom-4" />
                                <select className="w-full bg-transparent outline-none font-medium text-brand-dark appearance-none pr-6 pl-6 cursor-pointer">
                                    <option>2 Guests, 1 Room</option>
                                    <option>1 Guest, 1 Room</option>
                                    <option>4 Guests, 2 Rooms</option>
                                    <option>Family (4+ Guests)</option>
                                </select>
                                <ChevronDownIcon className="w-4 h-4 text-gray-500 absolute right-4 bottom-5 pointer-events-none" />
                            </div>
                            <button className="bg-brand-primary text-white rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-brand-primary/90 transition-colors shadow-lg py-5 lg:h-[72px]">
                                <SearchIcon className="w-5 h-5"/> Search
                            </button>
                        </div>
                    </div>
                </div>
            </section>

             {/* Featured Categories */}
             <section className="py-16">
                <div className="container mx-auto px-6">
                    <FadeInSection>
                        <h2 className="text-4xl font-heading font-heading font-semibold text-brand-dark mb-12">Featured Categories</h2>
                    </FadeInSection>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {categories.map((category, i) => (
                            <FadeInSection key={category.name} delay={i * 100}>
                                <div className="rounded-[32px] overflow-hidden relative group cursor-pointer h-80 shadow-lg">
                                    <img src={category.image} alt={category.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"  referrerPolicy="no-referrer" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                                    <div className="absolute bottom-0 left-0 p-8 w-full">
                                        <h3 className="text-2xl font-semibold text-white mb-2">{category.name}</h3>
                                        <p className="text-white/80 text-sm font-medium">{category.subtitle}</p>
                                    </div>
                                </div>
                            </FadeInSection>
                        ))}
                    </div>
                </div>
            </section>

             {/* Property Listings */}
             <section className="py-24 bg-white">
                 <div className="container mx-auto px-6">
                     <FadeInSection>
                        <div className="flex justify-between items-end mb-16 border-b border-gray-100 pb-8">
                            <h2 className="text-4xl font-heading font-heading font-semibold text-brand-dark">Trending Properties</h2>
                            <button className="text-brand-gold hover:text-brand-gold/80 font-semibold flex items-center gap-2">Explore All &rarr;</button>
                        </div>
                     </FadeInSection>
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                         {displayProperties.map((property, i) => (
                             <FadeInSection key={property.name} delay={i * 50}>
                                 <div className="bg-white rounded-[24px] border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow group flex flex-col h-full cursor-pointer" onClick={() => setSelectedPropertyForDetails(property)}>
                                     <div className="relative h-56 overflow-hidden">
                                        <img src={property.image} alt={property.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"  referrerPolicy="no-referrer" />
                                        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold text-brand-primary shadow-sm">
                                            {property.badge}
                                        </div>
                                        <button onClick={(e) => e.stopPropagation()} className="absolute top-4 right-4 p-2 bg-white/50 backdrop-blur rounded-full hover:bg-white transition-colors">
                                            <HeartIcon className="w-5 h-5 text-gray-700"/>
                                        </button>
                                     </div>
                                     <div className="p-6 flex-1 flex flex-col">
                                         <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-semibold text-lg text-brand-dark leading-tight">{property.name}</h4>
                                            <div className="flex items-center gap-1 text-sm font-semibold">
                                                <StarIcon className="w-4 h-4 solid text-brand-gold fill-current" /> {property.rating}
                                            </div>
                                         </div>
                                         <p className="text-gray-500 text-sm mb-4">{property.type} • {property.location}</p>
                                         <div className="mt-auto flex justify-between items-center pt-4 border-t border-gray-100">
                                             <div className="font-semibold text-xl text-brand-primary">{property.price} <span className="text-sm text-gray-500 font-normal">/night</span></div>
                                             <button onClick={(e) => { e.stopPropagation(); setSelectedPropertyForDetails(property); }} className="bg-brand-dark text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-brand-primary transition-colors">Book</button>
                                         </div>
                                     </div>
                                 </div>
                             </FadeInSection>
                         ))}
                     </div>
                 </div>
             </section>

             {/* AI Concierge */}
             <section className="py-24 bg-brand-primary text-white">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <FadeInSection>
                            <div className="flex items-center gap-3 mb-4">
                                <SparklesIcon className="w-8 h-8 text-brand-gold" />
                                <span className="text-xl font-bold tracking-widest uppercase text-brand-gold">Meet Ntanta</span>
                            </div>
                            <h2 className="text-5xl font-heading font-semibold mb-6">Your Intelligent Travel AI</h2>
                            <p className="text-xl text-white/80 mb-8 max-w-lg">Skip the scrolling. Tell Ntanta exactly what you want, and our smart AI will instantly curate the perfect stays and experiences for your hospitality and tourism needs.</p>
                            
                            <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 mb-8 max-w-lg">
                                <p className="italic text-lg">"Find me a beachfront villa under R2,000 in Cape Town for next weekend."</p>
                            </div>
                            
                            <button onClick={() => setIsChatBotOpen(true)} className="bg-brand-secondary text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:bg-brand-secondary/80 transition-colors flex items-center gap-2">
                                <ChatBubbleBottomCenterTextIcon className="w-5 h-5" /> Start a Conversation with Ntanta
                            </button>
                        </FadeInSection>
                        <div className="relative hidden lg:flex justify-center items-center">
                            <div className="absolute inset-0 bg-brand-secondary/30 blur-3xl opacity-50 rounded-full w-96 h-96 m-auto animate-pulse"></div>
                            <div className="relative z-10 w-80 h-80 bg-gradient-to-br from-brand-secondary to-brand-primary border-4 border-white/20 rounded-[40px] shadow-2xl flex flex-col items-center justify-center p-8 text-center backdrop-blur-sm">
                                <SparklesIcon className="w-32 h-32 text-brand-gold mb-6" />
                                <h3 className="text-2xl font-bold font-heading">Ntanta AI</h3>
                                <p className="text-sm font-medium text-white/70 mt-2">Hospitality & Tourism Chatbot</p>
                            </div>
                        </div>
                    </div>
                </div>
             </section>

             {/* Top Destinations */}
             <section className="py-24">
                <div className="container mx-auto px-6">
                    <FadeInSection>
                        <h2 className="text-4xl font-heading font-heading font-semibold text-brand-dark mb-16 text-center">Featured Destinations</h2>
                    </FadeInSection>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                        {destinations.map((dest, i) => (
                             <FadeInSection key={dest.name} delay={i * 50}>
                                <div className="bg-white p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex flex-col items-center text-center cursor-pointer group">
                                    <h4 className="font-semibold text-xl text-brand-dark mb-2 group-hover:text-brand-gold transition-colors">{dest.name}</h4>
                                    <p className="text-sm text-gray-500 mb-1">{dest.stays} Stays</p>
                                    <p className="text-xs font-medium text-brand-primary bg-brand-light px-3 py-1 rounded-full mt-2">From {dest.price}</p>
                                </div>
                             </FadeInSection>
                        ))}
                    </div>
                </div>
             </section>

             {/* Why Choose Us */}
             <section className="py-24 bg-white border-t border-gray-100">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
                        <FadeInSection delay={0}>
                            <div className="bg-brand-light w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-brand-primary">
                                <ShieldCheckIcon className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-semibold mb-3 font-heading">Verified Properties</h3>
                            <p className="text-gray-500">Every host and property is rigorously vetted to ensure safety and quality.</p>
                        </FadeInSection>
                        <FadeInSection delay={100}>
                            <div className="bg-brand-light w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-brand-primary">
                                <StarIcon className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-semibold mb-3 font-heading">Real Guest Reviews</h3>
                            <p className="text-gray-500">Read authentic experiences from travelers who have actually stayed there.</p>
                        </FadeInSection>
                        <FadeInSection delay={200}>
                            <div className="bg-brand-light w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-brand-primary">
                                <SearchIcon className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-semibold mb-3 font-heading">AI Fraud Detection</h3>
                            <p className="text-gray-500">Advanced AI secures your payments and protects you from fraudulent listings.</p>
                        </FadeInSection>
                    </div>
                </div>
             </section>

              {/* Ntanta ChatBot Modal */}
              {isChatBotOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                      {/* Backdrop */}
                      <div className="absolute inset-0 bg-brand-dark/60 backdrop-blur-sm" onClick={() => setIsChatBotOpen(false)}></div>
                      
                      {/* Dialog */}
                      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg relative z-10 overflow-hidden flex flex-col h-[600px] max-h-[90vh]">
                          {/* Header */}
                          <div className="p-4 bg-brand-primary text-white flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-brand-secondary rounded-full flex items-center justify-center">
                                      <SparklesIcon className="w-6 h-6 text-brand-gold" />
                                  </div>
                                  <div>
                                      <h3 className="font-semibold text-lg leading-tight">Ntanta</h3>
                                      <p className="text-xs text-white/80">Intelligent Travel AI</p>
                                  </div>
                              </div>
                              <button 
                                  onClick={() => setIsChatBotOpen(false)}
                                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                              >
                                  <XMarkIcon className="w-5 h-5 text-white" />
                              </button>
                          </div>
                          
                          {/* Chat Area */}
                          <div className="flex-1 p-6 overflow-y-auto bg-gray-50 flex flex-col gap-4">
                              <div className="self-start bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-sm max-w-[85%] shadow-sm">
                                  <p className="text-sm text-brand-dark">Hi there! I'm Ntanta, your AI travel concierge. Where are you dreaming of going next?</p>
                              </div>
                              <div className="self-start inline-flex flex-wrap gap-2 mt-2">
                                  <button className="text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-full hover:border-brand-primary hover:text-brand-primary transition-colors text-gray-600">Beachfront in Cape Town</button>
                                  <button className="text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-full hover:border-brand-primary hover:text-brand-primary transition-colors text-gray-600">Safari lodges in Kenya</button>
                                  <button className="text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-full hover:border-brand-primary hover:text-brand-primary transition-colors text-gray-600">Luxury stays in Zanzibar</button>
                              </div>
                          </div>

                          {/* Input Area */}
                          <div className="p-4 bg-white border-t border-gray-100">
                              <div className="relative">
                                  <input 
                                      type="text" 
                                      placeholder="Ask Ntanta anything..." 
                                      className="w-full bg-gray-50 border border-gray-200 rounded-full py-3 pl-4 pr-12 text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                                  />
                                  <button className="absolute right-2 top-1.5 w-9 h-9 bg-brand-primary text-white rounded-full flex items-center justify-center hover:bg-brand-primary/90 transition-colors">
                                      <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                      </svg>
                                  </button>
                              </div>
                          </div>
                      </div>
                  </div>
              )}


        </div>
    );
};

export default BookAStayPage;
