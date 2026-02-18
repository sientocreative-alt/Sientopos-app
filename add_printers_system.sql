-- Printer Management Infrastructure Migration

-- 1. Create Printers Table
CREATE TABLE IF NOT EXISTS public.printers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'Yazıcı', -- Fixed 'Yazıcı'
  printer_type TEXT DEFAULT 'Termal Fiş Yazıcısı', -- 'Termal Fiş Yazıcısı', 'Etiket Yazıcı'
  line_width INTEGER DEFAULT 48, -- 48, 58, 80
  connection_type TEXT DEFAULT 'Ethernet', -- 'Ethernet', 'USB', 'Bluetooth'
  connection_port TEXT, -- IP or Printer Name
  is_account_printer BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add Printer Columns to Categories
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS printer_id UUID REFERENCES public.printers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS label_printer_id UUID REFERENCES public.printers(id) ON DELETE SET NULL;

-- 3. Add Printer Columns to Products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS printer_id UUID REFERENCES public.printers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS label_printer_id UUID REFERENCES public.printers(id) ON DELETE SET NULL;

-- 4. Add Printer Column to Order Items (for historic tracking)
ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS printer_id UUID REFERENCES public.printers(id) ON DELETE SET NULL;

-- 5. Create Terminals Table
CREATE TABLE IF NOT EXISTS public.terminals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  password TEXT NOT NULL,
  terminal_type TEXT,
  printer_service TEXT,
  pos_service TEXT,
  default_printer_id UUID REFERENCES public.printers(id) ON DELETE SET NULL,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Enable RLS for Printers and Terminals
ALTER TABLE public.printers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.terminals ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for Printers
DROP POLICY IF EXISTS "Users can view their business printers" ON public.printers;
CREATE POLICY "Users can view their business printers" ON public.printers
FOR SELECT USING (business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins can manage their business printers" ON public.printers;
CREATE POLICY "Admins can manage their business printers" ON public.printers
FOR ALL USING (
    business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 8. RLS Policies for Terminals
DROP POLICY IF EXISTS "Users can view their business terminals" ON public.terminals;
CREATE POLICY "Users can view their business terminals" ON public.terminals
FOR SELECT USING (business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins can manage their business terminals" ON public.terminals;
CREATE POLICY "Admins can manage their business terminals" ON public.terminals
FOR ALL USING (
    business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Realtime for printers, terminals and order_items
ALTER TABLE public.printers REPLICA IDENTITY FULL;
ALTER TABLE public.terminals REPLICA IDENTITY FULL;
ALTER TABLE public.order_items REPLICA IDENTITY FULL;

-- Ensure tables are in the realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'order_items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'printers'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.printers;
  END IF;
END $$;
