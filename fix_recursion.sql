-- RLS Infinite Recursion Fix
-- Problem: Policies on 'profiles' were querying 'profiles', causing a loop.
-- Solution: Use SECURITY DEFINER functions to bypass RLS for authorization checks.

-- 1. Create Helper Functions (Bypass RLS)
CREATE OR REPLACE FUNCTION public.get_my_business_id()
RETURNS UUID AS $$
  SELECT business_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- 2. Fix Profiles Table Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles view" ON public.profiles;

CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
USING (is_admin());

-- 3. Fix Categories Table Policies
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Filter categories" ON public.categories;
DROP POLICY IF EXISTS "Categories policy" ON public.categories;

-- Allow users to see categories of their business
CREATE POLICY "View categories" ON public.categories FOR SELECT
USING (business_id = get_my_business_id());

-- Allow users to insert categories into their business
CREATE POLICY "Insert categories" ON public.categories FOR INSERT
WITH CHECK (business_id = get_my_business_id());

-- Allow users to update/delete categories of their business
CREATE POLICY "Manage categories" ON public.categories FOR ALL
USING (business_id = get_my_business_id());


-- 4. Fix Products Table Policies (Same logic)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Filter products" ON public.products;
DROP POLICY IF EXISTS "Public menu read" ON public.products; -- Re-evaluate this if public needs access

-- If public access is needed:
-- CREATE POLICY "Public menu read" ON public.products FOR SELECT USING (true);
-- But for now let's secure it to business:

CREATE POLICY "View products" ON public.products FOR SELECT
USING (business_id = get_my_business_id());

CREATE POLICY "Manage products" ON public.products FOR ALL
USING (business_id = get_my_business_id());
