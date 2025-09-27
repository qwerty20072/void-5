-- Add missing service_type column to conversations table
ALTER TABLE public.conversations 
ADD COLUMN service_type text;