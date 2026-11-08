import { supabase } from './supabase';
import { logger } from './logger';

export type ServiceListingStatus = 'pending_review' | 'active' | 'suspended' | 'archived';

export interface TransportListing { id: string; businessName: string; title: string; city: string; pickupAddress: string; dailyRate: number; currency: string; category: string; description: string; images: string[]; contactPhone: string; }
export interface WellnessListing { id: string; businessName: string; city: string; category: string; description: string; images: string[]; contactPhone: string; website?: string; }
export interface AccommodationListing { id: string; businessName: string; type: string; city: string; address?: string; nightlyRate: number; currency: string; maxGuests: number; description: string; images: string[]; }

const mapTransport = (row: any): TransportListing => ({ id: row.id, businessName: row.business_name, title: row.vehicle_title, city: row.city, pickupAddress: row.pickup_address, dailyRate: Number(row.daily_rate), currency: row.currency, category: row.vehicle_category, description: row.description, images: row.images || [], contactPhone: row.mobile_number });
const mapWellness = (row: any): WellnessListing => ({ id: row.id, businessName: row.business_name, city: row.city, category: row.wellness_category, description: row.description, images: row.images || [], contactPhone: row.mobile_number, website: row.website || undefined });
const mapAccommodation = (row: any): AccommodationListing => ({ id: row.id, businessName: row.business_name, type: row.accommodation_type, city: row.city, address: row.address || undefined, nightlyRate: Number(row.nightly_rate), currency: row.currency, maxGuests: row.max_guests, description: row.description, images: row.images || [] });

async function published<T>(table: string, mapper: (row: any) => T): Promise<T[]> {
  const { data, error } = await supabase.from(table).select('*').eq('status', 'active').order('created_at', { ascending: false });
  // A missing optional table must not take down property discovery during a staged rollout.
  if (error) { logger.warn(`Unable to load published ${table}.`, error); return []; }
  return (data || []).map(mapper);
}
export const getPublishedTransportListings = () => published('car_rentals', mapTransport);
export const getPublishedWellnessListings = () => published('wellness_services', mapWellness);
export const getPublishedAccommodationListings = () => published('accommodation_services', mapAccommodation);
