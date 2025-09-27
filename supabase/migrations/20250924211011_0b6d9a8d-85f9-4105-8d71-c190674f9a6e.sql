-- Remove the problematic handle_new_message function and any triggers using it
DROP FUNCTION IF EXISTS public.handle_new_message() CASCADE;

-- If there was a trigger on messages table, it will be automatically dropped with CASCADE