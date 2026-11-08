import React, { useState, useEffect } from 'react';
import { 
    StarIcon, MapPinIcon, ShieldCheckIcon, HeartIcon, ChevronDownIcon, CalendarIcon, UsersIcon, 
    XMarkIcon, CheckIcon, CheckCircleIcon, KeyIcon, WifiIcon, BeakerIcon, MapIcon, FireIcon,
    ArrowLeftIcon, ChatBubbleBottomCenterTextIcon, HandThumbUpIcon, ArrowUpIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { supabase } from '../../lib/supabase';

const faqs = [
    { question: "What are the check-in and check-out times?", answer: "Check-in is from 3:00 PM onwards, and check-out is until 11:00 AM. Early check-in or late check-out may be available upon request." },
    { question: "Is parking available on site?", answer: "Yes, we offer complimentary secure parking for all our guests." },
    { question: "Are pets allowed?", answer: "We love animals, but currently, we only allow service animals on the property." },
    { question: "What is your cancellation policy?", answer: "You can cancel free of charge until 48 hours before arrival. Cancellations made within 48 hours will incur a one-night fee." },
];

const rooms = [
    {
        id: 1,
        name: "Deluxe Ocean View Suite",
        size: "45m²",
        occupancy: 2,
        bed: "1 King Bed",
        price: "R 4,500",
        images: [
            "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80",
            "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&q=80"
        ],
        amenities: ["Ocean View", "Balcony", "Mini Bar", "Free WiFi"],
        left: 2
    },
    {
        id: 2,
        name: "Premium Garden Villa",
        size: "65m²",
        occupancy: 4,
        bed: "2 Queen Beds",
        price: "R 6,200",
        images: [
            "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&q=80",
            "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&q=80"
        ],
        amenities: ["Garden Access", "Private Pool", "Kitchenette", "Free WiFi"],
        left: 5
    },
    {
        id: 3,
        name: "Presidential Penthouse",
        size: "120m²",
        occupancy: 4,
        bed: "1 King, 1 Queen",
        price: "R 15,000",
        images: [
            "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800&q=80",
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80"
        ],
        amenities: ["Panoramic Views", "Butler Service", "Jacuzzi", "Free WiFi"],
        left: 1
    }
];

const reviews = [
    { name: "Sarah M.", date: "October 2023", rating: 5, text: "Absolutely incredible experience. The staff went above and beyond, and the views are breathtaking." },
    { name: "James L.", date: "September 2023", rating: 5, text: "A perfect getaway. The amenities are world-class, especially the spa. Will definitely return." },
    { name: "Elena R.", date: "August 2023", rating: 4, text: "Beautiful property and great food. The room was spacious and clean." }
];

interface StayDetailsPageProps {
    property: any;
    onBack: () => void;
}

const StayDetailsPage: React.FC<StayDetailsPageProps> = ({ property, onBack }) => {
    const [bookingStep, setBookingStep] = useState(0); // 0: hidden, 1: Add-ons, 2: Guest Details, 3: Payment, 4: Confirm
    const [selectedRoom, setSelectedRoom] = useState<any>(null);
    const [activeFaq, setActiveFaq] = useState<number | null>(null);
    
    // Booking Form State
    const [bookingDates, setBookingDates] = useState({ checkIn: '', checkOut: '' });
    const [addons, setAddons] = useState({ breakfast: false, transfer: false, spa: false, upgrade: false, occasion: false, insurance: false });

    // Handle room booking initiation
    const startBooking = (room: any) => {
        if (!bookingDates.checkIn || !bookingDates.checkOut) {
            alert('Please select check-in and check-out dates first.');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        setSelectedRoom(room);
        setBookingStep(1);
    };

    const handleConfirmBooking = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const username = user?.email || 'guest';
            
            // Log it in tour_requests to simulate a booking
            const newBooking = {
                property_id: property.id,
                property_title: property.name,
                username: username,
                date: bookingDates.checkIn,
                time: '14:00', // standard hotel check-in
                status: 'Confirmed', // directly confirm for simplicity
                timestamp: Date.now()
            };

            await supabase.from('tour_requests').insert(newBooking);
            
            setBookingStep(4);
        } catch (e) {
            console.error('Error confirming booking', e);
            setBookingStep(4); // proceed anyway for UX fallback
        }
    };

    return (
        <div className="bg-brand-light text-brand-dark min-h-screen relative font-sans">
            {/* Nav / Back */}
            <div className="fixed top-0 left-0 w-full z-50 bg-transparent p-6 pointer-events-none">
                <button onClick={onBack} className="pointer-events-auto flex items-center justify-center w-12 h-12 rounded-full bg-white/50 backdrop-blur-md hover:bg-white text-brand-dark transition-colors shadow-lg">
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
            </div>

            {/* Hero Layer (Full viewport cinematic) */}
            <div className="relative w-full h-[80vh] md:h-screen">
                <img src={property.image} alt={property.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/90 via-brand-dark/30 to-transparent"></div>
                
                <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 text-white pb-32 md:pb-40">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div>
                                <span className="inline-block px-3 py-1 bg-brand-gold/90 text-brand-dark text-xs font-bold rounded-full mb-4 uppercase tracking-wider">
                                    {property.badge || "Exclusive"}
                                </span>
                                <h1 className="text-5xl md:text-7xl font-heading font-semibold mb-2">{property.name}</h1>
                                <p className="text-xl md:text-2xl text-white/80 font-light max-w-2xl">A sanctuary of luxury and tranquility.</p>
                                
                                {/* Social Proof Strip */}
                                <div className="flex flex-wrap items-center gap-4 mt-6 text-sm font-medium">
                                    <div className="flex items-center gap-1">
                                        <StarIconSolid className="w-5 h-5 text-brand-gold" />
                                        <span className="text-lg">{property.rating}</span>
                                        <span className="text-white/60 ml-1">(128 Reviews)</span>
                                    </div>
                                    <div className="w-1 h-1 bg-white/30 rounded-full"></div>
                                    <div className="flex items-center gap-1 text-white/90">
                                        <MapPinIcon className="w-4 h-4" /> {property.location}
                                    </div>
                                    <div className="w-1 h-1 bg-white/30 rounded-full"></div>
                                    <div className="flex items-center gap-1 text-emerald-400">
                                        <ShieldCheckIcon className="w-4 h-4" /> Verified Property
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Search / Availability Bar */}
            <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-gray-200 shadow-sm transition-all -mt-20 md:-mt-16 mx-4 md:mx-auto max-w-7xl rounded-2xl md:rounded-[32px] p-2">
                <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 p-2 md:p-4">
                    <div className="flex-1 w-full bg-brand-light rounded-xl md:rounded-2xl p-3 md:p-4 flex flex-col justify-center relative border border-transparent focus-within:border-brand-primary transition-colors">
                        <label className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest pl-8 mb-1">Check In</label>
                        <CalendarIcon className="w-5 h-5 absolute left-3 md:left-4 bottom-3 md:bottom-4 text-brand-primary" />
                        <input type="date" value={bookingDates.checkIn} onChange={e => setBookingDates({...bookingDates, checkIn: e.target.value})} className="w-full bg-transparent outline-none pl-8 font-medium text-brand-dark text-sm" />
                    </div>
                    <div className="flex-1 w-full bg-brand-light rounded-xl md:rounded-2xl p-3 md:p-4 flex flex-col justify-center relative border border-transparent focus-within:border-brand-primary transition-colors">
                        <label className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest pl-8 mb-1">Check Out</label>
                        <CalendarIcon className="w-5 h-5 absolute left-3 md:left-4 bottom-3 md:bottom-4 text-brand-primary" />
                        <input type="date" value={bookingDates.checkOut} onChange={e => setBookingDates({...bookingDates, checkOut: e.target.value})} className="w-full bg-transparent outline-none pl-8 font-medium text-brand-dark text-sm" />
                    </div>
                    <div className="flex-1 w-full bg-brand-light rounded-xl md:rounded-2xl p-3 md:p-4 flex flex-col justify-center relative border border-transparent focus-within:border-brand-primary transition-colors">
                        <label className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest pl-8 mb-1">Guests & Rooms</label>
                        <UsersIcon className="w-5 h-5 absolute left-3 md:left-4 bottom-3 md:bottom-4 text-brand-primary" />
                        <select className="w-full bg-transparent outline-none pl-8 font-medium text-brand-dark appearance-none text-sm cursor-pointer">
                            <option>2 Guests, 1 Room</option>
                            <option>1 Guest, 1 Room</option>
                            <option>4 Guests, 2 Rooms</option>
                        </select>
                        <ChevronDownIcon className="w-4 h-4 absolute right-3 md:right-4 bottom-4 md:bottom-5 text-gray-400 pointer-events-none" />
                    </div>
                    <button className="w-full md:w-auto bg-brand-dark text-white px-8 py-4 rounded-xl md:rounded-2xl font-bold hover:bg-brand-primary transition-colors shadow-lg flex-shrink-0 text-sm h-[60px] md:h-[72px]">
                        Check Availability
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20 grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Main Content: Storytelling & Rooms */}
                <div className="lg:col-span-2 space-y-16">
                    
                    {/* Welcome & Overview */}
                    <section>
                        <h2 className="text-3xl font-heading font-semibold mb-6">About the Experience</h2>
                        <p className="text-gray-600 leading-relaxed text-lg mb-8">
                            Nestled in the heart of the region, {property.name} offers an unparalleled blend of modern luxury and authentic charm. 
                            Our spaces are designed to rejuvenate your spirit, offering breathtaking views, bespoke amenities, and a commitment to sustainable elegance. 
                            Whether you're unwinding by the pool or exploring the local culture, every moment here is curated to perfection.
                        </p>
                        
                        {/* Highlights Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { icon: WifiIcon, label: 'High-Speed WiFi' },
                                { icon: BeakerIcon, label: 'Luxury Spa' },
                                { icon: FireIcon, label: 'Gourmet Dining' },
                                { icon: KeyIcon, label: 'Smart Access' }
                            ].map((facility, i) => (
                                <div key={i} className="flex flex-col items-center justify-center p-4 bg-white rounded-[24px] border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                    <facility.icon className="w-8 h-8 text-brand-primary mb-3" />
                                    <span className="text-sm font-semibold text-gray-700">{facility.label}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                    
                    {/* Urgency Strip */}
                    <div className="bg-brand-primary/10 border-l-4 border-brand-primary p-4 rounded-xl flex items-center gap-4">
                        <FireIcon className="w-6 h-6 text-brand-primary animate-pulse" />
                        <div>
                            <p className="font-semibold text-brand-dark">High Demand</p>
                            <p className="text-sm text-gray-600">5 people are looking at this property right now.</p>
                        </div>
                    </div>

                    {/* Rooms & Suites */}
                    <section id="rooms">
                        <div className="flex justify-between items-end mb-8">
                            <h2 className="text-3xl font-heading font-semibold">Rooms & Suites</h2>
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-medium text-gray-500">Sort by:</label>
                                <select className="bg-white border border-gray-200 rounded-lg px-3 py-1 text-sm outline-none font-medium">
                                    <option>Recommended</option>
                                    <option>Price: Low to High</option>
                                    <option>Price: High to Low</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {rooms.map(room => (
                                <div key={room.id} className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col md:flex-row group">
                                    {/* Room Images */}
                                    <div className="relative w-full md:w-2/5 h-64 md:h-auto overflow-x-auto flex snap-x snap-mandatory">
                                        {room.images.map((img: string, idx: number) => (
                                            <div key={idx} className="w-full h-full flex-shrink-0 snap-center relative overflow-hidden group/img">
                                                <img src={img} alt={`${room.name} ${idx + 1}`} className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-700" referrerPolicy="no-referrer" />
                                            </div>
                                        ))}
                                        <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-red-500 flex items-center gap-1 shadow-sm border border-red-100">
                                            <FireIcon className="w-3 h-3" /> {room.left} left at this price
                                        </div>
                                        <div className="absolute z-10 bottom-4 left-0 w-full flex justify-center gap-1.5 opacity-80 pointer-events-none">
                                            {room.images.map((_, idx: number) => (
                                                <div key={idx} className="w-1.5 h-1.5 rounded-full bg-white backdrop-blur-sm shadow-sm" />
                                            ))}
                                        </div>
                                    </div>
                                    
                                    {/* Room Details */}
                                    <div className="p-6 md:p-8 flex-1 flex flex-col">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-2xl font-bold font-heading text-brand-dark">{room.name}</h3>
                                        </div>
                                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-6 border-b border-gray-100 pb-4">
                                            <span className="flex items-center gap-1"><MapIcon className="w-4 h-4 text-gray-400" /> {room.size}</span>
                                            <span className="flex items-center gap-1"><UsersIcon className="w-4 h-4 text-gray-400" /> Up to {room.occupancy}</span>
                                            <span className="flex items-center gap-1"><StarIcon className="w-4 h-4 text-gray-400" /> {room.bed}</span>
                                        </div>
                                        
                                        <div className="flex flex-wrap gap-2 mb-6">
                                            {room.amenities.map(am => (
                                                <span key={am} className="px-3 py-1 bg-brand-light text-brand-dark rounded-md text-xs font-semibold">{am}</span>
                                            ))}
                                        </div>

                                        <div className="mt-auto flex items-end justify-between">
                                            <div>
                                                <p className="text-xl md:text-3xl font-black text-brand-primary">{room.price}</p>
                                                <p className="text-xs text-gray-500 font-medium">per night, incl. taxes</p>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <button onClick={() => startBooking(room)} className="bg-brand-dark text-white px-8 py-3 rounded-xl font-bold hover:bg-brand-primary transition-colors text-sm shadow-md hover:shadow-xl">
                                                    Book Now
                                                </button>
                                                <button className="text-brand-primary font-semibold text-xs hover:text-brand-dark transition-colors text-center">
                                                    View Details
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Trust & Reviews */}
                    <section className="bg-brand-light p-8 md:p-12 rounded-[40px]">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-3xl font-heading font-semibold">Guest Experiences</h2>
                            <div className="flex items-center gap-2">
                                <StarIconSolid className="w-6 h-6 text-brand-gold" />
                                <span className="text-2xl font-bold">{property.rating}</span>
                                <span className="text-gray-500">/ 5</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {reviews.map((review, i) => (
                                <div key={i} className="bg-white p-6 rounded-3xl shadow-sm">
                                    <div className="flex items-center gap-1 mb-3">
                                        {[...Array(5)].map((_, idx) => <StarIconSolid key={idx} className={`w-4 h-4 ${idx < review.rating ? 'text-brand-gold' : 'text-gray-200'}`} /> )}
                                    </div>
                                    <p className="text-gray-700 italic mb-4 font-light leading-relaxed">"{review.text}"</p>
                                    <div className="flex items-center justify-between mt-auto">
                                        <p className="font-semibold text-sm text-brand-dark">{review.name}</p>
                                        <p className="text-xs text-gray-400">{review.date}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-8">
                    {/* Location Map Placeholder */}
                    <div className="bg-white p-2 rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
                        <div className="h-64 rounded-[24px] bg-slate-200 w-full relative overflow-hidden flex items-center justify-center group cursor-pointer">
                            {/* Placeholder for map - normally an iframe */}
                            <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=80" alt="Map" className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" referrerPolicy="no-referrer" />
                            <div className="absolute inset-0 bg-brand-dark/20 flex flex-col items-center justify-center">
                                <div className="bg-white p-3 rounded-full shadow-lg text-brand-primary mb-2 transform group-hover:-translate-y-2 transition-transform">
                                    <MapPinIcon className="w-6 h-6" />
                                </div>
                                <span className="bg-white/90 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs font-bold shadow-sm">View on Map</span>
                            </div>
                        </div>
                        <div className="p-6">
                            <h3 className="font-bold mb-2">Prime Location</h3>
                            <p className="text-sm text-gray-500 mb-4">{property.location}</p>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm border-b border-gray-50 pb-2">
                                    <span className="text-gray-500">Nearest Airport</span>
                                    <span className="font-semibold">25 mins</span>
                                </div>
                                <div className="flex justify-between text-sm border-b border-gray-50 pb-2">
                                    <span className="text-gray-500">City Center</span>
                                    <span className="font-semibold">10 mins</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Host Info */}
                    <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 flex flex-col items-center text-center">
                        <div className="w-20 h-20 bg-brand-primary/10 rounded-full flex items-center justify-center mb-4">
                            <ShieldCheckIcon className="w-10 h-10 text-brand-primary" />
                        </div>
                        <h3 className="font-bold text-lg mb-1">Managed Professionally</h3>
                        <p className="text-sm text-gray-500 mb-6">Response rate: 100% • 24/7 Support</p>
                        <button className="w-full py-3 rounded-xl border border-gray-200 text-brand-dark font-semibold hover:bg-gray-50 transition-colors text-sm">
                            Contact Host
                        </button>
                    </div>

                    {/* FAQs */}
                    <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                        <h3 className="text-xl font-heading font-semibold mb-6">Good to Know</h3>
                        <div className="space-y-4">
                            {faqs.map((faq, index) => (
                                <div key={index} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                                    <button 
                                        onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                                        className="w-full flex justify-between items-center text-left text-sm font-semibold text-brand-dark hover:text-brand-primary transition-colors"
                                    >
                                        <span>{faq.question}</span>
                                        <ChevronDownIcon className={`w-4 h-4 transform transition-transform ${activeFaq === index ? 'rotate-180' : ''}`} />
                                    </button>
                                    {activeFaq === index && (
                                        <p className="mt-3 text-sm text-gray-500 leading-relaxed font-light">
                                            {faq.answer}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Mobile CTA */}
            <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 z-40 flex items-center justify-between">
                <div>
                    <p className="text-lg font-black text-brand-primary">{property.price}</p>
                    <p className="text-xs text-gray-500 font-medium">per night</p>
                </div>
                <button onClick={() => {
                    const roomsSection = document.getElementById('rooms');
                    if (roomsSection) roomsSection.scrollIntoView({ behavior: 'smooth' });
                }} className="bg-brand-dark text-white px-8 py-3 rounded-xl font-bold">
                    View Rooms
                </button>
            </div>

            {/* Chat Widget Placeholder */}
            <div className="fixed bottom-6 right-6 z-50">
                <button className="w-14 h-14 bg-brand-primary text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-brand-dark transition-colors hover:scale-105 transform cursor-pointer">
                    <ChatBubbleBottomCenterTextIcon className="w-6 h-6" />
                </button>
            </div>

            {/* Full Screen Booking Flow Modal */}
            {bookingStep > 0 && selectedRoom && (
                <div className="fixed inset-0 z-[100] bg-brand-light flex flex-col">
                    {/* Minimal Header */}
                    <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-10">
                        <button onClick={() => setBookingStep(0)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <XMarkIcon className="w-6 h-6 text-gray-600" />
                        </button>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4].map(step => (
                                <div key={step} className={`w-12 md:w-24 h-1.5 rounded-full ${step <= bookingStep ? 'bg-brand-primary' : 'bg-gray-200'}`}></div>
                            ))}
                        </div>
                        <div className="w-10"></div> {/* spacer */}
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 py-8 md:py-12">
                        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                            
                            {/* Form Area */}
                            <div className="md:col-span-2 space-y-8">
                                {bookingStep === 1 && (
                                    <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                                        <h2 className="text-2xl font-heading font-semibold mb-2">Enhance your stay</h2>
                                        <p className="text-gray-500 text-sm mb-8">Add these extras now to guarantee availability.</p>
                                        
                                        <div className="space-y-4">
                                            {[
                                                { id: 'breakfast', label: 'Artisan Breakfast Buffet', price: 'R 350 / day', desc: 'Farm-to-table breakfast served overlooking the gardens.', icon: BeakerIcon },
                                                { id: 'transfer', label: 'Airport Transfer (Return)', price: 'R 1,200', desc: 'Private luxury sedan pickup and drop-off.', icon: MapPinIcon },
                                                { id: 'spa', label: 'Couples Spa Package', price: 'R 2,500', desc: '90-minute massage and access to thermal pools.', icon: SparklesIcon },
                                                { id: 'upgrade', label: 'Priority Room Upgrade', price: 'Free', desc: 'Subject to availability upon arrival.', icon: ArrowUpIcon },
                                                { id: 'occasion', label: 'Special Occasion Package', price: 'R 850', desc: 'Champagne, artisanal chocolates, and fine flowers in room.', icon: HeartIcon },
                                                { id: 'insurance', label: 'Comprehensive Travel Insurance', price: 'R 250 / guest', desc: 'Full coverage for cancellations and medical emergencies.', icon: ShieldCheckIcon }
                                            ].map(addon => {
                                                const Icon = addon.icon;
                                                return (
                                                    <div key={addon.id} 
                                                        onClick={() => setAddons({...addons, [addon.id as keyof typeof addons]: !addons[addon.id as keyof typeof addons]})}
                                                        className={`p-4 rounded-2xl border-2 cursor-pointer flex gap-4 transition-all ${addons[addon.id as keyof typeof addons] ? 'border-brand-primary bg-brand-primary/5' : 'border-gray-100 hover:border-gray-200'}`}
                                                    >
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mt-1 flex-shrink-0 ${addons[addon.id as keyof typeof addons] ? 'bg-brand-primary text-white' : 'bg-gray-100 text-gray-400'}`}>
                                                            {addons[addon.id as keyof typeof addons] ? <CheckIcon className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                                                        </div>
                                                        <div>
                                                            <div className="flex justify-between items-center mb-1">
                                                                <h4 className="font-semibold text-brand-dark">{addon.label}</h4>
                                                                <span className="font-bold text-brand-primary">{addon.price}</span>
                                                            </div>
                                                            <p className="text-sm text-gray-500">{addon.desc}</p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                                            <button onClick={() => setBookingStep(2)} className="bg-brand-dark text-white px-8 py-4 rounded-xl font-bold hover:bg-brand-primary transition-colors text-sm shadow-md">
                                                Continue to Guest Details
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {bookingStep === 2 && (
                                    <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                                        <div className="flex justify-between items-center mb-6">
                                            <h2 className="text-2xl font-heading font-semibold">Guest Details</h2>
                                            <div className="text-sm">
                                                <span className="text-gray-500">Have an account?</span>{' '}
                                                <button className="text-brand-primary font-bold hover:underline">Sign in</button>
                                            </div>
                                        </div>

                                        <div className="mb-8 p-4 bg-brand-light rounded-2xl flex items-center justify-between border border-gray-100">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                                                    <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/><path d="M1 1h22v22H1z" fill="none"/></svg>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-brand-dark text-sm">Checkout faster</p>
                                                    <p className="text-xs text-gray-500">Auto-fill your details with Google.</p>
                                                </div>
                                            </div>
                                            <button className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-brand-dark hover:bg-gray-50">
                                                Use Google
                                            </button>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                            <div className="flex flex-col gap-1.5 focus-within:text-brand-primary transition-colors">
                                                <label className="text-xs font-bold uppercase tracking-wide">First Name</label>
                                                <input type="text" className="px-4 py-3 bg-brand-light rounded-xl outline-none focus:ring-2 focus:ring-brand-primary text-brand-dark" required />
                                            </div>
                                            <div className="flex flex-col gap-1.5 focus-within:text-brand-primary transition-colors">
                                                <label className="text-xs font-bold uppercase tracking-wide">Last Name</label>
                                                <input type="text" className="px-4 py-3 bg-brand-light rounded-xl outline-none focus:ring-2 focus:ring-brand-primary text-brand-dark" required />
                                            </div>
                                            <div className="flex flex-col gap-1.5 md:col-span-2 focus-within:text-brand-primary transition-colors">
                                                <label className="text-xs font-bold uppercase tracking-wide">Email Address</label>
                                                <input type="email" className="px-4 py-3 bg-brand-light rounded-xl outline-none focus:ring-2 focus:ring-brand-primary text-brand-dark" required />
                                            </div>
                                            
                                            <div className="flex flex-col gap-1.5 md:col-span-2 focus-within:text-brand-primary transition-colors mt-4">
                                                <label className="text-xs font-bold uppercase tracking-wide">Estimated Arrival Time</label>
                                                <select className="px-4 py-3 bg-brand-light rounded-xl outline-none focus:ring-2 focus:ring-brand-primary text-brand-dark cursor-pointer appearance-none">
                                                    <option>I don't know yet</option>
                                                    <option>12:00 PM - 2:00 PM</option>
                                                    <option>2:00 PM - 4:00 PM</option>
                                                    <option>4:00 PM - 6:00 PM</option>
                                                    <option>6:00 PM - 8:00 PM</option>
                                                    <option>After 8:00 PM</option>
                                                </select>
                                            </div>

                                            <div className="flex flex-col gap-1.5 md:col-span-2 focus-within:text-brand-primary transition-colors">
                                                <label className="text-xs font-bold uppercase tracking-wide">Special Requests (Optional)</label>
                                                <textarea className="px-4 py-3 bg-brand-light rounded-xl outline-none focus:ring-2 focus:ring-brand-primary text-brand-dark min-h-[100px] resize-none" placeholder="Let us know if you have any allergies or special requirements..."></textarea>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
                                            <button onClick={() => setBookingStep(1)} className="text-gray-500 font-semibold hover:text-brand-dark text-sm">Back</button>
                                            <button onClick={() => setBookingStep(3)} className="bg-brand-dark text-white px-8 py-4 rounded-xl font-bold hover:bg-brand-primary transition-colors text-sm shadow-md">
                                                Continue to Payment
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {bookingStep === 3 && (
                                    <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                                        <h2 className="text-2xl font-heading font-semibold mb-2">Secure Payment</h2>
                                        <div className="flex items-center gap-4 mb-8">
                                            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold border border-emerald-100">
                                                <ShieldCheckIcon className="w-4 h-4" /> 256-bit SSL
                                            </div>
                                            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-600 rounded-full text-xs font-bold border border-slate-200">
                                                <CheckCircleIcon className="w-4 h-4" /> PCI-DSS Compliant
                                            </div>
                                        </div>
                                        
                                        <div className="mb-6">
                                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">When would you like to pay?</h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="border-2 border-brand-primary bg-brand-primary/5 rounded-2xl p-4 cursor-pointer relative">
                                                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-brand-primary flex items-center justify-center text-white"><CheckIcon className="w-3 h-3" /></div>
                                                    <h4 className="font-bold text-brand-dark mb-1">Pay Now</h4>
                                                    <p className="text-xs text-gray-500">Lock in this price today.</p>
                                                </div>
                                                <div className="border border-gray-200 hover:border-gray-300 rounded-2xl p-4 cursor-pointer">
                                                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full border border-gray-300"></div>
                                                    <h4 className="font-bold text-brand-dark mb-1">Pay at Property</h4>
                                                    <p className="text-xs text-gray-500">Pay when you arrive.</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mb-6">
                                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Payment Method</h3>
                                            <div className="flex gap-2 mb-4 overflow-x-auto pb-2 custom-scrollbar">
                                                <button className="flex-shrink-0 px-6 py-3 rounded-xl border-2 border-brand-primary bg-brand-primary/5 font-semibold text-brand-dark text-sm">Credit Card</button>
                                                <button className="flex-shrink-0 px-6 py-3 rounded-xl border border-gray-200 hover:border-gray-300 font-semibold text-gray-600 text-sm">Apple Pay</button>
                                                <button className="flex-shrink-0 px-6 py-3 rounded-xl border border-gray-200 hover:border-gray-300 font-semibold text-gray-600 text-sm">Google Pay</button>
                                                <button className="flex-shrink-0 px-6 py-3 rounded-xl border border-gray-200 hover:border-gray-300 font-semibold text-gray-600 text-sm">PayPal</button>
                                            </div>
                                        </div>

                                        <div className="bg-brand-light p-4 rounded-2xl mb-6">
                                            <div className="space-y-4">
                                                <div className="flex flex-col gap-1.5 focus-within:text-brand-primary">
                                                    <label className="text-xs font-bold uppercase tracking-wide">Card Number</label>
                                                    <input type="text" placeholder="0000 0000 0000 0000" className="px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-brand-primary font-mono" />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="flex flex-col gap-1.5 focus-within:text-brand-primary">
                                                        <label className="text-xs font-bold uppercase tracking-wide">Expiry</label>
                                                        <input type="text" placeholder="MM/YY" className="px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-brand-primary font-mono" />
                                                    </div>
                                                    <div className="flex flex-col gap-1.5 focus-within:text-brand-primary">
                                                        <label className="text-xs font-bold uppercase tracking-wide">CVC</label>
                                                        <input type="text" placeholder="123" className="px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-brand-primary font-mono" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
                                            <button onClick={() => setBookingStep(2)} className="text-gray-500 font-semibold hover:text-brand-dark text-sm">Back</button>
                                            <button onClick={handleConfirmBooking} className="bg-brand-primary text-white px-8 py-4 rounded-xl font-bold hover:bg-brand-primary/90 transition-colors text-sm shadow-xl shadow-brand-primary/20">
                                                Pay Now & Confirm
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {bookingStep === 4 && (
                                    <div className="bg-white p-12 rounded-[40px] shadow-sm border border-gray-100 flex flex-col items-center text-center">
                                        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                                            <CheckCircleIcon className="w-12 h-12 text-emerald-500" />
                                        </div>
                                        <h2 className="text-3xl font-heading font-black text-brand-dark mb-4">Booking Confirmed!</h2>
                                        <p className="text-lg text-gray-600 mb-8 max-w-sm">
                                            Your stay at {property.name} is all set. We've sent an instant confirmation email to your inbox.
                                        </p>
                                        
                                        <div className="bg-brand-light w-full max-w-sm p-6 rounded-2xl mb-8 flex flex-col items-center border border-gray-200 border-dashed">
                                            <p className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-2">Booking Reference</p>
                                            <p className="text-2xl font-mono font-black text-brand-primary tracking-widest">AFR-{Math.floor(100000 + Math.random() * 900000)}</p>
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-4 mb-8 w-full justify-center">
                                            <button className="flex items-center justify-center gap-2 px-6 py-3 bg-brand-light text-brand-dark rounded-xl font-bold hover:bg-gray-100 transition-colors text-sm border border-gray-200 shadow-sm">
                                                <CalendarIcon className="w-5 h-5" /> Add to Calendar
                                            </button>
                                            <button className="flex items-center justify-center gap-2 px-6 py-3 bg-brand-light text-brand-dark rounded-xl font-bold hover:bg-gray-100 transition-colors text-sm border border-gray-200 shadow-sm">
                                                <UsersIcon className="w-5 h-5" /> Manage Booking
                                            </button>
                                        </div>

                                        <button onClick={() => { setBookingStep(0); onBack(); }} className="bg-brand-dark text-white px-12 py-4 rounded-xl font-bold hover:bg-brand-primary transition-colors text-sm shadow-md">
                                            Return to Homepage
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Summary Sidebar (visible on steps 1,2,3) */}
                            {bookingStep < 4 && (
                                <div className="md:col-span-1">
                                    <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm sticky top-24">
                                        <h3 className="font-bold text-lg mb-4 pb-4 border-b border-gray-100">Booking Summary</h3>
                                        
                                        {/* Property Details */}
                                        <div className="flex gap-4 mb-6">
                                            <img src={selectedRoom.images[0]} className="w-16 h-16 rounded-xl object-cover" alt="Room" referrerPolicy="no-referrer" />
                                            <div>
                                                <p className="font-semibold text-sm line-clamp-2">{property.name}</p>
                                                <p className="text-xs text-brand-primary font-medium">{selectedRoom.name}</p>
                                            </div>
                                        </div>

                                        {/* Dates */}
                                        <div className="bg-brand-light p-3 rounded-xl mb-6">
                                            <div className="flex justify-between text-sm mb-2">
                                                <span className="text-gray-500">Check In</span>
                                                <span className="font-bold">{bookingDates.checkIn || 'Not set'}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Check Out</span>
                                                <span className="font-bold">{bookingDates.checkOut || 'Not set'}</span>
                                            </div>
                                        </div>

                                        {/* Price Breakdown */}
                                        <div className="space-y-3 pt-4 border-t border-gray-100 mb-6 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Room x 1 night</span>
                                                <span className="font-semibold">{selectedRoom.price}</span>
                                            </div>
                                            {addons.breakfast && <div className="flex justify-between"><span className="text-gray-600">Breakfast</span><span className="font-semibold">R 350</span></div>}
                                            {addons.transfer && <div className="flex justify-between"><span className="text-gray-600">Transfer</span><span className="font-semibold">R 1,200</span></div>}
                                            {addons.spa && <div className="flex justify-between"><span className="text-gray-600">Spa Package</span><span className="font-semibold">R 2,500</span></div>}
                                            {addons.upgrade && <div className="flex justify-between"><span className="text-gray-600">Priority Upgrade</span><span className="font-semibold">Free</span></div>}
                                            {addons.occasion && <div className="flex justify-between"><span className="text-gray-600">Occasion Package</span><span className="font-semibold">R 850</span></div>}
                                            {addons.insurance && <div className="flex justify-between"><span className="text-gray-600">Travel Insurance</span><span className="font-semibold">R 250</span></div>}
                                            <div className="flex justify-between text-gray-600 pt-2 border-t border-gray-50">
                                                <span>Taxes & Fees</span>
                                                <span>Included</span>
                                            </div>
                                        </div>

                                        {/* Total */}
                                        <div className="flex justify-between items-end pt-4 border-t-2 border-brand-dark/10">
                                            <span className="font-bold">Total</span>
                                            <div className="text-right">
                                                <span className="block text-2xl font-black text-brand-primary">{selectedRoom.price}*</span>
                                                <span className="text-[10px] text-gray-400">*Est. total based on selections</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Needs a simple SparklesIcon since it was missing above
const SparklesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09l2.846.813-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
  </svg>
);

export default StayDetailsPage;
