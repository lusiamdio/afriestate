
import { ALL_PROPERTIES as initialProperties, MOCK_NOTIFICATIONS } from '../constants';
import type { Property, TourRequest, User, SearchFilters, Message, Review, CalendarEvent, AgentProfile, Lead, InvestorSettings, InvestmentRequest, PropertyAlert, UserDocument, Notification } from '../types';
import { ListingType, PropertyStatus, PropertyType } from '../types';
import type { StayPropertyProfile } from '../data/stayDetailData';
import { FLAGSHIP_AFRICAN_GRAND_HOTEL } from '../data/stayDetailData';
import { supabase } from './supabase';
import { generateListingSignature, generateSecureBookingRef, sanitizeSafeUrl, sanitizeText } from './security';
import {
    getLocalAlertNotifications,
    getLocalReadAlertNotificationIds,
    markLocalAlertNotificationsRead,
} from './investmentAlerts';

const PUBLISHED_PROPERTIES_KEY = 'afriestate_published_properties_v1';
const PUBLISHED_STAYS_KEY = 'afriestate_published_stays_v1';
const STAY_BOOKINGS_KEY = 'afriestate_stay_bookings_v1';
const HOTEL_REGISTRATIONS_KEY = 'afriestate_hotel_registrations_v1';

const readLocalJson = <T,>(key: string, fallback: T): T => {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return fallback;
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
};

const safeJsonParse = <T,>(value: unknown, fallback: T): T => {
    if (value === null || value === undefined) return fallback;
    if (typeof value !== 'string') return value as T;
    const trimmed = value.trim();
    if (!trimmed) return fallback;
    try {
        return JSON.parse(trimmed) as T;
    } catch {
        return fallback;
    }
};

const CITY_PROVINCE_MAP: Record<string, string> = {
    'cape town': 'Western Cape',
    'stellenbosch': 'Western Cape',
    'johannesburg': 'Gauteng',
    'sandton': 'Gauteng',
    'pretoria': 'Gauteng',
    'durban': 'KwaZulu-Natal',
    'umhlanga': 'KwaZulu-Natal',
    'nairobi': 'Nairobi County',
    'mombasa': 'Mombasa County',
    'lagos': 'Lagos State',
    'abuja': 'FCT Abuja',
    'accra': 'Greater Accra',
    'marrakech': 'Marrakech-Safi',
    'casablanca': 'Casablanca-Settat',
    'kigali': 'Kigali City',
    'cairo': 'Cairo Governorate',
    'alexandria': 'Alexandria Governorate',
    'luanda': 'Luanda Province',
    'gaborone': 'South-East District',
    'addis ababa': 'Addis Ababa Charter',
    'dakar': 'Dakar Region',
    'windhoek': 'Khomas Region',
    'dar es salaam': 'Dar es Salaam Region',
    'zanzibar': 'Zanzibar Urban/West',
    'port louis': 'Port Louis District',
    'victoria': 'Mahé District',
    'harare': 'Harare Province',
    'lusaka': 'Lusaka Province',
    'kampala': 'Central Region',
    'maputo': 'Maputo City',
    'tunis': 'Tunis Governorate',
};

export const resolveProvinceForCity = (city: string, country: string, explicitRegion?: string): string => {
    const cleanCity = sanitizeText(city || 'Cape Town', 80);
    const cleanCountry = sanitizeText(country || 'South Africa', 80);
    const mapped = CITY_PROVINCE_MAP[cleanCity.toLowerCase()];
    if (mapped) return mapped;
    const regionClean = explicitRegion ? sanitizeText(explicitRegion, 80) : '';
    if (regionClean && regionClean.toLowerCase() !== cleanCity.toLowerCase()) {
        return regionClean;
    }
    return `${cleanCountry} Region`;
};

const writeLocalJson = (key: string, value: unknown) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // Ignore quota / private browsing errors
    }
};

const mergePublishedWithBase = (base: Property[]): Property[] => {
    const localPublished = readLocalJson<Property[]>(PUBLISHED_PROPERTIES_KEY, []);
    if (!Array.isArray(localPublished) || localPublished.length === 0) {
        return base;
    }
    const mergedMap = new Map<string, Property>();
    base.forEach((p) => mergedMap.set(String(p.id), p));
    localPublished.forEach((p) => mergedMap.set(String(p.id), p));
    return Array.from(mergedMap.values()).sort((a, b) => (b.dateListed || 0) - (a.dateListed || 0));
};

// --- Helper for handling Supabase errors ---
const handleError = (error: any, message: string) => {
    if (error) {
        let errorMessage = 'Unknown error';
        if (typeof error === 'string') {
            errorMessage = error;
        } else if (error && typeof error === 'object') {
            errorMessage = error.message || error.details || error.hint || JSON.stringify(error);
        }

        // Downgrade network errors to warnings for cleaner console in demo/offline mode
        const isNetworkError = errorMessage.includes('Failed to fetch') || 
                             errorMessage.includes('Network request failed') ||
                             errorMessage.includes('connection error');

        const isMissingTableError = errorMessage.includes("Could not find the table") || 
                                   (errorMessage.includes("relation") && errorMessage.includes("does not exist"));

        if (isNetworkError || isMissingTableError) {
             return true;
        }

        console.error(`[AfriEstate] Error ${message}: ${errorMessage}`);
        return true;
    }
    return false;
};

// --- Agent Profile Management ---
export const getAgentProfile = async (username: string): Promise<AgentProfile> => {
    try {
        const { data, error } = await supabase
            .from('agent_profiles')
            .select('*')
            .eq('username', username)
            .single();

        if (error && error.code !== 'PGRST116') {
            handleError(error, 'fetching agent profile');
        }

        if (data) {
            return {
                ...data,
                profilePicture: data.profile_picture || data.profilePicture,
            };
        }
    } catch (e) {
        // Silent fail to default
    }

    return {
        username: username,
        bio: `Welcome to AfriEstate! Tell clients a bit about yourself.`,
        email: `${username.toLowerCase().replace(/\s+/g, '.')}@AfriEstate.co.za`,
        phone: 'Please add your phone number.',
        profilePicture: '/images/tersia-kroonstad.webp',
        socials: { twitter: '', linkedin: '', facebook: '' }
    };
};

export const updateAgentProfile = async (username: string, updatedProfile: AgentProfile): Promise<AgentProfile> => {
    try {
        const cleanUsername = sanitizeText(username, 120);
        const { error } = await supabase
            .from('agent_profiles')
            .upsert(
                {
                    username: cleanUsername,
                    bio: sanitizeText(updatedProfile.bio, 1500),
                    email: sanitizeText(updatedProfile.email, 160),
                    phone: sanitizeText(updatedProfile.phone, 40),
                    profile_picture: sanitizeSafeUrl(updatedProfile.profilePicture, '/images/tersia-kroonstad.webp'),
                    socials: updatedProfile.socials || { twitter: '', linkedin: '', facebook: '' },
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'username' }
            );
        
        if (error) throw error;
        return updatedProfile;
    } catch (error) {
        handleError(error, 'updating agent profile');
        return updatedProfile; // Return optimistic update
    }
};

// --- Review Management ---
export const getReviews = async (): Promise<Review[]> => {
    try {
        const { data, error } = await supabase
            .from('reviews')
            .select('*')
            .order('timestamp', { ascending: false });
        
        if (error) {
            handleError(error, 'fetching reviews');
            return [];
        }
        return (data || []).map(r => ({
            ...r,
            agentName: r.agent_name || r.agentName,
            reviewerUsername: r.reviewer_username || r.reviewerUsername
        }));
    } catch (e) {
        return [];
    }
};

export const getReviewsForAgent = async (agentName: string): Promise<Review[]> => {
    try {
        const { data, error } = await supabase
            .from('reviews')
            .select('*')
            .eq('agent_name', agentName)
            .order('timestamp', { ascending: false });
        
        if (error) {
            return [];
        }
        return (data || []).map(r => ({
            ...r,
            agentName: r.agent_name || r.agentName,
            reviewerUsername: r.reviewer_username || r.reviewerUsername
        }));
    } catch (e) {
        return [];
    }
};

export const addReview = async (reviewData: Omit<Review, 'id' | 'timestamp'>): Promise<Review> => {
    const newReview: any = {
        agent_name: reviewData.agentName,
        reviewer_username: reviewData.reviewerUsername,
        rating: reviewData.rating,
        comment: reviewData.comment,
        timestamp: Date.now(),
    };
    try {
        const { data, error } = await supabase
            .from('reviews')
            .insert(newReview)
            .select()
            .single();
        
        if (error) throw error;
        return {
            ...data,
            agentName: data.agent_name,
            reviewerUsername: data.reviewer_username
        };
    } catch (error) {
        handleError(error, 'adding review');
        return { ...reviewData, id: `rev_${Date.now()}`, timestamp: Date.now() } as Review; // Return optimistic review
    }
};

// --- Property Management ---
export const getProperties = async (excludeMock = false): Promise<Property[]> => {
    try {
        const { data, error } = await supabase
            .from('properties')
            .select('*');

        if (error) {
            handleError(error, 'fetching properties');
            return excludeMock ? readLocalJson<Property[]>(PUBLISHED_PROPERTIES_KEY, []) : mergePublishedWithBase(initialProperties);
        }

        if (!data || data.length === 0) {
            return excludeMock ? readLocalJson<Property[]>(PUBLISHED_PROPERTIES_KEY, []) : mergePublishedWithBase(initialProperties);
        }

        const curatedMap = new Map(initialProperties.map(prop => [String(prop.id), prop]));

        const mappedData = data.map(p => {
            const parsedImages = safeJsonParse<string[] | undefined>(p.images, undefined);
            const curatedProp = curatedMap.get(String(p.id));
            const hasLocalImage = Array.isArray(parsedImages) && parsedImages.some((img: string) => typeof img === 'string' && img.startsWith('/images/'));
            return {
                ...p,
                dateListed: p.dateListed ?? p.date_listed ?? (p.created_at ? new Date(p.created_at).getTime() : Date.now()),
                listingType: p.listingType ?? p.listing_type,
                propertyType: p.propertyType ?? p.property_type,
                purchasePrice: p.purchasePrice ?? p.purchase_price,
                neighborhoodInfo: p.neighborhoodInfo ?? p.neighborhood_info,
                virtualTourUrl: p.virtualTourUrl ?? p.virtual_tour_url,
                vrTourUrl: p.vrTourUrl ?? p.vr_tour_url,
                smartContractReady: p.smartContractReady ?? p.smart_contract_ready,
                priceHistory: p.priceHistory ?? p.price_history,
                occupancyRate: p.occupancyRate ?? p.occupancy_rate,
                marketROI: p.marketROI ?? p.market_roi,
                perNightPrice: p.perNightPrice ?? p.per_night_price,
                packageIncludes: p.packageIncludes ?? p.package_includes,
                vehicleType: p.vehicleType ?? p.vehicle_type,
                country: p.country,
                region: p.region,
                hasSolar: p.hasSolar ?? p.has_solar,
                hasGenerator: p.hasGenerator ?? p.has_generator,
                hasBorehole: p.hasBorehole ?? p.has_borehole,
                hasWaterTank: p.hasWaterTank ?? p.has_water_tank,
                hasFibre: p.hasFibre ?? p.has_fibre,
                securityFeatures: p.securityFeatures ?? p.security_features,
                proximity: p.proximity,
                leaseDuration: p.leaseDuration ?? p.lease_duration,
                targetReturn: p.targetReturn ?? p.target_return,
                rentalYield: p.rentalYield ?? p.rental_yield,
                projectedROI: p.projectedROI ?? p.projected_roi,
                minInvestment: p.minInvestment ?? p.min_investment,
                investmentType: p.investmentType ?? p.investment_type,
                riskLevel: p.riskLevel ?? p.risk_level,
                localCurrency: p.localCurrency ?? p.local_currency,
                foreignBuyerEligible: p.foreignBuyerEligible ?? p.foreign_buyer_eligible,
                verificationDetails: p.verificationDetails ?? p.verification_details,
                address: safeJsonParse(p.address, { street: '', city: '', state: '', zip: '' }),
                details: safeJsonParse(p.details, { beds: 0, baths: 0, area: 0 }),
                amenities: safeJsonParse(p.amenities, []),
                images: curatedProp && !hasLocalImage ? curatedProp.images : (parsedImages || curatedProp?.images || []),
                agent: safeJsonParse(p.agent, { name: 'AfriEstate Agent', phone: '', email: '', avatar: '' }),
                financials: safeJsonParse(p.financials, undefined),
            };
        });

        return mergePublishedWithBase(mappedData);

    } catch (criticalErr: any) {
        if (criticalErr.message && (criticalErr.message.includes('Failed to fetch') || criticalErr.message.includes('Network request failed'))) {
            console.warn('[AfriEstate] Backend unreachable (fetch exception). Using synced local data.');
        } else {
            console.warn("Failed to fetch properties from Supabase, using synced local data.", criticalErr);
        }
        return excludeMock ? readLocalJson<Property[]>(PUBLISHED_PROPERTIES_KEY, []) : mergePublishedWithBase(initialProperties);
    }
};

export const upsertPublishedProperty = async (property: Property): Promise<Property> => {
    const existingLocal = readLocalJson<Property[]>(PUBLISHED_PROPERTIES_KEY, []);
    const sig = generateListingSignature(property.id, property.agent?.name || 'afriestate', property.price);
    const enriched: Property = {
        ...property,
        verificationDetails: property.verificationDetails || {
            verifiedDate: new Date().toISOString().split('T')[0],
            titleDeedNumber: sig,
            inspectionDate: new Date().toISOString().split('T')[0],
            registryStatus: property.verified ? 'Verified Registry Record' : 'Owner Attested · Integrity Signed',
            surveyVerified: true,
        },
    };
    const nextLocal = [enriched, ...existingLocal.filter((p) => String(p.id) !== String(enriched.id))];
    writeLocalJson(PUBLISHED_PROPERTIES_KEY, nextLocal);
    await saveProperties([enriched]);
    return enriched;
};

export const removePublishedProperty = async (propertyId: string): Promise<void> => {
    const existingLocal = readLocalJson<Property[]>(PUBLISHED_PROPERTIES_KEY, []);
    writeLocalJson(PUBLISHED_PROPERTIES_KEY, existingLocal.filter((p) => String(p.id) !== String(propertyId)));
    try {
        await supabase.from('properties').delete().eq('id', propertyId);
    } catch {
        // Ignore if table/record is demo-only
    }
};

export const publishCarRental = async (
    payload: {
        listing_mode?: 'hire' | 'sale';
        business_name: string;
        trading_name?: string | null;
        registration_number?: string | null;
        vat_number?: string | null;
        business_type: string;
        contact_person: string;
        mobile_number: string;
        whatsapp_number: string;
        email_address: string;
        website?: string | null;
        country: string;
        province: string;
        city: string;
        pickup_address: string;
        vehicle_title: string;
        vehicle_category: string;
        vehicle_make_model: string;
        vehicle_year: number;
        transmission: string;
        fuel_type?: string | null;
        mileage_km?: number | null;
        vehicle_condition?: string | null;
        financing_available?: boolean;
        daily_rate: number;
        currency: string;
        description: string;
        image_url?: string;
        images?: string[];
    },
    currentUser: User
): Promise<Property> => {
    const isForSale = payload.listing_mode === 'sale';
    const id = `car_${Date.now().toString(36)}`;
    const sig = generateListingSignature(id, currentUser.username, payload.daily_rate);
    const catLower = (payload.vehicle_category || '').toLowerCase();
    const vehicleType: Property['vehicleType'] =
        catLower.includes('luxury') ? 'Luxury' : catLower.includes('van') ? 'Van' : catLower.includes('suv') || catLower.includes('pickup') ? 'SUV' : 'Sedan';
    const defaultImg = vehicleType === 'Sedan' ? '/images/executive_sedan_fleet.jpg' : '/images/luxury_suv_fleet.jpg';

    const cleanGallery = (payload.images && payload.images.length > 0
        ? payload.images.map((u) => sanitizeSafeUrl(u, '')).filter(Boolean)
        : []);
    const imgUrl = cleanGallery[0] || sanitizeSafeUrl(payload.image_url, defaultImg);
    const resolvedImages = cleanGallery.length > 0 ? cleanGallery : [imgUrl];

    try {
        const { error } = await supabase.from('car_rentals').insert([{
            owner_id: currentUser.id || null,
            user_id: currentUser.username || currentUser.id,
            business_name: payload.business_name,
            trading_name: payload.trading_name || null,
            registration_number: payload.registration_number || null,
            vat_number: payload.vat_number || null,
            business_type: payload.business_type,
            contact_person: payload.contact_person,
            mobile_number: payload.mobile_number,
            whatsapp_number: payload.whatsapp_number,
            email_address: payload.email_address,
            website: payload.website || null,
            country: payload.country,
            province: payload.province,
            city: payload.city,
            pickup_address: payload.pickup_address,
            vehicle_title: payload.vehicle_title,
            vehicle_category: payload.vehicle_category,
            vehicle_make_model: payload.vehicle_make_model,
            vehicle_year: payload.vehicle_year,
            transmission: payload.transmission,
            daily_rate: payload.daily_rate,
            currency: payload.currency,
            description: payload.description,
            images: resolvedImages,
            status: 'active',
        }]);
        if (error) {
            handleError(error, 'persisting vehicle listing');
        }
    } catch (e) {
        handleError(e, 'persisting vehicle listing');
    }

    const newProperty: Property = {
        id,
        title: sanitizeText(payload.vehicle_title || payload.vehicle_make_model, 120),
        listingType: isForSale ? ListingType.SALE : ListingType.RENT,
        propertyType: PropertyType.TRANSPORT,
        address: {
            street: sanitizeText(payload.pickup_address, 140),
            city: sanitizeText(payload.city, 80),
            zip: '0001',
        },
        country: sanitizeText(payload.country, 80),
        coordinates: { lat: -26.2041, lng: 28.0473 },
        price: isForSale ? Math.max(5000, Number(payload.daily_rate) || 450000) : Math.max(100, Number(payload.daily_rate) || 950),
        perNightPrice: !isForSale,
        localCurrency: sanitizeText(payload.currency, 8) || 'ZAR',
        vehicleType,
        details: { beds: 0, baths: 0, area: 0 },
        description: sanitizeText(payload.description, 1500),
        neighborhoodInfo: isForSale
            ? `${sanitizeText(payload.business_name, 80)} (${sanitizeText(payload.business_type, 60)}) · Viewing at ${sanitizeText(payload.pickup_address, 120)}, ${sanitizeText(payload.city, 60)}`
            : `${sanitizeText(payload.business_name, 80)} (${sanitizeText(payload.business_type, 60)}) · Pickup at ${sanitizeText(payload.pickup_address, 120)}, ${sanitizeText(payload.city, 60)}`,
        amenities: [
            isForSale ? 'For Sale' : 'For Hire',
            payload.transmission === 'auto' ? 'Automatic Transmission' : 'Manual Transmission',
            `${payload.vehicle_year || 2025} Model`,
            sanitizeText(payload.vehicle_make_model, 60),
            payload.fuel_type ? sanitizeText(payload.fuel_type, 30) : '',
            isForSale && payload.mileage_km != null && Number.isFinite(payload.mileage_km)
                ? `${Number(payload.mileage_km).toLocaleString()} km`
                : '',
            isForSale && payload.vehicle_condition ? sanitizeText(payload.vehicle_condition, 40) : '',
            isForSale && payload.financing_available ? 'Finance & Trade-In Eligible' : '',
            !isForSale ? 'Unlimited Mileage Option' : '',
            sanitizeText(payload.business_type, 50),
        ].filter(Boolean),
        images: resolvedImages,
        agent: {
            name: sanitizeText(payload.business_name || payload.contact_person || currentUser.username, 80),
            phone: sanitizeText(payload.mobile_number || currentUser.phone || '+27 11 000 0000', 30),
            verified: true,
            rating: 4.9,
            reviewCount: 1,
        },
        featured: false,
        verified: true,
        views: 1,
        status: PropertyStatus.ACTIVE,
        dateListed: Date.now(),
        saves: 0,
        verificationDetails: {
            verifiedDate: new Date().toISOString().split('T')[0],
            titleDeedNumber: sig,
            inspectionDate: new Date().toISOString().split('T')[0],
            registryStatus: isForSale
                ? `Ownership & Roadworthy Verified · ${sanitizeText(payload.email_address, 80)}`
                : `Fleet License Verified · ${sanitizeText(payload.email_address, 80)}`,
            surveyVerified: true,
        },
    };

    return upsertPublishedProperty(newProperty);
};

export const publishWellnessService = async (
    payload: {
        business_name: string;
        trading_name?: string | null;
        registration_number?: string | null;
        wellness_category: string;
        contact_person: string;
        mobile_number: string;
        whatsapp_number: string;
        email_address: string;
        website?: string | null;
        country: string;
        province?: string | null;
        city: string;
        physical_address?: string | null;
        description: string;
        session_price?: number;
        image_url?: string;
        images?: string[];
    },
    currentUser: User
): Promise<Property> => {
    const id = `well_${Date.now().toString(36)}`;
    const sig = generateListingSignature(id, currentUser.username, payload.session_price || 650);

    const cleanGallery = (payload.images && payload.images.length > 0
        ? payload.images.map((u) => sanitizeSafeUrl(u, '')).filter(Boolean)
        : []);
    const imgUrl = cleanGallery[0] || sanitizeSafeUrl(payload.image_url, '/images/getlstd-property-photo.jpg');
    const resolvedImages = cleanGallery.length > 0 ? cleanGallery : [imgUrl];

    try {
        await supabase.from('wellness_services').insert([{
            owner_id: currentUser.id || null,
            user_id: currentUser.username || currentUser.id,
            ...payload,
            images: resolvedImages,
            status: 'active',
        }]);
    } catch {
        // Proceed with unified synced store
    }

    const categoryMap: Record<string, string> = {
        spa: 'Beauty & Spa · Wellness Retreats',
        massage: 'Alternative Healing · Massage Therapy',
        beauty: 'Beauty & Spa · Skin Atelier',
        fitness: 'Physical Wellness · Personal Training',
        yoga: 'Mental Wellness · Yoga & Breathwork',
        other: 'Wellness Retreats · Holistic Care',
    };
    const categoryLabel = categoryMap[payload.wellness_category] || sanitizeText(payload.wellness_category, 60) || 'Wellness Sanctuary';

    const newProperty: Property = {
        id,
        title: sanitizeText(payload.business_name, 120),
        listingType: ListingType.RENT,
        propertyType: PropertyType.WELLNESS,
        address: {
            street: sanitizeText(payload.physical_address || payload.province || payload.city, 140),
            city: sanitizeText(payload.city, 80),
            zip: '0001',
        },
        country: sanitizeText(payload.country, 80),
        coordinates: { lat: -33.9249, lng: 18.4241 },
        price: Math.max(150, Number(payload.session_price) || 650),
        perNightPrice: false,
        details: { beds: 0, baths: 0, area: 0 },
        description: sanitizeText(payload.description, 1500),
        neighborhoodInfo: `${sanitizeText(payload.description, 260)}${payload.website ? ` | Web: ${sanitizeText(payload.website, 100)}` : ''}`,
        amenities: [categoryLabel, 'Verified Practitioner', sanitizeText(payload.city, 40)],
        packageIncludes: [sanitizeText(payload.contact_person, 60), sanitizeText(payload.email_address, 80), sanitizeText(payload.whatsapp_number, 30)],
        images: resolvedImages,
        agent: {
            name: sanitizeText(payload.contact_person || payload.business_name || currentUser.username, 80),
            phone: sanitizeText(payload.mobile_number || payload.whatsapp_number || '+27 21 000 0000', 30),
            verified: true,
            rating: 4.9,
            reviewCount: 1,
        },
        featured: false,
        verified: true,
        views: 1,
        status: PropertyStatus.ACTIVE,
        dateListed: Date.now(),
        saves: 0,
        verificationDetails: {
            verifiedDate: new Date().toISOString().split('T')[0],
            titleDeedNumber: sig,
            inspectionDate: new Date().toISOString().split('T')[0],
            registryStatus: `Accredited Wellness Provider · ${sanitizeText(payload.website || payload.email_address, 90)}`,
            surveyVerified: true,
        },
    };

    return upsertPublishedProperty(newProperty);
};

export const publishAccommodationService = async (
    payload: {
        business_name: string;
        accommodation_type: string;
        country: string;
        city: string;
        address?: string | null;
        nightly_rate: number;
        currency: string;
        max_guests: number;
        description: string;
        image_url?: string;
    },
    currentUser: User
): Promise<Property> => {
    const id = `stay_${Date.now().toString(36)}`;
    const sig = generateListingSignature(id, currentUser.username, payload.nightly_rate);
    const isLongTermApartment = payload.accommodation_type === 'apartment';
    const propType = payload.accommodation_type === 'hotel' ? PropertyType.HOTEL : PropertyType.SHORT_TERM_RENTAL;
    const imgUrl = sanitizeSafeUrl(payload.image_url, '/images/photo-1600596542815-ffad4c1539a9.avif');

    try {
        await supabase.from('accommodation_services').insert({
            owner_id: currentUser.id,
            ...payload,
            images: [imgUrl],
            status: 'active',
        });
    } catch {
        // Proceed with unified store
    }

    const cleanCity = sanitizeText(payload.city, 80);
    const cleanCountry = sanitizeText(payload.country, 80);
    const rawSuburb = sanitizeText(payload.address || '', 80);
    const stayProfile: StayPropertyProfile = {
        ...FLAGSHIP_AFRICAN_GRAND_HOTEL,
        id,
        name: sanitizeText(payload.business_name, 120),
        subtitle: sanitizeText(payload.accommodation_type, 50),
        country: cleanCountry,
        province: resolveProvinceForCity(cleanCity, cleanCountry),
        city: cleanCity,
        suburb: rawSuburb && rawSuburb.toLowerCase() !== cleanCity.toLowerCase() ? rawSuburb : 'Central District',
        category: payload.accommodation_type === 'hotel' ? 'Hotels' : isLongTermApartment ? 'Serviced Apartments' : 'Resorts',
        propertyType: payload.accommodation_type === 'hotel' ? 'Hotel' : isLongTermApartment ? 'Serviced Apartment' : 'Villa',
        starRating: 5,
        score: 9.2,
        scoreLabel: 'Superb',
        reviewCount: 1,
        nightlyFromZar: Math.max(350, Number(payload.nightly_rate) || 1850),
        monthlyFromZar: Math.max(8500, Math.round((Number(payload.nightly_rate) || 1850) * 19)),
        locationLabel: `${sanitizeText(payload.city, 60)}, ${sanitizeText(payload.country, 60)}`,
        overviewShort: sanitizeText(payload.description, 300),
        heroImages: [
            {
                url: imgUrl,
                category: 'Exterior',
                caption: sanitizeText(payload.business_name, 100),
                specs: `Up to ${payload.max_guests || 2} Guests · Verified Stay`,
                aiTags: ['Verified', 'Direct Publish'],
            },
            ...FLAGSHIP_AFRICAN_GRAND_HOTEL.heroImages.slice(1),
        ],
        specs: {
            ...FLAGSHIP_AFRICAN_GRAND_HOTEL.specs,
            rooms: Math.max(1, payload.max_guests || 4),
        },
        investmentEligible: false,
    };

    const existingStays = readLocalJson<StayPropertyProfile[]>(PUBLISHED_STAYS_KEY, []);
    writeLocalJson(PUBLISHED_STAYS_KEY, [stayProfile, ...existingStays.filter((s) => s.id !== stayProfile.id)]);

    const propRecord: Property = {
        id,
        title: stayProfile.name,
        listingType: ListingType.RENT,
        propertyType: propType,
        address: {
            street: sanitizeText(payload.address || payload.city, 140),
            city: stayProfile.city,
            zip: '0001',
        },
        country: stayProfile.country,
        coordinates: { lat: -33.9249, lng: 18.4241 },
        price: stayProfile.nightlyFromZar,
        perNightPrice: true,
        localCurrency: sanitizeText(payload.currency, 8) || 'ZAR',
        guests: payload.max_guests || 2,
        leaseDuration: isLongTermApartment ? 'Medium term' : 'Short term / Stay',
        details: { beds: Math.max(1, Math.ceil((payload.max_guests || 2) / 2)), baths: 1, area: 850 },
        description: sanitizeText(payload.description, 1500),
        neighborhoodInfo: stayProfile.locationLabel,
        amenities: ['Solar Backup', 'High-Speed Fibre', 'Verified Hospitality Host'],
        images: [imgUrl],
        agent: {
            name: sanitizeText(currentUser.fullName || currentUser.username, 80),
            phone: sanitizeText(currentUser.phone || '+27 21 555 0100', 30),
            verified: true,
            rating: 4.9,
            reviewCount: 1,
        },
        featured: false,
        verified: true,
        views: 1,
        status: PropertyStatus.ACTIVE,
        dateListed: Date.now(),
        saves: 0,
        verificationDetails: {
            verifiedDate: new Date().toISOString().split('T')[0],
            titleDeedNumber: sig,
            inspectionDate: new Date().toISOString().split('T')[0],
            registryStatus: 'Hospitality & Identity Verified',
            surveyVerified: true,
        },
    };

    return upsertPublishedProperty(propRecord);
};

export const getPublishedStayProfiles = (): StayPropertyProfile[] => {
    return readLocalJson<StayPropertyProfile[]>(PUBLISHED_STAYS_KEY, []);
};

export const publishHotelListing = async (
    stayProfile: StayPropertyProfile,
    propertyRecord: Property
): Promise<Property> => {
    const existingStays = readLocalJson<StayPropertyProfile[]>(PUBLISHED_STAYS_KEY, []);
    writeLocalJson(PUBLISHED_STAYS_KEY, [stayProfile, ...existingStays.filter((s) => s.id !== stayProfile.id)]);
    return upsertPublishedProperty(propertyRecord);
};

export const saveProperties = async (properties: Property[]): Promise<void> => {
    try {
        const { data: authData } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
        const authUserId = authData?.user?.id || null;

        const dbProperties = properties.map(p => ({
            id: p.id,
            owner_id: authUserId,
            title: p.title,
            listing_type: p.listingType,
            property_type: p.propertyType,
            address: p.address,
            coordinates: p.coordinates,
            price: p.price,
            details: p.details,
            description: p.description,
            neighborhood_info: p.neighborhoodInfo || null,
            amenities: p.amenities || [],
            images: p.images || [],
            virtual_tour_url: p.virtualTourUrl || null,
            vr_tour_url: p.vrTourUrl || null,
            agent_name: p.agent?.name || 'afriestate',
            agent: p.agent || {},
            featured: p.featured || false,
            verified: p.verified || false,
            smart_contract_ready: p.smartContractReady || false,
            views: p.views || 0,
            status: p.status,
            date_listed: p.dateListed,
            saves: Math.max(0, p.saves || 0),
            purchase_price: p.purchasePrice || null,
            price_history: p.priceHistory || [],
            occupancy_rate: p.occupancyRate || null,
            market_roi: p.marketROI || null,
            financials: p.financials || [],
            guests: p.guests || null,
            vehicle_type: p.vehicleType || null,
            package_includes: p.packageIncludes || [],
            per_night_price: p.perNightPrice || false,
            country: p.country || null,
            region: p.region || null,
            has_solar: p.hasSolar || false,
            has_generator: p.hasGenerator || false,
            has_borehole: p.hasBorehole || false,
            has_water_tank: p.hasWaterTank || false,
            has_fibre: p.hasFibre || false,
            security_features: p.securityFeatures || [],
            proximity: p.proximity || [],
            lease_duration: p.leaseDuration || null,
            target_return: p.targetReturn || null,
            rental_yield: p.rentalYield || null,
            projected_roi: p.projectedROI || null,
            min_investment: p.minInvestment || null,
            investment_type: p.investmentType || null,
            risk_level: p.riskLevel || null,
            local_currency: p.localCurrency || null,
            foreign_buyer_eligible: p.foreignBuyerEligible ?? null,
            verification_details: p.verificationDetails || null,
        }));

        const { error } = await supabase.from('properties').upsert(dbProperties);
        if (error) throw error;
    } catch (error) {
        handleError(error, 'upserting properties');
    }
};

export const incrementPropertyView = async (propertyId: string): Promise<void> => {
    try {
        const { error } = await supabase.rpc('increment_views', { prop_id: propertyId });
        if (error) {
             const { data } = await supabase.from('properties').select('views').eq('id', propertyId).single();
             if (data) {
                 await supabase.from('properties').update({ views: (data.views || 0) + 1 }).eq('id', propertyId);
             }
        }
    } catch {
        // Ignore
    }
};

// --- User Management (Supabase Auth backed — never store or query plaintext passwords) ---
export const getUsers = async (): Promise<User[]> => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, username, full_name, email, role, phone, office_address, company_name, agency_name, profile_picture, country, is_verified, kyc_status, status, is_wallet_frozen');
        if (error) return [];
        return (data || []).map((u: any) => ({
            id: u.id,
            username: u.username,
            fullName: u.full_name,
            email: u.email,
            role: u.role === 'agent' || u.role === 'investor' ? u.role : 'user',
            phone: u.phone,
            officeAddress: u.office_address,
            companyName: u.company_name,
            agencyName: u.agency_name,
            profilePicture: u.profile_picture,
            country: u.country,
            isVerified: Boolean(u.is_verified),
            kycStatus: u.kyc_status,
            status: u.status,
            isWalletFrozen: Boolean(u.is_wallet_frozen),
        }));
    } catch {
        return [];
    }
};

export const addUser = async (user: User): Promise<{ success: boolean, message: string }> => {
    try {
        const { error } = await supabase.from('profiles').insert({
            id: user.id || undefined,
            username: user.username,
            full_name: sanitizeText(user.fullName, 120),
            email: user.email.trim().toLowerCase(),
            role: user.role || 'user',
            is_verified: user.role === 'user',
            phone: user.phone || null,
            office_address: user.officeAddress || null,
            company_name: user.companyName || null,
        });
        if (error) {
             if (error.message.includes('Failed to fetch')) return { success: true, message: "Profile queued (Offline Mode)" };
             return { success: false, message: error.message };
        }
        return { success: true, message: "Profile created successfully." };
    } catch {
        return { success: true, message: "Profile queued (Offline Mode)" };
    }
};

export const authenticateUser = async (email: string, password: string): Promise<{ user: User | null; error?: string }> => {
    try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password,
        });

        if (authError || !authData.user) {
            return { user: null, error: authError?.message || 'Invalid email or password.' };
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('id, username, full_name, email, role, phone, office_address, company_name, agency_name, profile_picture, is_verified, kyc_status, status, is_wallet_frozen')
            .eq('id', authData.user.id)
            .maybeSingle();

        const resolvedRole = profile?.role || authData.user.app_metadata?.role || 'user';
        const user: User = {
            id: authData.user.id,
            username: profile?.username || authData.user.email || authData.user.id,
            fullName: profile?.full_name || authData.user.user_metadata?.full_name || 'AfriEstate Member',
            email: profile?.email || authData.user.email || email,
            role: resolvedRole === 'agent' || resolvedRole === 'investor' ? resolvedRole : 'user',
            isVerified: Boolean(profile?.is_verified),
            kycStatus: profile?.kyc_status,
            status: profile?.status || 'Active',
            isWalletFrozen: Boolean(profile?.is_wallet_frozen),
            phone: profile?.phone,
            officeAddress: profile?.office_address,
            companyName: profile?.company_name,
            agencyName: profile?.agency_name,
            profilePicture: profile?.profile_picture,
        };

        if ((user.role === 'agent' || user.role === 'investor') && !user.isVerified) {
            return { user: null, error: `pending_verification_${user.role}` };
        }

        return { user };
    } catch {
        return { user: null, error: 'Authentication service unreachable.' };
    }
};

// --- Saved Properties Management (Per User) ---
export const getSavedPropertiesForUser = async (username: string): Promise<Set<string>> => {
    try {
        const { data, error } = await supabase
            .from('saved_properties')
            .select('property_id')
            .eq('username', username);
        
        if (error) {
             handleError(error, 'fetching saved properties');
             return new Set();
        }
        return new Set(data.map(item => item.property_id));
    } catch (e) { return new Set(); }
};

export const savePropertiesForUser = async (username: string, propertyIds: string[]): Promise<void> => {
    try {
        await supabase.from('saved_properties').delete().eq('username', username);
        if (propertyIds.length > 0) {
            await supabase.from('saved_properties').insert(propertyIds.map(id => ({ username, property_id: id })));
        }
    } catch (e) { handleError(e, 'saving properties'); }
};

// --- Saved Searches Management ---
export const getSavedSearchesForUser = async (username: string): Promise<SearchFilters[]> => {
    try {
        const { data, error } = await supabase
            .from('saved_searches')
            .select('filters')
            .eq('username', username);
        
        if (error || !Array.isArray(data)) return [];
        return data.map(item => safeJsonParse(item.filters, {} as SearchFilters));
    } catch (e) { return []; }
};

export const saveSearchesForUser = async (username: string, searches: SearchFilters[]): Promise<void> => {
    try {
        await supabase.from('saved_searches').delete().eq('username', username);
        if (searches.length > 0) {
            await supabase.from('saved_searches').insert(searches.map(s => ({ username, filters: s })));
        }
    } catch (e) { handleError(e, 'saving searches'); }
};

// --- Tour Request Management ---
export const getTourRequests = async (username: string): Promise<TourRequest[]> => {
    try {
        const { data, error } = await supabase
            .from('tour_requests')
            .select('*')
            .eq('username', username);
        
        if (error) return [];
        return data.map(r => ({
            ...r,
            propertyId: r.property_id || r.propertyId,
            propertyTitle: r.property_title || r.propertyTitle
        })) || [];
    } catch (e) { return []; }
};

export const getInquiriesForSeller = async (username: string): Promise<TourRequest[]> => {
    const properties = await getProperties();
    const sellerPropertyIds = properties.filter(p => p.agent.name === username).map(p => p.id);
    if (sellerPropertyIds.length === 0) return [];

    try {
        const { data, error } = await supabase
            .from('tour_requests')
            .select('*')
            .in('property_id', sellerPropertyIds);
        
        if (error) return [];
        return data.map(r => ({
             ...r,
             propertyId: r.property_id || r.propertyId,
             propertyTitle: r.property_title || r.propertyTitle
        })) || [];
    } catch (e) { return []; }
};

export const addTourRequest = async (username: string, propertyId: string, propertyTitle: string, date: string, time: string): Promise<TourRequest> => {
    const newRequest: any = {
        property_id: propertyId,
        property_title: propertyTitle,
        username,
        date,
        time,
        status: 'Pending',
        timestamp: Date.now(),
    };
    
    try {
        const { data, error } = await supabase.from('tour_requests').insert(newRequest).select().single();
        if (error) throw error;
        return {
            ...data,
            propertyId: data.property_id,
            propertyTitle: data.property_title
        };
    } catch (error) {
        handleError(error, 'adding tour request');
        return { ...newRequest, propertyId, propertyTitle, id: `tr_${Date.now()}` }; // Optimistic return
    }
};

// --- Messages ---
export const getMessagesForUser = async (username: string): Promise<Message[]> => {
    try {
        const cleanUser = sanitizeText(username, 120).replace(/["\\,()]/g, '');
        if (!cleanUser) return [];
        const quoted = `"${cleanUser}"`;
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .or(`sender_username.eq.${quoted},receiver_username.eq.${quoted}`)
            .order('timestamp', { ascending: true });
        
        if (error || !data) return [];
        return data.map(m => ({
            ...m,
            propertyId: m.property_id || m.propertyId,
            propertyTitle: m.property_title || m.propertyTitle,
            senderUsername: m.sender_username || m.senderUsername,
            receiverUsername: m.receiver_username || m.receiverUsername
        })) || [];
    } catch (e) { return []; }
};

export const sendMessage = async (msgData: Omit<Message, 'id' | 'timestamp'>): Promise<Message> => {
    const newMessage: any = {
        property_id: msgData.propertyId,
        property_title: msgData.propertyTitle,
        sender_username: msgData.senderUsername,
        receiver_username: msgData.receiverUsername,
        text: msgData.text,
        timestamp: Date.now(),
    };
    try {
        const { data, error } = await supabase.from('messages').insert(newMessage).select().single();
        if(error) throw error;
        return {
            ...data,
            propertyId: data.property_id,
            propertyTitle: data.property_title,
            senderUsername: data.sender_username,
            receiverUsername: data.receiver_username
        };
    } catch (error) {
        handleError(error, 'sending message');
        return { ...msgData, timestamp: Date.now(), id: `msg_${Date.now()}` };
    }
};

// --- Calendar ---
export const getEvents = async (username: string): Promise<CalendarEvent[]> => {
    try {
        const { data, error } = await supabase.from('calendar_events').select('*').eq('username', username);
        if (error) return [];
        return data.map(e => ({
            ...e,
            startTime: e.start_time || e.startTime,
            endTime: e.end_time || e.endTime
        })) || [];
    } catch (e) { return []; }
};

export const addEvent = async (username: string, eventData: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> => {
    const payload = {
        username,
        title: eventData.title,
        date: eventData.date,
        start_time: eventData.startTime,
        end_time: eventData.endTime,
        description: eventData.description || null
    };
    try {
        const { data, error } = await supabase.from('calendar_events').insert(payload).select().single();
        if (error) throw error;
        return {
             ...data,
             startTime: data.start_time,
             endTime: data.end_time
        };
    } catch (e) {
        return { ...eventData, id: `evt_${Date.now()}` } as CalendarEvent;
    }
};

export const updateEvent = async (username: string, event: CalendarEvent): Promise<CalendarEvent> => {
    const payload = {
        username,
        title: event.title,
        date: event.date,
        start_time: event.startTime,
        end_time: event.endTime,
        description: event.description || null
    };
    try {
        const { data, error } = await supabase.from('calendar_events').update(payload).eq('id', event.id).select().single();
        if (error) throw error;
        return {
             ...data,
             startTime: data.start_time,
             endTime: data.end_time
        };
    } catch (e) { return event; }
};

export const deleteEvent = async (username: string, eventId: string): Promise<void> => {
    try {
        await supabase.from('calendar_events').delete().eq('id', eventId);
    } catch (e) {}
};

// --- Notifications ---
export const getNotifications = async (user: User): Promise<Notification[]> => {
    const localAlerts = getLocalAlertNotifications();
    try {
        const { data, error } = await supabase.from('notifications').select('*').eq('username', user.username);
        if (error || !Array.isArray(data)) {
             return localAlerts;
        }
        const remote = data.map(n => ({
            ...n,
            isRead: n.is_read,
            propertyId: n.property_id
        }));
        const seen = new Set(remote.map(n => n.id));
        return [...localAlerts.filter(n => !seen.has(n.id)), ...remote];
    } catch (e) {
        return localAlerts;
    }
};

export const markNotificationsAsRead = async (username: string, ids: string[]): Promise<Set<string>> => {
    const localRead = markLocalAlertNotificationsRead(ids);
    try {
        await supabase.from('notifications').update({ is_read: true }).in('id', ids);
        const { data } = await supabase.from('notifications').select('id').eq('username', username).eq('is_read', true);
        const combined = new Set<string>(localRead);
        (data || []).forEach(n => combined.add(n.id));
        return combined;
    } catch (e) {
        return localRead;
    }
};

export const getReadNotificationIds = async (username: string): Promise<Set<string>> => {
    const localRead = getLocalReadAlertNotificationIds();
    try {
        const { data } = await supabase.from('notifications').select('id').eq('username', username).eq('is_read', true);
        const combined = new Set<string>(localRead);
        (data || []).forEach(n => combined.add(n.id));
        return combined;
    } catch (e) {
        return localRead;
    }
};

// --- Leads ---
export const getLeadsForAgent = async (agentUsername: string): Promise<Lead[]> => {
    return []; // Future implementation
};

// --- Investor Settings ---
export const getInvestorSettings = async (username: string): Promise<InvestorSettings> => {
    try {
        const { data } = await supabase.from('investor_settings').select('settings').eq('username', username).single();
        return data?.settings || null;
    } catch (e) { return null as any; }
};

export const saveInvestorSettings = async (username: string, settings: InvestorSettings): Promise<void> => {
    try {
        await supabase.from('investor_settings').upsert({ username, settings });
    } catch (e) {}
};

// --- Investment Requests ---
export const getInvestmentRequests = async (): Promise<InvestmentRequest[]> => {
    try {
        const { data } = await supabase.from('investment_requests').select('*').order('timestamp', { ascending: false });
        return data.map(r => ({
            ...r,
            investorUsername: r.investor_username,
            requestDetails: r.request_details
        })) || [];
    } catch (e) { return []; }
};

export const addInvestmentRequest = async (username: string, requestDetails: string): Promise<InvestmentRequest> => {
    const optimistic = {
        investor_username: username,
        request_details: requestDetails,
        timestamp: Date.now(),
        status: 'Open'
    };
    try {
        const { data } = await supabase.from('investment_requests').insert(optimistic).select().single();
        return {
            ...data,
            investorUsername: data.investor_username,
            requestDetails: data.request_details
        };
    } catch(e) { return { ...optimistic, id: `ir_${Date.now()}` } as any; }
};

export const getInvestorReturns = () => {
    return [
        { id: 'div1', propertyId: '12', propertyTitle: 'Luxury Hotel Development', date: '2023-10-01', amount: 12500, type: 'Dividend' },
        { id: 'div2', propertyId: '13', propertyTitle: 'Downtown Office Block', date: '2023-10-01', amount: 8200, type: 'Dividend' },
    ];
};

export const getInvestorDocuments = () => {
    return [
        { id: 'doc1', name: 'Contract - Hotel Development.pdf', type: 'Contract', date: '2022-01-15', url: '#' },
        { id: 'doc2', name: 'Q3 2023 Portfolio Statement.pdf', type: 'Statement', date: '2023-10-05', url: '#' },
    ];
};

export const getUserDocuments = async (username: string): Promise<UserDocument[]> => {
    try {
        const { data } = await supabase.from('user_documents').select('*').eq('username', username);
        return data.map(d => ({
            ...d,
            uploadDate: d.upload_date
        })) || [];
    } catch (e) { return []; }
};

export const addUserDocument = async (username: string, file: File): Promise<UserDocument> => {
    const safeName = sanitizeText(file.name, 100).replace(/[^a-zA-Z0-9._-]/g, '_') || 'document';
    let docUrl = '#';
    try {
        const { data: authData } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
        const folder = authData?.user?.id || username.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `${folder}/${Date.now()}_${safeName}`;
        const { error: uploadErr } = await supabase.storage.from('user-documents').upload(path, file, { upsert: true });
        if (!uploadErr) {
            docUrl = path;
        }
    } catch {
        // Fallback if storage bucket unavailable offline
    }

    const newDoc = {
        name: sanitizeText(file.name, 140),
        type: file.type.includes('pdf') ? 'pdf' : file.type.startsWith('image/') ? 'image' : 'doc',
        upload_date: Date.now(),
        url: docUrl,
        username,
    };
    try {
        const { data, error } = await supabase.from('user_documents').insert(newDoc).select().single();
        if (error) throw error;
        return { ...data, uploadDate: Number(data.upload_date) || Date.now() };
    } catch (error) {
        handleError(error, 'adding document');
        return { ...newDoc, id: `doc_${Date.now()}`, uploadDate: newDoc.upload_date } as any;
    }
};

export const deleteUserDocument = async (username: string, docId: string): Promise<void> => {
    try {
        await supabase.from('user_documents').delete().eq('id', docId);
    } catch {}
};

export const getPropertyAlerts = async (username: string): Promise<PropertyAlert[]> => {
    try {
        const { data } = await supabase.from('property_alerts').select('*').eq('username', username);
        return (data || []).map(a => ({
            ...a,
            criteria: safeJsonParse(a.criteria, {})
        }));
    } catch { return []; }
};

export const addPropertyAlert = async (username: string, alertData: Omit<PropertyAlert, 'id'>): Promise<PropertyAlert> => {
    const optimistic = { ...alertData, username };
    try {
        const { data } = await supabase.from('property_alerts').insert(optimistic).select().single();
        return {
             ...data,
             criteria: safeJsonParse(data?.criteria, alertData.criteria)
        };
    } catch { return { ...optimistic, id: `alert_${Date.now()}` } as any; }
};

export const deletePropertyAlert = async (username: string, alertId: string): Promise<void> => {
    try {
        await supabase.from('property_alerts').delete().eq('id', alertId);
    } catch {}
};

// --- Stay Bookings & Hotel Partner Onboarding Persistence ---
export interface StayBookingInput {
    propertyId: string;
    propertyName: string;
    roomId: string;
    roomName: string;
    ratePlanName: string;
    termMode: 'short-term' | 'long-term';
    checkIn: string;
    checkOut: string;
    guestsLabel: string;
    nights: number;
    months: number;
    guestName: string;
    guestEmail: string;
    payOption: 'now' | 'property';
    baseSubtotal: number;
    taxes: number;
    serviceFee: number;
    grandTotal: number;
    payToday: number;
    payAtProperty: number;
    bookingRef?: string;
}

export interface StayBookingRecord extends StayBookingInput {
    id: string;
    bookingRef: string;
    status: 'Confirmed' | 'Pending' | 'Cancelled';
    createdAt: number;
}

export const createStayBooking = async (input: StayBookingInput): Promise<StayBookingRecord> => {
    const bookingRef = input.bookingRef || generateSecureBookingRef('AFR-STAY');
    const localRecord: StayBookingRecord = {
        ...input,
        id: `bk_${Date.now().toString(36)}`,
        bookingRef,
        guestName: sanitizeText(input.guestName, 120),
        guestEmail: sanitizeText(input.guestEmail, 140),
        status: 'Confirmed',
        createdAt: Date.now(),
    };

    const existing = readLocalJson<StayBookingRecord[]>(STAY_BOOKINGS_KEY, []);
    writeLocalJson(STAY_BOOKINGS_KEY, [localRecord, ...existing]);

    try {
        const { data: authData } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
        await supabase.from('stay_bookings').insert({
            booking_ref: bookingRef,
            property_id: input.propertyId,
            property_name: sanitizeText(input.propertyName, 140),
            room_id: input.roomId,
            room_name: sanitizeText(input.roomName, 140),
            rate_plan_name: sanitizeText(input.ratePlanName, 100),
            term_mode: input.termMode,
            check_in: input.checkIn,
            check_out: input.checkOut,
            guests_label: sanitizeText(input.guestsLabel, 80),
            nights: input.nights,
            months: input.months,
            guest_user_id: authData?.user?.id || null,
            guest_name: localRecord.guestName,
            guest_email: localRecord.guestEmail,
            pay_option: input.payOption,
            base_subtotal_zar: input.baseSubtotal,
            taxes_zar: input.taxes,
            service_fee_zar: input.serviceFee,
            grand_total_zar: input.grandTotal,
            pay_today_zar: input.payToday,
            pay_at_property_zar: input.payAtProperty,
            status: 'Confirmed',
        });
    } catch {
        // Offline-resilient local store remains synchronized
    }

    return localRecord;
};

export const getStayBookingsForUser = async (email?: string): Promise<StayBookingRecord[]> => {
    const local = readLocalJson<StayBookingRecord[]>(STAY_BOOKINGS_KEY, []);
    try {
        let query = supabase.from('stay_bookings').select('*').order('created_at', { ascending: false });
        if (email) query = query.eq('guest_email', email.trim().toLowerCase());
        const { data, error } = await query;
        if (error || !data) return local;
        return data.map((row: any) => ({
            id: row.id,
            bookingRef: row.booking_ref,
            propertyId: row.property_id,
            propertyName: row.property_name,
            roomId: row.room_id,
            roomName: row.room_name,
            ratePlanName: row.rate_plan_name,
            termMode: row.term_mode,
            checkIn: row.check_in,
            checkOut: row.check_out,
            guestsLabel: row.guests_label,
            nights: row.nights,
            months: row.months,
            guestName: row.guest_name,
            guestEmail: row.guest_email,
            payOption: row.pay_option,
            baseSubtotal: Number(row.base_subtotal_zar),
            taxes: Number(row.taxes_zar),
            serviceFee: Number(row.service_fee_zar),
            grandTotal: Number(row.grand_total_zar),
            payToday: Number(row.pay_today_zar),
            payAtProperty: Number(row.pay_at_property_zar),
            status: row.status,
            createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
        }));
    } catch {
        return local;
    }
};

export interface HotelRegistrationPayload {
    id: string;
    hotelName: string;
    hotelType: string;
    starRating: number;
    companyName: string;
    tradingName: string;
    businessEmail: string;
    phone: string;
    country: string;
    province: string;
    city: string;
    district: string;
    street: string;
    postal: string;
    baseCurrency: string;
    checkInTime: string;
    checkOutTime: string;
    cancellationPolicy: string;
    galleryImages: string[];
    amenities: string[];
    rooms: Array<{
        id: string;
        name: string;
        category: string;
        bedConfig: string;
        maxAdults: number;
        maxChildren: number;
        sizeSqm: number;
        viewType: string;
        availableCount: number;
        baseRate: number;
        amenities: string[];
    }>;
    integritySignature: string;
    status: string;
}

export const saveHotelRegistration = async (payload: HotelRegistrationPayload): Promise<void> => {
    const existing = readLocalJson<HotelRegistrationPayload[]>(HOTEL_REGISTRATIONS_KEY, []);
    writeLocalJson(HOTEL_REGISTRATIONS_KEY, [payload, ...existing.filter((h) => h.id !== payload.id)]);

    try {
        const { data: authData } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
        await supabase.from('hotel_registrations').upsert({
            id: payload.id,
            owner_id: authData?.user?.id || null,
            hotel_name: payload.hotelName,
            hotel_type: payload.hotelType,
            star_rating: payload.starRating,
            company_name: payload.companyName,
            trading_name: payload.tradingName,
            business_email: payload.businessEmail,
            phone: payload.phone,
            country: payload.country,
            province: payload.province,
            city: payload.city,
            district: payload.district,
            street: payload.street,
            postal: payload.postal,
            base_currency: payload.baseCurrency,
            check_in_time: payload.checkInTime,
            check_out_time: payload.checkOutTime,
            cancellation_policy: payload.cancellationPolicy,
            gallery_images: payload.galleryImages,
            amenities: payload.amenities,
            integrity_signature: payload.integritySignature,
            status: payload.status,
        });

        if (payload.rooms.length > 0) {
            await supabase.from('hotel_rooms').upsert(
                payload.rooms.map((r) => ({
                    id: `${payload.id}_${r.id}`,
                    hotel_id: payload.id,
                    name: r.name,
                    category: r.category,
                    bed_config: r.bedConfig,
                    max_adults: r.maxAdults,
                    max_children: r.maxChildren,
                    size_sqm: r.sizeSqm,
                    view_type: r.viewType,
                    available_count: r.availableCount,
                    base_rate: r.baseRate,
                    amenities: r.amenities,
                }))
            );
        }
    } catch {
        // Local persistence preserved
    }
};

export const getHotelRegistrations = async (): Promise<HotelRegistrationPayload[]> => {
    return readLocalJson<HotelRegistrationPayload[]>(HOTEL_REGISTRATIONS_KEY, []);
};

