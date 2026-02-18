-- Migration: Create print_jobs table for on-demand printing

CREATE TABLE IF NOT EXISTS public.print_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  printer_id UUID REFERENCES public.printers(id) ON DELETE SET NULL,
  job_type TEXT NOT NULL, -- 'account_receipt', 'kitchen_order', etc.
  payload JSONB NOT NULL, -- Contains all data needed for printing
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.print_jobs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their business print jobs" ON public.print_jobs
FOR SELECT USING (business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can create their business print jobs" ON public.print_jobs
FOR INSERT WITH CHECK (business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

-- Realtime
ALTER TABLE public.print_jobs REPLICA IDENTITY FULL;

-- Ensure table is in the realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'print_jobs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.print_jobs;
  END IF;
END $$;
