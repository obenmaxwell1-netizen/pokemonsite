-- Enable pgcrypto for UUIDs
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create site_content table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.site_content (
    id text PRIMARY KEY,
    content text NOT NULL
);

-- Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text,
    price numeric NOT NULL DEFAULT 0,
    category text NOT NULL,
    product_type text DEFAULT 'Booster Box',
    stock_status text NOT NULL DEFAULT 'in_stock',
    featured boolean DEFAULT false,
    is_vip boolean DEFAULT false,
    images text[] DEFAULT '{}',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id),
    user_name text,
    user_email text,
    items jsonb NOT NULL,
    total_price numeric NOT NULL,
    payment_method text,
    notes text,
    shipping_address jsonb,
    status text DEFAULT 'pending',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security (RLS)
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Policies

-- Site content: public read
CREATE POLICY "Public site_content is viewable by everyone." ON public.site_content FOR SELECT USING (true);
CREATE POLICY "Admin can insert/update content" ON public.site_content FOR ALL USING (auth.role() = 'authenticated');

-- Products: public read
CREATE POLICY "Public products are viewable by everyone." ON public.products FOR SELECT USING (true);
CREATE POLICY "Admin can insert/update products" ON public.products FOR ALL USING (auth.role() = 'authenticated');

-- Orders: public insert (for manual inquiry without strict auth), user read
CREATE POLICY "Anyone can insert an order" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view order by id" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Admin can view all orders" ON public.orders FOR ALL USING (auth.role() = 'authenticated');

-- Profiles: user read/update
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create Storage Bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('products', 'products', true) ON CONFLICT DO NOTHING;

-- Storage Policies
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'products');
CREATE POLICY "Admin Insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'products' AND auth.role() = 'authenticated');
CREATE POLICY "Admin Update" ON storage.objects FOR UPDATE USING (bucket_id = 'products' AND auth.role() = 'authenticated');
CREATE POLICY "Admin Delete" ON storage.objects FOR DELETE USING (bucket_id = 'products' AND auth.role() = 'authenticated');

-- Bounty Requests Table
CREATE TABLE IF NOT EXISTS public.bounty_requests (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    card_name text NOT NULL,
    condition text NOT NULL,
    budget numeric NOT NULL,
    email text NOT NULL,
    status text DEFAULT 'pending',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- VIP Requests Table
CREATE TABLE IF NOT EXISTS public.vip_requests (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    email text NOT NULL,
    status text DEFAULT 'pending',
    passcode text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for Bounty and VIP Requests
ALTER TABLE public.bounty_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_requests ENABLE ROW LEVEL SECURITY;

-- Policies for Bounty and VIP Requests
CREATE POLICY "Anyone can insert bounty requests" ON public.bounty_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can view/update bounty requests" ON public.bounty_requests FOR ALL USING (true);

CREATE POLICY "Anyone can insert vip requests" ON public.vip_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view granted vip requests by passcode" ON public.vip_requests FOR SELECT USING (true);
CREATE POLICY "Admin can view/update vip requests" ON public.vip_requests FOR ALL USING (true);
