-- PartsFinda Marketplace Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  phone TEXT,
  address TEXT,
  parish TEXT,
  avatar_url TEXT,
  is_seller BOOLEAN DEFAULT false,
  seller_verified BOOLEAN DEFAULT false,
  seller_rating DECIMAL(3,2) DEFAULT 0,
  seller_reviews_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Parts categories
CREATE TABLE public.categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  parent_id UUID REFERENCES public.categories(id),
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Vehicle makes
CREATE TABLE public.makes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Vehicle models
CREATE TABLE public.models (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  make_id UUID REFERENCES public.makes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(make_id, name)
);

-- Parts listing
CREATE TABLE public.parts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id),
  make_id UUID REFERENCES public.makes(id),
  model_id UUID REFERENCES public.models(id),
  title TEXT NOT NULL,
  description TEXT,
  part_number TEXT,
  oem_number TEXT,
  condition TEXT CHECK (condition IN ('new', 'used', 'refurbished')),
  price DECIMAL(10,2) NOT NULL,
  negotiable BOOLEAN DEFAULT false,
  quantity INTEGER DEFAULT 1,
  year_from INTEGER,
  year_to INTEGER,
  images JSONB DEFAULT '[]',
  location TEXT,
  parish TEXT,
  warranty_months INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'reserved', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for better query performance
CREATE INDEX idx_parts_seller_id ON public.parts(seller_id);
CREATE INDEX idx_parts_category_id ON public.parts(category_id);
CREATE INDEX idx_parts_make_id ON public.parts(make_id);
CREATE INDEX idx_parts_model_id ON public.parts(model_id);
CREATE INDEX idx_parts_status ON public.parts(status);
CREATE INDEX idx_parts_price ON public.parts(price);

-- Shopping cart
CREATE TABLE public.cart_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  part_id UUID REFERENCES public.parts(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, part_id)
);

-- Orders
CREATE TABLE public.orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  buyer_id UUID REFERENCES public.profiles(id),
  seller_id UUID REFERENCES public.profiles(id),
  order_number TEXT UNIQUE NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'refunded')),
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  delivery_address TEXT,
  delivery_parish TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Order items
CREATE TABLE public.order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  part_id UUID REFERENCES public.parts(id),
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Messages
CREATE TABLE public.conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  part_id UUID REFERENCES public.parts(id),
  buyer_id UUID REFERENCES public.profiles(id),
  seller_id UUID REFERENCES public.profiles(id),
  last_message TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE,
  buyer_unread INTEGER DEFAULT 0,
  seller_unread INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(part_id, buyer_id, seller_id)
);

CREATE TABLE public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Reviews
CREATE TABLE public.reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id),
  buyer_id UUID REFERENCES public.profiles(id),
  seller_id UUID REFERENCES public.profiles(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(order_id)
);

-- Saved searches
CREATE TABLE public.saved_searches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT,
  search_params JSONB NOT NULL,
  notify_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Wishlist
CREATE TABLE public.wishlist (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  part_id UUID REFERENCES public.parts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, part_id)
);

-- Part requests
CREATE TABLE public.part_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  make_id UUID REFERENCES public.makes(id),
  model_id UUID REFERENCES public.models(id),
  year INTEGER,
  part_name TEXT NOT NULL,
  description TEXT,
  images JSONB DEFAULT '[]',
  budget_min DECIMAL(10,2),
  budget_max DECIMAL(10,2),
  parish TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'fulfilled', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Seller subscriptions
CREATE TABLE public.seller_subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_type TEXT CHECK (plan_type IN ('basic', 'professional', 'enterprise')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  listings_limit INTEGER DEFAULT 10,
  featured_listings INTEGER DEFAULT 0,
  starts_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Row Level Security Policies

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Parts policies
CREATE POLICY "Parts are viewable by everyone" ON public.parts
  FOR SELECT USING (status = 'active' OR seller_id = auth.uid());

CREATE POLICY "Sellers can create parts" ON public.parts
  FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update own parts" ON public.parts
  FOR UPDATE USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete own parts" ON public.parts
  FOR DELETE USING (auth.uid() = seller_id);

-- Cart policies
CREATE POLICY "Users can view own cart" ON public.cart_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add to own cart" ON public.cart_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cart" ON public.cart_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from own cart" ON public.cart_items
  FOR DELETE USING (auth.uid() = user_id);

-- Functions and Triggers

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parts_updated_at BEFORE UPDATE ON public.parts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
BEGIN
  new_number := 'PF' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate order number
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_number_trigger
BEFORE INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION set_order_number();

-- Function to update seller rating
CREATE OR REPLACE FUNCTION update_seller_rating()
RETURNS TRIGGER AS $$
DECLARE
  avg_rating DECIMAL(3,2);
  review_count INTEGER;
BEGIN
  SELECT AVG(rating), COUNT(*) INTO avg_rating, review_count
  FROM public.reviews
  WHERE seller_id = NEW.seller_id;

  UPDATE public.profiles
  SET seller_rating = avg_rating,
      seller_reviews_count = review_count
  WHERE id = NEW.seller_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_seller_rating_trigger
AFTER INSERT OR UPDATE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION update_seller_rating();
