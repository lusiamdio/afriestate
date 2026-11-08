-- =======================================================================================
-- AFRIESTATE - SERVICE LISTINGS SUPABASE SQL SCHEMA
-- Run this directly in your Supabase SQL Editor to provision the tables, 
-- storage buckets, and security policies for "Rent a Car" and "Wellness Services".
-- =======================================================================================

-- 1. Create custom types (Optional but good for data integrity)
CREATE TYPE service_status AS ENUM ('pending_review', 'active', 'suspended', 'archived');
CREATE TYPE vehicle_transmission AS ENUM ('auto', 'manual');

-- ==========================================
-- TABLE: car_rentals
-- ==========================================
CREATE TABLE IF NOT EXISTS public.car_rentals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Business Info
    business_name VARCHAR(255) NOT NULL,
    trading_name VARCHAR(255),
    registration_number VARCHAR(100),
    vat_number VARCHAR(100),
    business_type VARCHAR(100) NOT NULL,
    
    -- Contact Info
    contact_person VARCHAR(255) NOT NULL,
    mobile_number VARCHAR(50) NOT NULL,
    whatsapp_number VARCHAR(50) NOT NULL,
    email_address VARCHAR(255) NOT NULL,
    website VARCHAR(255),
    
    -- Location
    country VARCHAR(100) NOT NULL,
    province VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    pickup_address TEXT NOT NULL,
    
    -- Vehicle Info
    vehicle_title VARCHAR(255) NOT NULL,
    vehicle_category VARCHAR(100) NOT NULL,
    vehicle_make_model VARCHAR(255) NOT NULL,
    vehicle_year INT NOT NULL,
    transmission vehicle_transmission NOT NULL,
    
    -- Pricing
    daily_rate DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'ZAR',
    
    -- Description and Details
    description TEXT NOT NULL,
    
    -- Meta
    images TEXT[] DEFAULT '{}',
    is_verified BOOLEAN DEFAULT FALSE,
    status service_status DEFAULT 'pending_review',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- TABLE: wellness_services
-- ==========================================
CREATE TABLE IF NOT EXISTS public.wellness_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Business Info
    business_name VARCHAR(255) NOT NULL,
    trading_name VARCHAR(255),
    registration_number VARCHAR(100),
    wellness_category VARCHAR(100) NOT NULL,
    
    -- Contact Info
    contact_person VARCHAR(255) NOT NULL,
    mobile_number VARCHAR(50) NOT NULL,
    whatsapp_number VARCHAR(50) NOT NULL,
    email_address VARCHAR(255) NOT NULL,
    website VARCHAR(255),
    
    -- Location
    country VARCHAR(100) NOT NULL,
    province VARCHAR(100),
    city VARCHAR(100) NOT NULL,
    physical_address TEXT,
    
    -- Description and Details
    description TEXT NOT NULL,
    
    -- Meta
    images TEXT[] DEFAULT '{}',
    is_verified BOOLEAN DEFAULT FALSE,
    status service_status DEFAULT 'pending_review',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- TRIGGERS FOR updated_at
-- ==========================================
-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_car_rentals_updated_at
    BEFORE UPDATE ON public.car_rentals
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_wellness_services_updated_at
    BEFORE UPDATE ON public.wellness_services
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================
-- Enable RLS
ALTER TABLE public.car_rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_services ENABLE ROW LEVEL SECURITY;

-- CAR RENTALS POLICIES
-- 1. Public can view active car rentals
CREATE POLICY "Public can view active car rentals" ON public.car_rentals
    FOR SELECT USING (status = 'active');

-- 2. Users can view their own car rentals
CREATE POLICY "Users can view their own car rentals" ON public.car_rentals
    FOR SELECT USING (auth.uid() = user_id);

-- 3. Users can insert their own car rentals
CREATE POLICY "Users can insert their own car rentals" ON public.car_rentals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Users can update their own car rentals
CREATE POLICY "Users can update their own car rentals" ON public.car_rentals
    FOR UPDATE USING (auth.uid() = user_id);

-- WELLNESS SERVICES POLICIES
-- 1. Public can view active wellness services
CREATE POLICY "Public can view active wellness services" ON public.wellness_services
    FOR SELECT USING (status = 'active');

-- 2. Users can view their own wellness services
CREATE POLICY "Users can view their own wellness services" ON public.wellness_services
    FOR SELECT USING (auth.uid() = user_id);

-- 3. Users can insert their own wellness services
CREATE POLICY "Users can insert their own wellness services" ON public.wellness_services
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Users can update their own wellness services
CREATE POLICY "Users can update their own wellness services" ON public.wellness_services
    FOR UPDATE USING (auth.uid() = user_id);


-- ==========================================
-- STORAGE BUCKETS
-- ==========================================
-- Create bucket for service images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('service_images', 'service_images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Service images are publicly accessible" 
    ON storage.objects FOR SELECT 
    USING (bucket_id = 'service_images');

CREATE POLICY "Authenticated users can upload service images" 
    ON storage.objects FOR INSERT 
    WITH CHECK (
        bucket_id = 'service_images' 
        AND auth.role() = 'authenticated'
    );
