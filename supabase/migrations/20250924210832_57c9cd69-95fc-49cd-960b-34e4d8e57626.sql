-- Fix the handle_new_message function with correct http function signature
CREATE OR REPLACE FUNCTION public.handle_new_message()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Call the message-notification edge function using the correct http function
  PERFORM
    public.http((
      'POST',
      (SELECT current_setting('app.settings.supabase_url', true)) || '/functions/v1/message-notification',
      ARRAY[
        public.http_header('Content-Type', 'application/json'),
        public.http_header('Authorization', 'Bearer ' || (SELECT current_setting('app.settings.service_role_key', true)))
      ],
      'application/json',
      jsonb_build_object('record', to_jsonb(NEW))::text
    )::public.http_request);
  
  RETURN NEW;
END;
$function$;