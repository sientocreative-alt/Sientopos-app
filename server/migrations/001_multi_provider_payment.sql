-- 1. Create Payment Providers Table
CREATE TABLE IF NOT EXISTS public.payment_providers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE, -- 'iyzico', 'paytr'
    is_active BOOLEAN DEFAULT false,
    priority INT DEFAULT 0, -- 1 = High/Active
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Create Payment Settings Table
CREATE TABLE IF NOT EXISTS public.payment_settings (
    id SERIAL PRIMARY KEY,
    provider VARCHAR(50) NOT NULL,
    merchant_id VARCHAR(255),
    api_key VARCHAR(255),
    secret_key VARCHAR(255),
    salt VARCHAR(255), -- PayTR specific
    base_url VARCHAR(255),
    mode VARCHAR(20) DEFAULT 'sandbox', -- 'sandbox' or 'live'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    CONSTRAINT fk_provider FOREIGN KEY (provider) REFERENCES public.payment_providers(name) ON DELETE CASCADE,
    UNIQUE(provider)
);

-- 3. Initial Data
INSERT INTO public.payment_providers (name, is_active, priority) 
VALUES ('iyzico', true, 1), ('paytr', false, 2)
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.payment_settings (provider, mode)
VALUES ('iyzico', 'sandbox'), ('paytr', 'sandbox')
ON CONFLICT (provider) DO NOTHING;
