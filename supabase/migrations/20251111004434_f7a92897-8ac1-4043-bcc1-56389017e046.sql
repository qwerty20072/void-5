-- Create contact submissions table
CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tutor_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  selected_services TEXT[] DEFAULT '{}',
  additional_info TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert contact submissions (public form)
CREATE POLICY "Anyone can submit contact forms"
ON public.contact_submissions
FOR INSERT
TO public
WITH CHECK (true);

-- Only authenticated users can view submissions (for admin purposes)
CREATE POLICY "Authenticated users can view all submissions"
ON public.contact_submissions
FOR SELECT
TO authenticated
USING (true);

-- Create index for faster queries
CREATE INDEX idx_contact_submissions_created_at ON public.contact_submissions(created_at DESC);
CREATE INDEX idx_contact_submissions_tutor_id ON public.contact_submissions(tutor_id);