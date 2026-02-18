-- Support System Update for Resellers
-- Migration: 20260217180000_update_support_for_resellers.sql

-- 1. Add reseller_id to support_tickets
ALTER TABLE public.support_tickets 
ADD COLUMN reseller_id UUID REFERENCES public.resellers(id) ON DELETE SET NULL;

-- 2. Update RLS policies for support_tickets
-- Add Reseller access to support_tickets
DROP POLICY IF EXISTS "Resellers can manage their own tickets" ON public.support_tickets;
CREATE POLICY "Resellers can manage their own tickets"
ON public.support_tickets FOR ALL
TO authenticated
USING (
    reseller_id = auth.uid()
)
WITH CHECK (
    reseller_id = auth.uid()
);

-- 3. Update RLS policies for support_messages
-- Add Reseller access to support_messages (Read)
DROP POLICY IF EXISTS "Resellers can see messages for their tickets" ON public.support_messages;
CREATE POLICY "Resellers can see messages for their tickets"
ON public.support_messages FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM support_tickets 
        WHERE support_tickets.id = support_messages.ticket_id 
        AND support_tickets.reseller_id = auth.uid()
    )
    AND is_internal = false
);

-- Add Reseller access to support_messages (Insert)
DROP POLICY IF EXISTS "Resellers can send messages to their tickets" ON public.support_messages;
CREATE POLICY "Resellers can send messages to their tickets"
ON public.support_messages FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM support_tickets 
        WHERE support_tickets.id = ticket_id 
        AND support_tickets.reseller_id = auth.uid()
    )
    AND is_internal = false
);
