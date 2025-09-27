-- Add account_status column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN account_status TEXT DEFAULT 'active';

-- Add a check constraint to ensure valid values
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_account_status_check 
CHECK (account_status IN ('active', 'paused'));