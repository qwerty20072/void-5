-- Add purchased_mock_papers column to profiles table to track what users have bought
ALTER TABLE public.profiles 
ADD COLUMN purchased_mock_papers jsonb DEFAULT '{}'::jsonb;

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.purchased_mock_papers IS 'Tracks which mock papers the user has purchased by exam type and set';