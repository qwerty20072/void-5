-- Fix security vulnerability: Restrict profile visibility
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

-- Create a new secure policy that allows:
-- 1. Users to view their own profile completely
-- 2. Everyone to view tutor profiles (since they're public-facing service providers)
-- 3. Prevents viewing of student profiles by other users
CREATE POLICY "Secure profile visibility" ON public.profiles
FOR SELECT 
USING (
  -- Users can always see their own profile
  auth.uid() = id 
  OR 
  -- Tutor profiles are public (they're service providers)
  user_type = 'tutor'
);