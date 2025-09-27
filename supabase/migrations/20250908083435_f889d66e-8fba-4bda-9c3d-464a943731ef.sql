-- Add Stripe Connect fields to the payments table
ALTER TABLE public.payments 
ADD COLUMN connected_account_id TEXT,
ADD COLUMN platform_fee INTEGER,
ADD COLUMN tutor_amount INTEGER;

-- Add Stripe Connect account fields to profiles table for tutors
ALTER TABLE public.profiles
ADD COLUMN stripe_account_id TEXT,
ADD COLUMN charges_enabled BOOLEAN DEFAULT false,
ADD COLUMN payouts_enabled BOOLEAN DEFAULT false;