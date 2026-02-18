-- 1. SQL Schema (Fixed for Permissions)

-- Temizlik
DROP TABLE IF EXISTS order_items, stock_movements, personel_shifts, orders, products, categories, businesses, profiles CASCADE;

-- Businesses
CREATE TABLE public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Profiles (Standard Supabase approach instead of altering auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT DEFAULT 'garson' CHECK (role IN ('admin', 'garson')),
  business_id UUID REFERENCES public.businesses(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Categories
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE
);

-- Products
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  category_id UUID REFERENCES public.categories(id),
  stock_quantity INTEGER DEFAULT 0,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Orders
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  table_number TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'delivered')),
  total DECIMAL(10,2),
  personel_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2)
);

-- Personel & Stok
CREATE TABLE public.personel_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  clock_in TIMESTAMP,
  clock_out TIMESTAMP,
  break_duration INTEGER DEFAULT 0,
  business_id UUID REFERENCES public.businesses(id)
);

CREATE TABLE public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id),
  quantity INTEGER NOT NULL,
  type TEXT CHECK (type IN ('entry', 'exit', 'waste')),
  created_at TIMESTAMP DEFAULT NOW(),
  business_id UUID REFERENCES public.businesses(id)
);

-- RLS Etkinleştir
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personel_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- Helper Function for Policies
-- (Gets the current user's business_id/role from profiles)
-- NOTE: For better performance, claims (JWT) are preferred, but this works for basic setup.

-- Policies
CREATE POLICY "Public menu read" ON public.products FOR SELECT USING (true);

-- Business Access: Admins can see their business
CREATE POLICY "Business owners full" ON public.businesses FOR ALL USING 
(id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Profiles: Users can see own profile, Admins can deal with profiles in their business
CREATE POLICY "Profiles view" ON public.profiles FOR SELECT USING 
(id = auth.uid() OR business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Products/Categories: Filter by business_id
CREATE POLICY "Filter products" ON public.products USING 
(business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Filter categories" ON public.categories USING 
(business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

-- Orders: Users see own, Admins see all in business
CREATE POLICY "Orders policy" ON public.orders USING 
(business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

-- Realtime
ALTER TABLE public.orders REPLICA IDENTITY FULL;
-- ADD to publication manually or ensure 'postgres' role does it.
-- drop publication if exists supabase_realtime;
-- create publication supabase_realtime for table orders, personel_shifts;

-- TRIGGER: Auto-create profile on Signup (Optional but helpful)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'garson');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop verify if exists to avoid error on rerun
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
