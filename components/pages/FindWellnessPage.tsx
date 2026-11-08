import React, { useEffect, useRef, useState } from 'react';
import { MagnifyingGlassIcon as SearchIcon, StarIcon, MapPinIcon, HeartIcon, ChevronDownIcon, PhoneIcon, GlobeAltIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { wellnessDirectory } from '../../src/wellnessDirectory';
import { Property } from '../../types';
import { supabase } from '../../lib/supabase';

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

const categories = [
    { name: 'Mental Wellness', subtitle: 'Psychologists, Therapists, Counselors', icon: '🧠' },
    { name: 'Physical Wellness', subtitle: 'Fitness Trainers, Gyms, Physiotherapy', icon: '💪' },
    { name: 'Nutrition & Diet', subtitle: 'Nutritionists, Dieticians', icon: '🥗' },
    { name: 'Alternative Healing', subtitle: 'Acupuncture, Reiki, Holistic Therapies', icon: '🌿' },
    { name: 'Beauty & Spa', subtitle: 'Massage, Skin Care, Wellness Treatments', icon: '✨' },
    { name: 'Corporate Wellness', subtitle: 'Employee Wellness Programs', icon: '🏢' },
    { name: 'Medical Wellness', subtitle: 'Clinics, Preventive Care', icon: '⚕️' },
    { name: 'Wellness Retreats', subtitle: 'Retreat Centers and Experiences', icon: '🏔️' },
];

const popularServices = [
    { name: 'Therapy Sessions', price: 'From R350', button: 'Book Online', icon: '🛋️' },
    { name: 'Personal Fitness Coaching', price: 'From R250', button: 'Book Now', icon: '🏋️' },
    { name: 'Nutrition Consultation', price: 'From R400', button: 'Schedule Session', icon: '🥑' },
    { name: 'Spa & Massage Therapy', price: 'From R500', button: 'Book Treatment', icon: '💆' },
    { name: 'Corporate Wellness Assessment', price: 'Request Quote', button: 'Request Quote', icon: '📋' },
];

const retreats = [
    'Wellness Retreats', 'Yoga Retreats', 'Healing Retreats', 'Detox Retreats', 'Executive Wellness Retreats', 'Meditation Retreats'
];

const FindWellnessPage: React.FC<{ properties?: Property[] }> = ({ properties = [] }) => {
    const [visibleCount, setVisibleCount] = useState(12);
    const [selectedCompany, setSelectedCompany] = useState<any>(null);
    const [modalMode, setModalMode] = useState<'book' | 'enquire' | null>(null);

    const displayCompanies = properties.length > 0 ? properties.map(p => ({
        name: p.title,
        location: p.address.city,
        rating: p.agent?.rating || 4.7,
        category: p.amenities.join(' • ') || 'Wellness Center',
        image: p.images?.[0] || 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=2120&auto=format&fit=crop',
        notes: p.neighborhoodInfo || 'A premium wellness service provider.',
        phone: p.agent?.phone || '+27 12 345 6789',
        website: 'www.wellness.com'
    })) : [
        { name: 'Serenity Wellness Center', location: 'Cape Town', rating: 4.9, category: 'Mental Health • Coaching • Therapy', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=2120&auto=format&fit=crop', notes: '', phone: '+27 21 555 1234', website: 'serenitywellness.co.za' },
        { name: 'Vital Health Clinic', location: 'Johannesburg', rating: 4.8, category: 'Medical Wellness • Preventive Care', image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&q=80', notes: '', phone: '+27 11 444 8888', website: 'vitalhealth.co.za' },
        { name: 'Zen Retreat Africa', location: 'Garden Route', rating: 5.0, category: 'Retreats • Mindfulness • Yoga', image: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=800&q=80', notes: '', phone: '+27 44 333 9999', website: 'zenretreat.co.za' },
        { name: 'Balance Corporate Wellness', location: 'Pretoria', rating: 4.7, category: 'Employee Wellness Programs', image: 'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=800&q=80', notes: '', phone: '+27 12 222 7777', website: 'balancewellness.co.za' }
    ];

    const closeModal = () => {
        setSelectedCompany(null);
        setModalMode(null);
    };

    const handleFormSubmit = async () => {
        if (!selectedCompany) return;
        
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const username = user?.email || 'guest';
            
            // Log it in tour_requests to simulate a booking
            const newRequest = {
                property_id: 'wellness_' + Math.random().toString(36).substring(7),
                property_title: selectedCompany.name,
                username: username,
                date: new Date().toISOString().split('T')[0],
                time: '12:00',
                status: 'Pending',
                timestamp: Date.now()
            };

            await supabase.from('tour_requests').insert(newRequest);
            
            alert(modalMode === 'book' ? 'Booking requested successfully!' : 'Enquiry sent successfully!');
            closeModal();
        } catch (e) {
            console.error('Error submitting form', e);
            closeModal();
        }
    };

    return (
        <div className="bg-brand-light text-brand-dark font-sans min-h-screen">
            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-brand-light/50">
                <div className="absolute inset-0 z-0 flex">
                    <div className="w-1/3 bg-cover bg-center opacity-40" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1599447421416-3414500d18a5?q=80&w=2070)' }}></div>
                    <div className="w-1/3 bg-cover bg-center opacity-60" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1976)' }}></div>
                    <div className="w-1/3 bg-cover bg-center opacity-40" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=2070)' }}></div>
                    <div className="absolute inset-0 bg-gradient-to-b from-brand-light/80 via-transparent to-brand-light"></div>
                </div>

                <div className="container mx-auto px-6 relative z-10">
                    <div className="max-w-4xl mx-auto text-center">
                        <FadeInSection>
                            <h1 className="text-5xl md:text-7xl font-heading font-semibold tracking-tight text-brand-primary mb-6">
                                Discover Wellness That Fits Your Life
                            </h1>
                            <p className="text-xl md:text-2xl text-brand-primary/80 mb-12">
                                Find trusted wellness professionals, health services, therapists, coaches, fitness experts, retreats, and holistic care providers all in one place.
                            </p>
                        </FadeInSection>

                        <FadeInSection delay={100}>
                            <div className="bg-white/90 backdrop-blur-2xl p-8 rounded-[32px] shadow-2xl border border-white/50">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                                    <div className="bg-brand-light rounded-2xl p-4 border border-gray-100 focus-within:ring-2 ring-brand-primary relative">
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 ml-8">Search</label>
                                        <SearchIcon className="w-5 h-5 text-gray-400 absolute left-4 bottom-4" />
                                        <input type="text" placeholder="Keyword or practitioner" className="w-full bg-transparent outline-none font-medium text-brand-dark pl-6" />
                                    </div>
                                    <div className="bg-brand-light rounded-2xl p-4 border border-gray-100 focus-within:ring-2 ring-brand-primary relative">
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Category</label>
                                        <select className="w-full bg-transparent outline-none font-medium text-brand-dark appearance-none pr-8 cursor-pointer" defaultValue="">
                                            <option value="" disabled>Select category</option>
                                            {categories.map(category => (
                                                <option key={category.name} value={category.name}>{category.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDownIcon className="w-5 h-5 text-gray-400 absolute right-4 bottom-4 pointer-events-none" />
                                    </div>
                                    <div className="bg-brand-light rounded-2xl p-4 border border-gray-100 focus-within:ring-2 ring-brand-primary relative">
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 ml-8">Location</label>
                                        <MapPinIcon className="w-5 h-5 text-gray-400 absolute left-4 bottom-4" />
                                        <input type="text" placeholder="City or zip" className="w-full bg-transparent outline-none font-medium text-brand-dark pl-6" />
                                    </div>
                                    <button className="h-[72px] bg-brand-primary text-white rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-brand-primary/90 transition-colors shadow-lg">
                                        <SearchIcon className="w-5 h-5"/> Search Directory
                                    </button>
                                </div>
                            </div>
                            <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm text-brand-primary/80">
                                <span className="font-medium mr-2 self-center">Popular Searches:</span>
                                {['Mental Health', 'Therapy', 'Spa Treatments', 'Nutrition', 'Personal Training', 'Corporate Wellness'].map(tag => (
                                    <span key={tag} className="bg-white/60 backdrop-blur-sm px-4 py-1.5 rounded-full border border-gray-200 cursor-pointer hover:bg-white font-medium transition-colors">{tag}</span>
                                ))}
                            </div>
                        </FadeInSection>
                    </div>
                </div>
            </section>

            {/* Featured Companies Directory */}
            <section className="py-24 bg-brand-primary text-white">
                <div className="container mx-auto px-6">
                    <FadeInSection>
                        <h2 className="text-4xl font-heading font-semibold mb-6 text-center text-brand-gold">Wellness Business Directory</h2>
                        <p className="text-center text-brand-light/80 max-w-2xl mx-auto mb-16">Connect with Africa's leading healthcare providers, therapeutic professionals, fitness centers, and comprehensive wellness sanctuaries.</p>
                    </FadeInSection>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                        {displayCompanies.slice(0, visibleCount).map((company, i) => (
                            <FadeInSection key={company.name + i} delay={(i % 4) * 100}>
                                <div className="bg-white text-gray-800 rounded-3xl overflow-hidden shadow-2xl group cursor-pointer flex flex-col h-full transform hover:-translate-y-2 transition-transform duration-300">
                                    <div className="h-40 relative flex-shrink-0 overflow-hidden">
                                        <img src={company.image} alt={company.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"  referrerPolicy="no-referrer" />
                                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold text-brand-gold flex items-center gap-1 shadow-sm">
                                            <StarIcon className="w-3 h-3 solid text-brand-gold fill-current" /> {company.rating}
                                        </div>
                                    </div>
                                    <div className="p-6 flex flex-col flex-grow">
                                        <h3 className="text-xl font-heading font-semibold mb-2 leading-tight">{company.name} <span className="text-blue-500 ml-1" title="Verified">✓</span></h3>
                                        <p className="text-slate-500 text-sm mb-4 line-clamp-2">{company.notes}</p>
                                        <p className="text-xs font-medium text-brand-primary bg-brand-light/50 self-start px-3 py-1 rounded-lg mb-4">{company.category}</p>
                                        
                                        <div className="mt-auto pt-4 border-t border-gray-100 flex flex-col gap-2">
                                            <p className="text-brand-dark text-sm flex items-center gap-2"><MapPinIcon className="w-4 h-4 text-gray-400"/> {company.location}</p>
                                            {company.phone !== 'N/A' && <p className="text-brand-dark text-sm flex items-center gap-2"><PhoneIcon className="w-4 h-4 text-gray-400"/> {company.phone}</p>}
                                            {company.website !== 'N/A' && <p className="text-brand-dark text-sm flex items-center gap-2"><GlobeAltIcon className="w-4 h-4 text-gray-400"/> {company.website.replace('www.', '')}</p>}
                                        </div>
                                        
                                        <div className="mt-6 flex flex-col sm:flex-row gap-3">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setSelectedCompany(company); setModalMode('book'); }}
                                                className="flex-1 bg-brand-primary text-white py-2 rounded-xl text-sm font-semibold hover:bg-brand-primary/90 transition-colors shadow-sm"
                                            >
                                                Book Session
                                            </button>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setSelectedCompany(company); setModalMode('enquire'); }}
                                                className="flex-1 bg-brand-light text-brand-dark py-2 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors border border-gray-200"
                                            >
                                                Send Enquiry
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </FadeInSection>
                        ))}
                    </div>
                    {visibleCount < displayCompanies.length && (
                        <div className="mt-16 text-center">
                            <button 
                                onClick={() => setVisibleCount(prev => prev + 12)}
                                className="bg-brand-gold text-brand-primary px-8 py-3 rounded-full font-semibold shadow-lg hover:bg-brand-gold/90 transition-colors">
                                Show More Wellness Companies
                            </button>
                        </div>
                    )}
                </div>
            </section>

             {/* Popular Services */}
             <section className="py-24 bg-white">
                 <div className="container mx-auto px-6">
                     <FadeInSection>
                        <div className="flex justify-between items-end mb-16 border-b border-gray-100 pb-8">
                            <h2 className="text-4xl font-heading font-semibold text-brand-primary">Popular Services Near You</h2>
                            <button className="text-brand-gold hover:text-brand-gold/80 font-semibold flex items-center gap-2">View All &rarr;</button>
                        </div>
                     </FadeInSection>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                         {popularServices.map((service, i) => (
                             <FadeInSection key={service.name} delay={i * 50}>
                                 <div className="flex items-center justify-between p-6 rounded-[24px] border border-gray-100 hover:border-brand-gold/30 hover:shadow-lg transition-all group bg-brand-light/30">
                                     <div className="flex items-center gap-4">
                                        <div className="text-3xl bg-white w-14 h-14 rounded-full flex items-center justify-center shadow-sm">{service.icon}</div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900 border-b border-transparent group-hover:border-gray-900 transition-colors inline-block">{service.name}</h4>
                                            <p className="text-sm text-gray-500 font-medium">{service.price}</p>
                                        </div>
                                     </div>
                                     <button className="bg-brand-primary text-white px-5 py-2 rounded-full text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-0 translate-x-4">
                                         {service.button}
                                     </button>
                                 </div>
                             </FadeInSection>
                         ))}
                     </div>
                 </div>
             </section>

             {/* Retreats */}
             <section className="py-32 relative overflow-hidden bg-gray-900">
                <div className="absolute inset-0 z-0">
                    <img src="https://images.unsplash.com/photo-1545205597-3d9d02c29597?q=80&w=2070" className="w-full h-full object-cover opacity-40" alt="Retreat"  referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-900 to-transparent"></div>
                </div>
                <div className="container mx-auto px-6 relative z-10">
                    <FadeInSection>
                        <div className="max-w-2xl text-white">
                            <h2 className="text-5xl font-heading font-semibold tracking-tight mb-8 text-brand-gold">Immersive Wellness Retreats</h2>
                            <div className="flex flex-wrap gap-4 mb-12">
                                {retreats.map(r => (
                                    <span key={r} className="backdrop-blur-md bg-white/10 px-5 py-2 rounded-full text-sm font-medium border border-white/20 hover:bg-white hover:text-gray-900 cursor-pointer transition-colors">{r}</span>
                                ))}
                            </div>
                            <button className="bg-brand-secondary text-white px-8 py-4 rounded-full font-semibold shadow-lg hover:bg-brand-secondary/80 transition-colors">
                                Explore Retreats
                            </button>
                        </div>
                    </FadeInSection>
                </div>
             </section>

             {/* AI Matchmaker */}
             <section className="py-24 bg-brand-gold">
                <div className="container mx-auto px-6">
                    <div className="bg-white rounded-[40px] p-12 shadow-2xl relative overflow-hidden overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-light/50 rounded-full -mr-20 -mt-20 blur-3xl opacity-60 pointer-events-none"></div>
                         <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-gold rounded-full -ml-32 -mb-32 blur-3xl opacity-40 pointer-events-none"></div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 relative z-10 items-center">
                            <div>
                                <h2 className="text-4xl md:text-5xl font-heading font-semibold text-brand-primary mb-6">Find Your Perfect Wellness Journey</h2>
                                <p className="text-xl text-gray-600 mb-8">Let our AI matchmaker connect you with the ideal professionals and services based on your unique goals.</p>
                                
                                <div className="space-y-4 mb-8">
                                    <h4 className="font-semibold text-gray-800">What are your wellness goals?</h4>
                                    <div className="flex flex-wrap gap-3">
                                        {['Stress Management', 'Weight Loss', 'Better Sleep', 'Fitness', 'Mental Health'].map(goal => (
                                            <button key={goal} className="px-4 py-2 rounded-full border border-gray-200 text-gray-600 hover:border-brand-gold hover:text-brand-gold hover:bg-brand-secondary/5 transition-all text-sm font-medium">
                                                {goal}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <button className="w-full bg-brand-primary text-white py-4 rounded-2xl font-semibold shadow-lg hover:bg-brand-primary/90 transition-colors">
                                    Generate Recommendations ✨
                                </button>
                            </div>
                            <div className="hidden lg:block relative">
                                <img src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=2070" className="rounded-3xl shadow-xl transform rotate-3" alt="Matchmaker"  referrerPolicy="no-referrer" />
                                <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-3xl shadow-2xl flex items-center gap-4">
                                    <div className="text-4xl font-heading">🧘‍♀️</div>
                                    <div>
                                        <p className="text-sm text-gray-500 font-medium">Perfect Match Found</p>
                                        <p className="font-semibold text-brand-primary">Yoga & Meditation Retreat</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
             </section>

             {/* Provider CTA */}
             <section className="py-24 text-center">
                <div className="container mx-auto px-6">
                    <FadeInSection>
                        <h2 className="text-4xl font-heading font-semibold text-brand-primary mb-6">Grow Your Wellness Business</h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">Join Africa's fastest-growing wellness marketplace and connect with thousands seeking your expertise.</p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <button className="bg-brand-primary text-white px-8 py-4 rounded-full font-semibold shadow-lg hover:bg-brand-primary/90 transition-colors">
                                List Your Business
                            </button>
                            <button className="bg-white text-brand-primary border border-brand-primary px-8 py-4 rounded-full font-semibold shadow-sm hover:bg-brand-light/50 transition-colors">
                                Become a Wellness Partner
                            </button>
                        </div>
                    </FadeInSection>
                </div>
             </section>

             {/* Booking / Enquiry Modal */}
             {selectedCompany && modalMode && (
                 <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                     {/* Backdrop */}
                     <div className="absolute inset-0 bg-brand-dark/60 backdrop-blur-sm" onClick={closeModal}></div>
                     
                     {/* Dialog */}
                     <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
                         {/* Header */}
                         <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-brand-light/30">
                             <div>
                                 <h3 className="text-2xl font-heading font-semibold text-brand-primary mb-1">
                                     {modalMode === 'book' ? 'Book a Session' : 'Send Enquiry'}
                                 </h3>
                                 <p className="text-gray-500 text-sm">with {selectedCompany.name}</p>
                             </div>
                             <button 
                                 onClick={closeModal}
                                 className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                             >
                                 <XMarkIcon className="w-5 h-5" />
                             </button>
                         </div>
                         
                         {/* Body */}
                         <div className="p-6 overflow-y-auto">
                             <form className="flex flex-col gap-5">
                                 <div className="grid grid-cols-2 gap-4">
                                     <div className="flex flex-col gap-1.5">
                                         <label className="text-sm font-semibold text-brand-primary">First Name</label>
                                         <input type="text" className="px-4 py-3 bg-brand-light rounded-xl border border-gray-100 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary text-sm" placeholder="Your first name" required />
                                     </div>
                                     <div className="flex flex-col gap-1.5">
                                         <label className="text-sm font-semibold text-brand-primary">Last Name</label>
                                         <input type="text" className="px-4 py-3 bg-brand-light rounded-xl border border-gray-100 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary text-sm" placeholder="Your last name" required />
                                     </div>
                                 </div>
                                 
                                 <div className="flex flex-col gap-1.5">
                                     <label className="text-sm font-semibold text-brand-primary">Email Address</label>
                                     <input type="email" className="px-4 py-3 bg-brand-light rounded-xl border border-gray-100 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary text-sm" placeholder="you@example.com" required />
                                 </div>

                                 {modalMode === 'book' && (
                                     <div className="flex flex-col gap-1.5">
                                         <label className="text-sm font-semibold text-brand-primary">Preferred Date</label>
                                         <input type="date" className="px-4 py-3 bg-brand-light rounded-xl border border-gray-100 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary text-sm text-gray-700" required />
                                     </div>
                                 )}
                                 
                                 <div className="flex flex-col gap-1.5">
                                     <label className="text-sm font-semibold text-brand-primary">
                                       {modalMode === 'book' ? 'Reason for Visit (Optional)' : 'Message'}
                                     </label>
                                     <textarea 
                                         rows={4} 
                                         className="px-4 py-3 bg-brand-light rounded-xl border border-gray-100 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary text-sm resize-none" 
                                         placeholder={modalMode === 'book' ? "Any specific goals or conditions?" : "How can they help you?"}
                                         required={modalMode === 'enquire'}
                                     ></textarea>
                                 </div>

                                 <button type="button" onClick={handleFormSubmit} className="mt-2 w-full bg-brand-primary text-white py-4 rounded-xl font-semibold shadow-lg hover:bg-brand-primary/90 transition-colors">
                                     {modalMode === 'book' ? 'Request Appointment' : 'Send Message'}
                                 </button>
                                 <p className="text-xs text-center text-gray-400 mt-2">
                                   By submitting, you agree to our Terms of Service.
                                 </p>
                             </form>
                         </div>
                     </div>
                 </div>
             )}
        </div>
    );
};

export default FindWellnessPage;
