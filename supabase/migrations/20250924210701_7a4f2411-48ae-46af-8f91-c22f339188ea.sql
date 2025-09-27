-- Fix the handle_new_message function to use the correct http extension
CREATE OR REPLACE FUNCTION public.handle_new_message()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Call the message-notification edge function using public.http_post instead of net.http_post
  PERFORM
    public.http_post(
      url := (SELECT current_setting('app.settings.supabase_url', true)) || '/functions/v1/message-notification',
      headers := ARRAY[
        public.http_header('Content-Type', 'application/json'),
        public.http_header('Authorization', 'Bearer ' || (SELECT current_setting('app.settings.service_role_key', true)))
      ],
      content := jsonb_build_object('record', to_jsonb(NEW))::text,
      content_type := 'application/json'
    );
  
  RETURN NEW;
END;
$function$;