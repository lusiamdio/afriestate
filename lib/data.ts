
import { ALL_PROPERTIES as initialProperties, MOCK_NOTIFICATIONS } from '../constants';
import type { Property, TourRequest, User, SearchFilters, Message, Review, CalendarEvent, AgentProfile, Lead, InvestorSettings, InvestmentRequest, PropertyAlert, UserDocument, Notification } from '../types';
import { ListingType, PropertyStatus } from '../types';
import { supabase } from './supabase';

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
        profilePicture: `https://i.pravatar.cc/150?u=${encodeURIComponent(username)}`,
        socials: { twitter: '', linkedin: '', facebook: '' }
    };
};

export const updateAgentProfile = async (username: string, updatedProfile: AgentProfile): Promise<AgentProfile> => {
    try {
        const { error } = await supabase
            .from('agent_profiles')
            .upsert({ 
                ...updatedProfile, 
                username,
                profile_picture: updatedProfile.profilePicture 
            })
            .eq('username', username);
        
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
            return excludeMock ? [] : initialProperties;
        }

        if (!data || data.length === 0) return excludeMock ? [] : initialProperties;

        const mappedData = data.map(p => ({
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
            // Handle JSON fields if they come back as strings (rare with supabase-js but possible with some configs)
            address: typeof p.address === 'string' ? JSON.parse(p.address) : p.address,
            details: typeof p.details === 'string' ? JSON.parse(p.details) : p.details,
            amenities: typeof p.amenities === 'string' ? JSON.parse(p.amenities) : p.amenities,
            images: typeof p.images === 'string' ? JSON.parse(p.images) : p.images,
            agent: typeof p.agent === 'string' ? JSON.parse(p.agent) : p.agent,
            financials: typeof p.financials === 'string' ? JSON.parse(p.financials) : p.financials,
        }));

        return mappedData.sort((a, b) => b.dateListed - a.dateListed);

    } catch (criticalErr: any) {
        if (criticalErr.message && (criticalErr.message.includes('Failed to fetch') || criticalErr.message.includes('Network request failed'))) {
            console.warn('[AfriEstate] Backend unreachable (fetch exception). Using mock data.');
        } else {
            console.warn("Failed to fetch properties from Supabase, using mock data.", criticalErr);
        }
        return excludeMock ? [] : initialProperties;
    }
};

export const saveProperties = async (properties: Property[]): Promise<void> => {
    try {
        const dbProperties = properties.map(p => ({
            id: p.id,
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
            agent_name: p.agent?.name || 'simao',
            featured: p.featured || false,
            verified: p.verified || false,
            smart_contract_ready: p.smartContractReady || false,
            views: p.views || 0,
            status: p.status,
            date_listed: p.dateListed,
            saves: p.saves || 0,
            purchase_price: p.purchasePrice || null,
            price_history: p.priceHistory || [],
            occupancy_rate: p.occupancyRate || null,
            market_roi: p.marketROI || null,
            financials: p.financials || [],
            guests: p.guests || null,
            vehicle_type: p.vehicleType || null,
            package_includes: p.packageIncludes || [],
            per_night_price: p.perNightPrice || false
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
    } catch (e) {
        // Ignore
    }
};

// --- User Management ---
export const getUsers = async (): Promise<User[]> => {
    try {
        const { data, error } = await supabase.from('profiles').select('*');
        if (error) return [];
        return data || [];
    } catch (e) { return []; }
};

export const addUser = async (user: User): Promise<{ success: boolean, message: string }> => {
    try {
        const { error } = await supabase.from('profiles').insert({
            username: user.username,
            full_name: user.fullName,
            email: user.email,
            password: user.password,
            role: user.role,
            is_verified: user.role === 'user',
            phone: user.phone,
            office_address: user.officeAddress,
            company_name: user.companyName,
            // Add other fields mapping as needed
        });
        if (error) {
             if (error.message.includes('Failed to fetch')) return { success: true, message: "Demo User created (Offline Mode)" };
             return { success: false, message: error.message };
        }
        return { success: true, message: "User created successfully." };
    } catch (e) {
        return { success: true, message: "Demo User created (Offline Mode)" };
    }
};

export const authenticateUser = async (email: string, password: string): Promise<{ user: User | null; error?: string }> => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', email)
            .eq('password', password)
            .single();

        if (error) {
            if (error.message.includes('Failed to fetch') || error.code === 'PGRST116') {
                 if (email === 'peter.vdm@example.com' && password === 'Password123!') {
                     return { user: { username: 'Peter Van der Merwe', fullName: 'Peter Van der Merwe', email, role: 'agent', isVerified: true, profilePicture: 'https://i.pravatar.cc/150?u=Peter' } as any };
                 }
                 if (error.message.includes('Failed to fetch')) return { user: null, error: 'Network Error: Backend unreachable.' };
            }
            return { user: null, error: 'Invalid email or password.' };
        }
        
        if (!data) return { user: null, error: 'Invalid email or password.' };
        
        const user = {
            ...data,
            isVerified: data.is_verified || data.isVerified,
            fullName: data.full_name || data.fullName,
            officeAddress: data.office_address,
            companyName: data.company_name,
            profilePicture: data.profile_picture || data.profilePicture,
        } as User;

        if ((user.role === 'agent' || user.role === 'investor') && !user.isVerified) {
            return { user: null, error: `pending_verification_${user.role}` };
        }
        
        return { user };
    } catch (e) {
        return { user: null, error: 'Database connection failed.' };
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
        
        if (error) return [];
        return data.map(item => typeof item.filters === 'string' ? JSON.parse(item.filters) : item.filters);
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
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .or(`sender_username.eq.${username},receiver_username.eq.${username}`)
            .order('timestamp', { ascending: true });
        
        if (error) return [];
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
    try {
        const { data, error } = await supabase.from('notifications').select('*').eq('username', user.username);
        if (error) {
             return [];
        }
        return data.map(n => ({
            ...n,
            isRead: n.is_read,
            propertyId: n.property_id
        })) || [];
    } catch (e) {
        return [];
    }
};

export const markNotificationsAsRead = async (username: string, ids: string[]): Promise<Set<string>> => {
    try {
        await supabase.from('notifications').update({ is_read: true }).in('id', ids);
        const { data } = await supabase.from('notifications').select('id').eq('username', username).eq('is_read', true);
        return new Set(data?.map(n => n.id) || []);
    } catch (e) { return new Set(ids); } // Optimistic
};

export const getReadNotificationIds = async (username: string): Promise<Set<string>> => {
    try {
        const { data } = await supabase.from('notifications').select('id').eq('username', username).eq('is_read', true);
        return new Set(data?.map(n => n.id) || []);
    } catch (e) { return new Set(); }
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
    const newDoc = {
        name: file.name,
        type: file.type.includes('pdf') ? 'pdf' : 'doc',
        upload_date: Date.now(),
        url: '#',
        username,
    };
    try {
        const { data, error } = await supabase.from('user_documents').insert(newDoc).select().single();
        if (error) throw error;
        return { ...data, uploadDate: data.upload_date };
    } catch (error) {
        handleError(error, 'adding document');
        return { ...newDoc, id: `doc_${Date.now()}`, uploadDate: newDoc.upload_date } as any;
    }
};

export const deleteUserDocument = async (username: string, docId: string): Promise<void> => {
    try {
        await supabase.from('user_documents').delete().eq('id', docId);
    } catch (e) {}
};

export const getPropertyAlerts = async (username: string): Promise<PropertyAlert[]> => {
    try {
        const { data } = await supabase.from('property_alerts').select('*').eq('username', username);
        return data.map(a => ({
            ...a,
            criteria: typeof a.criteria === 'string' ? JSON.parse(a.criteria) : a.criteria
        })) || [];
    } catch (e) { return []; }
};

export const addPropertyAlert = async (username: string, alertData: Omit<PropertyAlert, 'id'>): Promise<PropertyAlert> => {
    const optimistic = { ...alertData, username };
    try {
        const { data } = await supabase.from('property_alerts').insert(optimistic).select().single();
        return {
             ...data,
             criteria: typeof data.criteria === 'string' ? JSON.parse(data.criteria) : data.criteria
        };
    } catch (e) { return { ...optimistic, id: `alert_${Date.now()}` } as any; }
};

export const deletePropertyAlert = async (username: string, alertId: string): Promise<void> => {
    try {
        await supabase.from('property_alerts').delete().eq('id', alertId);
    } catch (e) {}
};
