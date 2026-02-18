-- Support Ticket System Migration

-- 1. Create Support Tickets Table
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    category TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'Normal',
    status TEXT NOT NULL DEFAULT 'Open',
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    system_info JSONB,
    tags TEXT[] DEFAULT '{}',
    internal_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    first_responded_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ
);

-- 2. Create Support Messages Table
CREATE TABLE IF NOT EXISTS public.support_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false,
    attachments TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- 4. Policies for Support Tickets
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Super Admins can manage everything
DROP POLICY IF EXISTS "Super Admins can manage all tickets" ON public.support_tickets;
CREATE POLICY "Super Admins can manage all tickets"
ON public.support_tickets FOR ALL
TO authenticated
USING (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'super_admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'super_admin') OR
    (auth.email() = 'tolgacapaci91@gmail.com')
)
WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'super_admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'super_admin') OR
    (auth.email() = 'tolgacapaci91@gmail.com')
);

-- Users can view and create their own tickets
DROP POLICY IF EXISTS "Users can manage their own tickets" ON public.support_tickets;
CREATE POLICY "Users can manage their own tickets"
ON public.support_tickets FOR ALL
TO authenticated
USING (
    (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())) OR
    profile_id = auth.uid()
)
WITH CHECK (
    (business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())) OR
    profile_id = auth.uid()
);

-- 5. Policies for Support Messages
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Super Admins can manage all messages
DROP POLICY IF EXISTS "Super Admins can manage all messages" ON public.support_messages;
CREATE POLICY "Super Admins can manage all messages"
ON public.support_messages FOR ALL
TO authenticated
USING (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'super_admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'super_admin') OR
    (auth.email() = 'tolgacapaci91@gmail.com')
)
WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'super_admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'super_admin') OR
    (auth.email() = 'tolgacapaci91@gmail.com')
);

-- Users can see non-internal messages for their tickets
DROP POLICY IF EXISTS "Users can see messages for their tickets" ON public.support_messages;
CREATE POLICY "Users can see messages for their tickets"
ON public.support_messages FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM support_tickets 
        WHERE support_tickets.id = support_messages.ticket_id 
        AND (
            (support_tickets.business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())) OR 
            support_tickets.profile_id = auth.uid()
        )
    )
    AND is_internal = false
);

-- Users can insert messages to their own tickets
DROP POLICY IF EXISTS "Users can send messages to their tickets" ON public.support_messages;
CREATE POLICY "Users can send messages to their tickets"
ON public.support_messages FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM support_tickets 
        WHERE support_tickets.id = ticket_id 
        AND (
            (support_tickets.business_id IN (SELECT business_id FROM profiles WHERE id = auth.uid())) OR 
            support_tickets.profile_id = auth.uid()
        )
    )
    AND is_internal = false
);

-- 6. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
